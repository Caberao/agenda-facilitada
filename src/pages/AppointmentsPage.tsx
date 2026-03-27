import dayjs from 'dayjs';
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { appointmentStatusOptions, appointmentTypeOptions } from '../features/appointments/constants';
import { formatDate, sortAppointments } from '../lib/date';
import { useAppStore } from '../store/app-store';
import type { AppointmentStatus } from '../types/shared';

type LifecycleFilter = 'active' | 'inactive' | 'all';

const statusLabelMap: Record<AppointmentStatus, string> = {
  pending: 'Pendente',
  confirmed: 'Confirmado',
  completed: 'Concluído',
  cancelled: 'Cancelado',
  overdue: 'Atrasado',
};

function formatAppointmentTimeRange(time: string, endTime?: string) {
  if (!endTime) {
    return time;
  }

  return `${time} - ${endTime}`;
}

export function AppointmentsPage() {
  const appointmentsStore = useAppStore((state) => state.appointments);
  const updateAppointmentStatus = useAppStore((state) => state.updateAppointmentStatus);

  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<AppointmentStatus | 'all'>('all');
  const [type, setType] = useState<'all' | 'appointment' | 'follow-up' | 'reminder' | 'meeting' | 'personal'>(
    'all',
  );
  const [lifecycle, setLifecycle] = useState<LifecycleFilter>('active');
  const [date, setDate] = useState(dayjs().format('YYYY-MM-DD'));
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');

  const appointments = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    const filtered = appointmentsStore.filter((appointment) => {
      const matchesSearch = normalizedSearch
        ? `${appointment.title} ${appointment.clientName ?? ''} ${appointment.description}`
            .toLowerCase()
            .includes(normalizedSearch)
        : true;

      const matchesType = type === 'all' ? true : appointment.type === type;
      const matchesDate = date ? appointment.date === date : true;

      return matchesSearch && matchesType && matchesDate;
    });

    return sortAppointments(filtered);
  }, [appointmentsStore, date, search, type]);

  const activeAppointments = useMemo(
    () => appointments.filter((appointment) => appointment.status !== 'completed' && appointment.status !== 'cancelled'),
    [appointments],
  );

  const inactiveAppointments = useMemo(
    () => appointments.filter((appointment) => appointment.status === 'completed' || appointment.status === 'cancelled'),
    [appointments],
  );

  const isStatusFilterActive = status !== 'all';
  const shouldShowSplitSections = lifecycle === 'all' && !isStatusFilterActive;
  const visibleAppointments = useMemo(() => {
    const source =
      lifecycle === 'active' ? activeAppointments : lifecycle === 'inactive' ? inactiveAppointments : appointments;

    if (status === 'all') {
      return source;
    }

    return source.filter((appointment) => appointment.status === status);
  }, [activeAppointments, appointments, inactiveAppointments, lifecycle, status]);

  return (
    <section className="page">
      <header className="page__header page__header--row">
        <div>
          <h2>Agenda</h2>
          <p>Cadastre atendimentos completos aqui. Depois vamos levar estes dados para o layout da Dashboard.</p>
        </div>
        <Link className="button button--primary" to="/appointments/new">
          Novo agendamento
        </Link>
      </header>

      <article className="card">
        <div className="filters">
          <label className="field">
            <span>Status</span>
            <select value={status} onChange={(event) => setStatus(event.target.value as AppointmentStatus | 'all')}>
              {appointmentStatusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label className="field">
            <span>Visão</span>
            <select value={lifecycle} onChange={(event) => setLifecycle(event.target.value as LifecycleFilter)}>
              <option value="active">Ativos</option>
              <option value="inactive">Inativos</option>
              <option value="all">Todos</option>
            </select>
          </label>

          <label className="field">
            <span>Tipo</span>
            <select value={type} onChange={(event) => setType(event.target.value as typeof type)}>
              {appointmentTypeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label className="field">
            <span>Busca</span>
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Título, cliente ou descrição"
            />
          </label>

          <label className="field">
            <span>Data</span>
            <div className="field__date-row">
              <input value={date} onChange={(event) => setDate(event.target.value)} type="date" />
              <button
                className="field__date-clear"
                type="button"
                onClick={() => setDate('')}
                disabled={!date}
                aria-label="Limpar data"
                title="Limpar data"
              >
                ×
              </button>
            </div>
          </label>
        </div>
      </article>

      <div className="stack">
        {error ? (
          <article className="card">
            <p className="field-error">{error}</p>
          </article>
        ) : null}
        {info ? (
          <article className="card">
            <p className="field-success">{info}</p>
          </article>
        ) : null}

        {visibleAppointments.length === 0 && !shouldShowSplitSections ? (
          <article className="card">
            <p className="empty-message">Nenhum atendimento encontrado para os filtros aplicados.</p>
          </article>
        ) : (
          <>
            {shouldShowSplitSections && activeAppointments.length > 0 ? (
              <article className="card">
                <header className="appointments-section__header">
                  <h3>Ativos</h3>
                  <p>{activeAppointments.length} compromisso(s) ativo(s).</p>
                </header>
                <div className="stack appointment-grid">
                  {activeAppointments.map((appointment) => (
                    <article className="card appointment-card" key={appointment.id}>
                      <div className="appointment-card__header">
                        <div>
                          <h3>{appointment.title}</h3>
                          <p className="appointment-card__meta">
                            {formatDate(appointment.date)}
                            {` · ${formatAppointmentTimeRange(appointment.time, appointment.endTime)}`}
                            {appointment.clientName ? ` · ${appointment.clientName}` : ''}
                          </p>
                        </div>
                        <span className={`badge badge--${appointment.status}`}>{statusLabelMap[appointment.status]}</span>
                      </div>

                      <p className="appointment-card__description">{appointment.description}</p>

                      <div className="appointment-card__actions">
                        <label className="field">
                          <span>Atualizar status</span>
                          <select
                            value={appointment.status}
                            onChange={async (event) => {
                              try {
                                setError('');
                                setInfo('');
                                await updateAppointmentStatus(appointment.id, event.target.value as AppointmentStatus);
                                setInfo('Status atualizado com sucesso.');
                              } catch {
                                setError('Falha ao atualizar status. Verifique a conexão com o backend.');
                              }
                            }}
                          >
                            {appointmentStatusOptions
                              .filter((option) => option.value !== 'all')
                              .map((option) => (
                                <option key={option.value} value={option.value}>
                                  {option.label}
                                </option>
                              ))}
                          </select>
                        </label>

                        <Link className="button button--ghost" to={`/appointments/${appointment.id}/edit`}>
                          Editar
                        </Link>
                      </div>
                    </article>
                  ))}
                </div>
              </article>
            ) : null}

            {shouldShowSplitSections && inactiveAppointments.length > 0 ? (
              <article className="card">
                <header className="appointments-section__header">
                  <h3>Inativos</h3>
                  <p>Concluídos e cancelados. Reativar volta o compromisso para status Pendente.</p>
                </header>
                <div className="stack appointment-grid">
                  {inactiveAppointments.map((appointment) => (
                    <article className="card appointment-card" key={appointment.id}>
                      <div className="appointment-card__header">
                        <div>
                          <h3>{appointment.title}</h3>
                          <p className="appointment-card__meta">
                            {formatDate(appointment.date)}
                            {` · ${formatAppointmentTimeRange(appointment.time, appointment.endTime)}`}
                            {appointment.clientName ? ` · ${appointment.clientName}` : ''}
                          </p>
                        </div>
                        <span className={`badge badge--${appointment.status}`}>{statusLabelMap[appointment.status]}</span>
                      </div>

                      <p className="appointment-card__description">{appointment.description}</p>

                      <div className="appointment-card__actions">
                        <button
                          className="button button--ghost"
                          type="button"
                          onClick={async () => {
                            try {
                              setError('');
                              setInfo('');
                              await updateAppointmentStatus(appointment.id, 'pending');
                              setInfo('Compromisso reativado e movido para Ativos com status Pendente.');
                            } catch {
                              setError('Falha ao reativar compromisso. Verifique a conexão com o backend.');
                            }
                          }}
                        >
                          Reativar
                        </button>
                        <Link className="button button--ghost" to={`/appointments/${appointment.id}/edit`}>
                          Editar
                        </Link>
                      </div>
                    </article>
                  ))}
                </div>
              </article>
            ) : null}

            {!shouldShowSplitSections ? (
              <div className="stack appointment-grid">
                {visibleAppointments.map((appointment) => (
                  <article className="card appointment-card" key={appointment.id}>
                    <div className="appointment-card__header">
                      <div>
                        <h3>{appointment.title}</h3>
                        <p className="appointment-card__meta">
                          {formatDate(appointment.date)}
                          {` · ${formatAppointmentTimeRange(appointment.time, appointment.endTime)}`}
                          {appointment.clientName ? ` · ${appointment.clientName}` : ''}
                        </p>
                      </div>
                      <span className={`badge badge--${appointment.status}`}>{statusLabelMap[appointment.status]}</span>
                    </div>

                    <p className="appointment-card__description">{appointment.description}</p>

                    <div className="appointment-card__actions">
                      {appointment.status === 'completed' || appointment.status === 'cancelled' ? (
                        <button
                          className="button button--ghost"
                          type="button"
                          onClick={async () => {
                            try {
                              setError('');
                              setInfo('');
                              await updateAppointmentStatus(appointment.id, 'pending');
                              setInfo('Compromisso reativado e movido para Ativos com status Pendente.');
                            } catch {
                              setError('Falha ao reativar compromisso. Verifique a conexão com o backend.');
                            }
                          }}
                        >
                          Reativar
                        </button>
                      ) : (
                        <label className="field">
                          <span>Atualizar status</span>
                          <select
                            value={appointment.status}
                            onChange={async (event) => {
                              try {
                                setError('');
                                setInfo('');
                                await updateAppointmentStatus(appointment.id, event.target.value as AppointmentStatus);
                                setInfo('Status atualizado com sucesso.');
                              } catch {
                                setError('Falha ao atualizar status. Verifique a conexão com o backend.');
                              }
                            }}
                          >
                            {appointmentStatusOptions
                              .filter((option) => option.value !== 'all')
                              .map((option) => (
                                <option key={option.value} value={option.value}>
                                  {option.label}
                                </option>
                              ))}
                          </select>
                        </label>
                      )}

                      <Link className="button button--ghost" to={`/appointments/${appointment.id}/edit`}>
                        Editar
                      </Link>
                    </div>
                  </article>
                ))}
              </div>
            ) : null}
          </>
        )}
      </div>
    </section>
  );
}
