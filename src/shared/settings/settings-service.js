const SETTINGS_KEY = 'prochistka_hub_settings';

export const settingsService = {
  getAll() {
    try {
      return JSON.parse(localStorage.getItem(SETTINGS_KEY)) || {};
    } catch {
      return {};
    }
  },

  get(key, fallback = null) {
    return this.getAll()[key] ?? fallback;
  },

  set(key, value) {
    const settings = this.getAll();
    settings[key] = value;
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    return settings;
  }
};
