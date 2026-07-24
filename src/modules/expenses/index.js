import { renderModulePlaceholder } from '../../shared/ui/module-placeholder.js';

export const moduleManifest = {
  id: 'expenses',
  title: 'Расходы',
  route: '/expenses',
  order: 90,
  enabled: true,
  description: 'Расходы на рекламу, материалы, выплаты и прочие затраты.'
};

export function mount(container) {
  container.innerHTML = renderModulePlaceholder({
    manifest: moduleManifest,
    status: 'Пилотный контур',
    actions: [
      'Развести категории расходов и источники',
      'Добавить проверку выбросов по суммам',
      'Собрать отчёт маржинальности по заказам'
    ]
  });
}

export function unmount() {}
