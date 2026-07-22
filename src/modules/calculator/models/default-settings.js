export const CALCULATOR_SETTINGS_VERSION = 1;
export const CALCULATOR_SETTINGS_KEY = 'prochistka_hub_calculator_settings_v1';
export const CALCULATOR_DRAFT_KEY = 'prochistka_hub_calculator_drafts_v1';
export const CALCULATIONS_KEY = 'prochistka_hub_calculations_v1';

const cleaningTypes = {
  post_renovation_basic: {
    label: 'После ремонта — базовая',
    rate: 250,
    minimum: 13000,
    speed: 5,
    clutter: {
      none: { label: 'Без мебели', priceMultiplier: 1, timeMultiplier: 1 },
      low: { label: 'Небольшая', priceMultiplier: 1.2, timeMultiplier: 1.2 }
    },
    dirtiness: {
      normal: { label: 'Обычная', priceMultiplier: 1, timeMultiplier: 1 }
    },
    complexDirtRequiresIndividual: true
  },
  post_renovation_deep: {
    label: 'После ремонта — углублённая',
    rate: 390,
    minimum: 18000,
    speed: 5,
    clutter: {
      low: { label: 'Минимальная', priceMultiplier: 1, timeMultiplier: 1 },
      normal: { label: 'Обычная', priceMultiplier: 1.2, timeMultiplier: 1.2 },
      high: { label: 'Высокая', priceMultiplier: 1.4, timeMultiplier: 1.4 }
    },
    dirtiness: {
      normal: { label: 'Обычная', priceMultiplier: 1, timeMultiplier: 1 }
    },
    complexDirtRequiresIndividual: true
  },
  general: {
    label: 'Генеральная',
    rate: 300,
    minimum: 12000,
    speed: 7,
    clutter: {
      low: { label: 'Низкая', priceMultiplier: 0.9, timeMultiplier: 1 },
      normal: { label: 'Обычная', priceMultiplier: 1, timeMultiplier: 1.2 },
      high: { label: 'Высокая', priceMultiplier: 1.4, timeMultiplier: 1.4 }
    },
    dirtiness: {
      low: { label: 'Низкая', priceMultiplier: 0.9, timeMultiplier: 1 },
      normal: { label: 'Обычная', priceMultiplier: 1, timeMultiplier: 1 },
      elevated: { label: 'Повышенная', priceMultiplier: 1.4, timeMultiplier: 1.2 },
      severe: { label: 'Сильная', priceMultiplier: 1.8, timeMultiplier: 1.4, requiresConfirmation: true }
    }
  },
  maintenance_once: {
    label: 'Поддерживающая — разовая',
    rate: 120,
    minimum: 6500,
    speed: 25,
    clutter: {
      low: { label: 'Низкая', priceMultiplier: 0.95, timeMultiplier: 1 },
      normal: { label: 'Обычная', priceMultiplier: 1, timeMultiplier: 1 },
      high: { label: 'Высокая', priceMultiplier: 1.2, timeMultiplier: 1.2 }
    },
    dirtiness: {
      low: { label: 'Низкая', priceMultiplier: 0.95, timeMultiplier: 1 },
      normal: { label: 'Обычная', priceMultiplier: 1, timeMultiplier: 1 },
      elevated: { label: 'Повышенная', priceMultiplier: 1, timeMultiplier: 1.2, requiresConfirmation: true }
    }
  }
};

const services = [
  ['fridge', 'Холодильник', 'Кухня', 'шт', 850, 0.8, true],
  ['oven', 'Духовой шкаф', 'Кухня', 'шт', 770, 0.8, true],
  ['hood', 'Вытяжка', 'Кухня', 'шт', 350, 0.6, true],
  ['hob', 'Варочная панель', 'Кухня', 'шт', 450, 0.5, true],
  ['stove', 'Плита', 'Кухня', 'шт', 1500, 1.3, true],
  ['microwave', 'СВЧ', 'Кухня', 'шт', 450, 0.5, true],
  ['ozonation', 'Озонирование', 'Другое', 'час', 1500, 1, false],
  ['chair_cleaning', 'Химчистка стула', 'Химчистка', 'шт', 780, 0.9, false],
  ['sofa_standard', 'Химчистка дивана, 3 места', 'Химчистка', 'шт', 5000, 3.5, false],
  ['sofa_corner', 'Химчистка углового дивана', 'Химчистка', 'шт', 6000, 4.5, false],
  ['mattress_side', 'Химчистка матраса', 'Химчистка', 'сторона', 3800, 2.7, false],
  ['waste_collection', 'Сбор мусора больше 10 кг', 'Мусор', 'час', 750, 1, true],
  ['waste_carry', 'Вынос мусора больше 10 кг', 'Мусор', 'час', 1000, 1, true],
  ['construction_waste_collection', 'Сбор строительного мусора', 'Мусор', 'час', 850, 1, true],
  ['construction_waste_carry', 'Вынос строительного мусора', 'Мусор', 'час', 1500, 1, true],
  ['dishwashing', 'Мытьё посуды', 'Кухня', '30 мин', 300, 0.5, true],
  ['chandelier', 'Мойка сложных и хрустальных люстр', 'Другое', 'час', 1500, 1, true],
  ['curtains_remove', 'Снять или повесить шторы', 'Другое', 'шт', 250, 0.4, true],
  ['curtains_steam', 'Глажка или отпаривание штор', 'Другое', 'шт', 500, 0.9, true],
  ['external_waste', 'Вывоз строительного мусора, машина 12 м³', 'Мусор', 'шт', 18000, 3, false],
  ['panoramic_glazing', 'Панорамное остекление', 'Окна', 'м²', 750, 0.8, true],
  ['armchair_cleaning', 'Химчистка кресла', 'Химчистка', 'шт', 1500, 2, false]
].map(([id, name, category, unit, price, normHours, participatesInMainMinimum], order) => ({
  id,
  name,
  category,
  unit,
  price,
  normHours,
  participatesInMainMinimum,
  participatesInDiscount: participatesInMainMinimum,
  standaloneAllowed: true,
  standaloneMinimum: 6500,
  employeeBonus: null,
  active: true,
  order
}));

