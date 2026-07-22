export const ORDER_SCHEMA_VERSION = 1;
export const ORDERS_STORAGE_KEY = 'prochistka_hub_orders_v1';

export const defaultOrderStatuses = [
  { id: 'draft', label: 'Черновик' },
  { id: 'new', label: 'Новый' },
  { id: 'confirmed', label: 'Подтверждён' },
  { id: 'scheduled', label: 'Запланирован' },
  { id: 'in_progress', label: 'В работе' },
  { id: 'completed', label: 'Работы завершены' },
  { id: 'cancelled', label: 'Отменён' },
  { id: 'archived', label: 'Архив' }
];

export const allowedStatusTransitions = {
  draft: ['new', 'cancelled', 'archived'],
  new: ['confirmed', 'cancelled', 'archived'],
  confirmed: ['scheduled', 'cancelled', 'archived'],
  scheduled: ['in_progress', 'cancelled', 'archived'],
  in_progress: ['completed', 'cancelled', 'archived'],
  completed: ['archived'],
  cancelled: ['archived'],
  archived: []
};
