import { renderModulePlaceholder } from '../../shared/ui/module-placeholder.js';

export const moduleManifest = {
  id: 'documents',
  title: 'Документы',
  route: '/documents',
  order: 60,
  enabled: true,
  description: 'Шаблоны, генерация и хранение документов.'
};

export function mount(container) {
  container.innerHTML = renderModulePlaceholder({
    manifest: moduleManifest,
    status: 'Пилотный контур',
    actions: [
      'Собрать шаблоны КП, актов и договоров',
      'Подключить генерацию PDF через shared/pdf',
      'Хранить историю сформированных документов'
    ]
  });
}

export function unmount() {}
