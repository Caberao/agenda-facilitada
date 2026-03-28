import type { Settings } from '../types/shared';
import { dataRepository } from '../repositories';

type PartialLegacySettings = Partial<Settings> & {
  birthdaysModuleEnabled?: boolean;
};

function normalizeSettings(settings: Settings | PartialLegacySettings): Settings {
  return {
    businessName: settings.businessName || 'Agenda Facilitada',
    theme: settings.theme === 'dark' ? 'dark' : 'light',
    notificationsEnabled: typeof settings.notificationsEnabled === 'boolean' ? settings.notificationsEnabled : true,
    defaultReminderMinutes:
      typeof settings.defaultReminderMinutes === 'number' && !Number.isNaN(settings.defaultReminderMinutes)
        ? Math.max(0, settings.defaultReminderMinutes)
        : 60,
    compactMode: typeof settings.compactMode === 'boolean' ? settings.compactMode : false,
    birthdaysModuleEnabled: typeof settings.birthdaysModuleEnabled === 'boolean' ? settings.birthdaysModuleEnabled : true,
    notificationEmail: typeof settings.notificationEmail === 'string' ? settings.notificationEmail : '',
    notificationWhatsapp: typeof settings.notificationWhatsapp === 'string' ? settings.notificationWhatsapp : '',
    birthdayNotifyInApp: typeof settings.birthdayNotifyInApp === 'boolean' ? settings.birthdayNotifyInApp : true,
    birthdayNotifyEmail: typeof settings.birthdayNotifyEmail === 'boolean' ? settings.birthdayNotifyEmail : false,
    birthdayNotifyWhatsapp: typeof settings.birthdayNotifyWhatsapp === 'boolean' ? settings.birthdayNotifyWhatsapp : false,
  };
}

class SettingsService {
  async get() {
    return normalizeSettings((await dataRepository.getSettings()) as Settings | PartialLegacySettings);
  }

  async update(settings: Settings) {
    const normalized = normalizeSettings(settings);
    await dataRepository.setSettings(normalized);
    return normalizeSettings((await dataRepository.getSettings()) as Settings | PartialLegacySettings);
  }
}

export const settingsService = new SettingsService();
