import './styles.css';
import { moduleManifest } from './manifest.js';
import { defaultOrderStatuses } from './models/default-statuses.js';
import { createOrderService } from './services/order-service.js';

export { moduleManifest };

let service = null;
let unsubscribe = null;
let activeRefresh = null;

const escapeHtml = (value) => String(value ?? '')
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&#039;');

export function initialize({ shared }) {
  unsubscribe?.();
  service = createOrderService({ storage: shared.storageService, eventBus: shared.eventBus });
  unsubscribe = shared.eventBus.on('calculator:order-create-requested', (payload) => {
    const result = service.createFromCalculation(payload);
    activeRefresh?.();
    return result;
  });
}

function getService() {
  if (!service) throw new Error('Модуль заказов не инициализирован.');
  return service;
}

export const createFromCalculation = (...args) => getService().createFromCalculation(...args);
export const createManual = (...args) => getService().createManual(...args);
export const getById = (...args) => getService().getById(...args);
export const getByCalculationId = (...args) => getService().getByCalculationId(...args);
export const list = (...args) => getService().list(...args);
export const update = (...args) => getService().update(...args);
export const changeStatus = (...args) => getService().changeStatus(...args);
export const archive = (...args) => getService().archive(...args);

function value(form, name) {
  return form.elements.namedItem(name)?.value ?? '';
}

function orderFromForm(form) {
  return {
    status: value(form, 'status'),
    client: {
      name: value(form, 'clientName'),
      organizationName: value(form, 'organizationName'),
      phone: value(form, 'phone'),
      secondaryPhone: value(form, 'secondaryPhone'),
      email: value(form, 'email'),
      messenger: value(form, 'messenger')
    },
    object: {
      address: value(form, 'address'),
      district: value(form, 'district'),
      area: Number(value(form, 'area')) || 0,
      accessNotes: value(form, 'accessNotes'),
      parkingNotes: value(form, 'parkingNotes'),
      outsideKad: form.elements.namedItem('outsideKad')?.checked || false
    },
    schedule: {
      plannedDate: value(form, 'plannedDate'),
      plannedStartTime: value(form, 'plannedStartTime'),
      plannedEndTime: value(form, 'plannedEndTime'),
      plannedDays: Number(value(form, 'plannedDays')) || 1
    },
    service: {
      cleaningType: value(form, 'cleaningType'),
      cleaningVariant: value(form, 'cleaningVariant'),
      title: value(form, 'serviceTitle')
    },
    pricing: {
      calculatedPrice: Number(value(form, 'calculatedPrice')) || 0,
      recommendedPrice: Number(value(form, 'recommendedPrice')) || 0,
      finalPrice: Number(value(form, 'finalPrice')) || 0,
      currency: 'RUB'
    },
    planning: {
      crewPlan: { crew: Number(value(form, 'crew')) || 0, days: Number(value(form, 'plannedDays')) || 1 }
    },
    managerNotes: value(form, 'managerNotes')
  };
}

function fillEditor(form, order) {
  const fields = {
    status: order.status,
    clientName: order.client?.name,
    organizationName: order.client?.organizationName,
    phone: order.client?.phone,
    secondaryPhone: order.client?.secondaryPhone,
    email: order.client?.email,
    messenger: order.client?.messenger,
    address: order.object?.address,
    district: order.object?.district,
    area: order.object?.area,
    accessNotes: order.object?.accessNotes,
    parkingNotes: order.object?.parkingNotes,
    plannedDate: order.schedule?.plannedDate,
    plannedStartTime: order.schedule?.plannedStartTime,
    plannedEndTime: order.schedule?.plannedEndTime,
    plannedDays: order.schedule?.plannedDays,
    cleaningType: order.service?.cleaningType,
    cleaningVariant: order.service?.cleaningVariant,
    serviceTitle: order.service?.title,
    calculatedPrice: order.pricing?.calculatedPrice,
    recommendedPrice: order.pricing?.recommendedPrice,
    finalPrice: order.pricing?.finalPrice,
    crew: order.planning?.crewPlan?.crew,
    managerNotes: order.managerNotes
  };
  Object.entries(fields).forEach(([name, fieldValue]) => {
    const element = form.elements.namedItem(name);
    if (element) element.value = fieldValue ?? '';
  });
  form.elements.namedItem('outsideKad').checked = Boolean(order.object?.outsideKad);
}

