export interface VoiceAppointmentParseResult {
  title: string;
  description: string;
  date: string;
  time: string;
  endTime?: string;
  reminderMinutesBefore: number;
  reminderEnabled: boolean;
  warnings: string[];
}

export const VOICE_HOTWORD = 'agenda facilitada';
export const MOBILE_VOICE_HOTWORD = 'ok facilita';

const weekdayMap: Record<string, number> = {
  domingo: 0,
  segunda: 1,
  'segunda-feira': 1,
  terca: 2,
  'terça': 2,
  'terça-feira': 2,
  'terca-feira': 2,
  quarta: 3,
  'quarta-feira': 3,
  quinta: 4,
  'quinta-feira': 4,
  sexta: 5,
  'sexta-feira': 5,
  sabado: 6,
  sábado: 6,
};

export function parseVoiceAppointment(text: string, referenceDate = new Date()): VoiceAppointmentParseResult {
  const raw = text.trim();
  const normalized = normalize(raw);
  const warnings: string[] = [];

  const date = parseDate(normalized, referenceDate);
  if (!date) {
    warnings.push('Não entendi a data. Ajuste manualmente antes de salvar.');
  }

  const time = parseStartTime(normalized);
  if (!time) {
    warnings.push('Não entendi a hora inicial. Ajuste manualmente.');
  }

  const endTime = parseEndTime(normalized, time || undefined);
  const reminderMinutes = parseReminderMinutes(normalized);
  const reminderEnabled = reminderMinutes > 0 || /avisar|lembrete|lembrar/.test(normalized);
  const title = parseTitle(raw);

  return {
    title,
    description: title,
    date: date || toIsoDate(referenceDate),
    time: time || '',
    ...(endTime ? { endTime } : {}),
    reminderMinutesBefore: reminderEnabled ? reminderMinutes : 0,
    reminderEnabled,
    warnings,
  };
}

export function stripVoiceHotword(text: string) {
  return stripByHotword(text, VOICE_HOTWORD);
}

export function stripMobileHotword(text: string) {
  return stripByHotword(text, MOBILE_VOICE_HOTWORD);
}

export function stripByHotword(text: string, hotword: string) {
  const matches = Array.from(text.matchAll(new RegExp(escapeRegex(hotword), 'ig')));
  if (matches.length === 0) {
    return null;
  }

  const lastMatch = matches[matches.length - 1];
  const lastIndex = lastMatch?.index ?? -1;
  if (lastIndex < 0) {
    return null;
  }

  const stripped = text
    .slice(lastIndex + hotword.length)
    .replace(/^\s*[:,;-]?\s*/i, '')
    .trim();
  return stripped || '';
}

function normalize(value: string) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function parseDate(text: string, referenceDate: Date) {
  if (/\bhoje\b/.test(text)) {
    return toIsoDate(referenceDate);
  }

  if (/depois de amanha/.test(text)) {
    return toIsoDate(addDays(referenceDate, 2));
  }

  if (/\bamanha\b/.test(text)) {
    return toIsoDate(addDays(referenceDate, 1));
  }

  const numericDate = text.match(/\b(\d{1,2})[\/-](\d{1,2})(?:[\/-](\d{2,4}))?\b/);
  if (numericDate) {
    const day = Number(numericDate[1]);
    const month = Number(numericDate[2]);
    const yearRaw = numericDate[3] ? Number(numericDate[3]) : referenceDate.getFullYear();
    const year = yearRaw < 100 ? 2000 + yearRaw : yearRaw;
    if (isValidDate(year, month, day)) {
      return `${year}-${pad(month)}-${pad(day)}`;
    }
  }

  const diaDate = text.match(/\bdia\s+(\d{1,2})\b/);
  if (diaDate) {
    const day = Number(diaDate[1]);
    const month = referenceDate.getMonth() + 1;
    const year = referenceDate.getFullYear();
    if (isValidDate(year, month, day)) {
      return `${year}-${pad(month)}-${pad(day)}`;
    }
  }

  for (const [label, weekday] of Object.entries(weekdayMap)) {
    if (new RegExp(`\\b${escapeRegex(label)}\\b`).test(text)) {
      return toIsoDate(nextWeekday(referenceDate, weekday));
    }
  }

  return null;
}

