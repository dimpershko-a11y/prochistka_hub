export const moduleManifest = {
  id: 'settings',
  title: 'Настройки',
  route: '/settings',
  order: 120,
  enabled: true,
  description: 'Глобальные настройки Hub, бренда, цен и интеграций.'
};

export function mount(container) {
  container.innerHTML = `<article class="module-card"><h1>${moduleManifest.title}</h1><p>${moduleManifest.description}</p></article>`;
}

export function unmount() {}
