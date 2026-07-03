import { apiClient } from './api/api-client.js';
import { calculations } from './calculations/index.js';
import { eventBus } from './events/event-bus.js';
import { formatters } from './formatters/index.js';
import { googleSheets } from './google-sheets/index.js';
import { pdfService } from './pdf/pdf-service.js';
import { settingsService } from './settings/settings-service.js';
import { storageService } from './storage/storage-service.js';

export const shared = {
  apiClient,
  calculations,
  eventBus,
  formatters,
  googleSheets,
  pdfService,
  settingsService,
  storageService
};
