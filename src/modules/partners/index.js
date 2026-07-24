import { renderModulePlaceholder } from '../../shared/ui/module-placeholder.js';

export const moduleManifest = {
  id: 'partners',
  title: 'Партнёры',
  route: '/partners',
  order: 110,
  enabled: true,
  description: 'Дизайнеры, строители, партнёрские каналы и рекомендации.'
};

export function mount(container) {
  container.innerHTML = renderModulePlaceholder({
    manifest: moduleManifest,
    status: 'Пилотный контур',
    actions: [
      'Собрать партнёрские каналы и условия',
      'Отслеживать рекомендации и конверсию',
      'Связать партнёра с клиентами и заказами'
    ]
  });
}

export function unmount() {}
