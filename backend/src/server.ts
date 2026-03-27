import cors from 'cors';
import express from 'express';
import type { Request } from 'express';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, extname, join } from 'node:path';
import { repositoryMeta } from './repositories';
import { authService } from './services/auth.service';
import { birthdayBackgroundsService } from './services/birthday-backgrounds.service';
import { birthdayGroupsService } from './services/birthday-groups.service';
import { appointmentsService } from './services/appointments.service';
import { birthdaysService } from './services/birthdays.service';
import { clientsService } from './services/clients.service';
import { registrationService } from './services/registration.service';
import { settingsService } from './services/settings.service';
import { sendError } from './utils/http';
import type {
  Appointment,
  AppointmentFilters,
  AppointmentStatus,
  AppointmentType,
  BirthdayBackground,
  BirthdayBackgroundLayout,
  BirthdayContact,
  BirthdayGroup,
  LoginPayload,
  RegistrationAvatarUploadPayload,
  RegistrationAvatarUploadResponse,
  RegistrationProfile,
  RegistrationType,
  PhotoMaskShape,
  ReminderMode,
  Settings,
  UpdateAppointmentStatusPayload,
} from './types/shared';

const app = express();
const port = Number(process.env.PORT || 3333);

type AppointmentInput = Omit<Appointment, 'id' | 'createdAt' | 'updatedAt' | 'scheduledAt'>;
type ParseResult<T> = { value: T } | { error: string };

const appointmentStatuses: AppointmentStatus[] = ['pending', 'confirmed', 'completed', 'cancelled', 'overdue'];
const appointmentTypes: AppointmentType[] = ['appointment', 'follow-up', 'reminder', 'meeting', 'personal'];
const reminderModes: ReminderMode[] = ['visual', 'visual_sound'];
const registrationTypes: RegistrationType[] = ['pf', 'pj'];
const photoMaskShapes: PhotoMaskShape[] = ['circle', 'square'];
const avatarMaxBytes = 3 * 1024 * 1024;

const localDbPath = repositoryMeta.localDbPath || join(process.cwd(), '.local-db', 'agenda-facilitada.json');
const uploadDirectory = join(dirname(localDbPath), 'uploads');

mkdirSync(uploadDirectory, { recursive: true });

app.use(cors());
app.use(express.json({ limit: '6mb' }));
app.use('/uploads', express.static(uploadDirectory));

function isAppointmentStatus(value: unknown): value is AppointmentStatus {
  return typeof value === 'string' && appointmentStatuses.includes(value as AppointmentStatus);
}

function isAppointmentType(value: unknown): value is AppointmentType {
  return typeof value === 'string' && appointmentTypes.includes(value as AppointmentType);
}

function isRegistrationType(value: unknown): value is RegistrationType {
  return typeof value === 'string' && registrationTypes.includes(value as RegistrationType);
}

function isReminderMode(value: unknown): value is ReminderMode {
  return typeof value === 'string' && reminderModes.includes(value as ReminderMode);
}

function isPhotoMaskShape(value: unknown): value is PhotoMaskShape {
  return typeof value === 'string' && photoMaskShapes.includes(value as PhotoMaskShape);
}

function onlyDigits(value: string) {
  return value.replace(/\D/g, '');
}

function isValidCpf(value: string) {
  const digits = onlyDigits(value);

  if (digits.length !== 11) {
    return false;
  }

  if (/^(\d)\1{10}$/.test(digits)) {
    return false;
  }

  const numbers = digits.split('').map(Number);

  let sum = 0;
  for (let index = 0; index < 9; index += 1) {
    sum += (numbers[index] ?? 0) * (10 - index);
  }

  let check = 11 - (sum % 11);
  if (check >= 10) {
    check = 0;
  }

  if (check !== numbers[9]) {
    return false;
  }

  sum = 0;
  for (let index = 0; index < 10; index += 1) {
    sum += (numbers[index] ?? 0) * (11 - index);
  }

  check = 11 - (sum % 11);
  if (check >= 10) {
    check = 0;
  }

  return check === numbers[10];
}

