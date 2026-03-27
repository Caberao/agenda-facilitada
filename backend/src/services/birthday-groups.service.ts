import dayjs from 'dayjs';
import type { BirthdayGroup } from '../types/shared';
import { dataRepository } from '../repositories';
import { createId } from '../utils/id';

type BirthdayGroupInput = Omit<BirthdayGroup, 'id' | 'createdAt' | 'updatedAt'>;

class BirthdayGroupsService {
  list() {
    return dataRepository.getBirthdayGroups().sort((a, b) => a.name.localeCompare(b.name));
  }

  create(input: BirthdayGroupInput) {
    const now = dayjs().toISOString();
    const group: BirthdayGroup = {
      id: createId('bgroup'),
      name: input.name.trim(),
      ...(input.description?.trim() ? { description: input.description.trim() } : {}),
      active: input.active,
      createdAt: now,
      updatedAt: now,
    };

    const groups = dataRepository.getBirthdayGroups();
    dataRepository.setBirthdayGroups([group, ...groups]);
    return group;
  }

  update(id: string, input: BirthdayGroupInput) {
    const groups = dataRepository.getBirthdayGroups();
    const current = groups.find((item) => item.id === id);
    if (!current) {
      return null;
    }

    const updated: BirthdayGroup = {
      id: current.id,
      name: input.name.trim(),
      ...(input.description?.trim() ? { description: input.description.trim() } : {}),
      active: input.active,
      createdAt: current.createdAt,
      updatedAt: dayjs().toISOString(),
    };

    dataRepository.setBirthdayGroups(groups.map((item) => (item.id === id ? updated : item)));
    return updated;
  }
}

export const birthdayGroupsService = new BirthdayGroupsService();
