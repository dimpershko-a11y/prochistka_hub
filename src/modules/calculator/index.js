import './styles.css';
import { moduleManifest } from './manifest.js';
import { calculate } from './services/calculator-engine.js';
import { createCalculatorStore } from './services/calculator-store.js';

export { moduleManifest };

let cleanup = null;
let initializationCleanup = null;

export function initialize({ shared }) {
  initializationCleanup?.();
  const store = createCalculatorStore(shared.storageService);
  initializationCleanup = shared.eventBus.on('calculator:open-requested', ({ calculationSnapshot }) => {
    if (calculationSnapshot?.inputs) store.saveDraft(calculationSnapshot.inputs);
  });
}

const escapeHtml = (value) => String(value ?? '')
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&#039;');

function createDraft() {
  return {
    mode: 'one_time',
    cleaningType: 'post_renovation_basic',
    area: 50,
    clutter: 'none',
    dirtiness: 'normal',
    extras: [],
    outsideKad: false,
    roundingEnabled: true,
    automaticDiscount: { type: 'percent', value: 0 },
    manualDiscount: { type: 'percent', value: 0, force: false, reason: '' },
    manualMarkup: { type: 'amount', value: 0 },
    planning: { days: 1, crewCount: 0, splitReason: 'volume', ownerRole: 'none' },
    confirmations: {},
    client: {},
    object: {},
    schedule: {},
    externalCharges: {}
  };
}

function optionList(record, selected) {
  return Object.entries(record || {}).map(([id, item]) =>
    `<option value="${escapeHtml(id)}" ${id === selected ? 'selected' : ''}>${escapeHtml(item.label)}</option>`
  ).join('');
}

function inputValue(form, name) {
  return form.elements.namedItem(name)?.value ?? '';
}

function readForm(form, settings, calculationId) {
  const cleaningType = inputValue(form, 'cleaningType');
  const extras = settings.additionalServices.map((service) => ({
    serviceId: service.id,
    subtypeId: inputValue(form, `subtype:${service.id}`) || undefined,
    quantity: Number(inputValue(form, `extra:${service.id}`)) || 0
  })).filter((item) => item.quantity > 0);

  return {
    calculationId,
    mode: inputValue(form, 'mode'),
    cleanableArea: Number(inputValue(form, 'area')) || 0,
    visitsPerMonth: Number(inputValue(form, 'visitsPerMonth')) || 2,
    months: Number(inputValue(form, 'subscriptionMonths')) || 3,
    cleaningType,
    area: Number(inputValue(form, 'area')) || 0,
    clutter: inputValue(form, 'clutter'),
    dirtiness: inputValue(form, 'dirtiness'),
    complexDirt: form.elements.namedItem('complexDirt')?.checked || false,
    extras,
    outsideKad: form.elements.namedItem('outsideKad')?.checked || false,
    roundingEnabled: form.elements.namedItem('roundingEnabled')?.checked || false,
    manualDiscount: {
      type: inputValue(form, 'discountType'),
      value: Number(inputValue(form, 'discountValue')) || 0,
      force: form.elements.namedItem('forceDiscount')?.checked || false,
      reason: inputValue(form, 'discountReason')
    },
    manualMarkup: { type: inputValue(form, 'markupType'), value: Number(inputValue(form, 'markupValue')) || 0 },
    managerFinalPrice: Number(inputValue(form, 'managerFinalPrice')) || 0,
    actorRole: inputValue(form, 'actorRole') || 'manager',
    externalCharges: {
      parking: Number(inputValue(form, 'parking')) || 0,
      equipment: Number(inputValue(form, 'equipment')) || 0,
      contractors: Number(inputValue(form, 'contractors')) || 0
    },
    planning: {
      days: Number(inputValue(form, 'days')) || 1,
      crewCount: Number(inputValue(form, 'crewCount')) || 0,
      splitReason: inputValue(form, 'splitReason'),
      ownerRole: inputValue(form, 'ownerRole'),
      elevatedComplexity: form.elements.namedItem('elevatedComplexity')?.checked || false
    },
    confirmations: {
      dirtiness: form.elements.namedItem('confirmDirtiness')?.checked || false,
      individualPrice: form.elements.namedItem('confirmIndividual')?.checked || false
    },
    client: {
      name: inputValue(form, 'clientName'),
      organizationName: inputValue(form, 'organizationName'),
      phone: inputValue(form, 'phone'),
      email: inputValue(form, 'email'),
      messenger: inputValue(form, 'messenger')
    },
    object: {
      address: inputValue(form, 'address'),
      district: inputValue(form, 'district'),
      area: Number(inputValue(form, 'area')) || 0,
      accessNotes: inputValue(form, 'accessNotes'),
      parkingNotes: inputValue(form, 'parkingNotes'),
      outsideKad: form.elements.namedItem('outsideKad')?.checked || false
    },
    schedule: {
      plannedDate: inputValue(form, 'plannedDate'),
      plannedStartTime: inputValue(form, 'plannedStartTime'),
      plannedDays: Number(inputValue(form, 'days')) || 1
    },
    managerNotes: inputValue(form, 'managerNotes'),
    actor: inputValue(form, 'actorRole') || 'manager'
  };
}

