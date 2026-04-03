import { Mic, MicOff, WandSparkles } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { appointmentStatusOptions, appointmentTypeOptions } from '../features/appointments/constants';
import { getRegistrationRequest } from '../lib/api';
import { formatDate } from '../lib/date';
import {
  MOBILE_VOICE_HOTWORD,
  parseVoiceAppointment,
  stripMobileHotword,
  stripVoiceHotword,
  VOICE_HOTWORD,
} from '../lib/voice-appointment';
import { formatPhoneInput, onlyDigits } from '../lib/utils';
import { useAppStore } from '../store/app-store';
import type { Appointment, RegistrationType } from '../types/shared';

interface AppointmentFormPageProps {
  mode: 'create' | 'edit';
}

type PjAgendaMode = 'company' | 'clients';

type AppointmentInput = Omit<Appointment, 'id' | 'createdAt' | 'updatedAt' | 'scheduledAt'>;
type VoicePreview = ReturnType<typeof parseVoiceAppointment>;

const defaultInput: AppointmentInput = {
  title: '',
  description: '',
  date: '',
  time: '',
  endTime: '',
  type: 'appointment',
  status: 'pending',
  clientId: undefined,
  clientName: '',
  clientPhone: '',
  observations: '',
  reminderEnabled: true,
  reminderMinutesBefore: 30,
};

function toInput(appointment: Appointment): AppointmentInput {
  return {
    title: appointment.title,
    description: appointment.description,
    date: appointment.date,
    time: appointment.time,
    endTime: appointment.endTime || '',
    type: appointment.type,
    status: appointment.status,
    clientId: appointment.clientId,
    clientName: appointment.clientName || '',
    clientPhone: appointment.clientPhone || '',
    observations: appointment.observations || '',
    reminderEnabled: appointment.reminderEnabled,
    reminderMinutesBefore: appointment.reminderMinutesBefore,
  };
}

