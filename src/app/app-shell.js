const THEME_STORAGE_KEY = 'prochistka-hub-theme';

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
            <label class="hub-search">
              <span aria-hidden="true">⌕</span>
              <input type="search" placeholder="Поиск по заказам, клиентам, документам" />
            </label>

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
  const themeButton = root.querySelector('.theme-toggle');
  const themeLabel = root.querySelector('.theme-toggle__label');

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

  themeButton.addEventListener('click', () => {
    const nextTheme = getActiveTheme() === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    themeButton.setAttribute('aria-pressed', String(nextTheme === 'light'));
    themeLabel.textContent = nextTheme === 'light' ? 'Светлая' : 'Тёмная';
  });

  window.addEventListener('hub:route-change', (event) => {
    syncNavigation(event.detail.route, event.detail.module);
  });
}