function hydrateForm(form, draft, settings) {
  Object.entries({
    mode: draft.mode,
    visitsPerMonth: draft.visitsPerMonth,
    subscriptionMonths: draft.months,
    cleaningType: draft.cleaningType,
    area: draft.area,
    clutter: draft.clutter,
    dirtiness: draft.dirtiness,
    discountType: draft.manualDiscount?.type,
    discountValue: draft.manualDiscount?.value,
    discountReason: draft.manualDiscount?.reason,
    markupType: draft.manualMarkup?.type,
    markupValue: draft.manualMarkup?.value,
    managerFinalPrice: draft.managerFinalPrice,
    actorRole: draft.actorRole || draft.actor,
    parking: draft.externalCharges?.parking,
    equipment: draft.externalCharges?.equipment,
    contractors: draft.externalCharges?.contractors,
    days: draft.planning?.days,
    crewCount: draft.planning?.crewCount,
    splitReason: draft.planning?.splitReason,
    ownerRole: draft.planning?.ownerRole,
    clientName: draft.client?.name,
    organizationName: draft.client?.organizationName,
    phone: draft.client?.phone,
    email: draft.client?.email,
    messenger: draft.client?.messenger,
    address: draft.object?.address,
    district: draft.object?.district,
    accessNotes: draft.object?.accessNotes,
    parkingNotes: draft.object?.parkingNotes,
    plannedDate: draft.schedule?.plannedDate,
    plannedStartTime: draft.schedule?.plannedStartTime,
    managerNotes: draft.managerNotes
  }).forEach(([name, value]) => {
    const element = form.elements.namedItem(name);
    if (element && value !== undefined) element.value = value;
  });
  ['outsideKad', 'roundingEnabled', 'complexDirt', 'forceDiscount', 'elevatedComplexity'].forEach((name) => {
    const element = form.elements.namedItem(name);
    if (element) element.checked = Boolean(name === 'roundingEnabled' ? draft.roundingEnabled !== false : draft[name] || draft.planning?.[name]);
  });
  form.elements.namedItem('confirmDirtiness').checked = Boolean(draft.confirmations?.dirtiness);
  form.elements.namedItem('confirmIndividual').checked = Boolean(draft.confirmations?.individualPrice);
  (draft.extras || []).forEach((extra) => {
    const quantity = form.elements.namedItem(`extra:${extra.serviceId}`);
    const subtype = form.elements.namedItem(`subtype:${extra.serviceId}`);
    if (quantity) quantity.value = extra.quantity;
    if (subtype && extra.subtypeId) subtype.value = extra.subtypeId;
  });
  syncCoefficientOptions(form, settings, draft);
}

function syncCoefficientOptions(form, settings, draft = {}) {
  const type = settings.cleaningTypes[inputValue(form, 'cleaningType')];
  const clutter = form.elements.namedItem('clutter');
  const dirtiness = form.elements.namedItem('dirtiness');
  const currentClutter = draft.clutter || clutter.value;
  const currentDirtiness = draft.dirtiness || dirtiness.value;
  clutter.innerHTML = optionList(type?.clutter, currentClutter);
  dirtiness.innerHTML = optionList(type?.dirtiness, currentDirtiness);
}

