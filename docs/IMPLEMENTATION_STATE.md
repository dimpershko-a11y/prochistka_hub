# Calculator V1 + Orders V1 — состояние

- Ветка: `feature/calculator-orders-v1-integration` от текущего состояния `hub-check` (`d44290c`), потому что рабочая копия уже содержала незакоммиченные изменения владельца.
- Завершено: аудит Hub и старого калькулятора; канонические документы; расчётное ядро; настройки и миграции; storage черновика/расчётов; Orders service; Calculator/Orders UI; событийная интеграция; тесты; desktop/mobile smoke-test; целевой review.
- Текущий этап: опубликовано в рабочей ветке и готово к ручной приёмке владельцем.
- Осталось: ручная проверка бизнес-пользователем и решение по слиянию ветки. PR не создавался.
- Отклонение: сайт показывает поддерживающую уборку 150 ₽/м², реализовано приоритетное ТЗ 120 ₽/м².
- Последняя проверка: `npm test` — 47/47; `npm run lint:structure` — успешно; `npm run build` — успешно; `git diff --check` — успешно. Есть прежнее предупреждение Vite о чанке ExcelJS больше 500 kB.
- Browser smoke-test: Calculator desktop/mobile, Orders desktop/mobile, создание заказа из расчёта и сохранение ручного черновика — успешно; ошибок консоли приложения нет.
- Активированные skills: `codebase-map`, `project-architect`, `safe-code-change`, `scope-guard`, `algorithm-correctness-review`, `test-generator`, `impeccable`, `debug-fix-runner`, `code-reviewer`, `chrome:control-chrome`, `plan-before-change`, `ponytail:ponytail`.
- Ключевые файлы: `src/modules/calculator/**`, `src/modules/orders/**`, `src/shared/events/event-bus.js`, `src/main.js`, `tests/calculator/**`, `tests/orders/**`, `docs/CALCULATOR_ORDERS_ARCHITECTURE.md`.
