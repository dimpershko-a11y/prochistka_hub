export const moduleManifest = {
  id: 'partners',
  title: 'Партнёры',
  route: '/partners',
  order: 110,
  enabled: true,
  description: 'Дизайнеры, строители, партнёрские каналы и рекомендации.'
};

export function mount(container) {
  container.innerHTML = `<article class="module-card"><h1>${moduleManifest.title}</h1><p>${moduleManifest.description}</p></article>`;
}

export function unmount() {}
