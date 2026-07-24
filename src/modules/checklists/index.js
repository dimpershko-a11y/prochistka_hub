import { renderModulePlaceholder } from '../../shared/ui/module-placeholder.js';

export const moduleManifest = {
  id: 'checklists',
  title: 'Чек-листы',
  route: '/checklists',
  order: 30,
  enabled: true,
  description: 'Модуль чек-листов работ.'
};

export function mount(container) {
  container.innerHTML = renderModulePlaceholder({
    manifest: moduleManifest,
    status: 'Пилотный контур',
    actions: [
      'Описать шаблоны уборок по типам объектов',
      'Добавить отметки выполнения и фото-контроль',
      'Синхронизировать чек-лист с заказом'
    ]
  });
}

export function unmount() {}
