import { Plus } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import {
  createBirthdayGroupRequest,
  listBirthdayGroupsRequest,
  updateBirthdayGroupRequest,
} from '../lib/api';
import type { BirthdayGroup } from '../types/shared';

type BirthdayGroupInput = Omit<BirthdayGroup, 'id' | 'createdAt' | 'updatedAt'>;

const defaultInput: BirthdayGroupInput = {
  name: '',
  description: '',
  active: true,
};

export function BirthdayGroupsPage() {
  const [groups, setGroups] = useState<BirthdayGroup[]>([]);
  const [input, setInput] = useState<BirthdayGroupInput>(defaultInput);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadGroups() {
      try {
        const response = await listBirthdayGroupsRequest();
        setGroups(response);
      } catch {
        setError('Não foi possível carregar os grupos.');
      } finally {
        setIsLoading(false);
      }
    }

    void loadGroups();
  }, []);

  const orderedGroups = useMemo(
    () => [...groups].sort((a, b) => a.name.localeCompare(b.name, 'pt-BR')),
    [groups],
  );

  function handleToggleGroupForm() {
    setIsFormOpen((current) => {
      const nextOpen = !current;
      if (nextOpen) {
        setEditingId(null);
        setInput(defaultInput);
      }
      return nextOpen;
    });
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');

    if (!input.name.trim()) {
      setError('Informe o nome do grupo.');
      return;
    }

    setIsSaving(true);

    try {
      const payload: BirthdayGroupInput = {
        name: input.name.trim(),
        description: input.description?.trim() || undefined,
        active: input.active,
      };

      if (editingId) {
        const updated = await updateBirthdayGroupRequest(editingId, payload);
        setGroups((current) => current.map((entry) => (entry.id === editingId ? updated : entry)));
      } else {
        const created = await createBirthdayGroupRequest(payload);
        setGroups((current) => [created, ...current]);
      }

      setInput(defaultInput);
      setEditingId(null);
      setIsFormOpen(false);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Não foi possível salvar o grupo.');
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <section className="page">
      <header className="page__header page__header--row">
        <div>
          <h2>Grupos de Aniversariantes</h2>
          <p>Organize contatos em grupos para aplicar fundos e templates específicos.</p>
        </div>
        <button className="button button--primary" type="button" onClick={handleToggleGroupForm}>
          <Plus size={16} />
          {isFormOpen ? 'Fechar cadastro' : 'Novo grupo'}
        </button>
      </header>

      {isFormOpen ? (
        <article className="card">
          <form className="form" onSubmit={handleSubmit}>
            <div className="grid grid--two">
              <label className="field">
                <span>Nome do grupo</span>
                <input
                  autoFocus
                  value={input.name}
                  onChange={(event) => setInput((current) => ({ ...current, name: event.target.value }))}
                  placeholder="Ex: VIP, Clientes ouro, Equipe interna"
                  required
                />
              </label>

              <label className="field">
                <span>Descrição (opcional)</span>
                <input
                  value={input.description || ''}
                  onChange={(event) => setInput((current) => ({ ...current, description: event.target.value }))}
                  placeholder="Quem faz parte deste grupo?"
                />
              </label>
            </div>

            <label className="settings-switch">
              <span className="settings-switch__text">Grupo ativo para seleção no cadastro</span>
              <span className="settings-switch__control">
                <input
                  className="settings-switch__input"
                  checked={input.active}
                  onChange={(event) => setInput((current) => ({ ...current, active: event.target.checked }))}
                  type="checkbox"
                />
                <span className="settings-switch__track" aria-hidden="true" />
              </span>
            </label>

            <div className="actions">
              {editingId ? (
                <button
                  className="button button--ghost"
                  type="button"
                  onClick={() => {
                    setEditingId(null);
                    setInput(defaultInput);
                    setIsFormOpen(false);
                  }}
                >
                  Cancelar edição
                </button>
              ) : null}
              <button className="button button--primary" type="submit" disabled={isSaving}>
                {isSaving ? 'Salvando...' : editingId ? 'Salvar edição' : 'Salvar grupo'}
              </button>
            </div>
          </form>
        </article>
      ) : null}

      <article className="card">
        {isLoading ? <p className="empty-message">Carregando grupos...</p> : null}
        {!isLoading && orderedGroups.length === 0 ? (
          <p className="empty-message">Nenhum grupo cadastrado ainda.</p>
        ) : null}
        {error ? <p className="field-error">{error}</p> : null}
        {!isLoading && orderedGroups.length > 0 ? (
          <div className="stack birthday-list birthday-groups-list">
            {orderedGroups.map((group) => (
              <article className="birthday-item" key={group.id}>
                <div className="birthday-item__head">
                  <div>
                    <h3>{group.name}</h3>
                    <p>{group.description || 'Sem descrição.'}</p>
                  </div>
                  <span className="badge">{group.active ? 'Ativo' : 'Inativo'}</span>
                </div>
                <div className="birthday-item__actions">
                  <button
                    className="button button--ghost"
                    type="button"
                    onClick={() => {
                      setEditingId(group.id);
                      setInput({
                        name: group.name,
                        description: group.description || '',
                        active: group.active,
                      });
                      setIsFormOpen(true);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                  >
                    Editar
                  </button>
                </div>
              </article>
            ))}
          </div>
        ) : null}
      </article>
    </section>
  );
}