export function AppointmentFormPage({ mode }: AppointmentFormPageProps) {
  const navigate = useNavigate();
  const params = useParams<{ id: string }>();

  const clients = useAppStore((state) => state.clients);
  const getAppointmentById = useAppStore((state) => state.getAppointmentById);
  const createAppointment = useAppStore((state) => state.createAppointment);
  const updateAppointment = useAppStore((state) => state.updateAppointment);
  const deleteAppointment = useAppStore((state) => state.deleteAppointment);

  const appointment = useMemo(
    () => (mode === 'edit' && params.id ? getAppointmentById(params.id) : undefined),
    [getAppointmentById, mode, params.id],
  );

  const [input, setInput] = useState<AppointmentInput>(() => (appointment ? toInput(appointment) : defaultInput));
  const [registrationType, setRegistrationType] = useState<RegistrationType>('pj');
  const [pjAgendaMode, setPjAgendaMode] = useState<PjAgendaMode>(() =>
    appointment?.clientName || appointment?.clientId ? 'clients' : 'company',
  );
  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [voiceTranscript, setVoiceTranscript] = useState('');
  const [voicePreview, setVoicePreview] = useState<VoicePreview | null>(null);
  const [voiceError, setVoiceError] = useState('');
  const [voiceInfo, setVoiceInfo] = useState('');
  const [isListening, setIsListening] = useState(false);
  const speechRecognitionRef = useRef<BrowserSpeechRecognition | null>(null);
  const transcriptRef = useRef('');
  const [isMobileLayout, setIsMobileLayout] = useState(false);
  const [mobileHotwordEnabled, setMobileHotwordEnabled] = useState(() => {
    return localStorage.getItem('agenda_mobile_hotword_enabled') === '1';
  });
  const [mobileHotwordStatus, setMobileHotwordStatus] = useState('Escuta contínua desativada.');
  const hotwordRecognitionRef = useRef<BrowserSpeechRecognition | null>(null);
  const hotwordTranscriptRef = useRef('');
  const lastHotwordCommandRef = useRef('');

  useEffect(() => {
    let isCancelled = false;

    async function loadRegistrationType() {
      try {
        const registration = await getRegistrationRequest();
        if (!isCancelled) {
          setRegistrationType(registration.type);
        }
      } catch {
        if (!isCancelled) {
          setRegistrationType('pj');
        }
      }
    }

    void loadRegistrationType();

    return () => {
      isCancelled = true;
    };
  }, []);

  const isPersonalAgenda = registrationType === 'pf';
  const isPjAgenda = registrationType === 'pj';
  const isPjClientsAgenda = isPjAgenda && pjAgendaMode === 'clients';

  useEffect(() => {
    return () => {
      speechRecognitionRef.current?.stop();
      speechRecognitionRef.current = null;
      hotwordRecognitionRef.current?.stop();
      hotwordRecognitionRef.current = null;
    };
  }, []);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(max-width: 768px)');
    const syncLayout = () => {
      setIsMobileLayout(mediaQuery.matches);
    };

    syncLayout();
    mediaQuery.addEventListener('change', syncLayout);
    return () => {
      mediaQuery.removeEventListener('change', syncLayout);
    };
  }, []);

  useEffect(() => {
    localStorage.setItem('agenda_mobile_hotword_enabled', mobileHotwordEnabled ? '1' : '0');
  }, [mobileHotwordEnabled]);

  useEffect(() => {
    if (!isMobileLayout || !mobileHotwordEnabled || isListening) {
      stopMobileHotwordRecognition();
      if (!mobileHotwordEnabled) {
        setMobileHotwordStatus('Escuta contínua desativada.');
      }
      return;
    }

    startMobileHotwordRecognition();

    return () => {
      stopMobileHotwordRecognition();
    };
  }, [isMobileLayout, mobileHotwordEnabled, isListening]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!input.title.trim() || !input.date || !input.time) {
      setError('Preencha compromisso, data e hora inicial.');
      return;
    }

    if (isPjClientsAgenda && !input.clientName?.trim()) {
      setError('Informe o nome do cliente para agenda de clientes.');
      return;
    }

    if (isPjClientsAgenda && onlyDigits(input.clientPhone || '').length < 10) {
      setError('Informe um telefone válido para o cliente.');
      return;
    }

    if (input.endTime && input.endTime <= input.time) {
      setError('A hora final deve ser maior que a hora inicial.');
      return;
    }

    const normalizedDescription = input.description.trim() || input.title.trim();

    const payload: AppointmentInput = {
      ...input,
      title: input.title.trim(),
      description: normalizedDescription,
      ...(input.endTime ? { endTime: input.endTime } : {}),
      ...(isPjClientsAgenda ? { clientName: (input.clientName || '').trim() } : { clientName: undefined }),
      ...(isPjClientsAgenda ? { clientPhone: input.clientPhone?.trim() || undefined } : { clientPhone: undefined }),
      observations: input.observations?.trim() || undefined,
      ...(isPjClientsAgenda ? { clientId: input.clientId || undefined } : { clientId: undefined }),
      ...(isPersonalAgenda ? { type: 'personal' } : {}),
    };

    setIsSaving(true);

    try {
      if (mode === 'create') {
        await createAppointment(payload);
      } else if (mode === 'edit' && params.id) {
        await updateAppointment(params.id, payload);
      }

      setError('');
      navigate('/appointments');
    } catch {
      setError('Não foi possível salvar no servidor. Verifique se o backend está ativo.');
    } finally {
      setIsSaving(false);
    }
  }

  function startVoiceCapture() {
    setVoiceError('');
    setVoiceInfo('');
    stopMobileHotwordRecognition();

    const recognition = createSpeechRecognition();
    if (!recognition) {
      setVoiceError('Seu navegador não suporta captura de voz. Use Chrome/Edge recente.');
      return;
    }

    speechRecognitionRef.current = recognition;
    setIsListening(true);
    setVoiceTranscript('');
    transcriptRef.current = '';
    setVoicePreview(null);

    recognition.onresult = (event: SpeechRecognitionEventLike) => {
      const chunks: string[] = [];
      const finalChunks: string[] = [];

      for (let index = 0; index < event.results.length; index += 1) {
        const result = event.results[index];
        const chunk = result?.[0]?.transcript || '';
        if (chunk) {
          chunks.push(chunk);
          if (result?.isFinal) {
            finalChunks.push(chunk);
          }
        }
      }

      const preferredChunks = finalChunks.length > 0 ? finalChunks : chunks;
      const text = preferredChunks.join(' ').replace(/\s+/g, ' ').trim();
      transcriptRef.current = text;
      setVoiceTranscript(text);
    };

    recognition.onerror = () => {
      setVoiceError('Falha ao capturar áudio. Verifique permissão do microfone.');
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
      const mergedText = (transcriptRef.current || voiceTranscript).trim();
      if (mergedText) {
        const stripped = stripVoiceHotword(mergedText);
        const commandText = stripped === null ? mergedText : stripped;
        if (!commandText) {
          setVoicePreview(null);
          setVoiceError('Depois do gatilho, diga o compromisso. Ex: "agenda facilitada reunião amanhã às 15h".');
          return;
        }

        const parsed = parseVoiceAppointment(commandText, new Date());
        if (stripped === null) {
          parsed.warnings.unshift(`Gatilho "${VOICE_HOTWORD}" não detectado; comando interpretado mesmo assim.`);
        }

        setVoicePreview(parsed);
        applyParsedToForm(parsed);
        setVoiceInfo('Comando reconhecido e aplicado no formulário. Revise e clique em criar agendamento.');
      }
    };

    recognition.start();
  }

  function stopVoiceCapture() {
    speechRecognitionRef.current?.stop();
    speechRecognitionRef.current = null;
    setIsListening(false);
  }

  function applyVoicePreview() {
    if (!voicePreview) {
      return;
    }

    applyParsedToForm(voicePreview);
    setVoiceInfo('Comando aplicado no formulário.');
    setVoiceError('');
  }

  function applyParsedToForm(parsed: VoicePreview) {
    setInput((current) => ({
      ...current,
      title: parsed.title,
      description: parsed.description,
      date: parsed.date,
      time: parsed.time,
      endTime: parsed.endTime || '',
      reminderEnabled: parsed.reminderEnabled,
      reminderMinutesBefore: parsed.reminderMinutesBefore,
    }));
    setError('');
  }

  function startMobileHotwordRecognition() {
    const recognition = createSpeechRecognition();
    if (!recognition) {
      setMobileHotwordStatus('Navegador sem suporte à escuta contínua.');
      return;
    }

    hotwordRecognitionRef.current = recognition;
    hotwordTranscriptRef.current = '';
    setMobileHotwordStatus(`Escutando "${MOBILE_VOICE_HOTWORD}"...`);

    recognition.onresult = (event: SpeechRecognitionEventLike) => {
      const text = extractRecognitionText(event);
      hotwordTranscriptRef.current = text;
    };

    recognition.onerror = () => {
      setMobileHotwordStatus('Falha no microfone da escuta contínua.');
    };

    recognition.onend = () => {
      const transcript = hotwordTranscriptRef.current.trim();
      if (transcript) {
        const command = stripMobileHotword(transcript);
        if (command && command !== lastHotwordCommandRef.current) {
          const parsed = parseVoiceAppointment(command, new Date());
          setVoicePreview(parsed);
          applyParsedToForm(parsed);
          setVoiceInfo(`Comando por hotword detectado: ${command}`);
          setMobileHotwordStatus('Comando aplicado no formulário.');
          lastHotwordCommandRef.current = command;
        } else {
          setMobileHotwordStatus(`Escutando "${MOBILE_VOICE_HOTWORD}"...`);
        }
      }

      if (isMobileLayout && mobileHotwordEnabled && !isListening) {
        window.setTimeout(() => {
          startMobileHotwordRecognition();
        }, 260);
      }
    };

    recognition.start();
  }

  function stopMobileHotwordRecognition() {
    hotwordRecognitionRef.current?.stop();
    hotwordRecognitionRef.current = null;
  }

  function handleClientChange(value: string) {
    const client = clients.find((entry) => entry.id === value);

    if (!client) {
      setInput((current) => ({
        ...current,
        clientId: undefined,
      }));
      return;
    }

    setInput((current) => ({
      ...current,
      clientId: client.id,
      clientName: client.name,
      clientPhone: client.phone,
    }));
  }

  if (mode === 'edit' && !appointment) {
    return (
      <section className="page">
        <article className="card">
          <h2>Agendamento não encontrado</h2>
          <p className="empty-message">Não foi possível localizar esse registro.</p>
          <Link className="button button--primary" to="/appointments">
            Voltar para agenda
          </Link>
        </article>
      </section>
    );
  }

  return (
    <section className="page">
      <header className={isPersonalAgenda ? 'page__header page__header--row' : 'page__header'}>
        <div>
          <h2>{mode === 'create' ? (isPersonalAgenda ? 'Novo compromisso pessoal' : 'Novo agendamento') : 'Editar agendamento'}</h2>
          <p>
            {isPersonalAgenda
              ? 'Modo pessoal (PF): informe compromisso, data, hora inicial e hora final opcional.'
              : isPjClientsAgenda
                ? 'Modo PJ - Agenda de clientes: registre os dados do cliente e do atendimento.'
                : 'Modo PJ - Agenda da empresa: organize compromissos internos da equipe.'}
          </p>
        </div>
        {isPersonalAgenda ? (
          <div className="actions">
            <Link className="button button--ghost" to="/appointments">
              Cancelar
            </Link>
            <button className="button button--primary" type="submit" form="appointment-form" disabled={isSaving}>
              {isSaving ? 'Salvando...' : mode === 'create' ? 'Criar agendamento' : 'Salvar alterações'}
            </button>
          </div>
        ) : null}
      </header>

      <article className="card">
        <form id="appointment-form" className="form" onSubmit={handleSubmit}>
          <article className="voice-assistant">
            <div className="voice-assistant__head">
              <strong>Lançamento por voz</strong>
              <span>
                Comece com o gatilho <strong>"{VOICE_HOTWORD}"</strong>. Ex: "agenda facilitada reunião com Zico amanhã às
                15h, me avisar 15 minutos antes".
              </span>
            </div>
            <div className="voice-assistant__actions">
              {!isListening ? (
                <button className="button button--ghost" type="button" onClick={startVoiceCapture}>
                  <Mic size={16} />
                  Falar compromisso
                </button>
              ) : (
                <button className="button button--danger" type="button" onClick={stopVoiceCapture}>
                  <MicOff size={16} />
                  Parar gravação
                </button>
              )}
              <button
                className="button button--primary"
                type="button"
                onClick={applyVoicePreview}
                disabled={!voicePreview || !voicePreview.time}
              >
                <WandSparkles size={16} />
                Aplicar no formulário
              </button>
            </div>
            {voiceTranscript ? <p className="field-help-inline">Transcrição: {voiceTranscript}</p> : null}
            {voiceError ? <p className="field-error-inline">{voiceError}</p> : null}
            {voiceInfo ? <p className="field-success">{voiceInfo}</p> : null}
            {voicePreview ? (
              <div className="voice-preview">
                <p>
                  <strong>Título:</strong> {voicePreview.title}
                </p>
                <p>
                  <strong>Data:</strong> {formatDate(voicePreview.date)}
                </p>
                <p>
                  <strong>Hora:</strong> {voicePreview.time || 'não detectada'}
                  {voicePreview.endTime ? ` até ${voicePreview.endTime}` : ''}
                </p>
                <p>
                  <strong>Lembrete:</strong>{' '}
                  {voicePreview.reminderEnabled ? `${voicePreview.reminderMinutesBefore} min antes` : 'desligado'}
                </p>
                {voicePreview.warnings.length > 0 ? (
                  <p className="field-error-inline">{voicePreview.warnings.join(' ')}</p>
                ) : null}
              </div>
            ) : null}
          </article>

          {isMobileLayout ? (
            <article className="voice-assistant voice-assistant--mobile">
              <div className="voice-assistant__head">
                <strong>Mobile · Escuta contínua (experimental)</strong>
                <span>Diga "{MOBILE_VOICE_HOTWORD}" e em seguida o compromisso. Ex: "ok facilita reunião amanhã às 10h".</span>
              </div>
              <label className="field field--inline">
                <input
                  checked={mobileHotwordEnabled}
                  onChange={(event) => setMobileHotwordEnabled(event.target.checked)}
                  type="checkbox"
                />
                <span>Ativar escuta contínua no mobile</span>
              </label>
              <p className="field-help-inline">{mobileHotwordStatus}</p>
            </article>
          ) : null}

          {isPjAgenda ? (
            <div className="agenda-mode-switcher" role="radiogroup" aria-label="Modo da agenda PJ">
              <button
                type="button"
                role="radio"
                aria-checked={pjAgendaMode === 'company'}
                className={pjAgendaMode === 'company' ? 'agenda-mode-chip is-active' : 'agenda-mode-chip'}
                onClick={() => setPjAgendaMode('company')}
              >
                Agenda da empresa
              </button>
              <button
                type="button"
                role="radio"
                aria-checked={pjAgendaMode === 'clients'}
                className={pjAgendaMode === 'clients' ? 'agenda-mode-chip is-active' : 'agenda-mode-chip'}
                onClick={() => setPjAgendaMode('clients')}
              >
                Agenda de clientes
              </button>
            </div>
          ) : null}

          <div className={isPersonalAgenda || !isPjClientsAgenda ? 'grid grid--one' : 'grid grid--two'}>
            <label className="field">
              <span>{isPersonalAgenda ? 'Compromisso' : 'Título'}</span>
              <input
                autoFocus={mode === 'create'}
                value={input.title}
                onChange={(event) => setInput((current) => ({ ...current, title: event.target.value }))}
                required
              />
            </label>

            {isPjClientsAgenda ? (
              <label className="field">
                <span>Cliente</span>
                <select value={input.clientId || ''} onChange={(event) => handleClientChange(event.target.value)}>
                  <option value="">Sem cliente vinculado</option>
                  {clients.map((client) => (
                    <option key={client.id} value={client.id}>
                      {client.name}
                    </option>
                  ))}
                </select>
              </label>
            ) : null}
          </div>

          {isPjClientsAgenda ? (
            <div className="grid grid--two">
              <label className="field">
                <span>Nome do cliente</span>
                <input
                  value={input.clientName || ''}
                  onChange={(event) => setInput((current) => ({ ...current, clientName: event.target.value }))}
                  placeholder="Ex: Fernanda Alves"
                  required
                />
              </label>

              <label className="field">
                <span>Telefone do cliente</span>
                <input
                  value={input.clientPhone || ''}
                  onChange={(event) =>
                    setInput((current) => ({
                      ...current,
                      clientPhone: formatPhoneInput(event.target.value),
                    }))
                  }
                  placeholder="+55 11 90000-0000"
                  required
                />
              </label>
            </div>
          ) : null}

          {!isPersonalAgenda ? (
            <label className="field">
              <span>Descrição</span>
              <textarea
                value={input.description}
                onChange={(event) => setInput((current) => ({ ...current, description: event.target.value }))}
                rows={3}
                required
              />
            </label>
          ) : null}

          <div className="grid grid--five">
            <label className="field">
              <span>Data</span>
              <input
                value={input.date}
                onChange={(event) => setInput((current) => ({ ...current, date: event.target.value }))}
                type="date"
                required
              />
            </label>

            <label className="field">
              <span>Hora inicial</span>
              <input
                value={input.time}
                onChange={(event) => setInput((current) => ({ ...current, time: event.target.value }))}
                type="time"
                required
              />
            </label>

            <label className="field">
              <span>Hora final (opcional)</span>
              <input
                value={input.endTime || ''}
                onChange={(event) => setInput((current) => ({ ...current, endTime: event.target.value }))}
                type="time"
              />
            </label>

            <label className="field">
              <span>Lembrete (min)</span>
              <input
                value={input.reminderMinutesBefore}
                onChange={(event) =>
                  setInput((current) => ({
                    ...current,
                    reminderMinutesBefore: Number(event.target.value),
                  }))
                }
                type="number"
                min={0}
              />
            </label>

            <label className="field">
              <span>Status</span>
              <select
                value={input.status}
                onChange={(event) =>
                  setInput((current) => ({ ...current, status: event.target.value as Appointment['status'] }))
                }
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
          </div>
          <p className="field-help-inline">Se quiser só lembrete, deixe apenas a hora inicial.</p>

          {!isPersonalAgenda ? (
            <div className="grid grid--one">
              <label className="field">
                <span>Tipo</span>
                <select
                  value={input.type}
                  onChange={(event) =>
                    setInput((current) => ({ ...current, type: event.target.value as Appointment['type'] }))
                  }
                >
                  {appointmentTypeOptions
                    .filter((option) => option.value !== 'all')
                    .map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                </select>
              </label>
            </div>
          ) : null}

          <label className="field field--inline">
            <input
              checked={input.reminderEnabled}
              onChange={(event) => setInput((current) => ({ ...current, reminderEnabled: event.target.checked }))}
              type="checkbox"
            />
            <span>Ativar lembrete para este compromisso</span>
          </label>

          <p className="field-help-inline">
            Próxima evolução planejada: lembrete visual na tela + som configurável por preferência.
          </p>

          <label className="field">
            <span>Observações</span>
            <textarea
              value={input.observations || ''}
              onChange={(event) => setInput((current) => ({ ...current, observations: event.target.value }))}
              rows={3}
            />
          </label>

          {error ? <p className="field-error">{error}</p> : null}

          {!isPersonalAgenda ? (
            <div className="actions">
              {mode === 'edit' && params.id ? (
                <button
                  className="button button--danger"
                  type="button"
                  onClick={async () => {
                    if (!params.id) {
                      return;
                    }

                    const shouldDelete = window.confirm('Deseja excluir este agendamento? Esta ação não pode ser desfeita.');
                    if (!shouldDelete) {
                      return;
                    }

                    try {
                      setError('');
                      await deleteAppointment(params.id);
                      navigate('/appointments');
                    } catch {
                      setError('Não foi possível excluir o agendamento. Verifique a conexão com o backend.');
                    }
                  }}
                >
                  Excluir agendamento
                </button>
              ) : null}
              <Link className="button button--ghost" to="/appointments">
                Cancelar
              </Link>
              <button className="button button--primary" type="submit" disabled={isSaving}>
                {isSaving ? 'Salvando...' : mode === 'create' ? 'Criar agendamento' : 'Salvar alterações'}
              </button>
            </div>
          ) : null}
        </form>
      </article>
    </section>
  );
}

