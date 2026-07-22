\# PRO-CHISTKA Hub — Codex Instructions



\## Project goal

Build a modular business hub for PRO-CHISTKA cleaning company.



The hub may include:

\- cleaning calculator

\- business dashboard

\- checklists

\- employee timesheet

\- damage reports

\- PDF documents

\- CRM

\- orders

\- expenses

\- employees

\- partners

\- settings



\## Architecture

Keep every major section as a separate module.



Preferred structure:

\- modules/calculator

\- modules/dashboard

\- modules/checklists

\- modules/timesheet

\- modules/damage-reports

\- modules/documents

\- modules/crm

\- modules/orders

\- modules/expenses

\- modules/employees

\- modules/partners

\- modules/settings

\- shared/config

\- shared/calculations

\- shared/pdf

\- shared/google-sheets

\- shared/ui

\- shared/utils

\- shared/api



\## Rules

\- Do not mix modules.

\- Do not duplicate pricing formulas.

\- Do not hardcode secrets.

\- Do not put Google credentials or API keys in frontend code.

\- Do not change prices without explicit instruction.

\- Prefer small safe changes.

\- Before large changes, provide a plan.

\- After changes, report what was verified.



\## Brand

Brand: PRO-CHISTKA.

City: Saint Petersburg.

Website: pro-chistka.pro.

Tone: professional, clean, reliable, direct, confident.



\## Visual direction

Modern, clean, premium, practical.

Avoid cheap template-looking UI, random gradients, visual noise, and unnecessary animations.

