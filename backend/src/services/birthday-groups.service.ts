import dayjs from 'dayjs';
import type { BirthdayGroup } from '../types/shared';
import { dataRepository } from '../repositories';
import { createId } from '../utils/id';

type BirthdayGroupInput = Omit<BirthdayGroup, 'id' | 'createdAt' | 'updatedAt'>;

class BirthdayGroupsService {
  async list() {
    const groups = await dataRepository.getBirthdayGroups();
    return groups.sort((a, b) => a.name.localeCompare(b.name));
  }

  async create(input: BirthdayGroupInput) {
    const now = dayjs().toISOString();
    const group: BirthdayGroup = {
      id: createId('bgroup'),
      name: input.name.trim(),
      ...(input.description?.trim() ? { description: input.description.trim() } : {}),
      active: input.active,
      createdAt: now,
      updatedAt: now,
    };

    const groups = await dataRepository.getBirthdayGroups();
    await dataRepository.setBirthdayGroups([group, ...groups]);
    return group;
  }

  async update(id: string, input: BirthdayGroupInput) {
    const groups = await dataRepository.getBirthdayGroups();
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

    await dataRepository.setBirthdayGroups(groups.map((item) => (item.id === id ? updated : item)));
    return updated;
  }
}

export const birthdayGroupsService = new BirthdayGroupsService();
