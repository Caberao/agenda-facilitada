import type { AppointmentStatus, AppointmentType } from '../../types/shared';

export const appointmentStatusOptions: Array<{ value: AppointmentStatus | 'all'; label: string }> = [
  { value: 'all', label: 'Todos os status' },
  { value: 'pending', label: 'Pendente' },
  { value: 'confirmed', label: 'Confirmado' },
  { value: 'completed', label: 'Concluído' },
  { value: 'cancelled', label: 'Cancelado' },
  { value: 'overdue', label: 'Atrasado' },
];

export const appointmentTypeOptions: Array<{ value: AppointmentType | 'all'; label: string }> = [
  { value: 'all', label: 'Todos os tipos' },
  { value: 'appointment', label: 'Atendimento' },
  { value: 'follow-up', label: 'Retorno' },
  { value: 'reminder', label: 'Lembrete' },
  { value: 'meeting', label: 'Reunião' },
  { value: 'personal', label: 'Pessoal' },
];