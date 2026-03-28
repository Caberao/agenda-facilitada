import { useMemo, useState } from 'react';
import { Plus, Save, Trash2, UserCog } from 'lucide-react';

type DatabaseProvider = 'supabase' | 'local' | 'hybrid';

interface ManagedAccessUser {
  id: string;
  name: string;
  email: string;
  role: 'owner' | 'admin' | 'operator';
  maxSubUsers: number;
  databaseProvider: DatabaseProvider;
  workspaceCode: string;
  active: boolean;
}

const storageKey = 'agenda_facilitada_admin_access_users_v1';

function createUser(): ManagedAccessUser {
  return {
    id: `usr_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
    name: '',
    email: '',
    role: 'operator',
    maxSubUsers: 2,
    databaseProvider: 'supabase',
    workspaceCode: '',
    active: true,
  };
}

function loadUsers() {
  try {
    const raw = localStorage.getItem(storageKey);
    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw) as ManagedAccessUser[];
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed;
  } catch {
    return [];
  }
}

export function AdminAccessPage() {
  const [users, setUsers] = useState<ManagedAccessUser[]>(() => loadUsers());
  const [toast, setToast] = useState<string | null>(null);
  const [toastType, setToastType] = useState<'success' | 'error'>('success');
  const [toastRunId, setToastRunId] = useState(0);

  const hasErrors = useMemo(
    () => users.some((user) => !user.name.trim() || !user.email.trim() || !user.workspaceCode.trim()),
    [users],
  );

  function updateUser(id: string, partial: Partial<ManagedAccessUser>) {
    setUsers((current) => current.map((item) => (item.id === id ? { ...item, ...partial } : item)));
  }

  function addUser() {
    setUsers((current) => [createUser(), ...current]);
  }

  function removeUser(id: string) {
    setUsers((current) => current.filter((item) => item.id !== id));
  }

  function saveUsers() {
    if (hasErrors) {
      setToastType('error');
      setToast('Preencha nome, email e código do espaço para todos os usuários.');
      return;
    }

    localStorage.setItem(storageKey, JSON.stringify(users));
    setToastType('success');
    setToast('Configuração de acessos salva com sucesso.');
    setToastRunId((current) => current + 1);
  }

  return (
    <section className="page">
      {toast ? (
        <article
          className={toastType === 'success' ? 'floating-toast floating-toast--success' : 'floating-toast floating-toast--error'}
          role="status"
          aria-live="polite"
        >
          <div className="floating-toast__content">
            <strong>{toastType === 'success' ? 'Tudo salvo' : 'Ajuste necessário'}</strong>
            <span>{toast}</span>
          </div>
          {toastType === 'error' ? (
            <button className="floating-toast__close" type="button" onClick={() => setToast(null)} aria-label="Fechar aviso">
              ×
            </button>
          ) : (
            <div key={toastRunId} className="floating-toast__progress" />
          )}
        </article>
      ) : null}

      <header className="page__header page__header--row">
        <div>
          <h2>Admin de Acessos</h2>
          <p>Gerencie usuários, limite de subusuários e qual banco cada conta vai usar.</p>
        </div>
        <div className="actions">
          <button className="button button--ghost" type="button" onClick={addUser}>
            <Plus size={16} />
            Novo usuário
          </button>
          <button className="button button--primary" type="button" onClick={saveUsers}>
            <Save size={16} />
            Salvar configuração
          </button>
        </div>
      </header>

      <section className="admin-access-grid">
        {users.length === 0 ? (
          <article className="card">
            <p className="empty-message">Nenhum usuário configurado ainda. Clique em “Novo usuário”.</p>
          </article>
        ) : null}

        {users.map((user) => (
          <article className="card admin-access-card" key={user.id}>
            <header className="admin-access-card__header">
              <h3>
                <UserCog size={16} />
                Usuário
              </h3>
              <button className="button button--danger" type="button" onClick={() => removeUser(user.id)}>
                <Trash2 size={14} />
                Remover
              </button>
            </header>

            <div className="admin-access-card__fields">
              <label className="field">
                <span>Nome</span>
                <input value={user.name} onChange={(event) => updateUser(user.id, { name: event.target.value })} />
              </label>

              <label className="field">
                <span>Email</span>
                <input
                  type="email"
                  value={user.email}
                  onChange={(event) => updateUser(user.id, { email: event.target.value })}
                />
              </label>

              <label className="field">
                <span>Perfil</span>
                <select value={user.role} onChange={(event) => updateUser(user.id, { role: event.target.value as ManagedAccessUser['role'] })}>
                  <option value="owner">Owner</option>
                  <option value="admin">Admin</option>
                  <option value="operator">Operador</option>
                </select>
              </label>

              <label className="field">
                <span>Limite de subusuários</span>
                <input
                  type="number"
                  min={0}
                  max={20}
                  value={user.maxSubUsers}
                  onChange={(event) => updateUser(user.id, { maxSubUsers: Math.max(0, Number(event.target.value) || 0) })}
                />
              </label>

              <label className="field">
                <span>Banco deste usuário</span>
                <select
                  value={user.databaseProvider}
                  onChange={(event) => updateUser(user.id, { databaseProvider: event.target.value as DatabaseProvider })}
                >
                  <option value="supabase">Supabase</option>
                  <option value="local">Local</option>
                  <option value="hybrid">Híbrido (Supabase + cache local)</option>
                </select>
              </label>

              <label className="field">
                <span>Código do espaço (tenant/workspace)</span>
                <input
                  placeholder="ex.: igreja-centro"
                  value={user.workspaceCode}
                  onChange={(event) => updateUser(user.id, { workspaceCode: event.target.value })}
                />
              </label>

              <label className="field field--inline">
                <input type="checkbox" checked={user.active} onChange={(event) => updateUser(user.id, { active: event.target.checked })} />
                <span>Usuário ativo</span>
              </label>
            </div>
          </article>
        ))}
      </section>
    </section>
  );
}
