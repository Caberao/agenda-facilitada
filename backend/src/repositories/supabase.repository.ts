import { createClient } from '@supabase/supabase-js';
import { seedData } from '../data/seed';
import type {
  Appointment,
  BirthdayBackground,
  BirthdayBackgroundLayout,
  BirthdayContact,
  BirthdayGroup,
  Client,
  RegistrationProfile,
  Settings,
  User,
} from '../types/shared';
import type { DataRepository } from './repository.types';

type Json = string | number | boolean | null | { [key: string]: Json } | Json[];

interface SupabaseRepositoryOptions {
  url: string;
  serviceRoleKey: string;
  schema: string;
}

type DbAppointment = {
  id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  end_time: string | null;
  scheduled_at: string;
  type: Appointment['type'];
  status: Appointment['status'];
  client_name: string | null;
  client_phone: string | null;
  client_id: string | null;
  observations: string | null;
  reminder_enabled: boolean;
  reminder_minutes_before: number;
  reminder_mode: 'visual' | 'visual_sound';
  created_at: string;
  updated_at: string;
};

type DbClient = {
  id: string;
  name: string;
  phone: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

type DbBirthday = {
  id: string;
  name: string;
  nickname: string | null;
  whatsapp: string;
  birth_date: string;
  group_id: string | null;
  photo_url: string | null;
  notes: string | null;
  message_template: string | null;
  source: 'local' | 'external';
  external_ref: string | null;
  active: boolean;
  created_at: string;
  updated_at: string;
};

type DbBirthdayGroup = {
  id: string;
  name: string;
  description: string | null;
  active: boolean;
  created_at: string;
  updated_at: string;
};

type DbBirthdayBackground = {
  id: string;
  name: string;
  image_url: string;
  scope: 'global' | 'group';
  group_id: string | null;
  photo_mask_shape: 'circle' | 'square';
  name_font_key: string;
  layout: Json;
  active: boolean;
  created_at: string;
  updated_at: string;
};

type DbRegistration = {
  id: string;
  type: 'pf' | 'pj';
  display_name: string | null;
  full_name: string | null;
  company_name: string | null;
  trade_name: string | null;
  avatar_url: string | null;
  cpf: string | null;
  cnpj: string | null;
  email: string;
  phone: string;
  whatsapp: string | null;
  address: Json;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

type DbSettings = {
  id: string;
  business_name: string;
  theme: 'light' | 'dark';
  notifications_enabled: boolean;
  default_reminder_minutes: number;
  compact_mode: boolean;
  birthdays_module_enabled: boolean;
  notification_email: string;
  notification_whatsapp: string;
  birthday_notify_in_app: boolean;
  birthday_notify_email: boolean;
  birthday_notify_whatsapp: boolean;
};

type DbUser = {
  id: string;
  name: string;
  email: string;
  role: 'admin';
};

function appointmentToDb(item: Appointment): DbAppointment {
  return {
    id: item.id,
    title: item.title,
    description: item.description,
    date: item.date,
    time: item.time,
    end_time: item.endTime ?? null,
    scheduled_at: item.scheduledAt,
    type: item.type,
    status: item.status,
    client_name: item.clientName ?? null,
    client_phone: item.clientPhone ?? null,
    client_id: item.clientId ?? null,
    observations: item.observations ?? null,
    reminder_enabled: item.reminderEnabled,
    reminder_minutes_before: item.reminderMinutesBefore,
    reminder_mode: item.reminderMode ?? 'visual',
    created_at: item.createdAt,
    updated_at: item.updatedAt,
  };
}

function appointmentFromDb(item: DbAppointment): Appointment {
  return {
    id: item.id,
    title: item.title,
    description: item.description,
    date: item.date,
    time: item.time,
    ...(item.end_time ? { endTime: item.end_time } : {}),
    scheduledAt: item.scheduled_at,
    type: item.type,
    status: item.status,
    ...(item.client_name ? { clientName: item.client_name } : {}),
    ...(item.client_phone ? { clientPhone: item.client_phone } : {}),
    ...(item.client_id ? { clientId: item.client_id } : {}),
    ...(item.observations ? { observations: item.observations } : {}),
    reminderEnabled: item.reminder_enabled,
    reminderMinutesBefore: item.reminder_minutes_before,
    reminderMode: item.reminder_mode,
    createdAt: item.created_at,
    updatedAt: item.updated_at,
  };
}

function clientToDb(item: Client): DbClient {
  return {
    id: item.id,
    name: item.name,
    phone: item.phone,
    notes: item.notes ?? null,
    created_at: item.createdAt,
    updated_at: item.updatedAt,
  };
}

function clientFromDb(item: DbClient): Client {
  return {
    id: item.id,
    name: item.name,
    phone: item.phone,
    ...(item.notes ? { notes: item.notes } : {}),
    createdAt: item.created_at,
    updatedAt: item.updated_at,
  };
}

function birthdayToDb(item: BirthdayContact): DbBirthday {
  return {
    id: item.id,
    name: item.name,
    nickname: item.nickname ?? null,
    whatsapp: item.whatsapp,
    birth_date: item.birthDate,
    group_id: item.groupId ?? null,
    photo_url: item.photoUrl ?? null,
    notes: item.notes ?? null,
    message_template: item.messageTemplate ?? null,
    source: item.source,
    external_ref: item.externalRef ?? null,
    active: item.active,
    created_at: item.createdAt,
    updated_at: item.updatedAt,
  };
}

function birthdayFromDb(item: DbBirthday): BirthdayContact {
  return {
    id: item.id,
    name: item.name,
    ...(item.nickname ? { nickname: item.nickname } : {}),
    whatsapp: item.whatsapp,
    birthDate: item.birth_date,
    ...(item.group_id ? { groupId: item.group_id } : {}),
    ...(item.photo_url ? { photoUrl: item.photo_url } : {}),
    ...(item.notes ? { notes: item.notes } : {}),
    ...(item.message_template ? { messageTemplate: item.message_template } : {}),
    source: item.source,
    ...(item.external_ref ? { externalRef: item.external_ref } : {}),
    active: item.active,
    createdAt: item.created_at,
    updatedAt: item.updated_at,
  };
}

function birthdayGroupToDb(item: BirthdayGroup): DbBirthdayGroup {
  return {
    id: item.id,
    name: item.name,
    description: item.description ?? null,
    active: item.active,
    created_at: item.createdAt,
    updated_at: item.updatedAt,
  };
}

function birthdayGroupFromDb(item: DbBirthdayGroup): BirthdayGroup {
  return {
    id: item.id,
    name: item.name,
    ...(item.description ? { description: item.description } : {}),
    active: item.active,
    createdAt: item.created_at,
    updatedAt: item.updated_at,
  };
}

function birthdayBackgroundToDb(item: BirthdayBackground): DbBirthdayBackground {
  return {
    id: item.id,
    name: item.name,
    image_url: item.imageUrl,
    scope: item.scope,
    group_id: item.groupId ?? null,
    photo_mask_shape: item.photoMaskShape ?? 'circle',
    name_font_key: item.nameFontKey ?? 'magic_wall',
    layout: (item.layout ?? {}) as Json,
    active: item.active,
    created_at: item.createdAt,
    updated_at: item.updatedAt,
  };
}

function birthdayBackgroundFromDb(item: DbBirthdayBackground): BirthdayBackground {
  const parsedLayout = (item.layout && typeof item.layout === 'object'
    ? (item.layout as unknown)
    : {
        photoXPercent: 50,
        photoYPercent: 29.2,
        photoSizePercent: 42.6,
        showPhoto: true,
        nameXPercent: 51.7,
        nameYPercent: 68.7,
        nameSizePercent: 24,
        showName: true,
      }) as BirthdayBackgroundLayout;

  return {
    id: item.id,
    name: item.name,
    imageUrl: item.image_url,
    scope: item.scope,
    ...(item.group_id ? { groupId: item.group_id } : {}),
    photoMaskShape: item.photo_mask_shape,
    nameFontKey: item.name_font_key,
    layout: parsedLayout,
    active: item.active,
    createdAt: item.created_at,
    updatedAt: item.updated_at,
  };
}

function registrationToDb(item: RegistrationProfile): DbRegistration {
  return {
    id: item.id,
    type: item.type,
    display_name: item.displayName ?? null,
    full_name: item.fullName ?? null,
    company_name: item.companyName ?? null,
    trade_name: item.tradeName ?? null,
    avatar_url: item.avatarUrl ?? null,
    cpf: item.cpf ?? null,
    cnpj: item.cnpj ?? null,
    email: item.email,
    phone: item.phone,
    whatsapp: item.whatsapp ?? null,
    address: item.address as unknown as Json,
    notes: item.notes ?? null,
    created_at: item.createdAt,
    updated_at: item.updatedAt,
  };
}

function registrationFromDb(item: DbRegistration): RegistrationProfile {
  return {
    id: item.id,
    type: item.type,
    ...(item.display_name ? { displayName: item.display_name } : {}),
    ...(item.full_name ? { fullName: item.full_name } : {}),
    ...(item.company_name ? { companyName: item.company_name } : {}),
    ...(item.trade_name ? { tradeName: item.trade_name } : {}),
    ...(item.avatar_url ? { avatarUrl: item.avatar_url } : {}),
    ...(item.cpf ? { cpf: item.cpf } : {}),
    ...(item.cnpj ? { cnpj: item.cnpj } : {}),
    email: item.email,
    phone: item.phone,
    ...(item.whatsapp ? { whatsapp: item.whatsapp } : {}),
    address: item.address as unknown as RegistrationProfile['address'],
    ...(item.notes ? { notes: item.notes } : {}),
    createdAt: item.created_at,
    updatedAt: item.updated_at,
  };
}

function settingsToDb(item: Settings): DbSettings {
  return {
    id: 'app_settings',
    business_name: item.businessName,
    theme: item.theme,
    notifications_enabled: item.notificationsEnabled,
    default_reminder_minutes: item.defaultReminderMinutes,
    compact_mode: item.compactMode,
    birthdays_module_enabled: item.birthdaysModuleEnabled,
    notification_email: item.notificationEmail,
    notification_whatsapp: item.notificationWhatsapp,
    birthday_notify_in_app: item.birthdayNotifyInApp,
    birthday_notify_email: item.birthdayNotifyEmail,
    birthday_notify_whatsapp: item.birthdayNotifyWhatsapp,
  };
}

function settingsFromDb(item: DbSettings): Settings {
  return {
    businessName: item.business_name,
    theme: item.theme,
    notificationsEnabled: item.notifications_enabled,
    defaultReminderMinutes: item.default_reminder_minutes,
    compactMode: item.compact_mode,
    birthdaysModuleEnabled: item.birthdays_module_enabled,
    notificationEmail: item.notification_email,
    notificationWhatsapp: item.notification_whatsapp,
    birthdayNotifyInApp: item.birthday_notify_in_app,
    birthdayNotifyEmail: item.birthday_notify_email,
    birthdayNotifyWhatsapp: item.birthday_notify_whatsapp,
  };
}

function userFromDb(item: DbUser): User {
  return {
    id: item.id,
    name: item.name,
    email: item.email,
    role: item.role,
  };
}

export class SupabaseRepository implements DataRepository {
  private readonly client: any;

  constructor(options: SupabaseRepositoryOptions) {
    this.client = createClient(options.url, options.serviceRoleKey, {
      db: { schema: options.schema || 'public' },
      auth: { persistSession: false, autoRefreshToken: false },
    } as any);
  }

  async getUser() {
    const { data, error } = await this.client.from('app_users').select('*').limit(1).single();
    if (error || !data) {
      return seedData.user;
    }

    return userFromDb(data as DbUser);
  }

  async getSettings() {
    const { data, error } = await this.client.from('app_settings').select('*').eq('id', 'app_settings').single();
    if (error || !data) {
      return seedData.settings;
    }

    return settingsFromDb(data as DbSettings);
  }

  async setSettings(settings: Settings) {
    const payload = settingsToDb(settings);
    const { error } = await this.client.from('app_settings').upsert(payload, { onConflict: 'id' });
    if (error) {
      throw new Error(`Falha ao salvar settings no Supabase: ${error.message}`);
    }
  }

  async getRegistration() {
    const { data, error } = await this.client
      .from('registration_profiles')
      .select('*')
      .limit(1)
      .maybeSingle();

    if (error || !data) {
      return seedData.registration;
    }

    return registrationFromDb(data as DbRegistration);
  }

  async setRegistration(registration: RegistrationProfile) {
    const payload = registrationToDb(registration);
    const { error } = await this.client.from('registration_profiles').upsert(payload, { onConflict: 'id' });
    if (error) {
      throw new Error(`Falha ao salvar cadastro no Supabase: ${error.message}`);
    }
  }

  async getAppointments() {
    const { data, error } = await this.client.from('appointments').select('*');
    if (error) {
      throw new Error(`Falha ao buscar agendamentos no Supabase: ${error.message}`);
    }

    return (data as DbAppointment[]).map(appointmentFromDb);
  }

  async setAppointments(appointments: Appointment[]) {
    const { error: deleteError } = await this.client.from('appointments').delete().neq('id', '__none__');
    if (deleteError) {
      throw new Error(`Falha ao limpar agendamentos no Supabase: ${deleteError.message}`);
    }

    if (!appointments.length) {
      return;
    }

    const payload = appointments.map(appointmentToDb);
    const { error } = await this.client.from('appointments').insert(payload);
    if (error) {
      throw new Error(`Falha ao salvar agendamentos no Supabase: ${error.message}`);
    }
  }

  async getClients() {
    const { data, error } = await this.client.from('clients').select('*');
    if (error) {
      throw new Error(`Falha ao buscar clientes no Supabase: ${error.message}`);
    }

    return (data as DbClient[]).map(clientFromDb);
  }

  async setClients(clients: Client[]) {
    const { error: deleteError } = await this.client.from('clients').delete().neq('id', '__none__');
    if (deleteError) {
      throw new Error(`Falha ao limpar clientes no Supabase: ${deleteError.message}`);
    }

    if (!clients.length) {
      return;
    }

    const payload = clients.map(clientToDb);
    const { error } = await this.client.from('clients').insert(payload);
    if (error) {
      throw new Error(`Falha ao salvar clientes no Supabase: ${error.message}`);
    }
  }

  async getBirthdays() {
    const { data, error } = await this.client.from('birthdays').select('*');
    if (error) {
      throw new Error(`Falha ao buscar aniversariantes no Supabase: ${error.message}`);
    }

    return (data as DbBirthday[]).map(birthdayFromDb);
  }

  async setBirthdays(birthdays: BirthdayContact[]) {
    const { error: deleteError } = await this.client.from('birthdays').delete().neq('id', '__none__');
    if (deleteError) {
      throw new Error(`Falha ao limpar aniversariantes no Supabase: ${deleteError.message}`);
    }

    if (!birthdays.length) {
      return;
    }

    const payload = birthdays.map(birthdayToDb);
    const { error } = await this.client.from('birthdays').insert(payload);
    if (error) {
      throw new Error(`Falha ao salvar aniversariantes no Supabase: ${error.message}`);
    }
  }

  async getBirthdayGroups() {
    const { data, error } = await this.client.from('birthday_groups').select('*');
    if (error) {
      throw new Error(`Falha ao buscar grupos no Supabase: ${error.message}`);
    }

    return (data as DbBirthdayGroup[]).map(birthdayGroupFromDb);
  }

  async setBirthdayGroups(groups: BirthdayGroup[]) {
    const { error: deleteError } = await this.client.from('birthday_groups').delete().neq('id', '__none__');
    if (deleteError) {
      throw new Error(`Falha ao limpar grupos no Supabase: ${deleteError.message}`);
    }

    if (!groups.length) {
      return;
    }

    const payload = groups.map(birthdayGroupToDb);
    const { error } = await this.client.from('birthday_groups').insert(payload);
    if (error) {
      throw new Error(`Falha ao salvar grupos no Supabase: ${error.message}`);
    }
  }

  async getBirthdayBackgrounds() {
    const { data, error } = await this.client.from('birthday_backgrounds').select('*');
    if (error) {
      throw new Error(`Falha ao buscar fundos no Supabase: ${error.message}`);
    }

    return (data as DbBirthdayBackground[]).map(birthdayBackgroundFromDb);
  }

  async setBirthdayBackgrounds(backgrounds: BirthdayBackground[]) {
    const { error: deleteError } = await this.client.from('birthday_backgrounds').delete().neq('id', '__none__');
    if (deleteError) {
      throw new Error(`Falha ao limpar fundos no Supabase: ${deleteError.message}`);
    }

    if (!backgrounds.length) {
      return;
    }

    const payload = backgrounds.map(birthdayBackgroundToDb);
    const { error } = await this.client.from('birthday_backgrounds').insert(payload);
    if (error) {
      throw new Error(`Falha ao salvar fundos no Supabase: ${error.message}`);
    }
  }
}

export function createSupabaseRepository(options: SupabaseRepositoryOptions) {
  return new SupabaseRepository(options);
}
