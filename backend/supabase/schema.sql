-- Agenda Facilitada - base schema (public)
-- Execute no SQL Editor do Supabase.

create extension if not exists "pgcrypto";

create table if not exists public.app_users (
  id text primary key,
  name text not null,
  email text not null unique,
  role text not null check (role in ('admin'))
);

create table if not exists public.app_settings (
  id text primary key default 'app_settings',
  business_name text not null,
  theme text not null check (theme in ('light', 'dark')),
  notifications_enabled boolean not null default true,
  default_reminder_minutes integer not null default 60 check (default_reminder_minutes >= 0),
  compact_mode boolean not null default false,
  birthdays_module_enabled boolean not null default true
);

create table if not exists public.registration_profiles (
  id text primary key,
  type text not null check (type in ('pf', 'pj')),
  display_name text,
  full_name text,
  company_name text,
  trade_name text,
  avatar_url text,
  cpf text,
  cnpj text,
  email text not null,
  phone text not null,
  whatsapp text,
  address jsonb not null,
  notes text,
  created_at timestamptz not null,
  updated_at timestamptz not null
);

create table if not exists public.clients (
  id text primary key,
  name text not null,
  phone text not null,
  notes text,
  created_at timestamptz not null,
  updated_at timestamptz not null
);

create table if not exists public.appointments (
  id text primary key,
  title text not null,
  description text not null,
  date date not null,
  time text not null,
  end_time text,
  scheduled_at timestamptz not null,
  type text not null check (type in ('appointment', 'follow-up', 'reminder', 'meeting', 'personal')),
  status text not null check (status in ('pending', 'confirmed', 'completed', 'cancelled', 'overdue')),
  client_name text,
  client_phone text,
  client_id text,
  observations text,
  reminder_enabled boolean not null default true,
  reminder_minutes_before integer not null default 0 check (reminder_minutes_before >= 0),
  reminder_mode text not null default 'visual' check (reminder_mode in ('visual', 'visual_sound')),
  created_at timestamptz not null,
  updated_at timestamptz not null
);

create table if not exists public.birthday_groups (
  id text primary key,
  name text not null,
  description text,
  active boolean not null default true,
  created_at timestamptz not null,
  updated_at timestamptz not null
);

create table if not exists public.birthdays (
  id text primary key,
  name text not null,
  nickname text,
  whatsapp text not null,
  birth_date date not null,
  group_id text,
  photo_url text,
  notes text,
  message_template text,
  source text not null default 'local' check (source in ('local', 'external')),
  external_ref text,
  active boolean not null default true,
  created_at timestamptz not null,
  updated_at timestamptz not null
);

create table if not exists public.birthday_backgrounds (
  id text primary key,
  name text not null,
  image_url text not null,
  scope text not null check (scope in ('global', 'group')),
  group_id text,
  photo_mask_shape text not null default 'circle' check (photo_mask_shape in ('circle', 'square')),
  name_font_key text not null default 'magic_wall',
  layout jsonb not null,
  active boolean not null default true,
  created_at timestamptz not null,
  updated_at timestamptz not null
);

create index if not exists idx_appointments_date on public.appointments (date);
create index if not exists idx_appointments_status on public.appointments (status);
create index if not exists idx_birthdays_birth_date on public.birthdays (birth_date);
create index if not exists idx_birthdays_group_id on public.birthdays (group_id);
create index if not exists idx_birthday_backgrounds_group_id on public.birthday_backgrounds (group_id);

-- Seed mínimo para manter login/admin e settings
insert into public.app_users (id, name, email, role)
values ('user_admin_1', 'Cristian Ferreira', 'admin@agendafacilitada.com', 'admin')
on conflict (id) do update set
  name = excluded.name,
  email = excluded.email,
  role = excluded.role;

insert into public.app_settings (
  id,
  business_name,
  theme,
  notifications_enabled,
  default_reminder_minutes,
  compact_mode,
  birthdays_module_enabled
)
values (
  'app_settings',
  'Agenda Facilitada',
  'light',
  true,
  60,
  false,
  true
)
on conflict (id) do update set
  business_name = excluded.business_name,
  theme = excluded.theme,
  notifications_enabled = excluded.notifications_enabled,
  default_reminder_minutes = excluded.default_reminder_minutes,
  compact_mode = excluded.compact_mode,
  birthdays_module_enabled = excluded.birthdays_module_enabled;