services.push({
  id: 'windows',
  name: 'Мойка окон',
  category: 'Окна',
  unit: 'створка',
  price: 650,
  priceByCleaningType: {
    post_renovation_basic: 890,
    post_renovation_deep: 890,
    general: 650,
    maintenance_once: 650
  },
  normHours: 0.8,
  normHoursByCleaningType: {
    post_renovation_basic: 1.3,
    post_renovation_deep: 1.3
  },
  employeeBonusByCleaningType: {
    post_renovation_basic: 250,
    post_renovation_deep: 250,
    general: 150,
    maintenance_once: 150
  },
  participatesInMainMinimum: true,
  participatesInDiscount: true,
  standaloneAllowed: true,
  standaloneMinimum: 6500,
  active: true,
  order: services.length,
  subtypes: [
    { id: 'one_side_open', label: 'Односторонняя открывающаяся', price: 470, normHours: 0.5 },
    { id: 'one_side_fixed', label: 'Односторонняя глухая', price: 470, normHours: 0.5 },
    { id: 'two_side_open', label: 'Двухсторонняя открывающаяся', price: 650, normHours: 0.8 },
    { id: 'two_side_fixed', label: 'Двухсторонняя глухая', price: 690, normHours: 0.9 },
    { id: 'postreno_two_side_open', label: 'После ремонта, открывающаяся', price: 890, normHours: 1.3 },
    { id: 'postreno_two_side_fixed', label: 'После ремонта, глухая', price: 950, normHours: 1.5 },
    { id: 'balcony', label: 'Балконный блок', price: 2500, normHours: 1.5 },
    { id: 'loggia', label: 'Лоджия до 6 створок', price: 5000, normHours: 3.5 }
  ]
});

export const defaultCalculatorSettings = {
  schemaVersion: CALCULATOR_SETTINGS_VERSION,
  configRevision: '2026-07-22-v1',
  cleaningTypes,
  additionalServices: services,
  standaloneMinimum: 6500,
  outsideKadPrice: 1700,
  roundingStep: 100,
  taxRate: 0.08,
  overheadPerOrder: 2500,
  variableExpensePerSquareMeter: 30,
  materials: { enabled: false, mode: 'perSquareMeter', value: 17 },
  targetProfit: null,
  labor: {
    maxHoursPerEmployeeDay: 10,
    shortShiftHours: 6,
    shortShiftPay: 4500,
    fullShiftPay: 5000,
    elevatedComplexityPay: 5000,
    standaloneWindowsBasePay: 3500,
    ownerManagerDay: 5000,
    ownerCleanerManagerDay: 5000
  },
  subscription: {
    rate: 90,
    minimumProfitPerVisit: 1500,
    minimumReserve: 300,
    reserveRate: 0.05,
    managerControlMinimum: 2000,
    managerControlHourly: 500,
    discounts: {
      2: { 3: 0, 6: 2, 12: 4 },
      4: { 3: 2, 6: 4, 12: 6 },
      8: { 3: 4, 6: 6, 12: 8 }
    }
  }
};

function mergeRecord(base, value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return structuredClone(base);
  const result = structuredClone(base);
  Object.entries(value).forEach(([key, nextValue]) => {
    result[key] = result[key] && typeof result[key] === 'object' && !Array.isArray(result[key])
      ? mergeRecord(result[key], nextValue)
      : structuredClone(nextValue);
  });
  return result;
}

export function migrateCalculatorSettings(value) {
  const migrated = mergeRecord(defaultCalculatorSettings, value);
  migrated.schemaVersion = CALCULATOR_SETTINGS_VERSION;
  migrated.additionalServices = Array.isArray(value?.additionalServices)
    ? value.additionalServices
    : structuredClone(defaultCalculatorSettings.additionalServices);
  return migrated;
}
