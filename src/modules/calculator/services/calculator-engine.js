import { defaultCalculatorSettings, migrateCalculatorSettings } from '../models/default-settings.js';

const money = (value) => Math.round(Number(value) || 0);
const positive = (value) => Math.max(0, Number(value) || 0);
const clone = (value) => structuredClone(value);

export function roundUp(value, step = 100) {
  const safeStep = Math.max(1, positive(step));
  return Math.ceil(positive(value) / safeStep) * safeStep;
}

function makeId(prefix, createdAt) {
  return `${prefix}-${createdAt.replace(/\D/g, '').slice(0, 17)}-${Math.random().toString(36).slice(2, 8)}`;
}

function resolveServicePrice(service, cleaningType, subtype) {
  return positive(
    subtype?.price
      ?? service.priceByCleaningType?.[cleaningType]
      ?? service.price
  );
}

function resolveServiceHours(service, cleaningType, subtype) {
  return positive(
    subtype?.normHours
      ?? service.normHoursByCleaningType?.[cleaningType]
      ?? service.normHours
  );
}

function getService(settings, selection) {
  const service = settings.additionalServices.find((item) => item.id === selection.serviceId && item.active);
  if (!service) return null;
  const subtype = service.subtypes?.find((item) => item.id === selection.subtypeId) || null;
  return { service, subtype };
}

function buildExtraLines(settings, input, warnings) {
  return (input.extras || []).flatMap((selection) => {
    const resolved = getService(settings, selection);
    const quantity = positive(selection.quantity);
    if (!resolved || quantity === 0) return [];

    const { service, subtype } = resolved;
    const requiresIndividual = service.individual === true || subtype?.individual === true;
    const unitPrice = requiresIndividual ? positive(selection.manualPrice) : resolveServicePrice(service, input.cleaningType, subtype);
    if (requiresIndividual && (!unitPrice || !String(selection.comment || '').trim())) {
      warnings.push(`${service.name}: укажите индивидуальную цену и комментарий.`);
    }

    return [{
      id: `service:${service.id}:${subtype?.id || 'default'}`,
      kind: 'service',
      serviceId: service.id,
      label: subtype ? `${service.name} — ${subtype.label}` : service.name,
      unit: service.unit,
      quantity,
      unitPrice,
      originalAmount: money(quantity * unitPrice),
      amount: money(quantity * unitPrice),
      minimumAdjustment: 0,
      roundingAdjustment: 0,
      normHours: quantity * resolveServiceHours(service, input.cleaningType, subtype),
      participatesInMainMinimum: service.participatesInMainMinimum === true,
      participatesInDiscount: service.participatesInDiscount === true,
      standaloneAllowed: service.standaloneAllowed !== false,
      standaloneMinimum: positive(service.standaloneMinimum),
      requiresIndividual,
      individualComplete: !requiresIndividual || Boolean(unitPrice && String(selection.comment || '').trim()),
      employeeBonus: service.employeeBonusByCleaningType
        ? quantity * positive(service.employeeBonusByCleaningType[input.cleaningType] ?? service.employeeBonusByCleaningType.maintenance_once)
        : quantity * positive(service.employeeBonus)
    }];
  });
}

function distributeAdjustment(lines, amount, field) {
  if (!amount) return null;
  const target = lines.find((item) => item.kind === 'cleaning')
    || [...lines].filter((item) => item.participatesInMainMinimum).sort((a, b) => b.amount - a.amount)[0]
    || lines[0];
  if (!target) return null;
  target.amount += amount;
  target[field] = (target[field] || 0) + amount;
  return target.id;
}

function discountAmount(discount, eligibleAmount, minimumPrice, force) {
  if (!discount || positive(discount.value) === 0) return 0;
  const requested = discount.type === 'amount'
    ? positive(discount.value)
    : eligibleAmount * Math.min(100, positive(discount.value)) / 100;
  const maximum = force ? eligibleAmount : Math.max(0, eligibleAmount - minimumPrice);
  return money(Math.min(requested, maximum));
}

