import { createClient } from '@supabase/supabase-js';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import type { SeedData } from '../types/shared';

function loadEnvFromFile(filePath: string) {
  if (!existsSync(filePath)) {
    return;
  }

  const content = readFileSync(filePath, 'utf-8');
  const lines = content.split(/\r?\n/);

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) {
      continue;
    }

    const separatorIndex = line.indexOf('=');
    if (separatorIndex <= 0) {
      continue;
    }

    const key = line.slice(0, separatorIndex).trim();
    if (!key || process.env[key]) {
      continue;
    }

    const value = line.slice(separatorIndex + 1).trim();
    process.env[key] = value.replace(/^['"]|['"]$/g, '');
  }
}

function requiredEnv(name: string) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Variável obrigatória ausente: ${name}`);
  }
  return value;
}

function readLocalSnapshot(filePath: string) {
  if (!existsSync(filePath)) {
    throw new Error(`Arquivo local não encontrado: ${filePath}`);
  }

  const raw = readFileSync(filePath, 'utf-8');
  return JSON.parse(raw) as SeedData;
}

async function clearTable(client: any, table: string) {
  const { error } = await client.from(table).delete().neq('id', '__none__');
  if (error) {
    throw new Error(`Falha ao limpar ${table}: ${error.message}`);
  }
}

async function run() {
  const backendRoot = process.cwd();
  loadEnvFromFile(resolve(backendRoot, '.env'));

  const supabaseUrl = requiredEnv('SUPABASE_URL');
  const supabaseServiceRoleKey = requiredEnv('SUPABASE_SERVICE_ROLE_KEY');
  const localDbPath = resolve(backendRoot, process.env.LOCAL_DB_PATH || '.local-db/agenda-facilitada.json');

  const snapshot = readLocalSnapshot(localDbPath);
  const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  await clearTable(supabase, 'appointments');
  await clearTable(supabase, 'clients');
  await clearTable(supabase, 'birthdays');
  await clearTable(supabase, 'birthday_groups');
  await clearTable(supabase, 'birthday_backgrounds');
  await clearTable(supabase, 'registration_profiles');

  if (snapshot.clients.length) {
    const { error } = await supabase.from('clients').insert(
      snapshot.clients.map((item) => ({
        id: item.id,
        name: item.name,
        phone: item.phone,
        notes: item.notes ?? null,
        created_at: item.createdAt,
        updated_at: item.updatedAt,
      })),
    );
    if (error) {
      throw new Error(`Falha ao inserir clients: ${error.message}`);
    }
  }

  if (snapshot.appointments.length) {
    const { error } = await supabase.from('appointments').insert(
      snapshot.appointments.map((item) => ({
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
      })),
    );
    if (error) {
      throw new Error(`Falha ao inserir appointments: ${error.message}`);
    }
  }

  if (snapshot.birthdayGroups.length) {
    const { error } = await supabase.from('birthday_groups').insert(
      snapshot.birthdayGroups.map((item) => ({
        id: item.id,
        name: item.name,
        description: item.description ?? null,
        active: item.active,
        created_at: item.createdAt,
        updated_at: item.updatedAt,
      })),
    );
    if (error) {
      throw new Error(`Falha ao inserir birthday_groups: ${error.message}`);
    }
  }

  if (snapshot.birthdays.length) {
    const { error } = await supabase.from('birthdays').insert(
      snapshot.birthdays.map((item) => ({
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
      })),
    );
    if (error) {
      throw new Error(`Falha ao inserir birthdays: ${error.message}`);
    }
  }

  if (snapshot.birthdayBackgrounds.length) {
    const { error } = await supabase.from('birthday_backgrounds').insert(
      snapshot.birthdayBackgrounds.map((item) => ({
        id: item.id,
        name: item.name,
        image_url: item.imageUrl,
        scope: item.scope,
        group_id: item.groupId ?? null,
        photo_mask_shape: item.photoMaskShape ?? 'circle',
        name_font_key: item.nameFontKey ?? 'magic_wall',
        layout: item.layout ?? {},
        active: item.active,
        created_at: item.createdAt,
        updated_at: item.updatedAt,
      })),
    );
    if (error) {
      throw new Error(`Falha ao inserir birthday_backgrounds: ${error.message}`);
    }
  }

  {
    const { error } = await supabase.from('registration_profiles').upsert(
      {
        id: snapshot.registration.id,
        type: snapshot.registration.type,
        display_name: snapshot.registration.displayName ?? null,
        full_name: snapshot.registration.fullName ?? null,
        company_name: snapshot.registration.companyName ?? null,
        trade_name: snapshot.registration.tradeName ?? null,
        avatar_url: snapshot.registration.avatarUrl ?? null,
        cpf: snapshot.registration.cpf ?? null,
        cnpj: snapshot.registration.cnpj ?? null,
        email: snapshot.registration.email,
        phone: snapshot.registration.phone,
        whatsapp: snapshot.registration.whatsapp ?? null,
        address: snapshot.registration.address,
        notes: snapshot.registration.notes ?? null,
        created_at: snapshot.registration.createdAt,
        updated_at: snapshot.registration.updatedAt,
      },
      { onConflict: 'id' },
    );
    if (error) {
      throw new Error(`Falha ao inserir registration_profiles: ${error.message}`);
    }
  }

  {
    const { error } = await supabase.from('app_users').upsert(
      {
        id: snapshot.user.id,
        name: snapshot.user.name,
        email: snapshot.user.email,
        role: snapshot.user.role,
      },
      { onConflict: 'id' },
    );
    if (error) {
      throw new Error(`Falha ao inserir app_users: ${error.message}`);
    }
  }

  {
    const { error } = await supabase.from('app_settings').upsert(
      {
        id: 'app_settings',
        business_name: snapshot.settings.businessName,
        theme: snapshot.settings.theme,
        notifications_enabled: snapshot.settings.notificationsEnabled,
        default_reminder_minutes: snapshot.settings.defaultReminderMinutes,
        compact_mode: snapshot.settings.compactMode,
        birthdays_module_enabled: snapshot.settings.birthdaysModuleEnabled,
      },
      { onConflict: 'id' },
    );
    if (error) {
      throw new Error(`Falha ao inserir app_settings: ${error.message}`);
    }
  }

  console.log('Importação concluída com sucesso.');
  console.log(`Arquivo local: ${localDbPath}`);
  console.log(`Clientes: ${snapshot.clients.length}`);
  console.log(`Agendamentos: ${snapshot.appointments.length}`);
  console.log(`Aniversariantes: ${snapshot.birthdays.length}`);
  console.log(`Grupos: ${snapshot.birthdayGroups.length}`);
  console.log(`Fundos: ${snapshot.birthdayBackgrounds.length}`);
}

run().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : 'Erro desconhecido';
  console.error(`Falha na importação: ${message}`);
  process.exit(1);
});
