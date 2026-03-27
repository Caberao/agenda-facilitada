import dayjs from 'dayjs';
import type { RegistrationProfile } from '../types/shared';
import { dataRepository } from '../repositories';

class RegistrationService {
  get() {
    return dataRepository.getRegistration();
  }

  update(input: RegistrationProfile) {
    const current = dataRepository.getRegistration();
    const next: RegistrationProfile = {
      ...input,
      id: current.id,
      createdAt: current.createdAt,
      updatedAt: dayjs().toISOString(),
      address: { ...input.address },
    };

    dataRepository.setRegistration(next);
    return dataRepository.getRegistration();
  }
}

export const registrationService = new RegistrationService();
