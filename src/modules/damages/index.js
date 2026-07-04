export const moduleManifest = {
  id: 'damages',
  title: 'Повреждения',
  route: '/damages',
  order: 50,
  enabled: true,
  description: 'Фиксация повреждений, комментариев, ответственных и статусов.'
};

export function mount(container) {
  container.innerHTML = `<article class="module-card"><h1>${moduleManifest.title}</h1><p>${moduleManifest.description}</p></article>`;
}

export function unmount() {}
