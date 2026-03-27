import dayjs from 'dayjs';
import type { Appointment, AppointmentFilters, AppointmentStatus } from '../types/shared';
import { dataRepository } from '../repositories';
import { createId } from '../utils/id';

type AppointmentInput = Omit<Appointment, 'id' | 'createdAt' | 'updatedAt' | 'scheduledAt'>;

function normalizeText(value: string) {
  return value.trim();
}

function normalizeOptionalText(value: string | undefined) {
  const normalized = value?.trim();
  return normalized ? normalized : undefined;
}

function buildAppointment(
  input: AppointmentInput,
  metadata: Pick<Appointment, 'id' | 'createdAt'> & { updatedAt: string },
): Appointment {
  const appointment: Appointment = {
    id: metadata.id,
    title: normalizeText(input.title),
    description: normalizeText(input.description),
    date: input.date,
    time: input.time,
    ...(input.endTime ? { endTime: input.endTime } : {}),
    scheduledAt: dayjs(`${input.date} ${input.time}`).toISOString(),
    type: input.type,
    status: input.status,
    reminderEnabled: Boolean(input.reminderEnabled),
    reminderMinutesBefore: Math.max(0, Number.isFinite(input.reminderMinutesBefore) ? input.reminderMinutesBefore : 0),
    reminderMode: input.reminderMode || 'visual',
    createdAt: metadata.createdAt,
    updatedAt: metadata.updatedAt,
  };

  const clientId = normalizeOptionalText(input.clientId);
  const clientName = normalizeOptionalText(input.clientName);
  const clientPhone = normalizeOptionalText(input.clientPhone);
  const observations = normalizeOptionalText(input.observations);

  if (clientId) {
    appointment.clientId = clientId;
  }

  if (clientName) {
    appointment.clientName = clientName;
  }

  if (clientPhone) {
    appointment.clientPhone = clientPhone;
  }

  if (observations) {
    appointment.observations = observations;
  }

  return appointment;
}

class AppointmentsService {
  async list(filters?: AppointmentFilters) {
    const appointments = await dataRepository.getAppointments();

    const filtered = appointments.filter((appointment) => {
      const matchesSearch = filters?.search
        ? `${appointment.title} ${appointment.description} ${appointment.clientName || ''}`
            .toLowerCase()
            .includes(filters.search.toLowerCase())
        : true;
      const matchesStatus =
        !filters?.status || filters.status === 'all' ? true : appointment.status === filters.status;
      const matchesType = !filters?.type || filters.type === 'all' ? true : appointment.type === filters.type;
      const matchesDate = filters?.date ? appointment.date === filters.date : true;

      return matchesSearch && matchesStatus && matchesType && matchesDate;
    });

    return [...filtered].sort((first, second) => dayjs(first.scheduledAt).valueOf() - dayjs(second.scheduledAt).valueOf());
  }

  async create(input: AppointmentInput): Promise<Appointment> {
    const now = dayjs().toISOString();
    const appointment = buildAppointment(input, {
      id: createId('appointment'),
      createdAt: now,
      updatedAt: now,
    });

    const appointments = await dataRepository.getAppointments();
    await dataRepository.setAppointments([appointment, ...appointments]);

    return appointment;
  }

  async update(id: string, input: AppointmentInput): Promise<Appointment | null> {
    const appointments = await dataRepository.getAppointments();
    const current = appointments.find((appointment) => appointment.id === id);

    if (!current) {
      return null;
    }

    const updated = buildAppointment(input, {
      id: current.id,
      createdAt: current.createdAt,
      updatedAt: dayjs().toISOString(),
    });

    await dataRepository.setAppointments(appointments.map((appointment) => (appointment.id === id ? updated : appointment)));

    return updated;
  }

  async remove(id: string): Promise<boolean> {
    const appointments = await dataRepository.getAppointments();
    const nextAppointments = appointments.filter((appointment) => appointment.id !== id);

    if (nextAppointments.length === appointments.length) {
      return false;
    }

    await dataRepository.setAppointments(nextAppointments);
    return true;
  }

  async updateStatus(id: string, status: AppointmentStatus): Promise<Appointment | null> {
    const appointments = await dataRepository.getAppointments();
    let updatedAppointment: Appointment | null = null;

    const nextAppointments = appointments.map((appointment) => {
      if (appointment.id !== id) {
        return appointment;
      }

      updatedAppointment = {
        ...appointment,
        status,
        updatedAt: dayjs().toISOString(),
      };

      return updatedAppointment;
    });

    if (!updatedAppointment) {
      return null;
    }

    await dataRepository.setAppointments(nextAppointments);
    return updatedAppointment;
  }
}

export const appointmentsService = new AppointmentsService();
