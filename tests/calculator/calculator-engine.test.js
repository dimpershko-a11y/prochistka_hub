import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateLaborPlan,
  calculateOneTime,
  calculateSubscription,
  roundUp
} from '../../src/modules/calculator/services/calculator-engine.js';
import { createCalculatorStore } from '../../src/modules/calculator/services/calculator-store.js';
import { defaultCalculatorSettings, migrateCalculatorSettings } from '../../src/modules/calculator/models/default-settings.js';

const fixed = { now: () => '2026-07-22T10:00:00.000Z' };

function oneTime(overrides = {}) {
  return {
    mode: 'one_time',
    cleaningType: 'post_renovation_basic',
    area: 50,
    clutter: 'none',
    dirtiness: 'normal',
    roundingEnabled: true,
    extras: [],
    confirmations: {},
    planning: {},
    ...overrides
  };
}

function memoryStorage(initial = {}) {
  const values = new Map(Object.entries(structuredClone(initial)));
  return {
    get: (key, fallback = null) => structuredClone(values.has(key) ? values.get(key) : fallback),
    set: (key, value) => (values.set(key, structuredClone(value)), value),
    remove: (key) => values.delete(key)
  };
}

test('контрольные тарифные сценарии и минимум', () => {
  const cases = [
    [oneTime(), 13000, true],
    [oneTime({ cleaningType: 'general', area: 40, clutter: 'normal' }), 12000, false],
    [oneTime({ cleaningType: 'maintenance_once', area: 50, clutter: 'normal' }), 6500, true],
    [oneTime({ cleaningType: 'maintenance_once', area: 50, clutter: 'normal', outsideKad: true }), 8200, true]
  ];
  cases.forEach(([input, expected, minimumApplied]) => {
    const result = calculateOneTime(input, defaultCalculatorSettings, fixed);
    assert.equal(result.calculatedClientPrice, expected);
    assert.equal(result.minimumApplied, minimumApplied);
  });
});

test('окно выводит расчёт выше минимума до округления', () => {
  const result = calculateOneTime(oneTime({ extras: [{ serviceId: 'windows', quantity: 1 }] }), defaultCalculatorSettings, fixed);
  assert.equal(result.cleaningSubtotalBeforeMinimum, 13390);
  assert.equal(result.minimumApplied, false);
  assert.equal(result.priceBeforeRounding, 13390);
});

test('обычная скидка не опускает клининговую часть ниже минимума', () => {
  const result = calculateOneTime(oneTime({ manualDiscount: { type: 'percent', value: 20 } }), defaultCalculatorSettings, fixed);
  assert.equal(result.manualDiscount, 0);
  assert.equal(result.calculatedClientPrice, 13000);
});

test('принудительная скидка владельца проходит ниже минимума и попадает в аудит', () => {
  const result = calculateOneTime(oneTime({ actor: 'owner', manualDiscount: { type: 'percent', value: 10, force: true } }), defaultCalculatorSettings, fixed);
  assert.equal(result.calculatedClientPrice, 11700);
  assert.equal(result.auditTrail.at(-1).type, 'forced-discount');
  assert.equal(result.auditTrail.at(-1).belowMinimumBy, 1300);
});

test('округление вверх работает и распределяется в строку', () => {
  assert.equal(roundUp(17501), 17600);
  const settings = structuredClone(defaultCalculatorSettings);
  settings.cleaningTypes.general.rate = 175.01;
  settings.cleaningTypes.general.minimum = 0;
  const result = calculateOneTime(oneTime({ cleaningType: 'general', area: 100, clutter: 'normal' }), settings, fixed);
  assert.equal(result.priceBeforeRounding, 17501);
  assert.equal(result.calculatedClientPrice, 17600);
  assert.equal(result.roundingAdjustment, 99);
});

test('строки сметы сходятся с итогом после минимума и округления', () => {
  const result = calculateOneTime(oneTime({ area: 49, extras: [{ serviceId: 'fridge', quantity: 1 }] }), defaultCalculatorSettings, fixed);
  assert.equal(result.lineItems.reduce((sum, item) => sum + item.amount, 0), result.calculatedClientPrice);
});

test('окна добавляют нормо-часы и сдельную доплату', () => {
  const result = calculateOneTime(oneTime({ extras: [{ serviceId: 'windows', quantity: 2 }] }), defaultCalculatorSettings, fixed);
  assert.equal(result.normHours, 12.6);
  assert.equal(result.laborPlan.employees.reduce((sum, item) => sum + item.windowBonus, 0), 500);
});

test('план бригады использует ступени сменной оплаты', () => {
  const cases = [
    [12, 2, 6, 9000],
    [16, 2, 8, 10000]
  ];
  cases.forEach(([normHours, crew, hours, total]) => {
    const plan = calculateLaborPlan(defaultCalculatorSettings, { normHours });
    assert.equal(plan.crew, crew);
    assert.equal(plan.hoursPerEmployeeDay, hours);
    assert.equal(plan.total, total);
  });
});