function parseStartTime(text: string) {
  const hmsMatch = text.match(/\b(?:as|às)?\s*(\d{1,2})[:h](\d{2})\b/);
  if (hmsMatch) {
    const hours = clampHour(Number(hmsMatch[1]));
    const minutes = clampMinute(Number(hmsMatch[2]));
    if (hours !== null && minutes !== null) {
      return `${pad(hours)}:${pad(minutes)}`;
    }
  }

  const hourOnlyMatch = text.match(/\b(?:as|às)?\s*(\d{1,2})\s*(?:h|horas?)\b/);
  if (hourOnlyMatch) {
    const hours = clampHour(Number(hourOnlyMatch[1]));
    if (hours !== null) {
      return `${pad(hours)}:00`;
    }
  }

  return null;
}

function parseEndTime(text: string, startTime?: string) {
  const untilMatch = text.match(/\b(?:ate|até|termina(?:ndo)?(?:\s+as|\s+às)?|final(?:iza)?(?:\s+as|\s+às)?)\s*(\d{1,2})(?:[:h](\d{2}))?\b/);
  if (!untilMatch) {
    return undefined;
  }

  const hours = clampHour(Number(untilMatch[1]));
  if (hours === null) {
    return undefined;
  }

  const minutes = untilMatch[2] ? clampMinute(Number(untilMatch[2])) : 0;
  if (minutes === null) {
    return undefined;
  }

  const parsed = `${pad(hours)}:${pad(minutes)}`;
  if (startTime && parsed <= startTime) {
    return undefined;
  }

  return parsed;
}

function parseReminderMinutes(text: string) {
  const match = text.match(/\b(?:avisar|lembrete|lembrar).{0,30}?(\d{1,3})\s*(min|minuto|minutos)\b/);
  if (match) {
    return Math.max(0, Number(match[1]));
  }

  const shortMatch = text.match(/\b(\d{1,3})\s*min(?:utos)?\s*antes\b/);
  if (shortMatch) {
    return Math.max(0, Number(shortMatch[1]));
  }

  return 30;
}

function parseTitle(rawText: string) {
  const cleaned = rawText
    .replace(/,\s*/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  const withoutReminder = cleaned.split(/ me avisar | lembrar | lembrete /i)[0]?.trim() || cleaned;
  const withoutDateTime = withoutReminder
    .replace(/\b(hoje|amanhã|amanha|depois de amanhã|depois de amanha)\b.*$/i, '')
    .replace(/\b(dia\s+\d{1,2}|\d{1,2}[\/-]\d{1,2}(?:[\/-]\d{2,4})?)\b.*$/i, '')
    .replace(/\b(as|às)\s*\d{1,2}(?::\d{2}|h\d{2}|h)?\b.*$/i, '')
    .trim();

  return withoutDateTime || cleaned || 'Novo compromisso';
}

function toIsoDate(date: Date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function addDays(date: Date, days: number) {
  const clone = new Date(date);
  clone.setDate(clone.getDate() + days);
  return clone;
}

function nextWeekday(date: Date, weekday: number) {
  const current = date.getDay();
  let delta = (weekday - current + 7) % 7;
  if (delta === 0) {
    delta = 7;
  }

  return addDays(date, delta);
}

function isValidDate(year: number, month: number, day: number) {
  if (month < 1 || month > 12 || day < 1 || day > 31) {
    return false;
  }

  const date = new Date(year, month - 1, day);
  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day;
}

function clampHour(value: number) {
  if (!Number.isFinite(value) || value < 0 || value > 23) {
    return null;
  }
  return value;
}

function clampMinute(value: number) {
  if (!Number.isFinite(value) || value < 0 || value > 59) {
    return null;
  }
  return value;
}

function pad(value: number) {
  return String(value).padStart(2, '0');
}

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
