export const moduleManifest = {
  id: 'orders',
  title: 'Заказы',
  route: '/orders',
  order: 80,
  enabled: true,
  description: 'Модуль заказов.'
};

export function mount(container) {
  container.innerHTML = `<article class="module-card"><h1>${moduleManifest.title}</h1><p>${moduleManifest.description}</p></article>`;
}

export function unmount() {}
