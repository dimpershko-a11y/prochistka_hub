import { renderModulePlaceholder } from '../../shared/ui/module-placeholder.js';

export const moduleManifest = {
  id: 'crm',
  title: 'CRM',
  route: '/crm',
  order: 70,
  enabled: true,
  description: 'Клиенты, контакты, история общения и повторные обращения.'
};

export function mount(container) {
  container.innerHTML = renderModulePlaceholder({
    manifest: moduleManifest,
    status: 'Пилотный контур',
    actions: [
      'Собрать карточку клиента и историю касаний',
      'Добавить напоминания по повторным обращениям',
      'Связать CRM с заказами и документами'
    ]
  });
}

export function unmount() {}