function isValidCnpj(value: string) {
  const digits = onlyDigits(value);

  if (digits.length !== 14) {
    return false;
  }

  if (/^(\d)\1{13}$/.test(digits)) {
    return false;
  }

  const numbers = digits.split('').map(Number);
  const weights1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  const weights2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];

  let sum = 0;
  for (let index = 0; index < 12; index += 1) {
    sum += (numbers[index] ?? 0) * (weights1[index] ?? 0);
  }

  let check = sum % 11;
  check = check < 2 ? 0 : 11 - check;

  if (check !== numbers[12]) {
    return false;
  }

  sum = 0;
  for (let index = 0; index < 13; index += 1) {
    sum += (numbers[index] ?? 0) * (weights2[index] ?? 0);
  }

  check = sum % 11;
  check = check < 2 ? 0 : 11 - check;

  return check === numbers[13];
}

function parseAppointmentFilters(request: Request): AppointmentFilters {
  const search = typeof request.query.search === 'string' ? request.query.search : undefined;
  const status = isAppointmentStatus(request.query.status) ? request.query.status : 'all';
  const type = isAppointmentType(request.query.type) ? request.query.type : 'all';
  const date = typeof request.query.date === 'string' ? request.query.date : undefined;

  const filters: AppointmentFilters = {
    status,
    type,
  };

  if (search) {
    filters.search = search;
  }

  if (date) {
    filters.date = date;
  }

  return filters;
}

function isValidTimeValue(value: string) {
  return /^([01]\d|2[0-3]):([0-5]\d)$/.test(value);
}

function toMinutes(time: string) {
  const [hours, minutes] = time.split(':').map(Number);
  return (hours ?? 0) * 60 + (minutes ?? 0);
}

function parseAppointmentInput(body: Partial<Appointment>) {
  if (typeof body.title !== 'string' || !body.title.trim()) {
    return { error: 'Campo "title" é obrigatório.' };
  }

  if (typeof body.description !== 'string' || !body.description.trim()) {
    return { error: 'Campo "description" é obrigatório.' };
  }

  if (typeof body.date !== 'string' || !body.date) {
    return { error: 'Campo "date" é obrigatório.' };
  }

  if (typeof body.time !== 'string' || !body.time) {
    return { error: 'Campo "time" é obrigatório.' };
  }

  if (!isValidTimeValue(body.time)) {
    return { error: 'Campo "time" deve estar no formato HH:mm.' };
  }

  if (typeof body.endTime === 'string' && body.endTime.trim()) {
    if (!isValidTimeValue(body.endTime)) {
      return { error: 'Campo "endTime" deve estar no formato HH:mm.' };
    }

    if (toMinutes(body.endTime) <= toMinutes(body.time)) {
      return { error: '"endTime" deve ser maior que "time".' };
    }
  }

  if (!isAppointmentType(body.type)) {
    return { error: 'Campo "type" inválido.' };
  }

  if (!isAppointmentStatus(body.status)) {
    return { error: 'Campo "status" inválido.' };
  }

  if (typeof body.reminderEnabled !== 'boolean') {
    return { error: 'Campo "reminderEnabled" é obrigatório.' };
  }

  if (typeof body.reminderMinutesBefore !== 'number' || Number.isNaN(body.reminderMinutesBefore)) {
    return { error: 'Campo "reminderMinutesBefore" é obrigatório.' };
  }

  if (body.reminderMode !== undefined && !isReminderMode(body.reminderMode)) {
    return { error: 'Campo "reminderMode" inválido.' };
  }

  const value: AppointmentInput = {
      title: body.title,
      description: body.description,
      date: body.date,
      time: body.time,
      ...(typeof body.endTime === 'string' && body.endTime.trim() ? { endTime: body.endTime } : {}),
      type: body.type,
      status: body.status,
      reminderEnabled: body.reminderEnabled,
      reminderMinutesBefore: body.reminderMinutesBefore,
      reminderMode: body.reminderMode || 'visual',
  };

  if (typeof body.clientId === 'string') {
    value.clientId = body.clientId;
  }

  if (typeof body.clientName === 'string') {
    value.clientName = body.clientName;
  }

  if (typeof body.clientPhone === 'string') {
    value.clientPhone = body.clientPhone;
  }

  if (typeof body.observations === 'string') {
    value.observations = body.observations;
  }

  return {
    value,
  };
}

