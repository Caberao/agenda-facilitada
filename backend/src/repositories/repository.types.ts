import type {
  Appointment,
  BirthdayBackground,
  BirthdayContact,
  BirthdayGroup,
  Client,
  RegistrationProfile,
  SeedData,
  Settings,
  User,
} from '../types/shared';

export interface DataRepository {
  getUser: () => Promise<User>;
  getSettings: () => Promise<Settings>;
  setSettings: (settings: Settings) => Promise<void>;
  getRegistration: () => Promise<RegistrationProfile>;
  setRegistration: (registration: RegistrationProfile) => Promise<void>;
  getAppointments: () => Promise<Appointment[]>;
  setAppointments: (appointments: Appointment[]) => Promise<void>;
  getClients: () => Promise<Client[]>;
  setClients: (clients: Client[]) => Promise<void>;
  getBirthdays: () => Promise<BirthdayContact[]>;
  setBirthdays: (birthdays: BirthdayContact[]) => Promise<void>;
  getBirthdayGroups: () => Promise<BirthdayGroup[]>;
  setBirthdayGroups: (groups: BirthdayGroup[]) => Promise<void>;
  getBirthdayBackgrounds: () => Promise<BirthdayBackground[]>;
  setBirthdayBackgrounds: (backgrounds: BirthdayBackground[]) => Promise<void>;
}

export type DataProvider = 'local' | 'memory' | 'supabase';

export interface RepositoryMeta {
  requestedProvider: DataProvider;
  activeProvider: DataProvider;
  localDbPath?: string;
}

export function cloneSeedData(seed: SeedData): SeedData {
  return {
    user: { ...seed.user },
    settings: { ...seed.settings },
    registration: {
      ...seed.registration,
      address: { ...seed.registration.address },
    },
    appointments: seed.appointments.map((appointment) => ({ ...appointment })),
    clients: seed.clients.map((client) => ({ ...client })),
    birthdays: seed.birthdays.map((birthday) => ({ ...birthday })),
    birthdayGroups: seed.birthdayGroups.map((group) => ({ ...group })),
    birthdayBackgrounds: seed.birthdayBackgrounds.map((background) => ({ ...background })),
  };
}
