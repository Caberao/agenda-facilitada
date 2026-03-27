import dayjs from 'dayjs';
import { CheckSquare, Sparkles, Square, Send, UserRoundPen } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import {
  listBirthdayBackgroundsRequest,
  listBirthdayGroupsRequest,
  listBirthdaysRequest,
  resolveApiAssetUrl,
} from '../lib/api';
import { formatDate } from '../lib/date';
import { generateBirthdayArt } from '../lib/birthday-art';
import { requestWorkspaceTab } from '../lib/workspace-tabs';
import { onlyDigits } from '../lib/utils';
import type { BirthdayBackground, BirthdayContact, BirthdayGroup } from '../types/shared';

type BatchStatus = 'pending' | 'ready' | 'error';

type BatchItemState = {
  status: BatchStatus;
  error?: string;
  artDataUrl?: string;
};

const TODAY_ISO = dayjs().format('YYYY-MM-DD');
const defaultTemplate = 'Oi, {{nome}}! Feliz aniversário! Que seu novo ciclo seja cheio de saúde e conquistas.';

function getDisplayName(contact: Pick<BirthdayContact, 'name' | 'nickname'>) {
  return contact.nickname?.trim() || contact.name.trim();
}

function renderMessage(template: string, contact: Pick<BirthdayContact, 'name' | 'nickname'>) {
  return template.replaceAll('{{nome}}', getDisplayName(contact) || 'você');
}

