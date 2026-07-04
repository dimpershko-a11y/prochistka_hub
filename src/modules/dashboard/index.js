export const moduleManifest = {
  id: 'dashboard',
  title: 'Дашборд',
  route: '/dashboard',
  order: 20,
  enabled: true,
  description: 'Бизнес-дашборд с заказами, заявками, выручкой, расходами и показателями.'
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
