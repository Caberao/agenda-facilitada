import { seedData } from '../data/seed';
import type { DataRepository } from './repository.types';
import { cloneSeedData } from './repository.types';

export class MemoryRepository implements DataRepository {
  private data = cloneSeedData(seedData);

  getUser() {
    return { ...this.data.user };
  }

  getSettings() {
    return { ...this.data.settings };
  }

  setSettings(settings: typeof this.data.settings) {
    this.data.settings = { ...settings };
  }

  getRegistration() {
    return {
      ...this.data.registration,
      address: { ...this.data.registration.address },
    };
  }

  setRegistration(registration: typeof this.data.registration) {
    this.data.registration = {
      ...registration,
      address: { ...registration.address },
    };
  }

  getAppointments() {
    return this.data.appointments.map((appointment) => ({ ...appointment }));
  }

  setAppointments(appointments: typeof this.data.appointments) {
    this.data.appointments = appointments.map((appointment) => ({ ...appointment }));
  }

  getClients() {
    return this.data.clients.map((client) => ({ ...client }));
  }

  setClients(clients: typeof this.data.clients) {
    this.data.clients = clients.map((client) => ({ ...client }));
  }

  getBirthdays() {
    return this.data.birthdays.map((birthday) => ({ ...birthday }));
  }

  setBirthdays(birthdays: typeof this.data.birthdays) {
    this.data.birthdays = birthdays.map((birthday) => ({ ...birthday }));
  }

  getBirthdayGroups() {
    return this.data.birthdayGroups.map((group) => ({ ...group }));
  }

  setBirthdayGroups(groups: typeof this.data.birthdayGroups) {
    this.data.birthdayGroups = groups.map((group) => ({ ...group }));
  }

  getBirthdayBackgrounds() {
    return this.data.birthdayBackgrounds.map((background) => ({ ...background }));
  }

  setBirthdayBackgrounds(backgrounds: typeof this.data.birthdayBackgrounds) {
    this.data.birthdayBackgrounds = backgrounds.map((background) => ({ ...background }));
  }
}

export function createMemoryRepository() {
  return new MemoryRepository();
}
