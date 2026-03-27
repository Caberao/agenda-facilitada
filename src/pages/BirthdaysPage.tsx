import { Download, ImagePlus, MessageCircle, Plus, Sparkles, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import {
  createBirthdayRequest,
  listBirthdayBackgroundsRequest,
  listBirthdayGroupsRequest,
  listBirthdaysRequest,
  resolveApiAssetUrl,
  updateBirthdayRequest,
  uploadImageAssetRequest,
} from '../lib/api';
import { generateBirthdayArt } from '../lib/birthday-art';
import { formatDate } from '../lib/date';
import { formatPhoneInput, onlyDigits } from '../lib/utils';
import type { BirthdayBackground, BirthdayContact, BirthdayGroup } from '../types/shared';

type BirthdayInput = Omit<BirthdayContact, 'id' | 'createdAt' | 'updatedAt'>;

const defaultTemplate = 'Oi, {{nome}}! Feliz aniversário! Que seu novo ciclo seja cheio de saúde e conquistas.';
const CARDS_PER_PAGE = 5;
const TODAY_ISO = new Date().toISOString().slice(0, 10);

const defaultInput: BirthdayInput = {
  name: '',
  nickname: '',
  whatsapp: '',
  birthDate: '',
  groupId: '',
  photoUrl: '',
  notes: '',
  messageTemplate: defaultTemplate,
  source: 'local',
  externalRef: '',
  active: true,
};

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

export function BirthdaysContactsPage() {
  const [birthdays, setBirthdays] = useState<BirthdayContact[]>([]);
  const [groups, setGroups] = useState<BirthdayGroup[]>([]);
  const [backgrounds, setBackgrounds] = useState<BirthdayBackground[]>([]);
  const [input, setInput] = useState<BirthdayInput>(defaultInput);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [isGeneratingForId, setIsGeneratingForId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error' | null>(null);
  const [toastRunId, setToastRunId] = useState(0);
  const [generatedArt, setGeneratedArt] = useState<{ contactId: string; contactName: string; dataUrl: string } | null>(null);
  const [isArtModalOpen, setIsArtModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [groupFilter, setGroupFilter] = useState('all');
  const [birthDateFilter, setBirthDateFilter] = useState(TODAY_ISO);
  const [currentPage, setCurrentPage] = useState(1);

  function handleToggleContactForm() {
    setIsFormOpen((current) => {
      const nextOpen = !current;
      if (nextOpen) {
        setEditingId(null);
        setInput(defaultInput);
      }
      return nextOpen;
    });
  }

  useEffect(() => {
    async function loadData() {
      try {
        const [birthdayResponse, groupResponse, backgroundResponse] = await Promise.all([
          listBirthdaysRequest(),
          listBirthdayGroupsRequest(),
          listBirthdayBackgroundsRequest(),
        ]);

        setBirthdays(birthdayResponse);
        setGroups(groupResponse);
        setBackgrounds(backgroundResponse);
      } catch {
        setToastType('error');
        setToastMessage('Não foi possível carregar aniversariantes.');
      } finally {
        setIsLoading(false);
      }
    }

    void loadData();
  }, []);

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
  }, [toastRunId, toastType]);

  const upcoming = useMemo(
    () => [...birthdays].sort((a, b) => new Date(a.birthDate).getTime() - new Date(b.birthDate).getTime()),
    [birthdays],
  );
  const filteredUpcoming = useMemo(() => {
    const normalizedSearch = normalizeSearchText(searchTerm);
    const normalizedSearchDigits = onlyDigits(searchTerm);

    return upcoming.filter((entry) => {
      const matchGroup = groupFilter === 'all' ? true : (entry.groupId || '') === groupFilter;
      const matchBirthDate = birthDateFilter ? entry.birthDate === birthDateFilter : true;

      if (!normalizedSearch) {
        return matchGroup && matchBirthDate;
      }

      const displayName = normalizeSearchText(getDisplayName(entry));
      const fullName = normalizeSearchText(entry.name);
      const whatsappDigits = onlyDigits(entry.whatsapp);
      const matchName = displayName.includes(normalizedSearch) || fullName.includes(normalizedSearch);
      const matchPhone =
        entry.whatsapp.toLowerCase().includes(normalizedSearch) ||
        (normalizedSearchDigits.length >= 3 && whatsappDigits.includes(normalizedSearchDigits));

      return matchGroup && matchBirthDate && (matchName || matchPhone);
    });
  }, [birthDateFilter, groupFilter, searchTerm, upcoming]);

  const totalPages = useMemo(() => Math.max(1, Math.ceil(filteredUpcoming.length / CARDS_PER_PAGE)), [filteredUpcoming.length]);
  const pagedUpcoming = useMemo(() => {
    const start = (currentPage - 1) * CARDS_PER_PAGE;
    return filteredUpcoming.slice(start, start + CARDS_PER_PAGE);
  }, [currentPage, filteredUpcoming]);

  const activeGroups = useMemo(() => groups.filter((group) => group.active), [groups]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, groupFilter, birthDateFilter]);

  async function handlePhotoUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    try {
      setIsUploadingPhoto(true);
      const base64Data = await fileToBase64(file);
      const uploadResponse = await uploadImageAssetRequest({
        fileName: file.name,
        mimeType: file.type,
        base64Data,
      });

      setInput((current) => ({ ...current, photoUrl: uploadResponse.assetUrl }));
      setToastType('success');
      setToastMessage('Foto enviada com sucesso.');
      setToastRunId((current) => current + 1);
    } catch (uploadError) {
      const message = uploadError instanceof Error ? uploadError.message : 'Não foi possível enviar a foto.';
      setToastType('error');
      setToastMessage(message);
    } finally {
      setIsUploadingPhoto(false);
      event.target.value = '';
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setToastType(null);
    setToastMessage('');

    if (!input.name.trim()) {
      setToastType('error');
      setToastMessage('Informe o nome da pessoa.');
      return;
    }

    if (onlyDigits(input.whatsapp).length < 10) {
      setToastType('error');
      setToastMessage('Informe um WhatsApp válido.');
      return;
    }

    if (!input.birthDate) {
      setToastType('error');
      setToastMessage('Informe a data de aniversário.');
      return;
    }

    setIsSaving(true);

    try {
      const payload: BirthdayInput = {
        ...input,
        name: input.name.trim(),
        nickname: input.nickname?.trim() || undefined,
        whatsapp: input.whatsapp.trim(),
        birthDate: input.birthDate,
        groupId: input.groupId?.trim() || undefined,
        photoUrl: input.photoUrl?.trim() || undefined,
        messageTemplate: input.messageTemplate?.trim() || defaultTemplate,
        notes: input.notes?.trim() || undefined,
        externalRef: input.externalRef?.trim() || undefined,
      };

      if (editingId) {
        const updated = await updateBirthdayRequest(editingId, payload);
        setBirthdays((current) => current.map((entry) => (entry.id === editingId ? updated : entry)));
        setToastMessage('Aniversariante atualizado com sucesso.');
      } else {
        const created = await createBirthdayRequest(payload);
        setBirthdays((current) => [created, ...current]);
        setToastMessage('Aniversariante cadastrado com sucesso.');
      }

      setInput(defaultInput);
      setIsFormOpen(false);
      setEditingId(null);
      setToastType('success');
      setToastRunId((current) => current + 1);
    } catch (error) {
      const text = error instanceof Error ? error.message : 'Erro ao salvar aniversariante.';
      setToastType('error');
      setToastMessage(text);
    } finally {
      setIsSaving(false);
    }
  }

  async function handleGenerateArt(contact: BirthdayContact): Promise<string | null> {
    const selectedBackground = pickBackgroundForContact(contact, backgrounds);

    if (!selectedBackground) {
      setToastType('error');
      setToastMessage('Cadastre e ative um fundo global ou por grupo para gerar a arte.');
      return null;
    }

    if (!contact.photoUrl) {
      setToastType('error');
      setToastMessage('Cadastre a foto da pessoa para gerar a arte.');
      return null;
    }

    setIsGeneratingForId(contact.id);

    try {
      const artDataUrl = await generateBirthdayArt({
        backgroundUrl: resolveApiAssetUrl(selectedBackground.imageUrl),
        personPhotoUrl: resolveApiAssetUrl(contact.photoUrl),
        displayName: getDisplayName(contact),
        photoMaskShape: selectedBackground.photoMaskShape || 'circle',
        nameFontKey: selectedBackground.nameFontKey,
        layout: selectedBackground.layout,
      });

      setGeneratedArt({
        contactId: contact.id,
        contactName: getDisplayName(contact),
        dataUrl: artDataUrl,
      });
      setIsArtModalOpen(true);
      setToastType('success');
      setToastMessage('Arte gerada com sucesso.');
      setToastRunId((current) => current + 1);
      return artDataUrl;
    } catch (generateError) {
      const message = generateError instanceof Error ? generateError.message : 'Não foi possível gerar a arte.';
      setToastType('error');
      setToastMessage(message);
      return null;
    } finally {
      setIsGeneratingForId(null);
    }
  }

  function downloadImage(dataUrl: string, contactName: string) {
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = `parabens-${contactName}.png`;
    document.body.append(link);
    link.click();
    link.remove();
  }

  async function handleDownloadArt(contact: BirthdayContact) {
    const name = getDisplayName(contact);
    if (generatedArt && generatedArt.contactId === contact.id) {
      downloadImage(generatedArt.dataUrl, name);
      return;
    }

    const artDataUrl = await handleGenerateArt(contact);
    if (!artDataUrl) {
      return;
    }

    downloadImage(artDataUrl, name);
  }

  async function handleSendWhatsApp(contact: BirthdayContact) {
    const phoneDigits = onlyDigits(contact.whatsapp);
    if (phoneDigits.length < 10) {
      setToastType('error');
      setToastMessage('WhatsApp inválido para envio.');
      return;
    }

    const contactName = getDisplayName(contact);
    const message = renderMessage(contact.messageTemplate || defaultTemplate, contact);
    let artDataUrl = generatedArt && generatedArt.contactId === contact.id ? generatedArt.dataUrl : null;

    if (!artDataUrl) {
      artDataUrl = await handleGenerateArt(contact);
      if (!artDataUrl) {
        return;
      }
    }

    const imageFile = dataUrlToFile(artDataUrl, buildBirthdayImageFileName(contactName));
    const navigatorWithShare = navigator as Navigator & { canShare?: (data?: ShareData) => boolean };
    const shareData: ShareData = {
      title: `Parabéns, ${contactName}`,
      text: message,
      files: [imageFile],
    };

    try {
      if (
        typeof navigatorWithShare.share === 'function' &&
        (!navigatorWithShare.canShare || navigatorWithShare.canShare(shareData))
      ) {
        await navigatorWithShare.share(shareData);
        setToastType('success');
        setToastMessage('Compartilhamento aberto com imagem e mensagem.');
        setToastRunId((current) => current + 1);
        return;
      }
    } catch (shareError) {
      if (shareError instanceof DOMException && shareError.name === 'AbortError') {
        return;
      }
    }

    // Fallback para navegadores que não aceitam anexo automático no WhatsApp Web.
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(message);
      }
    } catch {
      // Falha silenciosa: alguns navegadores bloqueiam clipboard fora de contexto permitido.
    }

    downloadImage(artDataUrl, contactName);
    const url = `https://wa.me/${phoneDigits}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
    setToastType('success');
    setToastMessage('WhatsApp aberto. Imagem baixada e mensagem copiada para colar como legenda.');
    setToastRunId((current) => current + 1);
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
            <strong>{toastType === 'success' ? 'Tudo certo' : 'Erro'}</strong>
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

      <header className="page__header page__header--row">
        <div>
          <h2>Contatos Aniversariantes</h2>
          <p>Cadastro completo com grupo, foto e geração automática da arte de felicitação.</p>
        </div>
        <button className="button button--primary" type="button" onClick={handleToggleContactForm}>
          <Plus size={16} />
          {isFormOpen ? 'Fechar cadastro' : 'Novo cadastro'}
        </button>
      </header>

      {isFormOpen ? (
        <article className="card">
          <form className="form" onSubmit={handleSubmit}>
            <div className="grid grid--five birthday-form-grid">
              <label className="field">
                <span>Nome completo</span>
                <input
                  autoFocus
                  value={input.name}
                  onChange={(event) => setInput((current) => ({ ...current, name: event.target.value }))}
                  placeholder="Ex: Fernanda Alves"
                  required
                />
              </label>

              <label className="field">
                <span>Apelido (preferência na mensagem)</span>
                <input
                  value={input.nickname || ''}
                  onChange={(event) => setInput((current) => ({ ...current, nickname: event.target.value }))}
                  placeholder="Ex: Fê"
                />
              </label>

              <label className="field">
                <span>WhatsApp</span>
                <input
                  value={input.whatsapp}
                  onChange={(event) =>
                    setInput((current) => ({
                      ...current,
                      whatsapp: formatPhoneInput(event.target.value),
                    }))
                  }
                  placeholder="+55 11 98888-0000"
                  required
                />
              </label>

              <label className="field">
                <span>Data de aniversário</span>
                <input
                  value={input.birthDate}
                  onChange={(event) => setInput((current) => ({ ...current, birthDate: event.target.value }))}
                  type="date"
                  required
                />
              </label>

              <label className="field">
                <span>Grupo da mensagem</span>
                <select
                  value={input.groupId || ''}
                  onChange={(event) => setInput((current) => ({ ...current, groupId: event.target.value }))}
                >
                  <option value="">Sem grupo</option>
                  {activeGroups.map((group) => (
                    <option key={group.id} value={group.id}>
                      {group.name}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="grid grid--three birthday-form-grid">
              <label className="field">
                <span>URL da foto da pessoa</span>
                <input
                  value={input.photoUrl || ''}
                  onChange={(event) => setInput((current) => ({ ...current, photoUrl: event.target.value }))}
                  placeholder="https://... ou /uploads/..."
                />
              </label>

              <label className="field">
                <span>Enviar foto do PC</span>
                <input type="file" accept="image/*" onChange={handlePhotoUpload} />
              </label>

              {input.photoUrl ? (
                <div className="field">
                  <span>Prévia da foto</span>
                  <div className="birthday-photo-preview">
                    <img src={resolveApiAssetUrl(input.photoUrl)} alt={`Foto de ${input.name || 'contato'}`} />
                  </div>
                </div>
              ) : null}
            </div>

            <div className="grid grid--two">
              <label className="field">
                <span>Mensagem de felicitação</span>
                <textarea
                  value={input.messageTemplate || ''}
                  onChange={(event) => setInput((current) => ({ ...current, messageTemplate: event.target.value }))}
                  placeholder="Use {{nome}} para personalizar com apelido/nome."
                />
              </label>

              <label className="field">
                <span>Observações</span>
                <textarea
                  value={input.notes || ''}
                  onChange={(event) => setInput((current) => ({ ...current, notes: event.target.value }))}
                  placeholder="Preferências de contato, tom da mensagem, etc."
                />
              </label>
            </div>

            <div className="grid grid--two">
              <label className="field">
                <span>Fonte de dados (preparação futura)</span>
                <select
                  value={input.source}
                  onChange={(event) => setInput((current) => ({ ...current, source: event.target.value as BirthdayInput['source'] }))}
                >
                  <option value="local">Local (atual)</option>
                  <option value="external">Integração externa (futuro)</option>
                </select>
              </label>

              <label className="field">
                <span>Referência externa (opcional)</span>
                <input
                  value={input.externalRef || ''}
                  onChange={(event) => setInput((current) => ({ ...current, externalRef: event.target.value }))}
                  placeholder="Ex: crm_contact_123"
                />
              </label>
            </div>

            <label className="field field--inline">
              <input
                checked={input.active}
                onChange={(event) => setInput((current) => ({ ...current, active: event.target.checked }))}
                type="checkbox"
              />
              <span>Contato ativo para lembretes</span>
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
              <button className="button button--primary" type="submit" disabled={isSaving || isUploadingPhoto}>
                {isUploadingPhoto ? (
                  <>
                    <ImagePlus size={16} />
                    Enviando foto...
                  </>
                ) : isSaving ? (
                  'Salvando...'
                ) : editingId ? (
                  'Salvar edição'
                ) : (
                  'Salvar aniversariante'
                )}
              </button>
            </div>
          </form>
        </article>
      ) : null}

      {generatedArt && isArtModalOpen ? (
        <div
          className="modal-overlay"
          role="dialog"
          aria-modal="true"
          aria-label={`Prévia da arte de aniversário de ${generatedArt.contactName}`}
          onClick={() => setIsArtModalOpen(false)}
        >
          <article className="modal-card birthday-art-modal" onClick={(event) => event.stopPropagation()}>
            <header className="birthday-art-modal__header">
              <div>
                <h3>Prévia da Arte Gerada</h3>
                <p>{generatedArt.contactName}</p>
              </div>
              <button
                className="button button--ghost birthday-art-modal__close"
                type="button"
                onClick={() => setIsArtModalOpen(false)}
              >
                <X size={16} />
                Fechar
              </button>
            </header>
            <div className="birthday-art-preview birthday-art-preview--modal">
              <img src={generatedArt.dataUrl} alt={`Arte de aniversário para ${generatedArt.contactName}`} />
            </div>
            <div className="birthday-art-modal__actions">
              <a className="button button--primary" href={generatedArt.dataUrl} download={`parabens-${generatedArt.contactName}.png`}>
                <Download size={16} />
                Baixar PNG
              </a>
            </div>
          </article>
        </div>
      ) : null}

      <article className="card">
        {isLoading ? <p className="empty-message">Carregando aniversariantes...</p> : null}
        {!isLoading && upcoming.length === 0 ? <p className="empty-message">Nenhum aniversariante cadastrado ainda.</p> : null}
        {!isLoading && upcoming.length > 0 ? (
          <>
            <div className="birthday-filters-section">
              <div className="filters">
                <label className="field">
                  <span>Busca (nome ou telefone)</span>
                  <div className="field__date-row birthday-filter-input-row">
                    <input
                      value={searchTerm}
                      onChange={(event) => setSearchTerm(event.target.value)}
                      placeholder="Ex: Fê, Fernanda, 1198888..."
                    />
                    <button
                      className="field__date-clear birthday-filter-clear"
                      type="button"
                      onClick={() => setSearchTerm('')}
                      disabled={!searchTerm}
                      aria-label="Limpar busca"
                    >
                      x
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
                  <span>Data de aniversário</span>
                  <div className="field__date-row birthday-filter-input-row">
                    <input
                      type="date"
                      value={birthDateFilter}
                      onChange={(event) => setBirthDateFilter(event.target.value)}
                    />
                    <button
                      className="field__date-clear birthday-filter-clear"
                      type="button"
                      onClick={() => setBirthDateFilter('')}
                      disabled={!birthDateFilter}
                      aria-label="Limpar data"
                    >
                      x
                    </button>
                  </div>
                </label>
              </div>
            </div>
            <div className="birthday-cards-section">
              <div className="stack birthday-list">
              {pagedUpcoming.map((entry) => (
              <article className="birthday-item" key={entry.id}>
                <div className="birthday-item__head">
                  <div>
                    <h3>{getDisplayName(entry)}</h3>
                    <p>
                      {entry.whatsapp} · {formatDate(entry.birthDate)}
                    </p>
                  </div>
                  <span className="badge">{entry.active ? 'Ativo' : 'Inativo'}</span>
                </div>

                {entry.photoUrl ? (
                  <div className="birthday-photo-preview birthday-photo-preview--card">
                    <img src={resolveApiAssetUrl(entry.photoUrl)} alt={`Foto de ${getDisplayName(entry)}`} />
                  </div>
                ) : null}

                <p className="birthday-item__message">{renderMessage(entry.messageTemplate || defaultTemplate, entry)}</p>
                <div className="birthday-item__actions birthday-item__actions--contact">
                  <div className="birthday-item__actions-row">
                    <button
                      className="button button--primary"
                      type="button"
                      onClick={() => {
                        void handleGenerateArt(entry);
                      }}
                      disabled={isGeneratingForId === entry.id}
                    >
                      <Sparkles size={15} />
                      {isGeneratingForId === entry.id ? 'Gerando...' : 'Gerar arte'}
                    </button>
                    <button
                      className="button button--ghost"
                      type="button"
                      onClick={() => {
                        setEditingId(entry.id);
                        setInput({
                          name: entry.name,
                          nickname: entry.nickname || '',
                          whatsapp: entry.whatsapp,
                          birthDate: entry.birthDate,
                          groupId: entry.groupId || '',
                          photoUrl: entry.photoUrl || '',
                          notes: entry.notes || '',
                          messageTemplate: entry.messageTemplate || defaultTemplate,
                          source: entry.source,
                          externalRef: entry.externalRef || '',
                          active: entry.active,
                        });
                        setIsFormOpen(true);
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                    >
                      Editar
                    </button>
                  </div>
                  <div className="birthday-item__actions-row">
                    <button
                      className="button button--ghost"
                      type="button"
                      onClick={() => {
                        void handleDownloadArt(entry);
                      }}
                      disabled={isGeneratingForId === entry.id}
                    >
                      <Download size={15} />
                      Baixar imagem
                    </button>
                    <button
                      className="button button--ghost"
                      type="button"
                      onClick={() => {
                        void handleSendWhatsApp(entry);
                      }}
                      disabled={isGeneratingForId === entry.id}
                    >
                      <MessageCircle size={15} />
                      Enviar WhatsApp
                    </button>
                  </div>
                </div>
              </article>
              ))}
              </div>
            </div>
            {filteredUpcoming.length === 0 ? <p className="empty-message">Nenhum contato encontrado com os filtros atuais.</p> : null}
            <div className="birthday-pagination">
              <p>
                Página {currentPage} de {totalPages} · {filteredUpcoming.length} contato(s)
              </p>
              <div className="birthday-pagination__actions">
                <button
                  className="button button--ghost"
                  type="button"
                  onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                  disabled={currentPage === 1}
                >
                  Anterior
                </button>
                <button
                  className="button button--ghost"
                  type="button"
                  onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
                  disabled={currentPage === totalPages}
                >
                  Próxima
                </button>
              </div>
            </div>
          </>
        ) : null}
      </article>
    </section>
  );
}

function fileToBase64(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      if (typeof result !== 'string') {
        reject(new Error('Arquivo inválido.'));
        return;
      }

      const [, base64 = ''] = result.split(',');
      if (!base64) {
        reject(new Error('Arquivo inválido.'));
        return;
      }

      resolve(base64);
    };
    reader.onerror = () => reject(new Error('Não foi possível ler o arquivo.'));
    reader.readAsDataURL(file);
  });
}

function dataUrlToFile(dataUrl: string, fileName: string) {
  const [header, base64 = ''] = dataUrl.split(',');
  const mimeMatch = header.match(/data:(.*?);base64/i);
  const mimeType = mimeMatch?.[1] || 'image/png';
  const byteString = window.atob(base64);
  const byteArray = new Uint8Array(byteString.length);

  for (let index = 0; index < byteString.length; index += 1) {
    byteArray[index] = byteString.charCodeAt(index);
  }

  return new File([byteArray], fileName, { type: mimeType });
}

function buildBirthdayImageFileName(name: string) {
  const normalized = name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  return `parabens-${normalized || 'contato'}.png`;
}
