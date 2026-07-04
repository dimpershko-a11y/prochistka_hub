export const moduleManifest = {
  id: 'crm',
  title: 'CRM',
  route: '/crm',
  order: 70,
  enabled: true,
  description: 'Клиенты, контакты, история общения и повторные обращения.'
};

export function mount(container) {
  container.innerHTML = `<article class="module-card"><h1>${moduleManifest.title}</h1><p>${moduleManifest.description}</p></article>`;
}

export function unmount() {}
