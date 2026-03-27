import dayjs from 'dayjs';
import 'dayjs/locale/pt-br';
import type { Appointment } from '../types/shared';

dayjs.locale('pt-br');

export const DATE_DISPLAY_PATTERN = 'DD-MM-YYYY';
export const DATE_TIME_DISPLAY_PATTERN = 'DD-MM-YYYY [às] HH:mm';

export function formatDate(date: string, pattern = DATE_DISPLAY_PATTERN) {
  return dayjs(date).format(pattern);
}

export function formatDateTime(value: string, pattern = DATE_TIME_DISPLAY_PATTERN) {
  return dayjs(value).format(pattern);
}

export function isToday(date: string) {
  return dayjs(date).isSame(dayjs(), 'day');
}

export function isTomorrow(date: string) {
  return dayjs(date).isSame(dayjs().add(1, 'day'), 'day');
}

export function sortAppointments(appointments: Appointment[]) {
  return [...appointments].sort((a, b) => dayjs(a.scheduledAt).valueOf() - dayjs(b.scheduledAt).valueOf());
}
