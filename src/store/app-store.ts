import { create } from 'zustand';
import {
  createAppointmentRequest,
  deleteAppointmentRequest,
  getSettingsRequest,
  listAppointmentsRequest,
  listClientsRequest,
  loginRequest,
  updateAppointmentRequest,
  updateAppointmentStatusRequest,
  updateSettingsRequest,
} from '../lib/api';
import type {
  Appointment,
  AppointmentFilters,
  AppointmentStatus,
  Client,
  LoginPayload,
  Settings,
  ThemeMode,
  User,
} from '../types/shared';

interface LoginState {
  isAuthenticated: boolean;
  user: User | null;
}

interface AppState extends LoginState {
  appointments: Appointment[];
  clients: Client[];
  settings: Settings;
  mobileNavOpen: boolean;
  isLoading: boolean;
  login: (payload: LoginPayload) => Promise<boolean>;
  logout: () => void;
  setTheme: (theme: ThemeMode) => Promise<void>;
  updateSettings: (settings: Settings) => Promise<void>;
  toggleMobileNav: (open?: boolean) => void;
  createAppointment: (appointment: Omit<Appointment, 'id' | 'createdAt' | 'updatedAt' | 'scheduledAt'>) => Promise<string>;
  updateAppointment: (
    id: string,
    appointment: Omit<Appointment, 'id' | 'createdAt' | 'updatedAt' | 'scheduledAt'>,
  ) => Promise<void>;
  deleteAppointment: (id: string) => Promise<void>;
  updateAppointmentStatus: (id: string, status: AppointmentStatus) => Promise<void>;
  getAppointmentById: (id: string) => Appointment | undefined;
  getFilteredAppointments: (filters: AppointmentFilters) => Appointment[];
}

const defaultAuthState: LoginState = {
  isAuthenticated: false,
  user: null,
};

const defaultSettings: Settings = {
  businessName: 'Agenda Facilitada',
  theme: 'light',
  notificationsEnabled: true,
  defaultReminderMinutes: 30,
  compactMode: false,
  birthdaysModuleEnabled: true,
};

const storageKeys = {
  token: 'agenda_facilitada_token',
  user: 'agenda_facilitada_user',
} as const;

function setSessionStorage(token: string, user: User) {
  localStorage.setItem(storageKeys.token, token);
  localStorage.setItem(storageKeys.user, JSON.stringify(user));
}

function clearSessionStorage() {
  localStorage.removeItem(storageKeys.token);
  localStorage.removeItem(storageKeys.user);
}

export const useAppStore = create<AppState>((set, get) => ({
  ...defaultAuthState,
  appointments: [],
  clients: [],
  settings: defaultSettings,
  mobileNavOpen: false,
  isLoading: false,
  login: async (payload) => {
    try {
      set({ isLoading: true });

      const response = await loginRequest(payload);
      const [appointments, clients, settings] = await Promise.all([
        listAppointmentsRequest(),
        listClientsRequest(),
        getSettingsRequest(),
      ]);

      setSessionStorage(response.token, response.user);
      set({
        isAuthenticated: true,
        user: response.user,
        appointments,
        clients,
        settings,
        isLoading: false,
      });

      return true;
    } catch {
      clearSessionStorage();
      set({
        ...defaultAuthState,
        appointments: [],
        clients: [],
        settings: defaultSettings,
        isLoading: false,
      });
      return false;
    }
  },
  logout: () => {
    clearSessionStorage();
    set({
      ...defaultAuthState,
      appointments: [],
      clients: [],
      settings: defaultSettings,
    });
  },
  setTheme: async (theme) => {
    const currentSettings = get().settings;
    const nextSettings: Settings = {
      ...currentSettings,
      theme,
    };

    set({ settings: nextSettings });

    try {
      const persisted = await updateSettingsRequest(nextSettings);
      set({ settings: persisted });
    } catch {
      set({ settings: currentSettings });
    }
  },
  updateSettings: async (settings) => {
    const persisted = await updateSettingsRequest(settings);
    set({ settings: persisted });
  },
  toggleMobileNav: (open) =>
    set((state) => ({
      mobileNavOpen: typeof open === 'boolean' ? open : !state.mobileNavOpen,
    })),
  createAppointment: async (appointment) => {
    const created = await createAppointmentRequest(appointment);
    set((state) => ({
      appointments: [created, ...state.appointments],
    }));
    return created.id;
  },
  updateAppointment: async (id, appointment) => {
    const updated = await updateAppointmentRequest(id, appointment);
    set((state) => ({
      appointments: state.appointments.map((item) => (item.id === id ? updated : item)),
    }));
  },
  deleteAppointment: async (id) => {
    await deleteAppointmentRequest(id);
    set((state) => ({
      appointments: state.appointments.filter((item) => item.id !== id),
    }));
  },
  updateAppointmentStatus: async (id, status) => {
    await updateAppointmentStatusRequest(id, status);
    const appointments = await listAppointmentsRequest();
    set({ appointments });
  },
  getAppointmentById: (id) => get().appointments.find((appointment) => appointment.id === id),
  getFilteredAppointments: (filters) => {
    const { appointments } = get();

    return appointments.filter((appointment) => {
      const matchesSearch = filters.search
        ? `${appointment.title} ${appointment.clientName ?? ''} ${appointment.description}`
            .toLowerCase()
            .includes(filters.search.toLowerCase())
        : true;

      const matchesStatus =
        !filters.status || filters.status === 'all' ? true : appointment.status === filters.status;

      const matchesType = !filters.type || filters.type === 'all' ? true : appointment.type === filters.type;
      const matchesDate = filters.date ? appointment.date === filters.date : true;

      return matchesSearch && matchesStatus && matchesType && matchesDate;
    });
  },
}));
