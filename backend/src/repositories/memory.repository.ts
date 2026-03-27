import { seedData } from '../data/seed';
import type { DataRepository } from './repository.types';
import { cloneSeedData } from './repository.types';

export class MemoryRepository implements DataRepository {
  private data = cloneSeedData(seedData);

  async getUser() {
    return { ...this.data.user };
  }

  async getSettings() {
    return { ...this.data.settings };
  }

  async setSettings(settings: typeof this.data.settings) {
    this.data.settings = { ...settings };
  }

  async getRegistration() {
    return {
      ...this.data.registration,
      address: { ...this.data.registration.address },
    };
  }

  async setRegistration(registration: typeof this.data.registration) {
    this.data.registration = {
      ...registration,
      address: { ...registration.address },
    };
  }

  async getAppointments() {
    return this.data.appointments.map((appointment) => ({ ...appointment }));
  }

  async setAppointments(appointments: typeof this.data.appointments) {
    this.data.appointments = appointments.map((appointment) => ({ ...appointment }));
  }

  async getClients() {
    return this.data.clients.map((client) => ({ ...client }));
  }

  async setClients(clients: typeof this.data.clients) {
    this.data.clients = clients.map((client) => ({ ...client }));
  }

  async getBirthdays() {
    return this.data.birthdays.map((birthday) => ({ ...birthday }));
  }

  async setBirthdays(birthdays: typeof this.data.birthdays) {
    this.data.birthdays = birthdays.map((birthday) => ({ ...birthday }));
  }

  async getBirthdayGroups() {
    return this.data.birthdayGroups.map((group) => ({ ...group }));
  }

  async setBirthdayGroups(groups: typeof this.data.birthdayGroups) {
    this.data.birthdayGroups = groups.map((group) => ({ ...group }));
  }

  async getBirthdayBackgrounds() {
    return this.data.birthdayBackgrounds.map((background) => ({ ...background }));
  }

  async setBirthdayBackgrounds(backgrounds: typeof this.data.birthdayBackgrounds) {
    this.data.birthdayBackgrounds = backgrounds.map((background) => ({ ...background }));
  }
}

export function createMemoryRepository() {
  return new MemoryRepository();
}
