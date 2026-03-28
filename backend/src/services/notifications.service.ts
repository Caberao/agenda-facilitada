import dayjs from 'dayjs';
import { birthdaysService } from './birthdays.service';
import { settingsService } from './settings.service';

interface BirthdayNotificationTestResult {
  processedDate: string;
  totalBirthdays: number;
  inAppSent: boolean;
  emailSent: boolean;
  whatsappSent: boolean;
  targets: {
    email: string | null;
    whatsapp: string | null;
  };
  sampleNames: string[];
}

function parseDateInput(input?: string) {
  if (!input) {
    return dayjs();
  }

  const parsed = dayjs(input);
  if (!parsed.isValid()) {
    return dayjs();
  }

  return parsed;
}

class NotificationsService {
  async testBirthdayNotifications(dateInput?: string): Promise<BirthdayNotificationTestResult> {
    const [settings, birthdays] = await Promise.all([settingsService.get(), birthdaysService.list()]);
    const referenceDate = parseDateInput(dateInput);
    const targetMonth = referenceDate.month() + 1;
    const targetDay = referenceDate.date();

    const todayBirthdays = birthdays.filter((entry) => {
      if (!entry.active) {
        return false;
      }

      const [year, month, day] = entry.birthDate.split('-').map(Number);
      if (!year || !month || !day) {
        return false;
      }

      return month === targetMonth && day === targetDay;
    });

    const canNotify = settings.notificationsEnabled && todayBirthdays.length > 0;
    const emailTarget = settings.notificationEmail?.trim() || null;
    const whatsappTarget = settings.notificationWhatsapp?.trim() || null;

    return {
      processedDate: referenceDate.format('YYYY-MM-DD'),
      totalBirthdays: todayBirthdays.length,
      inAppSent: canNotify && settings.birthdayNotifyInApp,
      emailSent: canNotify && settings.birthdayNotifyEmail && Boolean(emailTarget),
      whatsappSent: canNotify && settings.birthdayNotifyWhatsapp && Boolean(whatsappTarget),
      targets: {
        email: emailTarget,
        whatsapp: whatsappTarget,
      },
      sampleNames: todayBirthdays.slice(0, 5).map((entry) => entry.nickname || entry.name),
    };
  }
}

export const notificationsService = new NotificationsService();
export type { BirthdayNotificationTestResult };

