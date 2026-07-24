import { renderModulePlaceholder } from '../../shared/ui/module-placeholder.js';

export const moduleManifest = {
  id: 'dashboard',
  title: 'Дашборд',
  route: '/dashboard',
  order: 20,
  enabled: true,
  description: 'Бизнес-дашборд с заказами, заявками, выручкой, расходами и показателями.'
};

export function mount(container) {
  container.innerHTML = renderModulePlaceholder({
    manifest: moduleManifest,
    status: 'Пилотный контур',
    actions: [
      'Собрать показатели дня: заказы, выручка, ФОТ',
      'Показать риски: документы, расходы, просрочки',
      'Подключить агрегаты из модулей без дублирования логики'
    ]
  });
}

export function unmount() {}