export function calculateLaborPlan(settings, input) {
  const normHours = positive(input.normHours);
  const days = Math.max(1, Math.round(positive(input.days) || 1));
  const recommendedCrew = normHours ? Math.max(1, Math.ceil(normHours / 10)) : 0;
  const crew = normHours ? Math.max(1, Math.round(positive(input.crewCount) || recommendedCrew)) : 0;
  const hoursPerShift = crew ? normHours / crew / days : 0;
  const laborSettings = settings.labor;
  const clientRestricted = input.splitReason === 'client_restriction';
  const elevated = input.elevatedComplexity === true;
  const standaloneWindows = input.standaloneWindows === true;
  let basePayPerShift = hoursPerShift <= laborSettings.shortShiftHours
    ? laborSettings.shortShiftPay
    : laborSettings.fullShiftPay;

  if (clientRestricted || elevated) basePayPerShift = laborSettings.elevatedComplexityPay;
  if (standaloneWindows && hoursPerShift <= 4) basePayPerShift = laborSettings.standaloneWindowsBasePay;

  const windowBonus = money(positive(input.windowBonus));
  const employees = Array.from({ length: crew }, (_, index) => ({
    employeeIndex: index + 1,
    days,
    hoursPerDay: hoursPerShift,
    basePay: money(basePayPerShift * days),
    windowBonus: crew ? money(windowBonus / crew) : 0
  }));

  const ownerRole = input.ownerRole || 'none';
  const ownerPay = ownerRole === 'manager'
    ? settings.labor.ownerManagerDay * days
    : ownerRole === 'cleaner_manager'
      ? settings.labor.ownerCleanerManagerDay * days
      : 0;
  const employeePay = employees.reduce((sum, employee) => sum + employee.basePay + employee.windowBonus, 0);

  return {
    normHours,
    recommendedCrew,
    crew,
    days,
    hoursPerEmployeeDay: hoursPerShift,
    exceedsShiftLimit: hoursPerShift > laborSettings.maxHoursPerEmployeeDay,
    splitReason: input.splitReason || 'volume',
    employees,
    ownerRole,
    ownerPay: money(ownerPay),
    total: money(employeePay + ownerPay)
  };
}

function buildExternalLines(settings, input) {
  const entries = [
    input.outsideKad ? ['outside-kad', 'Выезд за КАД', settings.outsideKadPrice] : null,
    ['parking', 'Парковка и платный въезд', input.externalCharges?.parking],
    ['equipment', 'Аренда оборудования', input.externalCharges?.equipment],
    ['contractors', 'Подрядчики и внешняя логистика', input.externalCharges?.contractors]
  ].filter(Boolean);

  return entries.flatMap(([id, label, value]) => {
    const amount = money(positive(value));
    return amount ? [{
      id: `external:${id}`,
      kind: 'external',
      label,
      quantity: 1,
      unitPrice: amount,
      originalAmount: amount,
      amount,
      participatesInMainMinimum: false,
      participatesInDiscount: false,
      normHours: 0,
      employeeBonus: 0
    }] : [];
  });
}

function calculateEconomics(settings, input, laborPlan, finalPrice, externalLines, warnings) {
  const area = positive(input.area);
  const variableExpenses = money(area * settings.variableExpensePerSquareMeter);
  const materials = settings.materials.enabled
    ? money(settings.materials.mode === 'fixed' ? settings.materials.value : area * settings.materials.value)
    : 0;
  const externalExpenses = money(positive(input.internalExpenses)
    + externalLines.reduce((sum, item) => sum + item.amount, 0));
  const costBeforeTax = laborPlan.total + variableExpenses + materials + settings.overheadPerOrder + externalExpenses;
  const tax = money(finalPrice * settings.taxRate);
  const expectedNetProfit = money(finalPrice - costBeforeTax - tax);
  const targetProfit = Number.isFinite(Number(settings.targetProfit)) ? positive(settings.targetProfit) : null;
  const economicFloor = targetProfit === null
    ? null
    : roundUp((costBeforeTax + targetProfit) / (1 - settings.taxRate), settings.roundingStep);

  if (targetProfit === null) warnings.push('Целевая прибыль не настроена; рекомендуемая цена не повышается автоматически.');

  return {
    plannedLabor: laborPlan,
    variableExpenses,
    materials,
    overhead: money(settings.overheadPerOrder),
    externalExpenses,
    costBeforeTax: money(costBeforeTax),
    tax,
    expectedNetProfit,
    marginPercent: finalPrice ? expectedNetProfit / finalPrice * 100 : 0,
    targetProfit,
    economicFloor
  };
}

