import dayjs from 'dayjs';
import type { BirthdayContact } from '../types/shared';
import { dataRepository } from '../repositories';
import { createId } from '../utils/id';

type BirthdayInput = Omit<BirthdayContact, 'id' | 'createdAt' | 'updatedAt'>;

function normalizeOptional(value: string | undefined) {
  const normalized = value?.trim();
  return normalized ? normalized : undefined;
}

function buildBirthday(input: BirthdayInput, metadata: Pick<BirthdayContact, 'id' | 'createdAt'>): BirthdayContact {
  const nickname = normalizeOptional(input.nickname);
  const groupId = normalizeOptional(input.groupId);
  const photoUrl = normalizeOptional(input.photoUrl);
  const notes = normalizeOptional(input.notes);
  const messageTemplate = normalizeOptional(input.messageTemplate);
  const externalRef = normalizeOptional(input.externalRef);

  return {
    id: metadata.id,
    name: input.name.trim(),
    ...(nickname ? { nickname } : {}),
    whatsapp: input.whatsapp.trim(),
    birthDate: input.birthDate,
    ...(groupId ? { groupId } : {}),
    ...(photoUrl ? { photoUrl } : {}),
    source: input.source,
    active: input.active,
    ...(notes ? { notes } : {}),
    ...(messageTemplate ? { messageTemplate } : {}),
    ...(externalRef ? { externalRef } : {}),
    createdAt: metadata.createdAt,
    updatedAt: dayjs().toISOString(),
  };
}

class BirthdaysService {
  list() {
    return dataRepository
      .getBirthdays()
      .sort((first, second) => dayjs(first.birthDate).valueOf() - dayjs(second.birthDate).valueOf());
  }

  create(input: BirthdayInput) {
    const now = dayjs().toISOString();
    const birthday = buildBirthday(input, {
      id: createId('birthday'),
      createdAt: now,
    });

    const birthdays = dataRepository.getBirthdays();
    dataRepository.setBirthdays([birthday, ...birthdays]);
    return birthday;
  }

  update(id: string, input: BirthdayInput) {
    const birthdays = dataRepository.getBirthdays();
    const current = birthdays.find((entry) => entry.id === id);
    if (!current) {
      return null;
    }

    const updated = buildBirthday(input, {
      id: current.id,
      createdAt: current.createdAt,
    });

    dataRepository.setBirthdays(birthdays.map((entry) => (entry.id === id ? updated : entry)));
    return updated;
  }
}

export const birthdaysService = new BirthdaysService();