export function mount(container, context) {
  const orders = getService();
  let selectedId = null;
  let creating = false;

  container.innerHTML = `
    <section class="orders-page">
      <header class="module-heading">
        <div><h1>Заказы</h1><p>Рабочий список заказов из калькулятора и ручных заявок.</p></div>
        <button class="primary-button" type="button" data-new-order>Новый заказ</button>
      </header>
      <div class="orders-toolbar" aria-label="Фильтры заказов">
        <label><span class="sr-only">Поиск</span><input type="search" data-order-search placeholder="Номер, клиент, телефон или адрес"></label>
        <label><span class="sr-only">Статус</span><select data-order-status><option value="">Все статусы</option>${defaultOrderStatuses.map((status) => `<option value="${status.id}">${status.label}</option>`).join('')}</select></label>
        <label><span class="sr-only">Источник</span><select data-order-source><option value="">Все источники</option><option value="calculator">Из калькулятора</option><option value="manual">Вручную</option></select></label>
        <label><span class="sr-only">Дата работ</span><input type="date" data-order-date></label>
      </div>
      <div class="orders-workspace">
        <div class="orders-list" data-orders-list aria-live="polite"></div>
        <aside class="order-editor" data-order-editor hidden>
          <div class="order-editor__heading"><div><span data-editor-source></span><h2 data-editor-title>Новый заказ</h2></div><button type="button" class="secondary-button" data-close-editor>Закрыть</button></div>
          <form data-order-form>
            <div class="form-grid">
              <label><span>Статус</span><select name="status">${defaultOrderStatuses.filter((item) => item.id !== 'archived').map((status) => `<option value="${status.id}">${status.label}</option>`).join('')}</select></label>
              <label><span>Имя клиента</span><input name="clientName" autocomplete="name"></label>
              <label><span>Организация</span><input name="organizationName" autocomplete="organization"></label>
              <label><span>Телефон</span><input name="phone" type="tel" autocomplete="tel"></label>
              <label><span>Доп. телефон</span><input name="secondaryPhone" type="tel"></label>
              <label><span>Email</span><input name="email" type="email" autocomplete="email"></label>
              <label><span>Мессенджер</span><input name="messenger"></label>
              <label class="field-wide"><span>Адрес</span><input name="address" autocomplete="street-address"></label>
              <label><span>Район</span><input name="district"></label>
              <label><span>Площадь, м²</span><input name="area" type="number" min="0"></label>
              <label class="check-field"><input name="outsideKad" type="checkbox"><span>За КАД</span></label>
              <label><span>Дата работ</span><input name="plannedDate" type="date"></label>
              <label><span>Начало</span><input name="plannedStartTime" type="time"></label>
              <label><span>Окончание</span><input name="plannedEndTime" type="time"></label>
              <label><span>Дней</span><input name="plannedDays" type="number" min="1" value="1"></label>
              <label><span>Сотрудников</span><input name="crew" type="number" min="0"></label>
              <label><span>Вид уборки</span><input name="cleaningType"></label>
              <label><span>Вариант</span><input name="cleaningVariant"></label>
              <label class="field-wide"><span>Название услуги</span><input name="serviceTitle"></label>
              <label><span>Расчётная цена, ₽</span><input name="calculatedPrice" type="number" min="0"></label>
              <label><span>Рекомендуемая цена, ₽</span><input name="recommendedPrice" type="number" min="0"></label>
              <label><span>Окончательная цена, ₽</span><input name="finalPrice" type="number" min="0"></label>
              <label class="field-wide"><span>Доступ</span><textarea name="accessNotes" rows="2"></textarea></label>
              <label class="field-wide"><span>Парковка</span><textarea name="parkingNotes" rows="2"></textarea></label>
              <label class="field-wide"><span>Комментарий менеджера</span><textarea name="managerNotes" rows="3"></textarea></label>
            </div>
            <div class="order-editor__actions">
              <button class="primary-button" type="submit">Сохранить</button>
              <button class="secondary-button" type="button" data-open-calculation hidden>Открыть расчёт</button>
              <button class="secondary-button" type="button" data-copy-order hidden>Создать копию</button>
              <button class="secondary-button" type="button" data-archive-order hidden>Архивировать</button>
              <span data-order-form-status role="status"></span>
            </div>
          </form>
        </aside>
      </div>
    </section>
  `;

  const listNode = container.querySelector('[data-orders-list]');
  const editor = container.querySelector('[data-order-editor]');
  const form = container.querySelector('[data-order-form]');
  const statusNode = container.querySelector('[data-order-form-status]');
  const archiveButton = container.querySelector('[data-archive-order]');
  const copyButton = container.querySelector('[data-copy-order]');
  const openCalculationButton = container.querySelector('[data-open-calculation]');
  const statusLabel = Object.fromEntries(defaultOrderStatuses.map((item) => [item.id, item.label]));

  function filters() {
    return {
      query: container.querySelector('[data-order-search]').value,
      status: container.querySelector('[data-order-status]').value,
      source: container.querySelector('[data-order-source]').value,
      date: container.querySelector('[data-order-date]').value
    };
  }

  function renderList() {
    const records = orders.list(filters());
    if (!records.length) {
      listNode.innerHTML = `<div class="orders-empty"><strong>Заказов пока нет</strong><span>Создайте заказ вручную или подтвердите расчёт в калькуляторе.</span></div>`;
      return;
    }
    listNode.innerHTML = `
      <div class="orders-table" role="table">
        <div class="orders-table__head" role="row"><span>Заказ</span><span>Клиент и объект</span><span>Работы</span><span>Цена</span><span>Статус</span></div>
        ${records.map((order) => `
          <button class="order-row" type="button" data-order-id="${escapeHtml(order.id)}" role="row">
            <span><strong>${escapeHtml(order.displayNumber)}</strong><small>${order.source === 'calculator' ? 'Из калькулятора' : 'Вручную'}</small></span>
            <span><strong>${escapeHtml(order.client?.name || order.client?.organizationName || 'Клиент не указан')}</strong><small>${escapeHtml(order.object?.address || order.client?.phone || 'Адрес не указан')}</small></span>
            <span><strong>${escapeHtml(order.schedule?.plannedDate || 'Дата не назначена')}</strong><small>${escapeHtml(order.service?.title || 'Услуга не указана')}</small></span>
            <span><strong>${context.shared.formatters.money(order.pricing?.finalPrice)}</strong><small>${order.object?.area ? `${order.object.area} м²` : 'Площадь не указана'}</small></span>
            <span><span class="order-status" data-status="${escapeHtml(order.status)}">${escapeHtml(statusLabel[order.status] || order.status)}</span></span>
          </button>
        `).join('')}
      </div>
    `;
  }

  function openEditor(order = null) {
    creating = !order;
    selectedId = order?.id || null;
    form.reset();
    if (order) fillEditor(form, order);
    else form.elements.namedItem('plannedDays').value = 1;
    editor.hidden = false;
    archiveButton.hidden = !order;
    copyButton.hidden = !order?.calculationSnapshot;
    openCalculationButton.hidden = !order?.calculationSnapshot;
    container.querySelector('[data-editor-title]').textContent = order ? order.displayNumber : 'Новый заказ';
    container.querySelector('[data-editor-source]').textContent = order
      ? (order.source === 'calculator' ? 'Из калькулятора' : 'Вручную')
      : 'Ручное создание';
    statusNode.textContent = '';
    if (order) context.eventBus.emit('orders:opened', { orderId: order.id });
    editor.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });
  }

  listNode.addEventListener('click', (event) => {
    const row = event.target.closest('[data-order-id]');
    if (row) openEditor(orders.getById(row.dataset.orderId));
  });
  container.querySelector('[data-new-order]').addEventListener('click', () => openEditor());
  container.querySelector('[data-close-editor]').addEventListener('click', () => { editor.hidden = true; });
  container.querySelectorAll('.orders-toolbar input, .orders-toolbar select').forEach((input) => input.addEventListener('input', renderList));

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    try {
      const payload = orderFromForm(form);
      const previous = creating ? null : orders.getById(selectedId);
      const requestedStatus = payload.status;
      if (!creating) delete payload.status;
      let order = creating ? orders.createManual(payload) : orders.update(selectedId, payload);
      if (!creating && previous.status !== requestedStatus) order = orders.changeStatus(selectedId, requestedStatus);
      selectedId = order.id;
      creating = false;
      archiveButton.hidden = false;
      statusNode.textContent = 'Заказ сохранён.';
      renderList();
    } catch (error) {
      statusNode.textContent = error.message;
    }
  });

  archiveButton.addEventListener('click', () => {
    try {
      orders.archive(selectedId);
      editor.hidden = true;
      renderList();
    } catch (error) {
      statusNode.textContent = error.message;
    }
  });

  copyButton.addEventListener('click', () => {
    try {
      const source = orders.getById(selectedId);
      const result = orders.createFromCalculation(source.calculationSnapshot, { createCopy: true, parentOrderId: source.id });
      renderList();
      openEditor(result.order);
      statusNode.textContent = 'Копия заказа создана.';
    } catch (error) {
      statusNode.textContent = error.message;
    }
  });

  openCalculationButton.addEventListener('click', () => {
    const order = orders.getById(selectedId);
    context.eventBus.emit('calculator:open-requested', {
      calculationId: order.sourceCalculationId,
      calculationSnapshot: order.calculationSnapshot
    });
    context.navigate('/calculator');
  });

  activeRefresh = renderList;
  renderList();
}

export function unmount() {
  activeRefresh = null;
}
