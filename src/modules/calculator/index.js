export const moduleManifest = {
  id: 'calculator',
  title: 'Калькулятор',
  route: '/calculator',
  order: 10,
  enabled: true,
  description: 'Расчёт стоимости уборки, коэффициентов, допработ и итогового PDF/КП.'
};

export function mount(container, context) {
  container.innerHTML = `
    <article class="module-card">
      <h1>${moduleManifest.title}</h1>
      <p>${moduleManifest.description}</p>
      <div class="module-meta">
        <div><strong>ID:</strong> ${moduleManifest.id}</div>
        <div><strong>Маршрут:</strong> ${moduleManifest.route}</div>
        <div><strong>Статус:</strong> модуль подключён к Hub</div>
      </div>
    </article>
  `;
}

export function unmount() {}