export function calculateOneTime(rawInput, rawSettings = defaultCalculatorSettings, options = {}) {
  const settings = migrateCalculatorSettings(rawSettings);
  const input = clone(rawInput || {});
  const now = options.now?.() || new Date().toISOString();
  const warnings = [];
  const confirmations = [];
  const blockers = [];
  const extraLines = buildExtraLines(settings, input, warnings);
  const cleaningType = input.cleaningType ? settings.cleaningTypes[input.cleaningType] : null;
  const area = positive(input.area);
  const hasCleaning = Boolean(cleaningType && area);

  if (input.cleaningType && !cleaningType) warnings.push('Выбран неизвестный вид уборки.');
  if (!hasCleaning && !extraLines.length) warnings.push('Укажите площадь основной уборки или выберите дополнительную услугу.');

  const clutter = cleaningType?.clutter?.[input.clutter] || Object.values(cleaningType?.clutter || {})[0];
  const dirtiness = cleaningType?.dirtiness?.[input.dirtiness] || Object.values(cleaningType?.dirtiness || {})[0];
  if (dirtiness?.requiresConfirmation && !input.confirmations?.dirtiness) {
    warnings.push('Выбранная загрязнённость требует подтверждения менеджера.');
    confirmations.push('dirtiness');
  }
  if (cleaningType?.complexDirtRequiresIndividual && input.complexDirt
    && !(input.confirmations?.individualPrice && positive(input.managerFinalPrice) && String(input.managerNotes || '').trim())) {
    warnings.push('Сложные строительные загрязнения требуют индивидуальной цены и подтверждения.');
    confirmations.push('individualPrice');
  }

  const mainOriginal = hasCleaning
    ? money(area * cleaningType.rate * (clutter?.priceMultiplier || 1) * (dirtiness?.priceMultiplier || 1))
    : 0;
  const lines = hasCleaning ? [{
    id: 'cleaning:main',
    kind: 'cleaning',
    label: cleaningType.label,
    quantity: area,
    unit: 'м²',
    unitPrice: cleaningType.rate,
    originalAmount: mainOriginal,
    amount: mainOriginal,
    minimumAdjustment: 0,
    roundingAdjustment: 0,
    participatesInMainMinimum: true,
    participatesInDiscount: true,
    normHours: area / positive(cleaningType.speed || 1) * (clutter?.timeMultiplier || 1) * (dirtiness?.timeMultiplier || 1),
    employeeBonus: 0
  }] : [];
  lines.push(...extraLines);

  const ineligibleStandalone = !hasCleaning && extraLines.filter((item) => !item.standaloneAllowed);
  if (ineligibleStandalone.length) {
    warnings.push(`Нельзя заказать отдельно: ${ineligibleStandalone.map((item) => item.label).join(', ')}.`);
  }

  const minimumLines = lines.filter((item) => item.participatesInMainMinimum);
  const cleaningSubtotalBeforeMinimum = money(minimumLines.reduce((sum, item) => sum + item.amount, 0));
  const minimumPrice = hasCleaning
    ? positive(cleaningType.minimum)
    : Math.max(settings.standaloneMinimum, ...extraLines.map((item) => item.standaloneMinimum || 0));
  const minimumTopUp = cleaningSubtotalBeforeMinimum > 0
    ? money(Math.max(0, minimumPrice - cleaningSubtotalBeforeMinimum))
    : 0;
  const minimumAdjustmentLineId = distributeAdjustment(minimumLines, minimumTopUp, 'minimumAdjustment');
  const cleaningSubtotalAfterMinimum = cleaningSubtotalBeforeMinimum + minimumTopUp;

  const forceDiscount = input.manualDiscount?.force === true;
  const actorRole = input.actorRole || input.actor || 'manager';
  const roleDiscountLimit = actorRole === 'manager' ? 5 : actorRole === 'extended_manager' ? 10 : Infinity;
  if (input.manualDiscount?.type === 'percent' && positive(input.manualDiscount.value) > roleDiscountLimit) {
    warnings.push(`Для роли «${actorRole}» скидка ограничена ${roleDiscountLimit}%.`);
    blockers.push('discountLimit');
  }
  if (forceDiscount && actorRole !== 'owner' && !String(input.manualDiscount?.reason || '').trim()) {
    warnings.push('Для принудительного снижения укажите причину.');
    blockers.push('forceDiscountReason');
  }
  const automaticDiscount = discountAmount(input.automaticDiscount, cleaningSubtotalAfterMinimum, minimumPrice, false);
  const afterAutomatic = cleaningSubtotalAfterMinimum - automaticDiscount;
  const manualDiscount = discountAmount(input.manualDiscount, afterAutomatic, minimumPrice, forceDiscount);
  const externalLines = buildExternalLines(settings, input);
  const externalCharges = money(externalLines.reduce((sum, item) => sum + item.amount, 0));
  const manualMarkup = money(input.manualMarkup?.type === 'percent'
    ? (afterAutomatic - manualDiscount + externalCharges) * positive(input.manualMarkup.value) / 100
    : positive(input.manualMarkup?.value));
  if (input.manualMarkup?.type === 'percent' && positive(input.manualMarkup.value) > 20 && !String(input.managerNotes || '').trim()) {
    warnings.push('Для наценки больше 20% укажите комментарий менеджера.');
    blockers.push('markupReason');
  }
  const priceBeforeRounding = money(afterAutomatic - manualDiscount + externalCharges + manualMarkup);
  const roundingEnabled = input.roundingEnabled !== false;
  const roundedPrice = roundingEnabled ? roundUp(priceBeforeRounding, settings.roundingStep) : priceBeforeRounding;
  const roundingAdjustment = roundedPrice - priceBeforeRounding;
  const roundingAdjustmentLineId = distributeAdjustment(minimumLines.length ? minimumLines : lines, roundingAdjustment, 'roundingAdjustment');

  const normHours = lines.reduce((sum, item) => sum + positive(item.normHours), 0);
  const windowBonus = lines.reduce((sum, item) => sum + positive(item.employeeBonus), 0);
  const laborPlan = calculateLaborPlan(settings, {
    normHours,
    days: input.planning?.days,
    crewCount: input.planning?.crewCount,
    splitReason: input.planning?.splitReason,
    elevatedComplexity: input.planning?.elevatedComplexity,
    ownerRole: input.planning?.ownerRole,
    windowBonus,
    standaloneWindows: !hasCleaning && extraLines.length > 0 && extraLines.every((item) => item.serviceId === 'windows')
  });
  if (laborPlan.exceedsShiftLimit) warnings.push('Смена превышает 10 часов: увеличьте бригаду или число дней.');

  const preliminaryEconomics = calculateEconomics(settings, input, laborPlan, roundedPrice, externalLines, warnings);
  const recommendedClientPrice = preliminaryEconomics.economicFloor === null
    ? roundedPrice
    : Math.max(roundedPrice, preliminaryEconomics.economicFloor);
  const managerFinalPrice = positive(input.managerFinalPrice) || recommendedClientPrice;
  if (preliminaryEconomics.economicFloor !== null && managerFinalPrice < preliminaryEconomics.economicFloor && !forceDiscount && actorRole !== 'owner') {
    warnings.push('Окончательная цена ниже экономического пола: включите принудительный режим или восстановите цену.');
    blockers.push('managerPriceBelowEconomicFloor');
  }
  if (positive(input.managerFinalPrice) && managerFinalPrice < minimumPrice && !forceDiscount && actorRole !== 'owner') {
    warnings.push('Окончательная цена ниже минимальной: включите принудительный режим или восстановите цену.');
    blockers.push('managerPriceBelowMinimum');
  }
  const internalCosts = calculateEconomics(settings, input, laborPlan, managerFinalPrice, externalLines, []);
  const managerAdjustment = money(managerFinalPrice - roundedPrice);

  const auditTrail = clone(input.auditTrail || []);
  auditTrail.push({ type: 'calculation-created', at: now, actor: input.actor || 'manager' });
  if (forceDiscount && manualDiscount) {
    auditTrail.push({
      type: 'forced-discount',
      at: now,
      actor: input.actor || 'manager',
      amount: manualDiscount,
      belowMinimumBy: money(Math.max(0, minimumPrice - (afterAutomatic - manualDiscount))),
      reason: String(input.manualDiscount.reason || '')
    });
  }
  if (managerAdjustment) {
    auditTrail.push({ type: 'manager-price-adjustment', at: now, actor: input.actor || 'manager', amount: managerAdjustment });
  }

  const calculatedLineItems = [
    ...lines,
    ...(automaticDiscount ? [{ id: 'discount:auto', kind: 'discount', label: 'Автоматическая скидка', amount: -automaticDiscount }] : []),
    ...(manualDiscount ? [{ id: 'discount:manual', kind: 'discount', label: 'Ручная скидка', amount: -manualDiscount }] : []),
    ...externalLines,
    ...(manualMarkup ? [{ id: 'markup:manual', kind: 'markup', label: 'Ручная наценка', amount: manualMarkup }] : [])
  ];
  const estimateLineItems = managerAdjustment
    ? [...calculatedLineItems, { id: 'manager:adjustment', kind: 'adjustment', label: 'Согласованная корректировка стоимости', amount: managerAdjustment }]
    : calculatedLineItems;
  const canFinalize = !confirmations.length
    && !blockers.length
    && !ineligibleStandalone.length
    && !extraLines.some((item) => !item.individualComplete)
    && Boolean(hasCleaning || extraLines.length);
  const calculationId = input.calculationId || makeId('calc', now);

  const result = {
    schemaVersion: 1,
    configRevision: settings.configRevision,
    calculationId,
    createdAt: now,
    mode: 'one_time',
    inputs: input,
    tariff: cleaningType ? { id: input.cleaningType, label: cleaningType.label, rate: cleaningType.rate } : null,
    lineItems: calculatedLineItems,
    warnings,
    confirmations,
    canFinalize,
    cleaningSubtotalBeforeMinimum,
    minimumPrice,
    minimumTopUp,
    minimumApplied: minimumTopUp > 0,
    minimumAdjustmentLineId,
    cleaningSubtotalAfterMinimum,
    automaticDiscount,
    manualDiscount,
    manualMarkup,
    externalCharges,
    priceBeforeRounding,
    roundingAdjustment,
    roundingAdjustmentLineId,
    calculatedClientPrice: roundedPrice,
    recommendedClientPrice,
    managerFinalPrice,
    normHours,
    crewPlan: laborPlan,
    laborPlan,
    internalCosts,
    tax: internalCosts.tax,
    expectedNetProfit: internalCosts.expectedNetProfit,
    auditTrail
  };

  result.estimatePayload = {
    calculationId,
    lineItems: clone(estimateLineItems),
    total: managerFinalPrice,
    currency: 'RUB',
    minimumApplied: result.minimumApplied,
    minimumMessage: result.minimumApplied
      ? `Применена минимальная стоимость заказа: ${minimumPrice} ₽. Расчёт уборки и дополнительных работ оказался ниже минимальной стоимости. Минимум не прибавляется сверху.`
      : null
  };
  result.orderPayload = {
    calculationId,
    calculationSnapshot: clone(result),
    client: clone(input.client || {}),
    object: clone(input.object || { area }),
    schedule: clone(input.schedule || {}),
    managerNotes: String(input.managerNotes || '')
  };
  return result;
}