function parseSettingsInput(body: Partial<Settings>) {
  if (typeof body.businessName !== 'string' || !body.businessName.trim()) {
    return { error: 'Campo "businessName" é obrigatório.' };
  }

  if (body.theme !== 'light' && body.theme !== 'dark') {
    return { error: 'Campo "theme" inválido.' };
  }

  if (typeof body.notificationsEnabled !== 'boolean') {
    return { error: 'Campo "notificationsEnabled" é obrigatório.' };
  }

  if (typeof body.defaultReminderMinutes !== 'number' || Number.isNaN(body.defaultReminderMinutes)) {
    return { error: 'Campo "defaultReminderMinutes" é obrigatório.' };
  }

  if (typeof body.compactMode !== 'boolean') {
    return { error: 'Campo "compactMode" é obrigatório.' };
  }

  if (typeof body.birthdaysModuleEnabled !== 'boolean') {
    return { error: 'Campo "birthdaysModuleEnabled" é obrigatório.' };
  }

  const settings: Settings = {
    businessName: body.businessName.trim(),
    theme: body.theme,
    notificationsEnabled: body.notificationsEnabled,
    defaultReminderMinutes: Math.max(0, body.defaultReminderMinutes),
    compactMode: body.compactMode,
    birthdaysModuleEnabled: body.birthdaysModuleEnabled,
  };

  return { value: settings };
}

function parseBirthdayInput(body: Partial<BirthdayContact>) {
  if (typeof body.name !== 'string' || !body.name.trim()) {
    return { error: 'Campo "name" é obrigatório.' };
  }

  if (typeof body.whatsapp !== 'string' || !body.whatsapp.trim()) {
    return { error: 'Campo "whatsapp" é obrigatório.' };
  }

  if (typeof body.birthDate !== 'string' || !body.birthDate.trim()) {
    return { error: 'Campo "birthDate" é obrigatório.' };
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(body.birthDate.trim())) {
    return { error: 'Campo "birthDate" deve estar no formato YYYY-MM-DD.' };
  }

  const value: Omit<BirthdayContact, 'id' | 'createdAt' | 'updatedAt'> = {
    name: body.name.trim(),
    ...(typeof body.nickname === 'string' && body.nickname.trim() ? { nickname: body.nickname.trim() } : {}),
    whatsapp: body.whatsapp.trim(),
    birthDate: body.birthDate.trim(),
    ...(typeof body.groupId === 'string' && body.groupId.trim() ? { groupId: body.groupId.trim() } : {}),
    ...(typeof body.photoUrl === 'string' && body.photoUrl.trim() ? { photoUrl: body.photoUrl.trim() } : {}),
    source: body.source === 'external' ? 'external' : 'local',
    active: typeof body.active === 'boolean' ? body.active : true,
    ...(typeof body.notes === 'string' && body.notes.trim() ? { notes: body.notes.trim() } : {}),
    ...(typeof body.messageTemplate === 'string' && body.messageTemplate.trim()
      ? { messageTemplate: body.messageTemplate.trim() }
      : {}),
    ...(typeof body.externalRef === 'string' && body.externalRef.trim() ? { externalRef: body.externalRef.trim() } : {}),
  };

  return { value };
}

function parseBirthdayGroupInput(body: Partial<BirthdayGroup>) {
  if (typeof body.name !== 'string' || !body.name.trim()) {
    return { error: 'Campo "name" é obrigatório.' };
  }

  const value: Omit<BirthdayGroup, 'id' | 'createdAt' | 'updatedAt'> = {
    name: body.name.trim(),
    ...(typeof body.description === 'string' && body.description.trim() ? { description: body.description.trim() } : {}),
    active: typeof body.active === 'boolean' ? body.active : true,
  };

  return { value };
}