function renderResult(root, result, moneyFormat) {
  const resultNode = root.querySelector('[data-calculation-result]');
  const warnings = root.querySelector('[data-calculation-warnings]');
  const createButton = root.querySelector('[data-create-order]');
  createButton.disabled = !result.canFinalize;
  warnings.innerHTML = result.warnings.map((warning) => `<li>${escapeHtml(warning)}</li>`).join('');
  warnings.hidden = result.warnings.length === 0;
  if (result.mode === 'subscription') {
    resultNode.innerHTML = `
      <div class="calculator-total">
        <span>Цена одного визита</span>
        <strong>${moneyFormat(result.managerFinalPrice)}</strong>
        <small>Полная предоплата ${moneyFormat(result.prepaymentTotal)} за ${result.totalVisits} визитов</small>
      </div>
      <dl class="calculator-metrics">
        <div><dt>Тарифная цена</dt><dd>${moneyFormat(result.tariffPrice)}</dd></div>
        <div><dt>Экономический пол</dt><dd>${moneyFormat(result.economicFloor)}</dd></div>
        <div><dt>Нормо-часы</dt><dd>${result.normHours.toFixed(1)}</dd></div>
        <div><dt>Оплата сотрудника</dt><dd>${moneyFormat(result.employeePay)}</dd></div>
        <div><dt>Резерв</dt><dd>${moneyFormat(result.reserve)}</dd></div>
        <div><dt>Прибыль с визита</dt><dd>${moneyFormat(result.expectedNetProfit)}</dd></div>
      </dl>
    `;
    resultNode.setAttribute('aria-label', `Цена визита ${moneyFormat(result.managerFinalPrice)}`);
    return;
  }
  resultNode.innerHTML = `
    <div class="calculator-total">
      <span>Итог для клиента</span>
      <strong>${moneyFormat(result.managerFinalPrice)}</strong>
      <small>Расчётная ${moneyFormat(result.calculatedClientPrice)} · рекомендуемая ${moneyFormat(result.recommendedClientPrice)}</small>
    </div>
    ${result.minimumApplied ? `<p class="calculator-notice">${escapeHtml(result.estimatePayload.minimumMessage)}</p>` : ''}
    <div class="calculator-lines">
      ${result.estimatePayload.lineItems.map((item) => `
        <div><span>${escapeHtml(item.label)}</span><strong>${moneyFormat(item.amount)}</strong></div>
      `).join('')}
    </div>
    <dl class="calculator-metrics">
      <div><dt>Нормо-часы</dt><dd>${result.normHours.toFixed(1)}</dd></div>
      <div><dt>Бригада</dt><dd>${result.crewPlan.crew || 0} чел. × ${result.crewPlan.days || 1} дн.</dd></div>
      <div><dt>Плановый ФОТ</dt><dd>${moneyFormat(result.laborPlan.total)}</dd></div>
      <div><dt>Налог</dt><dd>${moneyFormat(result.tax)}</dd></div>
      <div><dt>Себестоимость</dt><dd>${moneyFormat(result.internalCosts.costBeforeTax)}</dd></div>
      <div><dt>Ожидаемая прибыль</dt><dd>${moneyFormat(result.expectedNetProfit)}</dd></div>
    </dl>
  `;
  resultNode.setAttribute('aria-label', `Итоговая стоимость ${moneyFormat(result.managerFinalPrice)}`);
}

