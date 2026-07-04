export const moduleManifest = {
  id: 'expenses',
  title: 'Расходы',
  route: '/expenses',
  order: 90,
  enabled: true,
  description: 'Расходы на рекламу, материалы, выплаты и прочие затраты.'
};

export function mount(container) {
  container.innerHTML = `<article class="module-card"><h1>${moduleManifest.title}</h1><p>${moduleManifest.description}</p></article>`;
}

export function unmount() {}