function parseBirthdayBackgroundInput(
  body: Partial<BirthdayBackground>,
): ParseResult<Omit<BirthdayBackground, 'id' | 'createdAt' | 'updatedAt'>> {
  if (typeof body.name !== 'string' || !body.name.trim()) {
    return { error: 'Campo "name" é obrigatório.' };
  }

  if (typeof body.imageUrl !== 'string' || !body.imageUrl.trim()) {
    return { error: 'Campo "imageUrl" é obrigatório.' };
  }

  if (body.scope !== 'global' && body.scope !== 'group') {
    return { error: 'Campo "scope" inválido. Use "global" ou "group".' };
  }

  if (body.scope === 'group' && (typeof body.groupId !== 'string' || !body.groupId.trim())) {
    return { error: 'Para escopo de grupo, "groupId" é obrigatório.' };
  }

  if (body.photoMaskShape !== undefined && !isPhotoMaskShape(body.photoMaskShape)) {
    return { error: 'Campo "photoMaskShape" inválido. Use "circle" ou "square".' };
  }

  const parsedLayout = parseBirthdayBackgroundLayout(body.layout);
  if ('error' in parsedLayout) {
    return parsedLayout;
  }

  const value: Omit<BirthdayBackground, 'id' | 'createdAt' | 'updatedAt'> = {
    name: body.name.trim(),
    imageUrl: body.imageUrl.trim(),
    scope: body.scope,
    ...(body.scope === 'group' && typeof body.groupId === 'string' && body.groupId.trim()
      ? { groupId: body.groupId.trim() }
      : {}),
    photoMaskShape: body.photoMaskShape ?? 'circle',
    ...(typeof body.nameFontKey === 'string' && body.nameFontKey.trim()
      ? { nameFontKey: body.nameFontKey.trim() }
      : { nameFontKey: 'magic_wall' }),
    layout: parsedLayout.value,
    active: typeof body.active === 'boolean' ? body.active : true,
  };

  return { value };
}

function parseBirthdayBackgroundLayout(layout: unknown): ParseResult<BirthdayBackgroundLayout> {
  const fallback: BirthdayBackgroundLayout = {
    photoXPercent: 50,
    photoYPercent: 29.2,
    photoSizePercent: 42.6,
    showPhoto: true,
    nameXPercent: 51.7,
    nameYPercent: 68.7,
    nameSizePercent: 24,
    showName: true,
  };

  if (layout === undefined) {
    return { value: fallback };
  }

  if (!layout || typeof layout !== 'object') {
    return { error: 'Campo "layout" inválido.' };
  }

  const value = layout as Partial<BirthdayBackgroundLayout>;
  const keys: Array<keyof BirthdayBackgroundLayout> = [
    'photoXPercent',
    'photoYPercent',
    'photoSizePercent',
    'nameXPercent',
    'nameYPercent',
    'nameSizePercent',
  ];

  for (const key of keys) {
    const current = value[key];
    if (typeof current !== 'number' || Number.isNaN(current)) {
      return { error: `Campo "layout.${key}" inválido.` };
    }
  }

  if (value.showPhoto !== undefined && typeof value.showPhoto !== 'boolean') {
    return { error: 'Campo "layout.showPhoto" inválido.' };
  }

  if (value.showName !== undefined && typeof value.showName !== 'boolean') {
    return { error: 'Campo "layout.showName" inválido.' };
  }

  const result: BirthdayBackgroundLayout = {
    photoXPercent: clampLayoutPercent(value.photoXPercent as number, 5, 95),
    photoYPercent: clampLayoutPercent(value.photoYPercent as number, 5, 95),
    photoSizePercent: clampLayoutPercent(value.photoSizePercent as number, 8, 90),
    showPhoto: value.showPhoto ?? true,
    nameXPercent: clampLayoutPercent(value.nameXPercent as number, 5, 95),
    nameYPercent: clampLayoutPercent(value.nameYPercent as number, 5, 95),
    nameSizePercent: clampLayoutPercent(value.nameSizePercent as number, 5, 40),
    showName: value.showName ?? true,
  };

  return { value: result };
}

function clampLayoutPercent(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, Math.round(value * 10) / 10));
}

