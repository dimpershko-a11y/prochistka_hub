const escapeHtml = (value) => String(value ?? '')
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&#039;');

const defaultActions = [
  'Зафиксировать основной сценарий работы',
  'Подключить хранилище и права доступа',
  'Добавить журнал изменений и статусы'
];

export function renderModulePlaceholder({ manifest, status = 'Проектируется', actions = defaultActions, primaryHref = '#/' }) {
  const safeActions = actions.length ? actions : defaultActions;

  return `
    <section class="module-state" aria-labelledby="${escapeHtml(manifest.id)}-title">
      <div class="module-state__hero">
        <div>
          <span class="module-state__status">${escapeHtml(status)}</span>
          <h1 id="${escapeHtml(manifest.id)}-title">${escapeHtml(manifest.title)}</h1>
          <p>${escapeHtml(manifest.description)}</p>
        </div>
        <a class="hub-button hub-button--ghost" href="${escapeHtml(primaryHref)}">
          <span>Вернуться на главную</span>
          <span class="hub-button__icon" aria-hidden="true">←</span>
        </a>
      </div>

      <div class="module-state__body">
        <section class="module-state__panel" aria-labelledby="${escapeHtml(manifest.id)}-next-title">
          <h2 id="${escapeHtml(manifest.id)}-next-title">Что нужно для запуска</h2>
          <ul>
            ${safeActions.map((action) => `<li>${escapeHtml(action)}</li>`).join('')}
          </ul>
        </section>
        <section class="module-state__panel module-state__panel--quiet" aria-labelledby="${escapeHtml(manifest.id)}-guard-title">
          <h2 id="${escapeHtml(manifest.id)}-guard-title">Архитектурное правило</h2>
          <p>Модуль остаётся изолированным: собственный экран, собственная логика и подключение к общим сервисам только через shared-слой Hub.</p>
        </section>
      </div>
    </section>
  `;
}
