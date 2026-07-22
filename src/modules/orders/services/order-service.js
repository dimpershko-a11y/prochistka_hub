import {
  allowedStatusTransitions,
  defaultOrderStatuses,
  ORDERS_STORAGE_KEY,
  ORDER_SCHEMA_VERSION
} from '../models/default-statuses.js';

const clone = (value) => structuredClone(value);
const text = (value) => String(value || '').trim();
const amount = (value) => Math.max(0, Math.round(Number(value) || 0));

function merge(base, patch) {
  if (!patch || typeof patch !== 'object' || Array.isArray(patch)) return patch ?? base;
  const result = { ...base };
  Object.entries(patch).forEach(([key, value]) => {
    result[key] = value && typeof value === 'object' && !Array.isArray(value)
      ? merge(base?.[key] || {}, value)
      : value;
  });
  return result;
}

function migrateOrders(payload) {
  const orders = Array.isArray(payload) ? payload : payload?.orders;
  return {
    schemaVersion: ORDER_SCHEMA_VERSION,
    statuses: Array.isArray(payload?.statuses) ? payload.statuses : clone(defaultOrderStatuses),
    orders: (Array.isArray(orders) ? orders : []).map((order) => ({
      schemaVersion: ORDER_SCHEMA_VERSION,
      auditTrail: [],
      tags: [],
      warnings: [],
      confirmations: [],
      ...order
    }))
  };
}

function validateActiveOrder(order) {
  const errors = [];
  if (!text(order.client?.name) && !text(order.client?.organizationName)) errors.push('Укажите имя клиента или организацию.');
  if (!text(order.client?.phone)) errors.push('Укажите телефон клиента.');
  if (!text(order.object?.address)) errors.push('Укажите адрес объекта.');
  if (!text(order.service?.title) && !text(order.service?.cleaningType)) errors.push('Укажите услугу.');
  if (!text(order.schedule?.plannedDate)) errors.push('Укажите дату работ.');
  if (amount(order.pricing?.finalPrice) <= 0) errors.push('Укажите окончательную цену.');
  return errors;
}

