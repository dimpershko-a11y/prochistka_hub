# CODEX skills — Calculator V1 + Orders V1

## Статус

Источник: актуальный каталог Codex, предоставленный владельцем проекта 22 июля 2026 года.

- Всего в каталоге: 101 skill.
- Повторная полная инвентаризация для этой задачи запрещена.
- `browser:control-in-app-browser` не использовать: зарегистрирован, но `SKILL.md` отсутствует.
- Этот файл содержит только skills, относящиеся к Calculator V1 + Orders V1.

## Семь основных skills

Открыть их инструкции один раз, поэтапно, а не все одновременно без необходимости.

| Skill | Путь | Этап и назначение |
|---|---|---|
| `codebase-map` | `C:\Users\HP\.agents\skills\codebase-map\SKILL.md` | Первый точечный аудит структуры, точек входа и потоков данных. |
| `project-architect` | `C:\Users\HP\.agents\skills\project-architect\SKILL.md` | Границы Calculator, Orders и shared; публичные контракты и события. |
| `safe-code-change` | `C:\Users\HP\.agents\skills\safe-code-change\SKILL.md` | Реализация без массового рефакторинга и изменений соседних модулей. |
| `scope-guard` | `C:\Users\HP\.agents\skills\scope-guard\SKILL.md` | Запрет выхода в полноценную CRM, табель, расходы и финансы. |
| `algorithm-correctness-review` | `C:\Users\HP\.agents\skills\algorithm-correctness-review\SKILL.md` | Проверка формул, минимумов, скидок, округления, экономики и выплат. |
| `test-generator` | `C:\Users\HP\.agents\skills\test-generator\SKILL.md` | Параметризованные unit, integration и regression tests. |
| `impeccable` | `C:\Users\HP\OneDrive\Документы\GitHub\prochistka_hub\.agents\skills\impeccable\SKILL.md` | Проектный UI/UX, адаптивность, понятные формы и визуальная полировка. |

## Условные skills

Открывать только после наступления триггера.

| Skill | Триггер |
|---|---|
| `data-validation-specialist` | Меняются схемы, миграции, импорт, payload или валидация форм. |
| `edge-case-generator` | Базовые тесты готовы, но остаются риски непокрытых граничных входов. |
| `debug-fix-runner` | Фактически упал test, lint, build или runtime. |
| `code-reviewer` | Один финальный целевой review только изменённых файлов. |
| `no-gold-plating` **или** `ponytail:ponytail` | Решение начинает разрастаться; выбрать только один skill. |
| `chrome:control-chrome` | Финальный браузерный smoke-test, если Chrome доступен. |
| `github:github` | Требуется операция с GitHub, которой недостаточно локального git. |
| `github:gh-fix-ci` | Реально упали GitHub Actions checks. |
| `github:yeet` | Только после явного разрешения владельца на commit, push и PR. |

## Не использовать

Не открывать и не применять без отдельной задачи: SEO, реклама, social, Gmail, Calendar, Drive, documents, PDF, presentations, spreadsheets, data-analytics, imagegen, Sites, skill/plugin creator/installer и другие нерелевантные skills.

## Отчётность

В итоговом отчёте указывать только:

- реально применённые skills;
- этап применения;
- одно короткое предложение о результате.

Полный каталог и причины неиспользования остальных skills не повторять.