test('повышенная сложность короткой смены оплачивается по 5000 ₽', () => {
  const plan = calculateLaborPlan(defaultCalculatorSettings, { normHours: 4, elevatedComplexity: true });
  assert.equal(plan.total, 5000);
});

test('ограничение клиента на 2 сотрудника и 2 дня даёт ФОТ 20000 ₽', () => {
  const plan = calculateLaborPlan(defaultCalculatorSettings, { normHours: 16, crewCount: 2, days: 2, splitReason: 'client_restriction' });
  assert.equal(plan.total, 20000);
});

test('самостоятельные окна используют клиентский минимум и отдельную оплату сотрудника', () => {
  const result = calculateOneTime(oneTime({ cleaningType: '', area: 0, extras: [{ serviceId: 'windows', quantity: 1 }] }), defaultCalculatorSettings, fixed);
  assert.equal(result.calculatedClientPrice, 6500);
  assert.equal(result.laborPlan.total, 3650);
});

test('сильная загрязнённость требует подтверждения', () => {
  const blocked = calculateOneTime(oneTime({ cleaningType: 'general', clutter: 'normal', dirtiness: 'severe' }), defaultCalculatorSettings, fixed);
  const confirmed = calculateOneTime(oneTime({ cleaningType: 'general', clutter: 'normal', dirtiness: 'severe', confirmations: { dirtiness: true } }), defaultCalculatorSettings, fixed);
  assert.equal(blocked.canFinalize, false);
  assert.equal(confirmed.canFinalize, true);
});

test('индивидуальная услуга блокирует финализацию без цены и комментария', () => {
  const settings = structuredClone(defaultCalculatorSettings);
  settings.additionalServices.push({ id: 'individual', name: 'Индивидуальная', category: 'Другое', unit: 'шт', individual: true, active: true, standaloneAllowed: true, standaloneMinimum: 6500 });
  const blocked = calculateOneTime(oneTime({ cleaningType: '', area: 0, extras: [{ serviceId: 'individual', quantity: 1 }] }), settings, fixed);
  assert.equal(blocked.canFinalize, false);
  assert.match(blocked.warnings.join(' '), /индивидуальную цену/i);
});

test('для standalone-услуг используется самый высокий минимум', () => {
  const settings = structuredClone(defaultCalculatorSettings);
  settings.additionalServices.find((item) => item.id === 'fridge').standaloneMinimum = 7000;
  settings.additionalServices.find((item) => item.id === 'oven').standaloneMinimum = 9000;
  const result = calculateOneTime(oneTime({ cleaningType: '', area: 0, extras: [{ serviceId: 'fridge', quantity: 1 }, { serviceId: 'oven', quantity: 1 }] }), settings, fixed);
  assert.equal(result.minimumPrice, 9000);
});

test('абонементные скидки соответствуют таблице', () => {
  const cases = [[2, 3, 0], [4, 6, 4], [8, 12, 8]];
  cases.forEach(([visitsPerMonth, months, expected]) => {
    const result = calculateSubscription({ cleanableArea: 100, visitsPerMonth, months }, defaultCalculatorSettings, fixed);
    assert.equal(result.automaticDiscount, expected);
  });
});

test('абонемент не опускается ниже экономического пола после округления', () => {
  const result = calculateSubscription({ cleanableArea: 20, visitsPerMonth: 8, months: 12 }, defaultCalculatorSettings, fixed);
  assert.ok(result.calculatedClientPrice >= result.economicFloor);
  assert.ok(result.expectedNetProfit >= 1500);
  assert.equal(result.calculatedClientPrice % 100, 0);
});

test('черновик сериализуется без изменения результата', () => {
  const storage = memoryStorage();
  const store = createCalculatorStore(storage);
  const input = oneTime({ area: 72, extras: [{ serviceId: 'fridge', quantity: 1 }] });
  const before = calculateOneTime(input, defaultCalculatorSettings, fixed);
  store.saveDraft(input);
  const after = calculateOneTime(store.getDraft(), defaultCalculatorSettings, fixed);
  assert.equal(after.calculatedClientPrice, before.calculatedClientPrice);
  assert.equal(after.normHours, before.normHours);
});

test('миграция настроек сохраняет пользовательские и новые значения', () => {
  const migrated = migrateCalculatorSettings({ schemaVersion: 0, outsideKadPrice: 1900, cleaningTypes: { custom: { label: 'Своя', rate: 1, minimum: 2, speed: 3 } } });
  assert.equal(migrated.outsideKadPrice, 1900);
  assert.equal(migrated.cleaningTypes.custom.rate, 1);
  assert.equal(migrated.schemaVersion, 1);
});