interface SpeechRecognitionAlternativeLike {
  transcript: string;
}

interface SpeechRecognitionResultLike {
  0: SpeechRecognitionAlternativeLike;
  isFinal?: boolean;
}

interface SpeechRecognitionEventLike {
  resultIndex: number;
  results: {
    length: number;
    [index: number]: SpeechRecognitionResultLike | undefined;
  };
}

interface BrowserSpeechRecognition {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
}

type SpeechRecognitionConstructor = new () => BrowserSpeechRecognition;

function createSpeechRecognition() {
  const maybeWindow = window as Window & {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  };

  const Constructor = maybeWindow.SpeechRecognition || maybeWindow.webkitSpeechRecognition;
  if (!Constructor) {
    return null;
  }

  const recognition = new Constructor();
  recognition.lang = 'pt-BR';
  recognition.interimResults = true;
  recognition.continuous = true;
  recognition.onresult = null;
  recognition.onerror = null;
  recognition.onend = null;

  return recognition;
}

function extractRecognitionText(event: SpeechRecognitionEventLike) {
  const chunks: string[] = [];
  const finalChunks: string[] = [];

  for (let index = 0; index < event.results.length; index += 1) {
    const result = event.results[index];
    const chunk = result?.[0]?.transcript || '';
    if (chunk) {
      chunks.push(chunk);
      if (result?.isFinal) {
        finalChunks.push(chunk);
      }
    }
  }

  const preferredChunks = finalChunks.length > 0 ? finalChunks : chunks;
  return preferredChunks.join(' ').replace(/\s+/g, ' ').trim();
}
