export const moduleManifest = {
  id: 'employees',
  title: 'Сотрудники',
  route: '/employees',
  order: 100,
  enabled: true,
  description: 'База сотрудников, роли, ставки, контакты и история работ.'
};

export function mount(container) {
  container.innerHTML = `<article class="module-card"><h1>${moduleManifest.title}</h1><p>${moduleManifest.description}</p></article>`;
}

export function unmount() {}
