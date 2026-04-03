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
  name: 'Usuario Demo',
  email: 'demo@example.com',
  role: 'admin',
};

export const mockSettings: Settings = {
  businessName: 'Agenda Facilitada',
  theme: 'light',
  notificationsEnabled: true,
  defaultReminderMinutes: 30,
  compactMode: false,
  birthdaysModuleEnabled: true,
  notificationEmail: 'demo@example.com',
  notificationWhatsapp: '+55 11 90000-0000',
  birthdayNotifyInApp: true,
  birthdayNotifyEmail: false,
  birthdayNotifyWhatsapp: false,
};

export const mockClients: Client[] = [
  {
    id: 'client-1',
    name: 'Cliente Exemplo A',
    phone: '(11) 90000-0005',
    notes: 'Prefere confirmação por WhatsApp.',
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 'client-2',
    name: 'Cliente Exemplo B',
    phone: '(11) 90000-0006',
    notes: 'Atendimento recorrente às quartas.',
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 'client-3',
    name: 'Cliente Exemplo C',
    phone: '(11) 90000-0004',
    createdAt: now,
    updatedAt: now,
  },
];

export const mockBirthdays: BirthdayContact[] = [
  {
    id: 'birthday-1',
    name: 'Cliente Exemplo A',
    nickname: 'Cliente A',
    whatsapp: '(11) 90000-0005',
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
    clientName: 'Cliente Exemplo A',
    clientPhone: '(11) 90000-0005',
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
    clientName: 'Cliente Exemplo B',
    clientPhone: '(11) 90000-0006',
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
    clientName: 'Equipe Demo',
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
    clientName: 'Cliente Exemplo C',
    clientPhone: '(11) 90000-0004',
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
    clientName: 'Cliente Exemplo D',
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
    displayName: 'Usuario Demo',
    fullName: 'Usuario Demo',
    avatarUrl: '',
    cpf: '000.000.000-00',
    email: 'demo@example.com',
    phone: '(11) 98888-0000',
    whatsapp: '(11) 98888-0000',
    address: {
      zipCode: '00000-000',
      street: 'Rua Exemplo',
      number: '1000',
      complement: 'Sala 21',
      district: 'Centro',
      city: 'Cidade Demo',
      state: 'SP',
    },
    notes: 'Cadastro padrão local.',
    createdAt: now,
    updatedAt: now,
  },
};


