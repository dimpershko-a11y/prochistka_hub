import { renderModulePlaceholder } from '../../shared/ui/module-placeholder.js';

export const moduleManifest = {
  id: 'employees',
  title: 'Сотрудники',
  route: '/employees',
  order: 100,
  enabled: true,
  description: 'База сотрудников, роли, ставки, контакты и история работ.'
};

export function mount(container) {
  container.innerHTML = renderModulePlaceholder({
    manifest: moduleManifest,
    status: 'Пилотный контур',
    actions: [
      'Описать роли, ставки и контакты сотрудников',
      'Связать профили с табелем и заказами',
      'Добавить статус допуска к объектам'
    ]
  });
}

export function unmount() {}
