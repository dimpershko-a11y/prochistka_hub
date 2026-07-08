const THEME_STORAGE_KEY = 'prochistka-hub-theme';

const searchKeywords = {
  home: 'главная хаб центр операции фокус',
  calculator: 'калькулятор расчет расчёт смета кп площадь коэффициент',
  dashboard: 'дашборд показатели аналитика день метрики',
  checklists: 'чек-листы чеклисты объект проверка контроль',
  timesheet: 'табель смены часы сотрудники линия',
  damages: 'повреждения акты фото разбор претензии',
  documents: 'документы pdf коммерческое предложение подпись',
  crm: 'crm клиенты касания коммуникации контакты',
  orders: 'заказы заказ новый работа сегодня',
  expenses: 'расходы затраты деньги выбросы проверка',
  employees: 'сотрудники команда профили бригада',
  partners: 'партнеры партнёры подрядчики активные',
  settings: 'настройки интеграции hub конфигурация'
};

function normalizeSearch(value) {
  return value.toLocaleLowerCase('ru-RU').replaceAll('ё', 'е').trim();
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function getActiveTheme() {
  return document.documentElement.dataset.theme === 'light' ? 'light' : 'dark';
}

function setTheme(theme) {
  document.documentElement.dataset.themeSwitching = 'true';
  document.documentElement.dataset.theme = theme;
  localStorage.setItem(THEME_STORAGE_KEY, theme);
  window.setTimeout(() => {
    delete document.documentElement.dataset.themeSwitching;
  }, 160);
}

export function createAppShell({ root, modules, homeModule, router, config }) {
  if (!root) {
    throw new Error('Root element #app was not found');
  }

  const currentTheme = getActiveTheme();
  const navItems = [homeModule, ...modules];
  const searchItems = navItems.map((module) => {
    const { id, title, description, route } = module.moduleManifest;
    const keywords = searchKeywords[id] || '';

    return {
      id,
      title,
      description: description || 'Открыть раздел Hub',
      route,
      haystack: normalizeSearch(`${title} ${description || ''} ${keywords}`)
    };
  });

  root.innerHTML = `
    <div class="hub-shell">
      <aside class="hub-sidebar">
        <div class="hub-brand">
          <a class="hub-brand__mark" href="#/" aria-label="${config.brand.name} Hub">
            <span>PC</span>
          </a>
          <div>
            <div class="hub-brand__name">${config.brand.name}</div>
            <div class="hub-brand__subtitle">Единый рабочий хаб</div>
          </div>
        </div>

        <div class="hub-nav-wrap">
          <nav class="hub-nav" aria-label="Разделы Hub">
            ${navItems
              .map((module) => {
                const { id, route, title } = module.moduleManifest;

                return `
                  <a class="hub-nav__link" data-route="${route}" href="#${route}">
                    <span class="hub-nav__dot" data-module="${id}" aria-hidden="true"></span>
                    <span>${title}</span>
                  </a>
                `;
              })
              .join('')}
          </nav>
          <span class="hub-nav-more" aria-hidden="true">Ещё →</span>
        </div>

        <div class="hub-sidebar__footer">
          <span>${config.defaultCity}</span>
          <strong>${config.workingHours.days} · ${config.workingHours.from}–${config.workingHours.to}</strong>
        </div>
      </aside>

      <main class="hub-main">
        <div class="hub-main__topbar">
          <div class="hub-topbar__title">
            <strong data-current-title>Главная</strong>
            <span> / Hub</span>
          </div>

          <div class="hub-topbar__tools">
            <div class="hub-search-wrap" data-search>
              <label class="hub-search">
                <span aria-hidden="true">⌕</span>
                <input
                  type="search"
                  role="combobox"
                  aria-label="Поиск по разделам Hub"
                  aria-controls="hub-search-results"
                  aria-expanded="false"
                  autocomplete="off"
                  placeholder="Найти раздел: заказ, PDF, CRM"
                />
              </label>
              <div class="hub-search-results" id="hub-search-results" data-search-results role="listbox" hidden></div>
              <div class="sr-only" data-search-status aria-live="polite"></div>
            </div>

            <button class="theme-toggle" type="button" aria-label="Переключить светлую и тёмную тему" aria-pressed="${currentTheme === 'light'}">
              <span class="theme-toggle__track" aria-hidden="true">
                <span class="theme-toggle__thumb"></span>
              </span>
              <span class="theme-toggle__label">${currentTheme === 'light' ? 'Светлая' : 'Тёмная'}</span>
            </button>
          </div>
        </div>

        <section class="hub-outlet" data-router-outlet></section>
      </main>
    </div>
  `;

  router.attach(root.querySelector('[data-router-outlet]'));

  const titleNode = root.querySelector('[data-current-title]');
  const navLinks = [...root.querySelectorAll('.hub-nav__link')];
  const searchRoot = root.querySelector('[data-search]');
  const searchInput = searchRoot?.querySelector('input');
  const searchResults = root.querySelector('[data-search-results]');
  const searchStatus = root.querySelector('[data-search-status]');
  const themeButton = root.querySelector('.theme-toggle');
  const themeLabel = root.querySelector('.theme-toggle__label');
  let activeSearchMatches = [];

  function syncNavigation(route, moduleManifest) {
    navLinks.forEach((link) => {
      const isActive = link.dataset.route === route;
      link.classList.toggle('is-active', isActive);
      if (isActive) {
        link.setAttribute('aria-current', 'page');
      } else {
        link.removeAttribute('aria-current');
      }
    });

    if (titleNode && moduleManifest?.title) {
      titleNode.textContent = moduleManifest.title;
    }
  }

  function closeSearch({ clear = false } = {}) {
    if (!searchInput || !searchResults) return;

    if (clear) {
      searchInput.value = '';
    }

    activeSearchMatches = [];
    searchResults.hidden = true;
    searchResults.innerHTML = '';
    searchInput.setAttribute('aria-expanded', 'false');
  }

  function renderSearchResults() {
    if (!searchInput || !searchResults) return;

    const query = normalizeSearch(searchInput.value);

    if (!query) {
      closeSearch();
      return;
    }

    activeSearchMatches = searchItems.filter((item) => item.haystack.includes(query)).slice(0, 5);
    searchResults.hidden = false;
    searchInput.setAttribute('aria-expanded', 'true');

    if (searchStatus) {
      searchStatus.textContent = activeSearchMatches.length
        ? `Найдено разделов: ${activeSearchMatches.length}`
        : 'Разделы не найдены';
    }

    if (!activeSearchMatches.length) {
      searchResults.innerHTML = `
        <div class="hub-search-empty" role="status">
          <strong>Раздел не найден</strong>
          <span>Попробуйте: заказ, PDF, CRM, табель</span>
        </div>
      `;
      return;
    }

    searchResults.innerHTML = activeSearchMatches
      .map(
        (item) => `
          <a class="hub-search-result" role="option" href="#${item.route}" data-route="${item.route}">
            <span class="hub-search-result__mark" data-module="${item.id}" aria-hidden="true"></span>
            <span>
              <strong>${escapeHtml(item.title)}</strong>
              <small>${escapeHtml(item.description)}</small>
            </span>
          </a>
        `
      )
      .join('');
  }

  searchInput?.addEventListener('input', renderSearchResults);

  searchInput?.addEventListener('focus', () => {
    if (searchInput.value.trim()) {
      renderSearchResults();
    }
  });

  searchInput?.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      closeSearch();
      searchInput.blur();
      return;
    }

    if (event.key === 'Enter' && activeSearchMatches.length) {
      event.preventDefault();
      window.location.hash = `#${activeSearchMatches[0].route}`;
      closeSearch({ clear: true });
    }
  });

  searchResults?.addEventListener('click', (event) => {
    const result = event.target.closest('.hub-search-result');
    if (!result) return;
    closeSearch({ clear: true });
  });

  document.addEventListener('pointerdown', (event) => {
    if (!searchRoot || searchRoot.contains(event.target)) return;
    closeSearch();
  });

  themeButton.addEventListener('click', () => {
    const nextTheme = getActiveTheme() === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    themeButton.setAttribute('aria-pressed', String(nextTheme === 'light'));
    themeLabel.textContent = nextTheme === 'light' ? 'Светлая' : 'Тёмная';
  });

  window.addEventListener('hub:route-change', (event) => {
    syncNavigation(event.detail.route, event.detail.module);
    closeSearch();
  });
}
