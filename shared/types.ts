export type ThemeMode = 'light' | 'dark'

export type AppointmentStatus =
  | 'pending'
  | 'confirmed'
  | 'completed'
  | 'cancelled'
  | 'overdue'

export type AppointmentType =
  | 'appointment'
  | 'follow-up'
  | 'reminder'
  | 'meeting'
  | 'personal'

export type ReminderMode = 'visual' | 'visual_sound'

export interface User {
  id: string
  name: string
  email: string
  role: 'admin'
}

export interface Client {
  id: string
  name: string
  phone: string
  notes?: string
  createdAt: string
  updatedAt: string
}

export interface Appointment {
  id: string
  title: string
  description: string
  date: string
  time: string
  endTime?: string
  scheduledAt: string
  type: AppointmentType
  status: AppointmentStatus
  clientName?: string
  clientPhone?: string
  clientId?: string
  observations?: string
  reminderEnabled: boolean
  reminderMinutesBefore: number
  reminderMode?: ReminderMode
  createdAt: string
  updatedAt: string
}

export interface BirthdayContact {
  id: string
  name: string
  nickname?: string
  whatsapp: string
  birthDate: string
  groupId?: string
  photoUrl?: string
  notes?: string
  messageTemplate?: string
  source: 'local' | 'external'
  externalRef?: string
  active: boolean
  createdAt: string
  updatedAt: string
}

export interface BirthdayGroup {
  id: string
  name: string
  description?: string
  active: boolean
  createdAt: string
  updatedAt: string
}

export type PhotoMaskShape = 'circle' | 'square'

export interface BirthdayBackgroundLayout {
  photoXPercent: number
  photoYPercent: number
  photoSizePercent: number
  showPhoto: boolean
  nameXPercent: number
  nameYPercent: number
  nameSizePercent: number
  showName: boolean
}

export interface BirthdayBackground {
  id: string
  name: string
  imageUrl: string
  scope: 'global' | 'group'
  groupId?: string
  photoMaskShape?: PhotoMaskShape
  nameFontKey?: string
  layout?: BirthdayBackgroundLayout
  active: boolean
  createdAt: string
  updatedAt: string
}

export interface Settings {
  businessName: string
  theme: ThemeMode
  notificationsEnabled: boolean
  defaultReminderMinutes: number
  compactMode: boolean
  birthdaysModuleEnabled: boolean
}

export type RegistrationType = 'pf' | 'pj'

export interface RegistrationAddress {
  zipCode: string
  street: string
  number: string
  complement?: string
  district: string
  city: string
  state: string
}

export interface RegistrationProfile {
  id: string
  type: RegistrationType
  displayName?: string
  fullName?: string
  companyName?: string
  tradeName?: string
  avatarUrl?: string
  cpf?: string
  cnpj?: string
  email: string
  phone: string
  whatsapp?: string
  address: RegistrationAddress
  notes?: string
  createdAt: string
  updatedAt: string
}

export interface RegistrationAvatarUploadPayload {
  fileName: string
  mimeType: string
  base64Data: string
}

export interface RegistrationAvatarUploadResponse {
  avatarUrl: string
}

export interface DashboardSummary {
  today: number
  tomorrow: number
  overdue: number
  next7Days: number
  completed: number
  cancelled: number
  pending: number
}

export interface LoginPayload {
  email: string
  password: string
}

export interface LoginResponse {
  token: string
  user: User
}

export interface AppointmentFilters {
  search?: string
  status?: AppointmentStatus | 'all'
  type?: AppointmentType | 'all'
  date?: string
}

export interface UpdateAppointmentStatusPayload {
  status: AppointmentStatus
}

export interface SeedData {
  user: User
  settings: Settings
  appointments: Appointment[]
  clients: Client[]
  birthdays: BirthdayContact[]
  birthdayGroups: BirthdayGroup[]
  birthdayBackgrounds: BirthdayBackground[]
  registration: RegistrationProfile
}

export interface PrismaPlannedModels {
  User: 'id, name, email, passwordHash, role, createdAt, updatedAt'
  Appointment:
    'id, title, description, date, time, endTime, scheduledAt, type, status, clientName, clientPhone, clientId, observations, reminderEnabled, reminderMinutesBefore, createdAt, updatedAt'
  Client: 'id, name, phone, notes, createdAt, updatedAt'
}
