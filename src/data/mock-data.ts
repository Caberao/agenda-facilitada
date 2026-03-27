import type {
  Appointment,
  BirthdayBackground,
  BirthdayContact,
  BirthdayGroup,
  Client,
  DashboardSummary,
  SeedData,
  Settings,
  User,
} from '../types/shared';

const now = new Date().toISOString();

export const mockUser: User = {
  id: 'user-admin-1',
  name: 'Cristian Altnix',
  email: 'admin@agendafacilitada.com',
  role: 'admin',
};

export const mockSettings: Settings = {
  businessName: 'Agenda Facilitada',
  theme: 'light',
  notificationsEnabled: true,
  defaultReminderMinutes: 30,
  compactMode: false,
  birthdaysModuleEnabled: true,
};

export const mockClients: Client[] = [
  {
    id: 'client-1',
    name: 'Marina Souza',
    phone: '(11) 99876-1201',
    notes: 'Prefere confirmação por WhatsApp.',
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 'client-2',
    name: 'Rafael Costa',
    phone: '(11) 98765-4402',
    notes: 'Atendimento recorrente às quartas.',
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 'client-3',
    name: 'Beatriz Lima',
    phone: '(21) 99231-8890',
    createdAt: now,
    updatedAt: now,
  },
];

export const mockBirthdays: BirthdayContact[] = [
  {
    id: 'birthday-1',
    name: 'Marina Souza',
    nickname: 'Mari',
    whatsapp: '(11) 99876-1201',
    birthDate: '2026-03-30',
    groupId: 'bgroup-1',
    photoUrl: '',
    messageTemplate: 'Feliz aniversário, {{nome}}! Que seu dia seja incrível.',
    source: 'local',
    active: true,
    createdAt: now,
    updatedAt: now,
  },
];

export const mockBirthdayGroups: BirthdayGroup[] = [
  {
    id: 'bgroup-1',
    name: 'Clientes',
    active: true,
    createdAt: now,
    updatedAt: now,
  },
];

export const mockBirthdayBackgrounds: BirthdayBackground[] = [
  {
    id: 'bgbg-1',
    name: 'Padrão',
    imageUrl: '',
    scope: 'global',
    photoMaskShape: 'circle',
    nameFontKey: 'magic_wall',
    active: true,
    createdAt: now,
    updatedAt: now,
  },
];

export const mockAppointments: Appointment[] = [
  {
    id: 'appointment-1',
    title: 'Consulta inicial',
    description: 'Primeiro atendimento com alinhamento de objetivos.',
    date: '2026-03-24',
    time: '09:00',
    scheduledAt: '2026-03-24T09:00:00.000Z',
    type: 'appointment',
    status: 'confirmed',
    clientId: 'client-1',
    clientName: 'Marina Souza',
    clientPhone: '(11) 99876-1201',
    observations: 'Enviar materiais após a reunião.',
    reminderEnabled: true,
    reminderMinutesBefore: 60,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 'appointment-2',
    title: 'Retorno mensal',
    description: 'Acompanhamento do plano e próximos passos.',
    date: '2026-03-24',
    time: '14:30',
    scheduledAt: '2026-03-24T14:30:00.000Z',
    type: 'follow-up',
    status: 'pending',
    clientId: 'client-2',
    clientName: 'Rafael Costa',
    clientPhone: '(11) 98765-4402',
    reminderEnabled: true,
    reminderMinutesBefore: 30,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 'appointment-3',
    title: 'Reunião de alinhamento',
    description: 'Definir prioridades da próxima semana.',
    date: '2026-03-25',
    time: '11:00',
    scheduledAt: '2026-03-25T11:00:00.000Z',
    type: 'meeting',
    status: 'confirmed',
    clientName: 'Equipe Interna',
    reminderEnabled: false,
    reminderMinutesBefore: 15,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 'appointment-4',
    title: 'Lembrete de documentação',
    description: 'Validar envio de documentos pendentes.',
    date: '2026-03-22',
    time: '16:00',
    scheduledAt: '2026-03-22T16:00:00.000Z',
    type: 'reminder',
    status: 'overdue',
    clientId: 'client-3',
    clientName: 'Beatriz Lima',
    clientPhone: '(21) 99231-8890',
    reminderEnabled: true,
    reminderMinutesBefore: 120,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 'appointment-5',
    title: 'Sessão concluída',
    description: 'Atendimento finalizado com sucesso.',
    date: '2026-03-21',
    time: '10:00',
    scheduledAt: '2026-03-21T10:00:00.000Z',
    type: 'appointment',
    status: 'completed',
    clientName: 'Fernando Alves',
    reminderEnabled: true,
    reminderMinutesBefore: 45,
    createdAt: now,
    updatedAt: now,
  },
];

export const mockDashboardSummary: DashboardSummary = {
  today: 2,
  tomorrow: 1,
  overdue: 1,
  next7Days: 4,
  completed: 1,
  cancelled: 0,
  pending: 1,
};

export const mockSeedData: SeedData = {
  user: mockUser,
  settings: mockSettings,
  appointments: mockAppointments,
  clients: mockClients,
  birthdays: mockBirthdays,
  birthdayGroups: mockBirthdayGroups,
  birthdayBackgrounds: mockBirthdayBackgrounds,
  registration: {
    id: 'registration_admin_1',
    type: 'pf',
    displayName: 'Cristian Altnix',
    fullName: 'Cristian Altnix',
    avatarUrl: '',
    cpf: '123.456.789-00',
    email: 'admin@agendafacilitada.com',
    phone: '(11) 98888-0000',
    whatsapp: '(11) 98888-0000',
    address: {
      zipCode: '01310-100',
      street: 'Avenida Paulista',
      number: '1000',
      complement: 'Sala 21',
      district: 'Bela Vista',
      city: 'São Paulo',
      state: 'SP',
    },
    notes: 'Cadastro padrão local.',
    createdAt: now,
    updatedAt: now,
  },
};
