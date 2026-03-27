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
  get() {
    return normalizeSettings(dataRepository.getSettings() as Settings | Omit<Settings, 'birthdaysModuleEnabled'>);
  }

  update(settings: Settings) {
    const normalized = normalizeSettings(settings);
    dataRepository.setSettings(normalized);
    return normalizeSettings(dataRepository.getSettings() as Settings | Omit<Settings, 'birthdaysModuleEnabled'>);
  }
}

export const settingsService = new SettingsService();
