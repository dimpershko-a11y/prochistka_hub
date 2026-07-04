export const moduleManifest = {
  id: 'documents',
  title: 'Документы',
  route: '/documents',
  order: 60,
  enabled: true,
  description: 'Шаблоны, генерация и хранение документов.'
};

export function mount(container) {
  container.innerHTML = `<article class="module-card"><h1>${moduleManifest.title}</h1><p>${moduleManifest.description}</p></article>`;
}

export function unmount() {}
