import dayjs from 'dayjs';
import { useMemo } from 'react';
import { formatDateTime, sortAppointments } from '../lib/date';
import { useAppStore } from '../store/app-store';
import type { Appointment } from '../types/shared';

function createSummary(appointments: Appointment[]) {
  const today = dayjs();
  const tomorrow = today.add(1, 'day');
  const nextWeek = today.add(7, 'day');

  return {
    today: appointments.filter((appointment) => dayjs(appointment.date).isSame(today, 'day')).length,
    tomorrow: appointments.filter((appointment) => dayjs(appointment.date).isSame(tomorrow, 'day')).length,
    overdue: appointments.filter((appointment) => appointment.status === 'overdue').length,
    next7Days: appointments.filter((appointment) => {
      const date = dayjs(appointment.date);
      return date.isAfter(today.subtract(1, 'day'), 'day') && date.isBefore(nextWeek.add(1, 'day'), 'day');
    }).length,
    pending: appointments.filter((appointment) => appointment.status === 'pending').length,
    completed: appointments.filter((appointment) => appointment.status === 'completed').length,
    cancelled: appointments.filter((appointment) => appointment.status === 'cancelled').length,
  };
}

export function DashboardPage() {
  const appointments = useAppStore((state) => state.appointments);

  const summary = useMemo(() => createSummary(appointments), [appointments]);
  const nextAppointments = useMemo(
    () =>
      sortAppointments(
        appointments.filter((appointment) => appointment.status !== 'completed' && appointment.status !== 'cancelled'),
      ).slice(0, 5),
    [appointments],
  );

  return (
    <section className="page">
      <header className="page__header">
        <h2>Resumo da agenda</h2>
        <p>Uma visão rápida do seu dia para priorizar os próximos atendimentos.</p>
      </header>

      <div className="grid grid--metrics">
        <article className="metric-block">
          <p className="metric-card__label">Hoje</p>
          <strong>{summary.today}</strong>
        </article>
        <article className="metric-block">
          <p className="metric-card__label">Amanhã</p>
          <strong>{summary.tomorrow}</strong>
        </article>
        <article className="metric-block">
          <p className="metric-card__label">Próx. 7 dias</p>
          <strong>{summary.next7Days}</strong>
        </article>
        <article className="metric-block metric-card--warn">
          <p className="metric-card__label">Atrasados</p>
          <strong>{summary.overdue}</strong>
        </article>
      </div>

      <div className="grid grid--two">
        <article className="card">
          <h3>Status atuais</h3>
          <dl className="status-list">
            <div>
              <dt>Pendentes</dt>
              <dd>{summary.pending}</dd>
            </div>
            <div>
              <dt>Concluídos</dt>
              <dd>{summary.completed}</dd>
            </div>
            <div>
              <dt>Cancelados</dt>
              <dd>{summary.cancelled}</dd>
            </div>
          </dl>
        </article>

        <article className="card">
          <h3>Próximos atendimentos</h3>
          {nextAppointments.length === 0 ? (
            <p className="empty-message">Nenhum atendimento futuro encontrado.</p>
          ) : (
            <ul className="stack-list">
              {nextAppointments.map((appointment) => (
                <li key={appointment.id}>
                  <p className="stack-list__title">{appointment.title}</p>
                  <p className="stack-list__meta">
                    {formatDateTime(`${appointment.date} ${appointment.time}`)}
                    {appointment.clientName ? ` · ${appointment.clientName}` : ''}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </article>
      </div>
    </section>
  );
}
