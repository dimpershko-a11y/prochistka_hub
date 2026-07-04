export const moduleManifest = {
  id: 'timesheet',
  title: 'Табель',
  route: '/timesheet',
  order: 40,
  enabled: true,
  description: 'Учёт смен, часов, ставок и выплат сотрудникам.'
};

export function mount(container) {
  container.innerHTML = `<article class="module-card"><h1>${moduleManifest.title}</h1><p>${moduleManifest.description}</p></article>`;
}

export function unmount() {}