function subscriptionLaborPay(settings, hours) {
  if (hours <= 4) return 3500;
  if (hours <= 5) return 4000;
  if (hours <= 8) return 4500;
  if (hours <= 10) return 5000;
  return null;
}

export function calculateSubscription(rawInput, rawSettings = defaultCalculatorSettings, options = {}) {
  const settings = migrateCalculatorSettings(rawSettings);
  const input = clone(rawInput || {});
  const now = options.now?.() || new Date().toISOString();
  const area = positive(input.cleanableArea);
  const visitsPerMonth = [2, 4, 8].includes(Number(input.visitsPerMonth)) ? Number(input.visitsPerMonth) : 2;
  const months = [3, 6, 12].includes(Number(input.months)) ? Number(input.months) : 3;
  const discountPercent = settings.subscription.discounts[visitsPerMonth][months];
  const tariffPrice = money(area * settings.subscription.rate * (1 - discountPercent / 100));
  const normHours = area / positive(settings.cleaningTypes.maintenance_once.speed || 1);
  const employeePay = subscriptionLaborPay(settings, normHours);
  const warnings = [];
  if (employeePay === null) warnings.push('Регулярный визит свыше 10 часов требует индивидуального расчёта.');
  const managerControlMonthly = Math.max(
    settings.subscription.managerControlMinimum,
    positive(input.managerControlHours || 4) * settings.subscription.managerControlHourly
  );
  const managerControlShare = money(managerControlMonthly / visitsPerMonth);
  const travelCompensation = money(positive(input.travelCompensation));
  const directExpenses = money(positive(input.directExpenses));
  const fixedCost = positive(employeePay) + managerControlShare + travelCompensation + directExpenses;
  const taxRate = settings.taxRate;
  const reserveRate = settings.subscription.reserveRate;
  const minimumReserve = settings.subscription.minimumReserve;
  const minimumProfit = settings.subscription.minimumProfitPerVisit;
  const fixedReserveFloor = (fixedCost + minimumReserve + minimumProfit) / (1 - taxRate);
  const economicFloorRaw = fixedReserveFloor * reserveRate <= minimumReserve
    ? fixedReserveFloor
    : (fixedCost + minimumProfit) / (1 - taxRate - reserveRate);
  const economicFloor = roundUp(economicFloorRaw, settings.roundingStep);
  const visitPrice = roundUp(Math.max(tariffPrice, economicFloor), settings.roundingStep);
  const reserve = Math.max(money(visitPrice * reserveRate), minimumReserve);
  const tax = money(visitPrice * taxRate);
  const expectedNetProfit = visitPrice - fixedCost - reserve - tax;
  const calculationId = input.calculationId || makeId('subscription', now);

  const result = {
    schemaVersion: 1,
    configRevision: settings.configRevision,
    calculationId,
    createdAt: now,
    mode: 'subscription',
    inputs: input,
    warnings,
    confirmations: [],
    canFinalize: area > 0 && employeePay !== null,
    tariffPrice,
    automaticDiscount: discountPercent,
    normHours,
    employeePay,
    managerControlShare,
    travelCompensation,
    directExpenses,
    reserve,
    economicFloor,
    calculatedClientPrice: visitPrice,
    recommendedClientPrice: visitPrice,
    managerFinalPrice: positive(input.managerFinalPrice) || visitPrice,
    tax,
    expectedNetProfit,
    totalVisits: visitsPerMonth * months,
    prepaymentTotal: visitPrice * visitsPerMonth * months,
    lineItems: [{ id: 'subscription:visit', kind: 'cleaning', label: 'Регулярная поддерживающая уборка', amount: visitPrice }],
    auditTrail: [{ type: 'calculation-created', at: now, actor: input.actor || 'manager' }]
  };
  result.estimatePayload = {
    calculationId,
    lineItems: clone(result.lineItems),
    total: result.managerFinalPrice,
    currency: 'RUB',
    minimumApplied: false,
    minimumMessage: null
  };
  result.orderPayload = {
    calculationId,
    calculationSnapshot: clone(result),
    client: clone(input.client || {}),
    object: clone(input.object || { area: input.cleanableArea }),
    schedule: clone(input.schedule || {}),
    managerNotes: String(input.managerNotes || '')
  };
  return result;
}

export function calculate(rawInput, settings, options) {
  return rawInput?.mode === 'subscription'
    ? calculateSubscription(rawInput, settings, options)
    : calculateOneTime(rawInput, settings, options);
}