function parseRegistrationInput(body: Partial<RegistrationProfile>) {
  if (!isRegistrationType(body.type)) {
    return { error: 'Campo "type" inválido. Use "pf" ou "pj".' };
  }

  if (typeof body.email !== 'string' || !body.email.trim()) {
    return { error: 'Campo "email" é obrigatório.' };
  }

  if (typeof body.phone !== 'string' || !body.phone.trim()) {
    return { error: 'Campo "phone" é obrigatório.' };
  }

  if (!body.address || typeof body.address !== 'object') {
    return { error: 'Campo "address" é obrigatório.' };
  }

  const address = body.address;
  if (
    typeof address.zipCode !== 'string' ||
    typeof address.street !== 'string' ||
    typeof address.number !== 'string' ||
    typeof address.district !== 'string' ||
    typeof address.city !== 'string' ||
    typeof address.state !== 'string'
  ) {
    return { error: 'Preencha endereço completo (CEP, rua, número, bairro, cidade e estado).' };
  }

  if (body.type === 'pf') {
    if (typeof body.fullName !== 'string' || !body.fullName.trim()) {
      return { error: 'Para PF, "fullName" é obrigatório.' };
    }
    if (typeof body.cpf !== 'string' || !body.cpf.trim() || !isValidCpf(body.cpf)) {
      return { error: 'Para PF, informe um "cpf" válido.' };
    }
  }

  if (body.type === 'pj') {
    if (typeof body.companyName !== 'string' || !body.companyName.trim()) {
      return { error: 'Para PJ, "companyName" é obrigatório.' };
    }
    if (typeof body.cnpj !== 'string' || !body.cnpj.trim() || !isValidCnpj(body.cnpj)) {
      return { error: 'Para PJ, informe um "cnpj" válido.' };
    }
  }

  const registration: RegistrationProfile = {
    id: body.id || 'registration_admin_1',
    type: body.type,
    email: body.email.trim(),
    phone: body.phone.trim(),
    address: {
      zipCode: address.zipCode.trim(),
      street: address.street.trim(),
      number: address.number.trim(),
      district: address.district.trim(),
      city: address.city.trim(),
      state: address.state.trim(),
      ...(typeof address.complement === 'string' && address.complement.trim()
        ? { complement: address.complement.trim() }
        : {}),
    },
    createdAt: body.createdAt || new Date().toISOString(),
    updatedAt: body.updatedAt || new Date().toISOString(),
    ...(typeof body.displayName === 'string' && body.displayName.trim()
      ? { displayName: body.displayName.trim() }
      : {}),
    ...(typeof body.fullName === 'string' && body.fullName.trim() ? { fullName: body.fullName.trim() } : {}),
    ...(typeof body.companyName === 'string' && body.companyName.trim() ? { companyName: body.companyName.trim() } : {}),
    ...(typeof body.tradeName === 'string' && body.tradeName.trim() ? { tradeName: body.tradeName.trim() } : {}),
    ...(typeof body.avatarUrl === 'string' && body.avatarUrl.trim() ? { avatarUrl: body.avatarUrl.trim() } : {}),
    ...(typeof body.cpf === 'string' && body.cpf.trim() ? { cpf: body.cpf.trim() } : {}),
    ...(typeof body.cnpj === 'string' && body.cnpj.trim() ? { cnpj: body.cnpj.trim() } : {}),
    ...(typeof body.whatsapp === 'string' && body.whatsapp.trim() ? { whatsapp: body.whatsapp.trim() } : {}),
    ...(typeof body.notes === 'string' && body.notes.trim() ? { notes: body.notes.trim() } : {}),
  };

  return { value: registration };
}

function sanitizeFileName(fileName: string) {
  return fileName
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9._-]/g, '-')
    .replace(/-{2,}/g, '-')
    .toLowerCase();
}

function parseAvatarUploadInput(body: Partial<RegistrationAvatarUploadPayload>) {
  if (typeof body.fileName !== 'string' || !body.fileName.trim()) {
    return { error: 'Informe o nome do arquivo.' };
  }

  if (typeof body.mimeType !== 'string' || !body.mimeType.trim()) {
    return { error: 'Informe o tipo MIME da imagem.' };
  }

  if (typeof body.base64Data !== 'string' || !body.base64Data.trim()) {
    return { error: 'Conteúdo da imagem é obrigatório.' };
  }

  const supportedMimeTypes: Record<string, string> = {
    'image/jpeg': '.jpg',
    'image/jpg': '.jpg',
    'image/png': '.png',
    'image/webp': '.webp',
    'image/gif': '.gif',
  };

  const extensionFromMime = supportedMimeTypes[body.mimeType.toLowerCase()];
  if (!extensionFromMime) {
    return { error: 'Formato não suportado. Use JPG, PNG, WEBP ou GIF.' };
  }

  let fileBuffer: Buffer;
  try {
    fileBuffer = Buffer.from(body.base64Data, 'base64');
  } catch {
    return { error: 'Arquivo inválido.' };
  }

  if (!fileBuffer.length) {
    return { error: 'Arquivo inválido.' };
  }

  if (fileBuffer.byteLength > avatarMaxBytes) {
    return { error: 'Imagem muito grande. Limite de 3MB.' };
  }

  const safeBaseName = sanitizeFileName(body.fileName.replace(extname(body.fileName), '')) || 'avatar';
  const fileName = `${Date.now()}-${safeBaseName}${extensionFromMime}`;
  const filePath = join(uploadDirectory, fileName);
  const assetUrl = `/uploads/${fileName}`;
  const responsePayload: RegistrationAvatarUploadResponse = {
    avatarUrl: assetUrl,
  };

  return {
    value: {
      filePath,
      buffer: fileBuffer,
      assetUrl,
      responsePayload,
    },
  };
}

