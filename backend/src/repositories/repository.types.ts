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
  getUser: () => User;
  getSettings: () => Settings;
  setSettings: (settings: Settings) => void;
  getRegistration: () => RegistrationProfile;
  setRegistration: (registration: RegistrationProfile) => void;
  getAppointments: () => Appointment[];
  setAppointments: (appointments: Appointment[]) => void;
  getClients: () => Client[];
  setClients: (clients: Client[]) => void;
  getBirthdays: () => BirthdayContact[];
  setBirthdays: (birthdays: BirthdayContact[]) => void;
  getBirthdayGroups: () => BirthdayGroup[];
  setBirthdayGroups: (groups: BirthdayGroup[]) => void;
  getBirthdayBackgrounds: () => BirthdayBackground[];
  setBirthdayBackgrounds: (backgrounds: BirthdayBackground[]) => void;
}

export type DataProvider = 'local' | 'memory';

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
