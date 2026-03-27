import type { Settings } from '../types/shared';
import { dataRepository } from '../repositories';

function normalizeSettings(settings: Settings | Omit<Settings, 'birthdaysModuleEnabled'>): Settings {
  return {
    ...settings,
    birthdaysModuleEnabled:
      'birthdaysModuleEnabled' in settings && typeof settings.birthdaysModuleEnabled === 'boolean'
        ? settings.birthdaysModuleEnabled
        : true,
  };
}

class SettingsService {
  async get() {
    return normalizeSettings((await dataRepository.getSettings()) as Settings | Omit<Settings, 'birthdaysModuleEnabled'>);
  }

  async update(settings: Settings) {
    const normalized = normalizeSettings(settings);
    await dataRepository.setSettings(normalized);
    return normalizeSettings((await dataRepository.getSettings()) as Settings | Omit<Settings, 'birthdaysModuleEnabled'>);
  }
}

export const settingsService = new SettingsService();
