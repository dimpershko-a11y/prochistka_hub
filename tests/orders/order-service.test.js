import test from 'node:test';
import assert from 'node:assert/strict';
import { createOrderService } from '../../src/modules/orders/services/order-service.js';
import { ORDERS_STORAGE_KEY } from '../../src/modules/orders/models/default-statuses.js';

function memoryStorage(initial = {}) {
  const values = new Map(Object.entries(structuredClone(initial)));
  return {
    get: (key, fallback = null) => structuredClone(values.has(key) ? values.get(key) : fallback),
    set: (key, value) => (values.set(key, structuredClone(value)), value),
    remove: (key) => values.delete(key)
  };
}

function harness(initial = {}) {
  let sequence = 0;
  const events = [];
  const eventBus = { emit: (name, payload) => events.push({ name, payload: structuredClone(payload) }) };
  const service = createOrderService({
    storage: memoryStorage(initial),
    eventBus,
    now: () => `2026-07-22T10:00:${String(sequence).padStart(2, '0')}.000Z`,
    id: () => `order-${++sequence}`
  });
  return { service, events };
}

function calculation(id = 'calc-1') {
  return {
    calculationId: id,
    tariff: { label: 'Генеральная' },
    inputs: { cleaningType: 'general', area: 40 },
    calculatedClientPrice: 12000,
    recommendedClientPrice: 13000,
    managerFinalPrice: 12500,
    normHours: 8,
    crewPlan: { crew: 1 },
    laborPlan: { total: 5000 },
    internalCosts: { costBeforeTax: 8000 },
    expectedNetProfit: 3500,
    lineItems: [{ id: 'main', label: 'Генеральная', amount: 12500 }],
    warnings: [],
    confirmations: []
  };
}

function validManual(overrides = {}) {
  return {
    status: 'new',
    client: { name: 'Анна', phone: '+79990000000' },
    object: { address: 'Невский проспект, 1', area: 50 },
    schedule: { plannedDate: '2026-07-25' },
    service: { title: 'Генеральная уборка' },
    pricing: { finalPrice: 15000 },
    ...overrides
  };
}

test('заказ из калькулятора сохраняет финальную цену и полный snapshot', () => {
  const { service } = harness();
  const source = calculation();
  const { order } = service.createFromCalculation(source);
  source.managerFinalPrice = 1;
  assert.equal(order.pricing.finalPrice, 12500);
  assert.equal(service.getById(order.id).calculationSnapshot.managerFinalPrice, 12500);
});

test('изменение тарифов не меняет snapshot старого заказа', () => {
  const { service } = harness();
  const source = calculation();
  const { order } = service.createFromCalculation(source);
  source.tariff.label = 'Изменено';
  assert.equal(service.getById(order.id).calculationSnapshot.tariff.label, 'Генеральная');
});

test('повторное создание по calculationId не создаёт дубль', () => {
  const { service } = harness();
  const first = service.createFromCalculation(calculation());
  const second = service.createFromCalculation(calculation());
  assert.equal(second.created, false);
  assert.equal(second.order.id, first.order.id);
  assert.equal(service.list().length, 1);
});

test('явное создание копии связывает новый заказ с исходным', () => {
  const { service } = harness();
  const first = service.createFromCalculation(calculation());
  const copy = service.createFromCalculation(calculation(), { createCopy: true });
  assert.notEqual(copy.order.id, first.order.id);
  assert.equal(copy.order.parentOrderId, first.order.id);
  assert.equal(copy.order.auditTrail.at(-1).type, 'copied');
});

test('ручной заказ без snapshot сохраняется и восстанавливается', () => {
  const { service } = harness();
  const order = service.createManual(validManual());
  assert.equal(order.source, 'manual');
  assert.equal(order.calculationSnapshot, null);
  assert.equal(service.getById(order.id).client.name, 'Анна');
});

test('неполный ручной заказ сохраняется как черновик, но не активируется', () => {
  const { service } = harness();
  const draft = service.createManual({ status: 'draft', client: { name: 'Черновик' } });
  assert.equal(draft.status, 'draft');
  assert.throws(() => service.changeStatus(draft.id, 'new'), /телефон|адрес|услугу|дату|цену/i);
});

test('редактирование цены создаёт запись аудита', () => {
  const { service } = harness();
  const order = service.createManual(validManual({ status: 'draft' }));
  const updated = service.update(order.id, { pricing: { finalPrice: 16000 } });
  assert.equal(updated.auditTrail.at(-1).type, 'price-changed');
  assert.equal(updated.auditTrail.at(-1).to, 16000);
});

test('изменение статуса создаёт событие orders:status-changed', () => {
  const { service, events } = harness();
  const order = service.createManual(validManual({ status: 'draft' }));
  service.changeStatus(order.id, 'new');
  assert.ok(events.some((event) => event.name === 'orders:status-changed' && event.payload.orderId === order.id));
});

test('архивирование не удаляет заказ физически', () => {
  const { service } = harness();
  const order = service.createManual(validManual({ status: 'draft' }));
  service.archive(order.id);
  assert.equal(service.getById(order.id).status, 'archived');
  assert.equal(service.list().length, 0);
  assert.equal(service.list({ includeArchived: true }).length, 1);
});

test('поиск и фильтры работают по номеру, телефону, адресу, статусу и источнику', () => {
  const { service } = harness();
  const order = service.createManual(validManual({ status: 'draft' }));
  assert.equal(service.list({ query: order.displayNumber }).length, 1);
  assert.equal(service.list({ query: '+7999' }).length, 1);
  assert.equal(service.list({ query: 'невский' }).length, 1);
  assert.equal(service.list({ status: 'draft', source: 'manual' }).length, 1);
  assert.equal(service.list({ status: 'new' }).length, 0);
});

test('миграция старого массива заказов не теряет данные', () => {
  const old = [{ id: 'legacy', status: 'draft', source: 'manual', client: { name: 'Старый' } }];
  const { service } = harness({ [ORDERS_STORAGE_KEY]: old });
  const order = service.getById('legacy');
  assert.equal(order.client.name, 'Старый');
  assert.equal(order.schemaVersion, 1);
});

test('orders:created содержит orderId и источник', () => {
  const { service, events } = harness();
  const order = service.createManual(validManual({ status: 'draft' }));
  const event = events.find((item) => item.name === 'orders:created');
  assert.equal(event.payload.orderId, order.id);
  assert.equal(event.payload.source, 'manual');
});

test('невалидный переход статуса отклоняется', () => {
  const { service } = harness();
  const order = service.createManual(validManual({ status: 'draft' }));
  assert.throws(() => service.changeStatus(order.id, 'completed'), /недопустим/);
});
