export function createAppShell({ root, modules, router, config }) {
  if (!root) {
    throw new Error('Root element #app was not found');
  }

  root.innerHTML = `
    <div class="hub-shell">
      <aside class="hub-sidebar">
        <div class="hub-brand">
          <div class="hub-brand__name">${config.brand.name}</div>
          <div class="hub-brand__subtitle">Единый рабочий хаб</div>
        </div>

        <nav class="hub-nav">
          ${modules
            .map(
              (module) => `
                <a class="hub-nav__link" href="#${module.moduleManifest.route}">
                  <span>${module.moduleManifest.title}</span>
                </a>
              `
            )
            .join('')}
        </nav>
      </aside>

      <main class="hub-main">
        <div class="hub-main__topbar">
          <div>
            <strong>${config.brand.name}</strong>
            <span> / Hub</span>
          </div>
        </div>

        <section class="hub-outlet" data-router-outlet></section>
      </main>
    </div>
  `;

  router.attach(root.querySelector('[data-router-outlet]'));
}
