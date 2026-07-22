---
name: employee-timesheet-module
description: Use when building or improving the PRO-CHISTKA employee timesheet module: shifts, hours, payments, employees, objects, and PDF/export.
---

# employee-timesheet-module

## Purpose
Use when building or improving the PRO-CHISTKA employee timesheet module: shifts, hours, payments, employees, objects, and PDF/export.

## Project context
This skill is for the PRO-CHISTKA Hub project.

PRO-CHISTKA Hub is a modular web application for a cleaning company. The project may include:
- calculator
- business dashboard
- checklists
- employee timesheet
- damage reports
- PDF documents
- CRM
- orders
- expenses
- employees
- partners
- settings
- Google Sheets integration

## Core rules
- Keep modules separated.
- Do not mix business logic with UI.
- Do not duplicate formulas or pricing rules.
- Do not change prices unless explicitly requested.
- Do not expose secrets, tokens, Google credentials, or API keys.
- Prefer shared logic in shared/config, shared/calculations, shared/pdf, shared/google-sheets, shared/ui, and shared/utils.
- Make small, safe changes.
- Do not touch unrelated modules.

## Workflow
1. Inspect the project structure.
2. Locate relevant files.
3. Identify affected modules.
4. Explain the plan before making non-trivial changes.
5. Make focused changes only.
6. Run or suggest relevant checks: build, tests, typecheck, lint, manual QA.
7. Report what was changed and what was verified.

## Output
Return:
- short summary
- files changed
- business logic affected
- checks performed
- risks or follow-up tasks
