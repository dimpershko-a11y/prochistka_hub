import {
  CALCULATIONS_KEY,
  CALCULATOR_DRAFT_KEY,
  CALCULATOR_SETTINGS_KEY,
  defaultCalculatorSettings,
  migrateCalculatorSettings
} from '../models/default-settings.js';

const clone = (value) => structuredClone(value);

export function createCalculatorStore(storage) {
  return {
    getSettings() {
      return migrateCalculatorSettings(storage.get(CALCULATOR_SETTINGS_KEY, defaultCalculatorSettings));
    },

    saveSettings(settings) {
      const value = migrateCalculatorSettings(settings);
      storage.set(CALCULATOR_SETTINGS_KEY, value);
      return clone(value);
    },

    getDraft() {
      return clone(storage.get(CALCULATOR_DRAFT_KEY, null));
    },

    saveDraft(draft) {
      storage.set(CALCULATOR_DRAFT_KEY, clone(draft));
      return clone(draft);
    },

    clearDraft() {
      storage.remove(CALCULATOR_DRAFT_KEY);
    },

    listCalculations() {
      const payload = storage.get(CALCULATIONS_KEY, { schemaVersion: 1, calculations: [] });
      return clone(Array.isArray(payload) ? payload : payload.calculations || []);
    },

    saveCalculation(calculation) {
      const calculations = this.listCalculations();
      const index = calculations.findIndex((item) => item.calculationId === calculation.calculationId);
      if (index >= 0) calculations[index] = clone(calculation);
      else calculations.push(clone(calculation));
      storage.set(CALCULATIONS_KEY, { schemaVersion: 1, calculations });
      return clone(calculation);
    },

    linkOrder(calculationId, orderId) {
      const calculations = this.listCalculations();
      const calculation = calculations.find((item) => item.calculationId === calculationId);
      if (!calculation) return null;
      calculation.orderId = orderId;
      storage.set(CALCULATIONS_KEY, { schemaVersion: 1, calculations });
      return clone(calculation);
    }
  };
}
