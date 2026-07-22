const moduleDetails = {
  calculator: {
    marker: 'КЛ',
    action: 'Быстрый расчёт',
    signal: 'КП за 12 мин',
    tone: 'blue'
  },
  dashboard: {
    marker: 'DB',
    action: 'Открыть показатели',
    signal: 'День в фокусе',
    tone: 'mint'
  },
  checklists: {
    marker: 'ЧЛ',
    action: 'Проверить объект',
    signal: '6 активных',
    tone: 'amber'
  },
  timesheet: {
    marker: 'ТБ',
    action: 'Смены и часы',
    signal: '8 на линии',
    tone: 'violet'
  },
  damages: {
    marker: 'ПВ',
    action: 'Разбор актов',
    signal: '2 требуют фото',
    tone: 'rose'
  },
  documents: {
    marker: 'PDF',
    action: 'Сформировать',
    signal: '4 на подпись',
    tone: 'blue'
  },
  crm: {
    marker: 'CRM',
    action: 'Клиенты и касания',
    signal: '14 контактов',
    tone: 'mint'
  },
  orders: {
    marker: 'ЗК',
    action: 'Заказы сегодня',
    signal: '9 в работе',
    tone: 'amber'
  },
  expenses: {
    marker: 'РС',
    action: 'Контроль затрат',
    signal: '3 выброса',
    tone: 'rose'
  },
  employees: {
    marker: 'СТ',
    action: 'Команда',
    signal: '24 профиля',
    tone: 'violet'
  },
  partners: {
    marker: 'ПР',
    action: 'Партнёры',
    signal: '5 активных',
    tone: 'mint'
  },
  settings: {
    marker: 'НА',
    action: 'Настроить Hub',
    signal: 'Интеграции',
    tone: 'blue'
  }
};

const todayPlan = [
  ['09:30', 'Генеральная уборка', 'Петроградская, 140 м2', 'бригада 2'],
  ['13:00', 'Поддерживающая', 'Центр, офис 80 м2', 'бригада 1'],
  ['17:30', 'Приёмка объекта', 'Приморский район', 'менеджер']
];

const focusItems = [
  ['PDF', '4 документа ждут формирования'],
  ['CRM', '14 клиентов без касания 7+ дней'],
  ['Расходы', '3 позиции требуют проверки'],
  ['Чек-листы', '6 объектов в активной работе']
];

function getDetails(module) {
  return moduleDetails[module.moduleManifest.id] || {
    marker: module.moduleManifest.title.slice(0, 2).toUpperCase(),
    action: 'Открыть модуль',
    signal: 'Готов к работе',
    tone: 'blue'
  };
}

function renderModuleTile(module, index) {
  const details = getDetails(module);

  return `
    <a class="module-tile module-tile--${details.tone} reveal-item" href="#${module.moduleManifest.route}" style="--i: ${index}">
      <span class="module-tile__marker">${details.marker}</span>
      <span class="module-tile__content">
        <strong>${module.moduleManifest.title}</strong>
        <span>${details.action}</span>
      </span>
      <span class="module-tile__signal">${details.signal}</span>
    </a>
  `;
}

function setupReveal(container) {
  const items = [...container.querySelectorAll('.reveal-item')];

  if (!items.length) return;

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (prefersReducedMotion || !('IntersectionObserver' in window)) {
    items.forEach((item) => item.classList.add('is-visible'));
    return;
  }

  const page = container.querySelector('.home-page');
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;

        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      });

      if (items.every((item) => item.classList.contains('is-visible'))) {
        window.clearTimeout(revealFallback);
        observer.disconnect();
      }
    },
    {
      threshold: 0.12,
      rootMargin: '0px 0px 12% 0px'
    }
  );

  const revealFallback = window.setTimeout(() => {
    items.forEach((item) => item.classList.add('is-visible'));
    observer.disconnect();
  }, 720);

  requestAnimationFrame(() => {
    page?.classList.add('is-motion-ready');
    items.forEach((item) => observer.observe(item));
  });
}