export function createOrderService({ storage, eventBus, now = () => new Date().toISOString(), id = () => crypto.randomUUID() }) {
  function read() {
    return migrateOrders(storage.get(ORDERS_STORAGE_KEY, null));
  }

  function write(payload) {
    const migrated = migrateOrders(payload);
    storage.set(ORDERS_STORAGE_KEY, migrated);
    return migrated;
  }

  function emit(name, order, extra = {}) {
    eventBus?.emit(name, clone({ orderId: order.id, source: order.source, order, ...extra }));
  }

  function nextDisplayNumber(orders, createdAt) {
    const date = createdAt.slice(0, 10).replaceAll('-', '');
    const count = orders.filter((order) => order.createdAt?.startsWith(createdAt.slice(0, 10))).length + 1;
    return `PC-${date}-${String(count).padStart(3, '0')}`;
  }

  function baseOrder(source, actor) {
    const createdAt = now();
    const payload = read();
    return {
      schemaVersion: ORDER_SCHEMA_VERSION,
      id: id(),
      displayNumber: nextDisplayNumber(payload.orders, createdAt),
      source,
      sourceCalculationId: null,
      parentOrderId: null,
      createdAt,
      updatedAt: createdAt,
      createdBy: actor,
      updatedBy: actor,
      status: 'draft',
      client: { name: '', organizationName: '', phone: '', secondaryPhone: '', email: '', messenger: '' },
      object: { address: '', district: '', area: 0, accessNotes: '', parkingNotes: '', outsideKad: false },
      schedule: { plannedDate: '', plannedStartTime: '', plannedEndTime: '', plannedDays: 1 },
      service: { cleaningType: '', cleaningVariant: '', title: '', lineItems: [] },
      pricing: { calculatedPrice: 0, recommendedPrice: 0, finalPrice: 0, currency: 'RUB', source },
      planning: { normHours: 0, crewPlan: null, plannedLabor: null, plannedExpenses: null, plannedProfit: null },
      actualLabor: null,
      actualExpenses: null,
      actualProfit: null,
      calculationSnapshot: null,
      warnings: [],
      confirmations: [],
      managerNotes: '',
      tags: [],
      auditTrail: [{ type: 'created', at: createdAt, actor, source }]
    };
  }

  function persist(order, eventName = 'orders:updated', extra = {}) {
    const payload = read();
    const index = payload.orders.findIndex((item) => item.id === order.id);
    if (index >= 0) payload.orders[index] = clone(order);
    else payload.orders.push(clone(order));
    write(payload);
    emit(eventName, order, extra);
    return clone(order);
  }

  function createFromCalculation(source, options = {}) {
    const calculation = source?.calculationSnapshot || source;
    const calculationId = source?.calculationId || calculation?.calculationId;
    if (!calculationId) throw new Error('Для создания заказа нужен calculationId.');
    const payload = read();
    const existing = payload.orders.find((order) => order.sourceCalculationId === calculationId && !order.parentOrderId);
    if (existing && !options.createCopy) return { order: clone(existing), created: false, duplicate: true };

    const actor = options.actor || source?.actor || 'manager';
    const order = baseOrder('calculator', actor);
    order.status = 'new';
    order.sourceCalculationId = calculationId;
    order.parentOrderId = options.createCopy ? (existing?.id || options.parentOrderId || null) : null;
    order.client = merge(order.client, source?.client || calculation?.inputs?.client || {});
    order.object = merge(order.object, source?.object || calculation?.inputs?.object || { area: calculation?.inputs?.area });
    order.schedule = merge(order.schedule, source?.schedule || calculation?.inputs?.schedule || {});
    order.service = {
      cleaningType: calculation?.inputs?.cleaningType || '',
      cleaningVariant: calculation?.inputs?.cleaningVariant || '',
      title: calculation?.tariff?.label || 'Расчёт из калькулятора',
      lineItems: clone(calculation?.estimatePayload?.lineItems || calculation?.lineItems || [])
    };
    order.pricing = {
      calculatedPrice: amount(calculation?.calculatedClientPrice),
      recommendedPrice: amount(calculation?.recommendedClientPrice),
      finalPrice: amount(calculation?.managerFinalPrice),
      currency: 'RUB',
      source: 'calculator'
    };
    order.planning = {
      normHours: Number(calculation?.normHours || 0),
      crewPlan: clone(calculation?.crewPlan || null),
      plannedLabor: clone(calculation?.laborPlan || null),
      plannedExpenses: clone(calculation?.internalCosts || null),
      plannedProfit: calculation?.expectedNetProfit ?? null
    };
    order.calculationSnapshot = clone(calculation);
    order.warnings = clone(calculation?.warnings || []);
    order.confirmations = clone(calculation?.confirmations || []);
    order.managerNotes = text(source?.managerNotes);
    if (options.createCopy) order.auditTrail.push({ type: 'copied', at: order.createdAt, actor, parentOrderId: order.parentOrderId });
    return { order: persist(order, 'orders:created'), created: true, duplicate: false };
  }

  function createManual(input = {}, options = {}) {
    const actor = options.actor || input.actor || 'manager';
    let order = baseOrder('manual', actor);
    order = merge(order, input);
    order.id ||= id();
    order.source = 'manual';
    order.calculationSnapshot = null;
    order.updatedAt = order.createdAt;
    order.pricing = { ...order.pricing, source: 'manual', finalPrice: amount(order.pricing?.finalPrice) };
    if (order.status !== 'draft') {
      const errors = validateActiveOrder(order);
      if (errors.length) throw new Error(errors.join(' '));
    }
    return persist(order, 'orders:created');
  }

  function getById(orderId) {
    return clone(read().orders.find((order) => order.id === orderId) || null);
  }

  function getByCalculationId(calculationId) {
    return clone(read().orders.find((order) => order.sourceCalculationId === calculationId && !order.parentOrderId) || null);
  }

  function list(filters = {}) {
    const query = text(filters.query).toLocaleLowerCase('ru-RU');
    return clone(read().orders.filter((order) => {
      if (!filters.includeArchived && order.status === 'archived') return false;
      if (filters.status && order.status !== filters.status) return false;
      if (filters.source && order.source !== filters.source) return false;
      if (filters.date && order.schedule?.plannedDate !== filters.date) return false;
      if (!query) return true;
      return [order.displayNumber, order.client?.name, order.client?.organizationName, order.client?.phone, order.object?.address]
        .some((value) => text(value).toLocaleLowerCase('ru-RU').includes(query));
    }));
  }

  function update(orderId, patch, options = {}) {
    const current = getById(orderId);
    if (!current) throw new Error('Заказ не найден.');
    const actor = options.actor || patch?.updatedBy || 'manager';
    const updatedAt = now();
    const updated = merge(current, patch);
    updated.id = current.id;
    updated.updatedAt = updatedAt;
    updated.updatedBy = actor;
    if (updated.status !== 'draft') {
      const errors = validateActiveOrder(updated);
      if (errors.length) throw new Error(errors.join(' '));
    }
    const oldPrice = amount(current.pricing?.finalPrice);
    const newPrice = amount(updated.pricing?.finalPrice);
    updated.auditTrail = [...current.auditTrail, {
      type: oldPrice !== newPrice ? 'price-changed' : 'updated',
      at: updatedAt,
      actor,
      ...(oldPrice !== newPrice ? { from: oldPrice, to: newPrice } : {})
    }];
    return persist(updated);
  }

  function changeStatus(orderId, status, options = {}) {
    const order = getById(orderId);
    if (!order) throw new Error('Заказ не найден.');
    if (!defaultOrderStatuses.some((item) => item.id === status)) throw new Error('Неизвестный статус заказа.');
    if (!(allowedStatusTransitions[order.status] || []).includes(status)) {
      throw new Error(`Переход «${order.status}» → «${status}» недопустим.`);
    }
    if (status !== 'draft' && status !== 'cancelled' && status !== 'archived') {
      const errors = validateActiveOrder(order);
      if (errors.length) throw new Error(errors.join(' '));
    }
    const actor = options.actor || 'manager';
    const previousStatus = order.status;
    order.status = status;
    order.updatedAt = now();
    order.updatedBy = actor;
    order.auditTrail.push({ type: 'status-changed', at: order.updatedAt, actor, from: previousStatus, to: status });
    return persist(order, 'orders:status-changed', { previousStatus, status });
  }

  function archive(orderId, options = {}) {
    const order = getById(orderId);
    if (!order) throw new Error('Заказ не найден.');
    const actor = options.actor || 'manager';
    const previousStatus = order.status;
    order.status = 'archived';
    order.updatedAt = now();
    order.updatedBy = actor;
    order.auditTrail.push({ type: 'archived', at: order.updatedAt, actor, from: previousStatus });
    return persist(order, 'orders:archived', { previousStatus });
  }

  return { createFromCalculation, createManual, getById, getByCalculationId, list, update, changeStatus, archive, validateActiveOrder };
}
