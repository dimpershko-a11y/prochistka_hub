export const moduleManifest = {
  id: 'checklists',
  title: 'Чек-листы',
  route: '/checklists',
  order: 30,
  enabled: true,
  description: 'Модуль чек-листов работ.'
};

export function mount(container) {
  container.innerHTML = `<article class="module-card"><h1>${moduleManifest.title}</h1><p>${moduleManifest.description}</p></article>`;
}

export function unmount() {}
