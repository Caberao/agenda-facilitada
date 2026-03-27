import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, isAbsolute, resolve } from 'node:path';
import { seedData } from '../data/seed';
import type { SeedData } from '../types/shared';
import type { DataRepository } from './repository.types';
import { cloneSeedData } from './repository.types';

interface LocalFileRepositoryOptions {
  filePath: string;
}

function resolveLocalDbPath(inputPath: string) {
  if (isAbsolute(inputPath)) {
    return inputPath;
  }

  return resolve(process.cwd(), inputPath);
}

function isSeedData(candidate: unknown): candidate is SeedData {
  if (!candidate || typeof candidate !== 'object') {
    return false;
  }

  const record = candidate as Partial<SeedData>;
  return Boolean(record.user && record.settings && Array.isArray(record.appointments) && Array.isArray(record.clients));
}

function normalizeSeedData(candidate: SeedData | Omit<SeedData, 'registration'>) {
  const maybeRegistration = (candidate as Partial<SeedData>).registration;
  const maybeBirthdays = (candidate as Partial<SeedData>).birthdays;
  const maybeGroups = (candidate as Partial<SeedData>).birthdayGroups;
  const maybeBackgrounds = (candidate as Partial<SeedData>).birthdayBackgrounds;

  return {
    ...candidate,
    registration: maybeRegistration
      ? {
          ...maybeRegistration,
          address: { ...maybeRegistration.address },
        }
        : {
            ...seedData.registration,
            address: { ...seedData.registration.address },
          },
    birthdays: Array.isArray(maybeBirthdays)
      ? maybeBirthdays.map((birthday) => ({ ...birthday }))
      : seedData.birthdays.map((birthday) => ({ ...birthday })),
    birthdayGroups: Array.isArray(maybeGroups)
      ? maybeGroups.map((group) => ({ ...group }))
      : seedData.birthdayGroups.map((group) => ({ ...group })),
    birthdayBackgrounds: Array.isArray(maybeBackgrounds)
      ? maybeBackgrounds.map((background) => ({ ...background }))
      : seedData.birthdayBackgrounds.map((background) => ({ ...background })),
  } as SeedData;
}

export class LocalFileRepository implements DataRepository {
  private readonly filePath: string;
  private data: SeedData;

  constructor(options: LocalFileRepositoryOptions) {
    this.filePath = resolveLocalDbPath(options.filePath);
    this.data = this.loadOrCreate();
  }

  getFilePath() {
    return this.filePath;
  }

  async getUser() {
    return { ...this.data.user };
  }

  async getSettings() {
    return { ...this.data.settings };
  }

  async setSettings(settings: SeedData['settings']) {
    this.data.settings = { ...settings };
    this.persist();
  }

  async getRegistration() {
    return {
      ...this.data.registration,
      address: { ...this.data.registration.address },
    };
  }

  async setRegistration(registration: SeedData['registration']) {
    this.data.registration = {
      ...registration,
      address: { ...registration.address },
    };
    this.persist();
  }

  async getAppointments() {
    return this.data.appointments.map((appointment) => ({ ...appointment }));
  }

  async setAppointments(appointments: SeedData['appointments']) {
    this.data.appointments = appointments.map((appointment) => ({ ...appointment }));
    this.persist();
  }

  async getClients() {
    return this.data.clients.map((client) => ({ ...client }));
  }

  async setClients(clients: SeedData['clients']) {
    this.data.clients = clients.map((client) => ({ ...client }));
    this.persist();
  }

  async getBirthdays() {
    return this.data.birthdays.map((birthday) => ({ ...birthday }));
  }

  async setBirthdays(birthdays: SeedData['birthdays']) {
    this.data.birthdays = birthdays.map((birthday) => ({ ...birthday }));
    this.persist();
  }

  async getBirthdayGroups() {
    return this.data.birthdayGroups.map((group) => ({ ...group }));
  }

  async setBirthdayGroups(groups: SeedData['birthdayGroups']) {
    this.data.birthdayGroups = groups.map((group) => ({ ...group }));
    this.persist();
  }

  async getBirthdayBackgrounds() {
    return this.data.birthdayBackgrounds.map((background) => ({ ...background }));
  }

  async setBirthdayBackgrounds(backgrounds: SeedData['birthdayBackgrounds']) {
    this.data.birthdayBackgrounds = backgrounds.map((background) => ({ ...background }));
    this.persist();
  }

  private loadOrCreate() {
    const initialData = cloneSeedData(seedData);
    const parentPath = dirname(this.filePath);
    mkdirSync(parentPath, { recursive: true });

    if (!existsSync(this.filePath)) {
      this.writeData(initialData);
      return initialData;
    }

    try {
      const raw = readFileSync(this.filePath, 'utf-8');
      const parsed = JSON.parse(raw) as unknown;

      if (!isSeedData(parsed)) {
        this.writeData(initialData);
        return initialData;
      }

      return cloneSeedData(normalizeSeedData(parsed as SeedData | Omit<SeedData, 'registration'>));
    } catch {
      this.writeData(initialData);
      return initialData;
    }
  }

  private persist() {
    this.writeData(this.data);
  }

  private writeData(data: SeedData) {
    writeFileSync(this.filePath, JSON.stringify(data, null, 2), 'utf-8');
  }
}