app.get('/health', (_request, response) => {
  response.json({ status: 'ok' });
});

app.post('/auth/login', async (request, response) => {
  const payload = request.body as LoginPayload;

  if (!payload?.email || !payload?.password) {
    return sendError(response, 400, 'Email e senha são obrigatórios.');
  }

  const loginResponse = await authService.login(payload);

  if (!loginResponse) {
    return sendError(response, 401, 'Credenciais inválidas.');
  }

  return response.json(loginResponse);
});

app.get('/appointments', async (request, response) => {
  const filters = parseAppointmentFilters(request);
  return response.json(await appointmentsService.list(filters));
});

app.post('/appointments', async (request, response) => {
  const parsed = parseAppointmentInput(request.body as Partial<Appointment>);
  if ('error' in parsed) {
    return sendError(response, 400, parsed.error);
  }

  const appointment = await appointmentsService.create(parsed.value);
  return response.status(201).json(appointment);
});

app.put('/appointments/:id', async (request, response) => {
  const id = request.params.id;
  if (!id) {
    return sendError(response, 400, 'ID do agendamento é obrigatório.');
  }

  const parsed = parseAppointmentInput(request.body as Partial<Appointment>);
  if ('error' in parsed) {
    return sendError(response, 400, parsed.error);
  }

  const appointment = await appointmentsService.update(id, parsed.value);
  if (!appointment) {
    return sendError(response, 404, 'Agendamento não encontrado.');
  }

  return response.json(appointment);
});

app.delete('/appointments/:id', async (request, response) => {
  const id = request.params.id;
  if (!id) {
    return sendError(response, 400, 'ID do agendamento é obrigatório.');
  }

  const removed = await appointmentsService.remove(id);
  if (!removed) {
    return sendError(response, 404, 'Agendamento não encontrado.');
  }

  return response.status(204).send();
});

app.patch('/appointments/:id/status', async (request, response) => {
  const id = request.params.id;
  if (!id) {
    return sendError(response, 400, 'ID do agendamento é obrigatório.');
  }

  const payload = request.body as UpdateAppointmentStatusPayload;
  if (!isAppointmentStatus(payload?.status)) {
    return sendError(response, 400, 'Status inválido.');
  }

  const appointment = await appointmentsService.updateStatus(id, payload.status);
  if (!appointment) {
    return sendError(response, 404, 'Agendamento não encontrado.');
  }

  return response.json(appointment);
});

app.get('/clients', async (_request, response) => {
  return response.json(await clientsService.list());
});

app.post('/clients', async (request, response) => {
  const payload = request.body as { name?: string; phone?: string; notes?: string };

  if (!payload?.name || !payload?.phone) {
    return sendError(response, 400, 'Nome e telefone são obrigatórios.');
  }

  const createPayload = {
    name: payload.name,
    phone: payload.phone,
    ...(typeof payload.notes === 'string' ? { notes: payload.notes } : {}),
  };

  const client = await clientsService.create(createPayload);
  return response.status(201).json(client);
});

app.get('/birthdays', async (_request, response) => {
  return response.json(await birthdaysService.list());
});

app.post('/birthdays', async (request, response) => {
  const parsed = parseBirthdayInput(request.body as Partial<BirthdayContact>);
  if ('error' in parsed) {
    return sendError(response, 400, parsed.error);
  }

  const birthday = await birthdaysService.create(parsed.value);
  return response.status(201).json(birthday);
});

app.put('/birthdays/:id', async (request, response) => {
  const id = request.params.id;
  if (!id) {
    return sendError(response, 400, 'ID do aniversariante é obrigatório.');
  }

  const parsed = parseBirthdayInput(request.body as Partial<BirthdayContact>);
  if ('error' in parsed) {
    return sendError(response, 400, parsed.error);
  }

  const birthday = await birthdaysService.update(id, parsed.value);
  if (!birthday) {
    return sendError(response, 404, 'Aniversariante não encontrado.');
  }

  return response.json(birthday);
});

