import { Bell, Mail, MessageCircle, Moon, ShieldUser, Sun, Users, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { triggerBirthdayNotificationsTestRequest } from '../lib/api';
import { useAppStore } from '../store/app-store';
import type { Settings } from '../types/shared';

export function SettingsPage() {
  const user = useAppStore((state) => state.user);
  const settings = useAppStore((state) => state.settings);
  const updateSettings = useAppStore((state) => state.updateSettings);

  const [form, setForm] = useState<Settings>(settings);
  const [isSaving, setIsSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error' | null>(null);
  const [toastRunId, setToastRunId] = useState(0);
  const [isTestingNotify, setIsTestingNotify] = useState(false);

  useEffect(() => {
    setForm({
      ...settings,
      theme: settings.theme === 'dark' ? 'dark' : 'light',
    });
  }, [settings]);

  useEffect(() => {
    const previewTheme = form.theme === 'dark' ? 'dark' : 'light';
    document.documentElement.dataset.theme = previewTheme;
    document.body.dataset.theme = previewTheme;
  }, [form.theme]);

  const themeChoices = useMemo(
    () => [
      { value: 'light' as const, label: 'Claro', icon: Sun },
      { value: 'dark' as const, label: 'Escuro', icon: Moon },
    ],
    [],
  );

  useEffect(() => {
    if (toastType !== 'success') {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setToastType(null);
      setToastMessage('');
    }, 3000);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [toastType, toastRunId]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);
    setToastType(null);
    setToastMessage('');

    try {
      await updateSettings(form);
      setToastType('success');
      setToastMessage('Configurações salvas com sucesso.');
      setToastRunId((current) => current + 1);
    } catch {
      setToastType('error');
      setToastMessage('Não foi possível salvar as configurações. Confira o backend.');
    } finally {
      setIsSaving(false);
    }
  }

  async function handleTestBirthdayNotifications() {
    setIsTestingNotify(true);
    setToastType(null);
    setToastMessage('');

    try {
      const result = await triggerBirthdayNotificationsTestRequest();
      const channels: string[] = [];

      if (result.inAppSent) {
        channels.push('tela');
      }
      if (result.emailSent) {
        channels.push('email');
      }
      if (result.whatsappSent) {
        channels.push('WhatsApp');
      }

      const channelsText = channels.length ? channels.join(', ') : 'nenhum canal ativo';
      const sampleNames = result.sampleNames.length ? ` (${result.sampleNames.join(', ')})` : '';

      setToastType('success');
      setToastMessage(
        `Teste concluído: ${result.totalBirthdays} aniversariante(s) hoje${sampleNames}. Canais usados: ${channelsText}.`,
      );
      setToastRunId((current) => current + 1);
    } catch {
      setToastType('error');
      setToastMessage('Falha ao executar teste de notificação. Verifique o backend e tente novamente.');
    } finally {
      setIsTestingNotify(false);
    }
  }

  return (
    <section className="page">
      {toastType ? (
        <div
          className={toastType === 'success' ? 'floating-toast floating-toast--success' : 'floating-toast floating-toast--error'}
          role="status"
          aria-live="polite"
        >
          <div className="floating-toast__content">
            <strong>{toastType === 'success' ? 'Tudo salvo' : 'Erro ao salvar'}</strong>
            <span>{toastMessage}</span>
          </div>
          {toastType === 'error' ? (
            <button className="floating-toast__close" type="button" onClick={() => setToastType(null)} aria-label="Fechar aviso">
              <X size={14} />
            </button>
          ) : null}
          {toastType === 'success' ? <div key={toastRunId} className="floating-toast__progress" /> : null}
        </div>
      ) : null}

      <header className="page__header">
        <h2>Configurações</h2>
        <p>Painel de preferências para visual, operação e acesso do projeto.</p>
      </header>

      <form className="form settings-form" onSubmit={handleSubmit}>
        <article className="card settings-card">
          <div className="settings-card__head">
            <ShieldUser size={18} />
            <h3>Negócio</h3>
          </div>
          <label className="field settings-business-field">
            <span>Nome do negócio</span>
            <input
              value={form.businessName}
              onChange={(event) => setForm((current) => ({ ...current, businessName: event.target.value }))}
              required
            />
          </label>
        </article>

        <article className="card settings-card">
          <div className="settings-card__head">
            <Sun size={18} />
            <h3>Aparência</h3>
          </div>
          <p className="settings-card__hint">Use as mesmas tonalidades do app em claro/escuro.</p>

          <div className="theme-switcher" role="radiogroup" aria-label="Tema do sistema">
            {themeChoices.map((choice) => {
              const Icon = choice.icon;
              const active = form.theme === choice.value;

              return (
                <button
                  key={choice.value}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  className={active ? 'theme-chip is-active' : 'theme-chip'}
                  onClick={() => setForm((current) => ({ ...current, theme: choice.value }))}
                >
                  <Icon size={16} />
                  {choice.label}
                </button>
              );
            })}
          </div>

          <label className="settings-switch">
            <span className="settings-switch__text">Layout compacto para ganhar espaço em tela menor</span>
            <span className="settings-switch__control">
              <input
                className="settings-switch__input"
                checked={form.compactMode}
                onChange={(event) => setForm((current) => ({ ...current, compactMode: event.target.checked }))}
                type="checkbox"
              />
              <span className="settings-switch__track" aria-hidden="true" />
            </span>
          </label>
        </article>

        <article className="card settings-card">
          <div className="settings-card__head">
            <Bell size={18} />
            <h3>Operação</h3>
          </div>
          <div className="settings-operation-grid">
            <label className="field">
              <span>Lembrete padrão (min)</span>
              <input
                value={form.defaultReminderMinutes}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    defaultReminderMinutes: Number(event.target.value),
                  }))
                }
                type="number"
                min={0}
              />
            </label>
            <div className="settings-operation-toggles">
              <label className="settings-switch settings-switch--lower">
                <span className="settings-switch__text">Notificações ativas</span>
                <span className="settings-switch__control">
                  <input
                    className="settings-switch__input"
                    checked={form.notificationsEnabled}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        notificationsEnabled: event.target.checked,
                      }))
                    }
                    type="checkbox"
                  />
                  <span className="settings-switch__track" aria-hidden="true" />
                </span>
              </label>
              <label className="settings-switch settings-switch--lower">
                <span className="settings-switch__text">Aniversariantes no menu</span>
                <span className="settings-switch__control">
                  <input
                    className="settings-switch__input"
                    checked={form.birthdaysModuleEnabled}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        birthdaysModuleEnabled: event.target.checked,
                      }))
                    }
                    type="checkbox"
                  />
                  <span className="settings-switch__track" aria-hidden="true" />
                </span>
              </label>
            </div>
          </div>
        </article>

        <article className="card settings-card">
          <div className="settings-card__head">
            <MessageCircle size={18} />
            <h3>Contato Para Alertas</h3>
          </div>
          <p className="settings-card__hint">
            Estes dados são os canais padrão deste usuário para receber aviso de aniversariantes e notificações do sistema.
          </p>

          <div className="settings-notification-grid">
            <label className="field">
              <span>Email de notificação</span>
              <input
                type="email"
                value={form.notificationEmail}
                onChange={(event) => setForm((current) => ({ ...current, notificationEmail: event.target.value }))}
                placeholder="exemplo@empresa.com"
              />
            </label>

            <label className="field">
              <span>WhatsApp de notificação</span>
              <input
                value={form.notificationWhatsapp}
                onChange={(event) => setForm((current) => ({ ...current, notificationWhatsapp: event.target.value }))}
                placeholder="+55 11 90000-0000"
              />
            </label>
          </div>

          <div className="settings-notification-channels">
            <label className="settings-switch settings-switch--lower">
              <span className="settings-switch__text">Aviso na tela do sistema</span>
              <span className="settings-switch__control">
                <input
                  className="settings-switch__input"
                  checked={form.birthdayNotifyInApp}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      birthdayNotifyInApp: event.target.checked,
                    }))
                  }
                  type="checkbox"
                />
                <span className="settings-switch__track" aria-hidden="true" />
              </span>
            </label>

            <label className="settings-switch settings-switch--lower">
              <span className="settings-switch__text">Aviso por email</span>
              <span className="settings-switch__control">
                <input
                  className="settings-switch__input"
                  checked={form.birthdayNotifyEmail}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      birthdayNotifyEmail: event.target.checked,
                    }))
                  }
                  type="checkbox"
                />
                <span className="settings-switch__track" aria-hidden="true" />
              </span>
            </label>

            <label className="settings-switch settings-switch--lower">
              <span className="settings-switch__text">Aviso por WhatsApp</span>
              <span className="settings-switch__control">
                <input
                  className="settings-switch__input"
                  checked={form.birthdayNotifyWhatsapp}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      birthdayNotifyWhatsapp: event.target.checked,
                    }))
                  }
                  type="checkbox"
                />
                <span className="settings-switch__track" aria-hidden="true" />
              </span>
            </label>
          </div>

          <div className="settings-notification-meta">
            {form.birthdayNotifyEmail ? (
              <span>
                <Mail size={14} /> Email ativo para alertas.
              </span>
            ) : null}
            {form.birthdayNotifyWhatsapp ? (
              <span>
                <MessageCircle size={14} /> WhatsApp ativo para alertas.
              </span>
            ) : null}
          </div>

          <div className="settings-notification-actions">
            <button
              type="button"
              className="button button--ghost"
              onClick={handleTestBirthdayNotifications}
              disabled={isTestingNotify}
            >
              {isTestingNotify ? 'Testando...' : 'Testar envio de notificação'}
            </button>
          </div>
        </article>

        <article className="card settings-card">
          <div className="settings-card__head">
            <Users size={18} />
            <h3>Equipe e Usuários</h3>
          </div>
          <p className="settings-card__hint">
            Hoje o projeto roda em modo single-user para portfólio. Esta área já fica preparada para múltiplos usuários.
          </p>
          <div className="settings-user-row">
            <div>
              <strong>{user?.name || 'Administrador'}</strong>
              <p>{user?.email || 'admin@agendafacilitada.com'}</p>
            </div>
            <span className="badge">Admin</span>
          </div>
          <button type="button" className="button button--ghost" disabled>
            Convidar usuário (em breve)
          </button>
        </article>

        <div className="actions">
          <button className="button button--primary" type="submit" disabled={isSaving}>
            {isSaving ? 'Salvando...' : 'Salvar configurações'}
          </button>
        </div>
      </form>
    </section>
  );
}
