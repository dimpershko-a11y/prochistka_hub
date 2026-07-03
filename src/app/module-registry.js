import * as calculator from '../modules/calculator/index.js';
import * as dashboard from '../modules/dashboard/index.js';
import * as checklists from '../modules/checklists/index.js';
import * as timesheet from '../modules/timesheet/index.js';
import * as damages from '../modules/damages/index.js';
import * as documents from '../modules/documents/index.js';
import * as crm from '../modules/crm/index.js';
import * as orders from '../modules/orders/index.js';
import * as expenses from '../modules/expenses/index.js';
import * as employees from '../modules/employees/index.js';
import * as partners from '../modules/partners/index.js';
import * as settings from '../modules/settings/index.js';

export const modules = [
  calculator,
  dashboard,
  checklists,
  timesheet,
  damages,
  documents,
  crm,
  orders,
  expenses,
  employees,
  partners,
  settings
]
  .filter((module) => module.moduleManifest?.enabled)
  .sort((a, b) => a.moduleManifest.order - b.moduleManifest.order);
