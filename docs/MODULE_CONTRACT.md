# Контракт модуля

Каждый модуль PRO-CHISTKA Hub должен иметь одинаковый публичный интерфейс.

## manifest.js

```js
export const moduleManifest = {
  id: 'calculator',
  title: 'Калькулятор',
  route: '/calculator',
  order: 10,
  enabled: true,
  description: 'Расчёт стоимости уборки'
};
```

## index.js

```js
import { moduleManifest } from './manifest.js';

export { moduleManifest };

export function mount(container, context) {
  container.innerHTML = `<h1>${moduleManifest.title}</h1>`;
}

export function unmount() {}
```

## Обязательные поля manifest

| Поле | Назначение |
|---|---|
| `id` | Уникальный технический ID модуля |
| `title` | Название в интерфейсе |
| `route` | Адрес внутри Hub |
| `order` | Порядок в меню |
| `enabled` | Включён/выключен |
| `description` | Краткое описание |

## Правило импорта

Модуль может импортировать свои внутренние файлы, `src/shared` и глобальную конфигурацию.

Внутренние файлы одного модуля не используются напрямую внутри другого модуля.
