import type {
  Appointment,
  AppointmentFilters,
  AppointmentStatus,
  BirthdayBackground,
  BirthdayContact,
  BirthdayGroup,
  Client,
  LoginPayload,
  LoginResponse,
  RegistrationAvatarUploadResponse,
  RegistrationProfile,
  Settings,
} from '../types/shared';

const apiBaseUrl = (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, '') || 'http://localhost:3333';

type RequestOptions = Omit<RequestInit, 'body'> & {
  body?: unknown;
};

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const response = await fetch(`${apiBaseUrl}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
  });

  const isJson = response.headers.get('content-type')?.includes('application/json');
  const payload = isJson ? await response.json() : null;

  if (!response.ok) {
    const message =
      payload && typeof payload === 'object' && 'message' in payload && typeof payload.message === 'string'
        ? payload.message
        : `Request failed: ${response.status}`;
    throw new Error(message);
  }

  return payload as T;
}

export function loginRequest(payload: LoginPayload) {
  return request<LoginResponse>('/auth/login', {
    method: 'POST',
    body: payload,
  });
}

function buildAppointmentQuery(filters?: AppointmentFilters) {
  if (!filters) {
    return '';
  }

  const params = new URLSearchParams();

  if (filters.search) {
    params.set('search', filters.search);
  }

  if (filters.status && filters.status !== 'all') {
    params.set('status', filters.status);
  }

  if (filters.type && filters.type !== 'all') {
    params.set('type', filters.type);
  }

  if (filters.date) {
    params.set('date', filters.date);
  }

  const query = params.toString();
  return query ? `?${query}` : '';
}

export function listAppointmentsRequest(filters?: AppointmentFilters) {
  return request<Appointment[]>(`/appointments${buildAppointmentQuery(filters)}`);
}

export function createAppointmentRequest(
  payload: Omit<Appointment, 'id' | 'createdAt' | 'updatedAt' | 'scheduledAt'>,
) {
  return request<Appointment>('/appointments', {
    method: 'POST',
    body: payload,
  });
}

export function updateAppointmentRequest(
  id: string,
  payload: Omit<Appointment, 'id' | 'createdAt' | 'updatedAt' | 'scheduledAt'>,
) {
  return request<Appointment>(`/appointments/${id}`, {
    method: 'PUT',
    body: payload,
  });
}

export function deleteAppointmentRequest(id: string) {
  return request<void>(`/appointments/${id}`, {
    method: 'DELETE',
  });
}

export function updateAppointmentStatusRequest(id: string, status: AppointmentStatus) {
  return request<Appointment>(`/appointments/${id}/status`, {
    method: 'PATCH',
    body: { status },
  });
}

export function listClientsRequest() {
  return request<Client[]>('/clients');
}

export function listBirthdaysRequest() {
  return request<BirthdayContact[]>('/birthdays');
}

export function createBirthdayRequest(payload: Omit<BirthdayContact, 'id' | 'createdAt' | 'updatedAt'>) {
  return request<BirthdayContact>('/birthdays', {
    method: 'POST',
    body: payload,
  });
}

export function updateBirthdayRequest(id: string, payload: Omit<BirthdayContact, 'id' | 'createdAt' | 'updatedAt'>) {
  return request<BirthdayContact>(`/birthdays/${id}`, {
    method: 'PUT',
    body: payload,
  });
}

export function listBirthdayGroupsRequest() {
  return request<BirthdayGroup[]>('/birthday-groups');
}

export function createBirthdayGroupRequest(payload: Omit<BirthdayGroup, 'id' | 'createdAt' | 'updatedAt'>) {
  return request<BirthdayGroup>('/birthday-groups', {
    method: 'POST',
    body: payload,
  });
}

export function updateBirthdayGroupRequest(
  id: string,
  payload: Omit<BirthdayGroup, 'id' | 'createdAt' | 'updatedAt'>,
) {
  return request<BirthdayGroup>(`/birthday-groups/${id}`, {
    method: 'PUT',
    body: payload,
  });
}

export function listBirthdayBackgroundsRequest() {
  return request<BirthdayBackground[]>('/birthday-backgrounds');
}

export function createBirthdayBackgroundRequest(
  payload: Omit<BirthdayBackground, 'id' | 'createdAt' | 'updatedAt'>,
) {
  return request<BirthdayBackground>('/birthday-backgrounds', {
    method: 'POST',
    body: payload,
  });
}

export function updateBirthdayBackgroundRequest(
  id: string,
  payload: Omit<BirthdayBackground, 'id' | 'createdAt' | 'updatedAt'>,
) {
  return request<BirthdayBackground>(`/birthday-backgrounds/${id}`, {
    method: 'PUT',
    body: payload,
  });
}

export function getSettingsRequest() {
  return request<Settings>('/settings');
}

export function updateSettingsRequest(payload: Settings) {
  return request<Settings>('/settings', {
    method: 'PUT',
    body: payload,
  });
}

export function getRegistrationRequest() {
  return request<RegistrationProfile>('/registration');
}

export function updateRegistrationRequest(payload: RegistrationProfile) {
  return request<RegistrationProfile>('/registration', {
    method: 'PUT',
    body: payload,
  });
}

export function resolveApiAssetUrl(assetPath: string) {
  if (!assetPath) {
    return '';
  }

  if (/^https?:\/\//i.test(assetPath)) {
    return assetPath;
  }

  const normalizedPath = assetPath.startsWith('/') ? assetPath : `/${assetPath}`;
  return `${apiBaseUrl}${normalizedPath}`;
}

export function uploadRegistrationAvatarRequest(payload: {
  fileName: string;
  mimeType: string;
  base64Data: string;
}) {
  return request<RegistrationAvatarUploadResponse>('/registration/avatar', {
    method: 'POST',
    body: payload,
  });
}

export function uploadImageAssetRequest(payload: { fileName: string; mimeType: string; base64Data: string }) {
  return request<{ assetUrl: string }>('/uploads/image', {
    method: 'POST',
    body: payload,
  });
}