export function mount(container, context) {
  const store = createCalculatorStore(context.shared.storageService);
  let settings = store.getSettings();
  const draft = store.getDraft() || createDraft();
  const servicesByCategory = Map.groupBy
    ? Map.groupBy(settings.additionalServices.filter((item) => item.active), (item) => item.category)
    : settings.additionalServices.filter((item) => item.active).reduce((map, item) => map.set(item.category, [...(map.get(item.category) || []), item]), new Map());

  container.innerHTML = `
    <section class="calculator-page">
      <header class="module-heading">
        <div><h1>Калькулятор заказа</h1><p>Предварительная цена, план бригады и внутренняя экономика в одном расчёте.</p></div>
        <button class="secondary-button" type="button" data-reset>Сбросить</button>
      </header>
      <form class="calculator-layout" data-calculator-form>
        <div class="calculator-form-stack">
          <section class="calculator-section">
            <div class="section-heading"><h2>Параметры услуги</h2><span>Клиентская часть</span></div>
            <div class="form-grid">
              <label><span>Формат</span><select name="mode"><option value="one_time">Разовый заказ</option><option value="subscription">Абонемент</option></select></label>
              <label><span>Вид уборки</span><select name="cleaningType">${optionList(settings.cleaningTypes, draft.cleaningType)}</select></label>
              <label><span>Площадь, м²</span><input name="area" type="number" min="0" step="1" inputmode="decimal"></label>
              <label><span>Визитов в месяц</span><select name="visitsPerMonth"><option value="2">2 визита</option><option value="4">4 визита</option><option value="8">8 визитов</option></select></label>
              <label><span>Срок абонемента</span><select name="subscriptionMonths"><option value="3">3 месяца</option><option value="6">6 месяцев</option><option value="12">12 месяцев</option></select></label>
              <label><span>Заставленность</span><select name="clutter"></select></label>
              <label><span>Загрязнённость</span><select name="dirtiness"></select></label>
              <label class="check-field"><input name="outsideKad" type="checkbox"><span>Выезд за КАД +${context.shared.formatters.money(settings.outsideKadPrice)}</span></label>
              <label class="check-field"><input name="complexDirt" type="checkbox"><span>Есть сложные строительные загрязнения</span></label>
              <label class="check-field"><input name="confirmDirtiness" type="checkbox"><span>Подтверждаю повышенную сложность</span></label>
              <label class="check-field"><input name="confirmIndividual" type="checkbox"><span>Индивидуальная оценка подтверждена</span></label>
            </div>
          </section>

          <section class="calculator-section">
            <div class="section-heading"><h2>Дополнительные услуги</h2><span>Количество можно оставить нулевым</span></div>
            <div class="extras-groups">
              ${[...servicesByCategory.entries()].map(([category, services]) => `
                <details ${category === 'Окна' || category === 'Кухня' ? 'open' : ''}>
                  <summary>${escapeHtml(category)} <span>${services.length}</span></summary>
                  <div class="extras-list">
                    ${services.map((service) => `
                      <div class="extra-row">
                        <label><span>${escapeHtml(service.name)} <small>${context.shared.formatters.money(service.price)} / ${escapeHtml(service.unit)}</small></span><input name="extra:${escapeHtml(service.id)}" type="number" min="0" step="1" value="0" aria-label="Количество: ${escapeHtml(service.name)}"></label>
                        ${service.subtypes ? `<select name="subtype:${escapeHtml(service.id)}" aria-label="Подтип: ${escapeHtml(service.name)}"><option value="">Стандартная створка</option>${service.subtypes.map((item) => `<option value="${escapeHtml(item.id)}">${escapeHtml(item.label)}</option>`).join('')}</select>` : ''}
                      </div>
                    `).join('')}
                  </div>
                </details>
              `).join('')}
            </div>
          </section>

          <section class="calculator-section">
            <div class="section-heading"><h2>Клиент и объект</h2><span>Перейдут в заказ</span></div>
            <div class="form-grid">
              <label><span>Имя клиента</span><input name="clientName" autocomplete="name"></label>
              <label><span>Организация</span><input name="organizationName" autocomplete="organization"></label>
              <label><span>Телефон</span><input name="phone" type="tel" autocomplete="tel"></label>
              <label><span>Email</span><input name="email" type="email" autocomplete="email"></label>
              <label><span>Мессенджер</span><input name="messenger"></label>
              <label class="field-wide"><span>Адрес</span><input name="address" autocomplete="street-address"></label>
              <label><span>Район</span><input name="district"></label>
              <label><span>Дата</span><input name="plannedDate" type="date"></label>
              <label><span>Начало</span><input name="plannedStartTime" type="time"></label>
              <label class="field-wide"><span>Доступ</span><textarea name="accessNotes" rows="2"></textarea></label>
              <label class="field-wide"><span>Парковка</span><textarea name="parkingNotes" rows="2"></textarea></label>
            </div>
          </section>

          <section class="calculator-section calculator-internal">
            <div class="section-heading"><h2>План и цена менеджера</h2><span>Внутренние данные</span></div>
            <div class="form-grid">
              <label><span>Сотрудников</span><input name="crewCount" type="number" min="0" max="20" placeholder="Авто"></label>
              <label><span>Дней</span><input name="days" type="number" min="1" max="30"></label>
              <label><span>Причина деления</span><select name="splitReason"><option value="volume">Объём работ</option><option value="client_restriction">Ограничение клиента</option></select></label>
              <label><span>Роль владельца</span><select name="ownerRole"><option value="none">Не участвует</option><option value="manager">Менеджер</option><option value="cleaner_manager">Менеджер-клинер</option></select></label>
              <label><span>Роль пользователя</span><select name="actorRole"><option value="manager">Менеджер</option><option value="extended_manager">Расширенный менеджер</option><option value="admin">Администратор</option><option value="owner">Владелец</option></select></label>
              <label class="check-field"><input name="elevatedComplexity" type="checkbox"><span>Повышенная сложность смены</span></label>
              <label class="check-field"><input name="roundingEnabled" type="checkbox"><span>Округлять вверх до 100 ₽</span></label>
              <label><span>Скидка</span><span class="compound-control"><select name="discountType"><option value="percent">%</option><option value="amount">₽</option></select><input name="discountValue" type="number" min="0"></span></label>
              <label><span>Наценка</span><span class="compound-control"><select name="markupType"><option value="amount">₽</option><option value="percent">%</option></select><input name="markupValue" type="number" min="0"></span></label>
              <label class="check-field"><input name="forceDiscount" type="checkbox"><span>Принудительно ниже ограничений</span></label>
              <label><span>Причина скидки</span><input name="discountReason"></label>
              <label><span>Парковка, ₽</span><input name="parking" type="number" min="0"></label>
              <label><span>Оборудование, ₽</span><input name="equipment" type="number" min="0"></label>
              <label><span>Подрядчики, ₽</span><input name="contractors" type="number" min="0"></label>
              <label><span>Окончательная цена, ₽</span><input name="managerFinalPrice" type="number" min="0" placeholder="По рекомендации"></label>
              <label class="field-wide"><span>Комментарий менеджера</span><textarea name="managerNotes" rows="3"></textarea></label>
            </div>
          </section>

          <details class="calculator-settings">
            <summary>Настройки калькулятора</summary>
            <div class="settings-grid">
              ${Object.entries(settings.cleaningTypes).map(([id, type]) => `
                <fieldset><legend>${escapeHtml(type.label)}</legend>
                  <label><span>₽/м²</span><input data-setting="rate" data-type="${escapeHtml(id)}" type="number" min="0" value="${type.rate}"></label>
                  <label><span>Минимум</span><input data-setting="minimum" data-type="${escapeHtml(id)}" type="number" min="0" value="${type.minimum}"></label>
                  <label><span>м²/час</span><input data-setting="speed" data-type="${escapeHtml(id)}" type="number" min="0.1" step="0.1" value="${type.speed}"></label>
                </fieldset>
              `).join('')}
            </div>
            <label><span>Целевая прибыль, ₽</span><input data-target-profit type="number" min="0" value="${settings.targetProfit ?? ''}" placeholder="Не настроена"></label>
            <div class="settings-add-grid">
              <fieldset data-new-type><legend>Добавить вид уборки</legend>
                <label><span>ID</span><input name="typeId" placeholder="commercial"></label>
                <label><span>Название</span><input name="typeLabel" placeholder="Коммерческая"></label>
                <label><span>₽/м²</span><input name="typeRate" type="number" min="0"></label>
                <label><span>Минимум</span><input name="typeMinimum" type="number" min="0"></label>
                <label><span>м²/час</span><input name="typeSpeed" type="number" min="0.1" step="0.1"></label>
                <button class="secondary-button" type="button" data-add-type>Добавить вид</button>
              </fieldset>
              <fieldset data-new-service><legend>Добавить допуслугу</legend>
                <label><span>Название</span><input name="serviceName"></label>
                <label><span>Категория</span><input name="serviceCategory" value="Другое"></label>
                <label><span>Единица</span><input name="serviceUnit" value="шт"></label>
                <label><span>Цена, ₽</span><input name="servicePrice" type="number" min="0"></label>
                <label><span>Нормо-часы</span><input name="serviceHours" type="number" min="0" step="0.1"></label>
                <button class="secondary-button" type="button" data-add-service>Добавить услугу</button>
              </fieldset>
            </div>
            <button class="secondary-button" type="button" data-save-settings>Сохранить настройки</button>
          </details>
        </div>

        <aside class="calculator-summary">
          <ul class="calculator-warnings" data-calculation-warnings hidden></ul>
          <div data-calculation-result role="status" aria-live="polite"></div>
          <div class="calculator-actions">
            <button class="primary-button" type="button" data-create-order>Создать заказ в Hub</button>
            <button class="secondary-button" type="button" data-save-estimate>Сохранить смету</button>
            <div class="calculator-action-status" data-action-status aria-live="polite"></div>
          </div>
        </aside>
      </form>
    </section>
  `;

  const form = container.querySelector('[data-calculator-form]');
  hydrateForm(form, draft, settings);
  let currentResult = null;
  let calculationId = draft.calculationId;

  function recalculate() {
    const input = readForm(form, settings, calculationId);
    currentResult = calculate(input, settings);
    calculationId = currentResult.calculationId;
    input.calculationId = calculationId;
    store.saveDraft(input);
    renderResult(container, currentResult, context.shared.formatters.money.bind(context.shared.formatters));
  }

  const onInput = (event) => {
    if (event.target.name === 'cleaningType') syncCoefficientOptions(form, settings);
    recalculate();
  };
  form.addEventListener('input', onInput);
  form.addEventListener('change', onInput);

  container.querySelector('[data-reset]').addEventListener('click', () => {
    store.clearDraft();
    mount(container, context);
  });

  container.querySelector('[data-save-settings]').addEventListener('click', () => {
    container.querySelectorAll('[data-setting]').forEach((input) => {
      settings.cleaningTypes[input.dataset.type][input.dataset.setting] = Number(input.value) || 0;
    });
    const targetProfit = container.querySelector('[data-target-profit]').value;
    settings.targetProfit = targetProfit === '' ? null : Number(targetProfit);
    settings = store.saveSettings(settings);
    context.eventBus.emit('calculator:settings-updated', { configRevision: settings.configRevision });
    recalculate();
  });

  container.querySelector('[data-add-type]').addEventListener('click', () => {
    const fieldset = container.querySelector('[data-new-type]');
    const id = inputValue(fieldset, 'typeId').trim();
    const label = inputValue(fieldset, 'typeLabel').trim();
    if (!id || !label || settings.cleaningTypes[id]) return;
    settings.cleaningTypes[id] = {
      label,
      rate: Number(inputValue(fieldset, 'typeRate')) || 0,
      minimum: Number(inputValue(fieldset, 'typeMinimum')) || 0,
      speed: Number(inputValue(fieldset, 'typeSpeed')) || 1,
      clutter: { normal: { label: 'Обычная', priceMultiplier: 1, timeMultiplier: 1 } },
      dirtiness: { normal: { label: 'Обычная', priceMultiplier: 1, timeMultiplier: 1 } }
    };
    store.saveSettings(settings);
    unmount();
    mount(container, context);
  });

  container.querySelector('[data-add-service]').addEventListener('click', () => {
    const fieldset = container.querySelector('[data-new-service]');
    const name = inputValue(fieldset, 'serviceName').trim();
    if (!name) return;
    const id = `${name.toLocaleLowerCase('ru-RU').replace(/[^a-zа-я0-9]+/gi, '-').replace(/(^-|-$)/g, '') || 'service'}-${Date.now()}`;
    settings.additionalServices.push({
      id,
      name,
      category: inputValue(fieldset, 'serviceCategory').trim() || 'Другое',
      unit: inputValue(fieldset, 'serviceUnit').trim() || 'шт',
      price: Number(inputValue(fieldset, 'servicePrice')) || 0,
      normHours: Number(inputValue(fieldset, 'serviceHours')) || 0,
      participatesInMainMinimum: false,
      participatesInDiscount: false,
      standaloneAllowed: true,
      standaloneMinimum: settings.standaloneMinimum,
      employeeBonus: null,
      active: true,
      order: settings.additionalServices.length
    });
    store.saveSettings(settings);
    unmount();
    mount(container, context);
  });

  container.querySelector('[data-save-estimate]').addEventListener('click', () => {
    const status = container.querySelector('[data-action-status]');
    store.saveCalculation(currentResult);
    context.eventBus.emit('calculator:estimate-created', currentResult.estimatePayload);
    status.textContent = 'Смета сохранена в расчёте.';
  });

  container.querySelector('[data-create-order]').addEventListener('click', () => {
    const status = container.querySelector('[data-action-status]');
    if (!currentResult?.canFinalize) {
      status.textContent = 'Устраните предупреждения перед созданием заказа.';
      return;
    }
    store.saveCalculation(currentResult);
    context.eventBus.emit('calculator:calculation-saved', { calculationId: currentResult.calculationId });
    const responses = context.eventBus.emit('calculator:order-create-requested', currentResult.orderPayload);
    const response = responses.find(Boolean);
    if (!response?.order) {
      status.textContent = 'Модуль заказов не готов принять расчёт.';
      return;
    }
    store.linkOrder(currentResult.calculationId, response.order.id);
    context.eventBus.emit('calculator:order-created', { calculationId: currentResult.calculationId, orderId: response.order.id });
    status.innerHTML = `${response.duplicate ? 'Заказ уже существует:' : 'Создан заказ'} <button type="button" data-open-order>${escapeHtml(response.order.displayNumber)}</button>`;
    status.querySelector('[data-open-order]').addEventListener('click', () => context.navigate('/orders'));
  });

  recalculate();
  cleanup = () => form.removeEventListener('input', onInput);
}

export function unmount() {
  cleanup?.();
  cleanup = null;
}