export function createHomePage({ modules, config }) {
  return {
    moduleManifest: {
      id: 'home',
      title: 'Главная',
      route: '/',
      order: 0,
      enabled: true,
      description: 'Операционный центр PRO-CHISTKA Hub'
    },
    mount(container) {
      container.innerHTML = `
        <section class="home-page" aria-labelledby="home-title">
          <div class="home-command">
            <div class="home-command__copy">
              <p class="microcopy">Сегодня / Санкт-Петербург / 09:00–22:00</p>
              <h1 id="home-title">Единый центр управления PRO-CHISTKA</h1>
              <p>
                Быстрый расчёт, заказы, команда, документы и деньги собраны в одной рабочей поверхности.
                Видно, что требует внимания прямо сейчас.
              </p>
            </div>

            <div class="home-command__actions" aria-label="Быстрые действия">
              <a class="hub-button hub-button--primary" href="#/orders">
                <span>Новый заказ</span>
                <span class="hub-button__icon" aria-hidden="true">+</span>
              </a>
              <a class="hub-button hub-button--ghost" href="#/calculator">
                <span>Быстрый расчёт</span>
                <span class="hub-button__icon" aria-hidden="true">→</span>
              </a>
            </div>
          </div>

          <div class="hero-grid" aria-label="Операционный обзор">
            <article class="bezel hero-panel hero-panel--calculator reveal-item" style="--i: 0">
              <div class="bezel__core">
                <div class="panel-heading">
                  <span>Быстрый расчёт</span>
                  <strong>КП за 12 минут</strong>
                </div>
                <div class="quote-orbit" aria-hidden="true">
                  <span>м2</span>
                  <span>коэф.</span>
                  <span>PDF</span>
                </div>
                <p>Черновик сметы, допработы и PDF-коммерческое предложение стартуют из одного места.</p>
                <a class="panel-link" href="#/calculator">Открыть калькулятор</a>
              </div>
            </article>

            <article class="bezel hero-panel hero-panel--schedule reveal-item" style="--i: 1">
              <div class="bezel__core">
                <div class="panel-heading">
                  <span>Сегодня</span>
                  <strong>3 ключевых события</strong>
                </div>
                <div class="timeline-list">
                  ${todayPlan
                    .map(
                      ([time, title, place, team]) => `
                        <div class="timeline-row">
                          <time>${time}</time>
                          <span>
                            <strong>${title}</strong>
                            <small>${place}</small>
                          </span>
                          <em>${team}</em>
                        </div>
                      `
                    )
                    .join('')}
                </div>
              </div>
            </article>

            <aside class="status-stack reveal-item" style="--i: 2" aria-label="Фокус внимания">
              ${focusItems
                .map(
                  ([label, text]) => `
                    <a class="status-line" href="#/${label === 'PDF' ? 'documents' : label === 'Расходы' ? 'expenses' : label === 'Чек-листы' ? 'checklists' : 'crm'}">
                      <span>${label}</span>
                      <strong>${text}</strong>
                    </a>
                  `
                )
                .join('')}
            </aside>
          </div>

          <section class="module-section" aria-labelledby="modules-title">
            <div class="section-heading">
              <div>
                <p class="microcopy">Модули Hub</p>
                <h2 id="modules-title">Рабочие разделы без лишних переходов</h2>
              </div>
              <p>Каждый модуль живёт отдельно, но использует общий стиль, навигацию и будущий слой данных.</p>
            </div>

            <div class="module-grid">
              ${modules.map(renderModuleTile).join('')}
            </div>
          </section>

          <section class="action-strip bezel reveal-item" style="--i: 3" aria-label="Следующее действие">
            <div class="bezel__core action-strip__core">
              <div>
                <span>Операционный ритм</span>
                <strong>Сначала создаём заказ, затем закрываем расчёт, команду и документы.</strong>
              </div>
              <a class="hub-button hub-button--primary" href="#/orders">
                <span>Начать работу</span>
                <span class="hub-button__icon" aria-hidden="true">→</span>
              </a>
            </div>
          </section>
        </section>
      `;

      setupReveal(container);
    },
    unmount() {}
  };
}
