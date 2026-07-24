import { renderModulePlaceholder } from '../../shared/ui/module-placeholder.js';

export const moduleManifest = {
  id: 'damages',
  title: 'Повреждения',
  route: '/damages',
  order: 50,
  enabled: true,
  description: 'Фиксация повреждений, комментариев, ответственных и статусов.'
};

export function mount(container) {
  container.innerHTML = renderModulePlaceholder({
    manifest: moduleManifest,
    status: 'Пилотный контур',
    actions: [
      'Зафиксировать фото, объект и ответственного',
      'Добавить статусы разбора и компенсаций',
      'Связать акт повреждения с заказом и клиентом'
    ]
  });
}

export function unmount() {}
