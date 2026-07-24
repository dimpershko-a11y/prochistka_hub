import { renderModulePlaceholder } from '../../shared/ui/module-placeholder.js';

export const moduleManifest = {
  id: 'settings',
  title: 'Настройки',
  route: '/settings',
  order: 120,
  enabled: true,
  description: 'Глобальные настройки Hub, бренда, цен и интеграций.'
};

export function mount(container) {
  container.innerHTML = renderModulePlaceholder({
    manifest: moduleManifest,
    status: 'Рабочий контур',
    actions: [
      'Хранить настройки бренда и рабочих часов',
      'Не размещать секреты и API-ключи во фронтенде',
      'Развести тарифы, интеграции и права доступа'
    ]
  });
}

export function unmount() {}