function normalizeSearchText(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

function pickBackgroundForContact(contact: BirthdayContact, backgrounds: BirthdayBackground[]) {
  const activeBackgrounds = backgrounds.filter((item) => item.active);
  const groupBackground = activeBackgrounds.find((item) => item.scope === 'group' && item.groupId === contact.groupId);
  if (groupBackground) {
    return groupBackground;
  }

  return activeBackgrounds.find((item) => item.scope === 'global') || null;
}

function getGroupName(groups: BirthdayGroup[], groupId?: string) {
  if (!groupId) {
    return 'Sem grupo';
  }
  return groups.find((group) => group.id === groupId)?.name || 'Grupo';
}

export function BirthdayBatchPage() {
  const [contacts, setContacts] = useState<BirthdayContact[]>([]);
  const [groups, setGroups] = useState<BirthdayGroup[]>([]);
  const [backgrounds, setBackgrounds] = useState<BirthdayBackground[]>([]);
  const [search, setSearch] = useState('');
  const [groupFilter, setGroupFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState(TODAY_ISO);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [results, setResults] = useState<Record<string, BatchItemState>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadData() {
      try {
        const [contactsResponse, groupsResponse, backgroundsResponse] = await Promise.all([
          listBirthdaysRequest(),
          listBirthdayGroupsRequest(),
          listBirthdayBackgroundsRequest(),
        ]);
        setContacts(contactsResponse);
        setGroups(groupsResponse);
        setBackgrounds(backgroundsResponse);
      } catch {
        setError('Não foi possível carregar os dados para envio em lote.');
      } finally {
        setIsLoading(false);
      }
    }

    void loadData();
  }, []);

  const filteredContacts = useMemo(() => {
    const normalizedSearch = normalizeSearchText(search);
    const normalizedDigits = onlyDigits(search);

    return contacts
      .filter((contact) => contact.active)
      .filter((contact) => (dateFilter ? contact.birthDate === dateFilter : true))
      .filter((contact) => (groupFilter === 'all' ? true : (contact.groupId || '') === groupFilter))
      .filter((contact) => {
        if (!normalizedSearch) {
          return true;
        }
        const name = normalizeSearchText(contact.name);
        const nickname = normalizeSearchText(contact.nickname || '');
        const phone = normalizeSearchText(contact.whatsapp);
        const phoneDigits = onlyDigits(contact.whatsapp);
        return (
          name.includes(normalizedSearch) ||
          nickname.includes(normalizedSearch) ||
          phone.includes(normalizedSearch) ||
          (normalizedDigits.length >= 3 && phoneDigits.includes(normalizedDigits))
        );
      })
      .sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
  }, [contacts, dateFilter, groupFilter, search]);

  useEffect(() => {
    setSelectedIds((current) => current.filter((id) => filteredContacts.some((contact) => contact.id === id)));
  }, [filteredContacts]);

  const allVisibleSelected = filteredContacts.length > 0 && filteredContacts.every((contact) => selectedIds.includes(contact.id));

  function toggleSelect(contactId: string) {
    setSelectedIds((current) =>
      current.includes(contactId) ? current.filter((id) => id !== contactId) : [...current, contactId],
    );
  }

  function toggleSelectAllVisible() {
    if (allVisibleSelected) {
      setSelectedIds((current) => current.filter((id) => !filteredContacts.some((contact) => contact.id === id)));
      return;
    }

    setSelectedIds((current) => {
      const next = new Set(current);
      for (const contact of filteredContacts) {
        next.add(contact.id);
      }
      return Array.from(next);
    });
  }

  async function generateArtForContact(contact: BirthdayContact): Promise<BatchItemState> {
    const selectedBackground = pickBackgroundForContact(contact, backgrounds);
    if (!selectedBackground) {
      return { status: 'error', error: 'Sem fundo ativo para este grupo.' };
    }
    if (!contact.photoUrl) {
      return { status: 'error', error: 'Contato sem foto.' };
    }
    if (onlyDigits(contact.whatsapp).length < 10) {
      return { status: 'error', error: 'WhatsApp inválido.' };
    }

    try {
      const artDataUrl = await generateBirthdayArt({
        backgroundUrl: resolveApiAssetUrl(selectedBackground.imageUrl),
        personPhotoUrl: resolveApiAssetUrl(contact.photoUrl),
        displayName: getDisplayName(contact),
        photoMaskShape: selectedBackground.photoMaskShape || 'circle',
        nameFontKey: selectedBackground.nameFontKey,
        layout: selectedBackground.layout,
      });

      return {
        status: 'ready',
        artDataUrl,
      };
    } catch {
      return { status: 'error', error: 'Falha ao gerar arte.' };
    }
  }

  async function handleGenerateSelected() {
    if (selectedIds.length === 0) {
      setError('Selecione ao menos um contato para gerar.');
      return;
    }

    setError('');
    setIsGenerating(true);

    const selectedContacts = filteredContacts.filter((contact) => selectedIds.includes(contact.id));
    const nextResults: Record<string, BatchItemState> = {};

    for (const contact of selectedContacts) {
      // Processamento sequencial para evitar pico de memória ao gerar várias artes.
      nextResults[contact.id] = await generateArtForContact(contact);
    }

    setResults((current) => ({ ...current, ...nextResults }));
    setIsGenerating(false);
  }

  function openWhatsApp(contact: BirthdayContact) {
    const phoneDigits = onlyDigits(contact.whatsapp);
    if (phoneDigits.length < 10) {
      setResults((current) => ({
        ...current,
        [contact.id]: { status: 'error', error: 'WhatsApp inválido para envio.' },
      }));
      return;
    }

    const message = renderMessage(contact.messageTemplate || defaultTemplate, contact);
    const url = `https://wa.me/${phoneDigits}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  }

  return (
    <section className="page">
      <header className="page__header page__header--row">
        <div>
          <h2>Envio em Lote</h2>
          <p>Filtre aniversariantes do dia, selecione quem deseja e gere as artes em um clique.</p>
        </div>
      </header>

      <article className="card">
        <div className="filters birthday-batch-filters">
          <label className="field">
            <span>Data</span>
            <div className="field__date-row birthday-filter-input-row">
              <input type="date" value={dateFilter} onChange={(event) => setDateFilter(event.target.value)} />
              <button
                className="field__date-clear birthday-filter-clear"
                type="button"
                onClick={() => setDateFilter('')}
                disabled={!dateFilter}
                aria-label="Limpar data"
                title="Limpar data"
              >
                ×
              </button>
            </div>
          </label>
          <label className="field">
            <span>Grupo</span>
            <select value={groupFilter} onChange={(event) => setGroupFilter(event.target.value)}>
              <option value="all">Todos os grupos</option>
              <option value="">Sem grupo</option>
              {groups.map((group) => (
                <option key={group.id} value={group.id}>
                  {group.name}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>Busca</span>
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Nome, apelido ou telefone"
            />
          </label>
          <div className="field">
            <span>Ações</span>
            <div className="birthday-batch__actions">
              <button className="button button--primary" type="button" onClick={toggleSelectAllVisible}>
                {allVisibleSelected ? <Square size={14} /> : <CheckSquare size={14} />}
                {allVisibleSelected ? 'Desmarcar visíveis' : 'Selecionar visíveis'}
              </button>
              <button className="button button--primary" type="button" disabled={isGenerating} onClick={() => void handleGenerateSelected()}>
                <Sparkles size={14} />
                {isGenerating ? 'Gerando...' : 'Gerar artes dos selecionados'}
              </button>
            </div>
          </div>
        </div>
      </article>

      <article className="card">
        {isLoading ? <p className="empty-message">Carregando contatos...</p> : null}
        {!isLoading && filteredContacts.length === 0 ? (
          <p className="empty-message">Nenhum contato encontrado para os filtros aplicados.</p>
        ) : null}
        {error ? <p className="field-error">{error}</p> : null}
        {!isLoading && filteredContacts.length > 0 ? (
          <div className="stack birthday-list">
            {filteredContacts.map((contact) => {
              const result = results[contact.id];
              const isSelected = selectedIds.includes(contact.id);

              return (
                <article className="birthday-item" key={contact.id}>
                  <div className="birthday-item__head">
                    <div>
                      <h3>{getDisplayName(contact)}</h3>
                      <p>
                        {contact.whatsapp} · {formatDate(contact.birthDate)} · {getGroupName(groups, contact.groupId)}
                      </p>
                    </div>
                    <label className="birthday-batch__select">
                      <input type="checkbox" checked={isSelected} onChange={() => toggleSelect(contact.id)} />
                      <span>Selecionar</span>
                    </label>
                  </div>

                  {result?.artDataUrl ? (
                    <div className="birthday-background-preview birthday-background-preview--small">
                      <img src={result.artDataUrl} alt={`Arte gerada para ${getDisplayName(contact)}`} />
                    </div>
                  ) : null}

                  <p className="birthday-item__message">
                    {result?.status === 'ready' ? 'Pronto para envio.' : result?.error || 'Pendente de geração.'}
                  </p>

                  <div className="birthday-item__actions">
                    <button
                      className="button button--ghost"
                      type="button"
                      onClick={() =>
                        requestWorkspaceTab({
                          path: '/birthdays/contacts',
                          label: 'Aniversários · Contatos',
                        })
                      }
                    >
                      <UserRoundPen size={14} />
                      Corrigir contato
                    </button>
                    <button className="button button--ghost" type="button" onClick={() => openWhatsApp(contact)}>
                      <Send size={14} />
                      Abrir envio
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        ) : null}
      </article>
    </section>
  );
}