app.get('/birthday-groups', async (_request, response) => {
  return response.json(await birthdayGroupsService.list());
});

app.post('/birthday-groups', async (request, response) => {
  const parsed = parseBirthdayGroupInput(request.body as Partial<BirthdayGroup>);
  if ('error' in parsed) {
    return sendError(response, 400, parsed.error);
  }

  const group = await birthdayGroupsService.create(parsed.value);
  return response.status(201).json(group);
});

app.put('/birthday-groups/:id', async (request, response) => {
  const id = request.params.id;
  if (!id) {
    return sendError(response, 400, 'ID do grupo é obrigatório.');
  }

  const parsed = parseBirthdayGroupInput(request.body as Partial<BirthdayGroup>);
  if ('error' in parsed) {
    return sendError(response, 400, parsed.error);
  }

  const group = await birthdayGroupsService.update(id, parsed.value);
  if (!group) {
    return sendError(response, 404, 'Grupo não encontrado.');
  }

  return response.json(group);
});

app.get('/birthday-backgrounds', async (_request, response) => {
  return response.json(await birthdayBackgroundsService.list());
});

app.post('/birthday-backgrounds', async (request, response) => {
  const parsed = parseBirthdayBackgroundInput(request.body as Partial<BirthdayBackground>);
  if ('error' in parsed) {
    return sendError(response, 400, parsed.error);
  }

  const background = await birthdayBackgroundsService.create(parsed.value);
  return response.status(201).json(background);
});

app.put('/birthday-backgrounds/:id', async (request, response) => {
  const id = request.params.id;
  if (!id) {
    return sendError(response, 400, 'ID do fundo é obrigatório.');
  }

  const parsed = parseBirthdayBackgroundInput(request.body as Partial<BirthdayBackground>);
  if ('error' in parsed) {
    return sendError(response, 400, parsed.error);
  }

  const background = await birthdayBackgroundsService.update(id, parsed.value);
  if (!background) {
    return sendError(response, 404, 'Fundo não encontrado.');
  }

  return response.json(background);
});

app.get('/settings', async (_request, response) => {
  return response.json(await settingsService.get());
});

app.put('/settings', async (request, response) => {
  const parsed = parseSettingsInput(request.body as Partial<Settings>);

  if ('error' in parsed) {
    return sendError(response, 400, parsed.error);
  }

  const settings = await settingsService.update(parsed.value);
  return response.json(settings);
});

app.get('/registration', async (_request, response) => {
  return response.json(await registrationService.get());
});

app.post('/registration/avatar', (request, response) => {
  const parsed = parseAvatarUploadInput(request.body as Partial<RegistrationAvatarUploadPayload>);

  if ('error' in parsed) {
    return sendError(response, 400, parsed.error);
  }

  try {
    writeFileSync(parsed.value.filePath, parsed.value.buffer);
    return response.status(201).json(parsed.value.responsePayload);
  } catch {
    return sendError(response, 500, 'Falha ao salvar a imagem localmente.');
  }
});

app.post('/uploads/image', (request, response) => {
  const parsed = parseAvatarUploadInput(request.body as Partial<RegistrationAvatarUploadPayload>);

  if ('error' in parsed) {
    return sendError(response, 400, parsed.error);
  }

  try {
    writeFileSync(parsed.value.filePath, parsed.value.buffer);
    return response.status(201).json({ assetUrl: parsed.value.assetUrl });
  } catch {
    return sendError(response, 500, 'Falha ao salvar a imagem localmente.');
  }
});

app.put('/registration', async (request, response) => {
  const parsed = parseRegistrationInput(request.body as Partial<RegistrationProfile>);

  if ('error' in parsed) {
    return sendError(response, 400, parsed.error);
  }

  const registration = await registrationService.update(parsed.value);
  return response.json(registration);
});

app.listen(port, () => {
  console.log(`Agenda Facilitada API running on http://localhost:${port}`);
  console.log(
    `Data provider: requested=${repositoryMeta.requestedProvider} active=${repositoryMeta.activeProvider}`,
  );
  if (repositoryMeta.localDbPath) {
    console.log(`Local DB path: ${repositoryMeta.localDbPath}`);
  }
});
