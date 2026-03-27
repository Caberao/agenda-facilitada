import dayjs from 'dayjs';
import type { RegistrationProfile } from '../types/shared';
import { dataRepository } from '../repositories';

class RegistrationService {
  async get() {
    return dataRepository.getRegistration();
  }

  async update(input: RegistrationProfile) {
    const current = await dataRepository.getRegistration();
    const next: RegistrationProfile = {
      ...input,
      id: current.id,
      createdAt: current.createdAt,
      updatedAt: dayjs().toISOString(),
      address: { ...input.address },
    };

    await dataRepository.setRegistration(next);
    return dataRepository.getRegistration();
  }
}

export const registrationService = new RegistrationService();
