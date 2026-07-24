import { renderModulePlaceholder } from '../../shared/ui/module-placeholder.js';

export const moduleManifest = {
  id: 'timesheet',
  title: 'Табель',
  route: '/timesheet',
  order: 40,
  enabled: true,
  description: 'Учёт смен, часов, ставок и выплат сотрудникам.'
};

export function mount(container) {
  container.innerHTML = renderModulePlaceholder({
    manifest: moduleManifest,
    status: 'Пилотный контур',
    actions: [
      'Собрать смены по заказам и сотрудникам',
      'Развести ставки, доплаты и штрафы',
      'Подготовить экспорт выплат за период'
    ]
  });
}

export function unmount() {}
