import { Circle, Clipboard, Minus, Plus, RotateCcw, ScanFace, Square, Type as TypeIcon, Upload } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { ChangeEvent, ClipboardEvent as ReactClipboardEvent, FormEvent, MouseEvent as ReactMouseEvent } from 'react';
import {
  createBirthdayBackgroundRequest,
  listBirthdayBackgroundsRequest,
  listBirthdayGroupsRequest,
  resolveApiAssetUrl,
  updateBirthdayBackgroundRequest,
  uploadImageAssetRequest,
} from '../lib/api';
import {
  BIRTHDAY_NAME_FONTS,
  getBirthdayNameFontOption,
  DEFAULT_BIRTHDAY_NAME_FONT_KEY,
} from '../lib/birthday-name-fonts';
import type { BirthdayBackground, BirthdayBackgroundLayout, BirthdayGroup } from '../types/shared';

type BirthdayBackgroundInput = Omit<BirthdayBackground, 'id' | 'createdAt' | 'updatedAt'>;
type EditorTarget = 'photo' | 'name';
type FontMenuPosition = {
  left: number;
  top: number;
  maxHeight: number;
};
type DragState = {
  target: EditorTarget;
  offsetX: number;
  offsetY: number;
};

const defaultLayout: BirthdayBackgroundLayout = {
  photoXPercent: 50,
  photoYPercent: 29.2,
  photoSizePercent: 42.6,
  showPhoto: true,
  nameXPercent: 51.7,
  nameYPercent: 68.7,
  nameSizePercent: 24,
  showName: true,
};

const defaultInput: BirthdayBackgroundInput = {
  name: '',
  imageUrl: '',
  scope: 'global',
  groupId: '',
  photoMaskShape: 'circle',
  nameFontKey: DEFAULT_BIRTHDAY_NAME_FONT_KEY,
  layout: defaultLayout,
  active: true,
};

function normalizeLayout(layout: BirthdayBackgroundLayout | undefined) {
  if (!layout) {
    return { ...defaultLayout };
  }

  return {
    photoXPercent: layout.photoXPercent,
    photoYPercent: layout.photoYPercent,
    photoSizePercent: layout.photoSizePercent,
    showPhoto: layout.showPhoto ?? true,
    nameXPercent: layout.nameXPercent,
    nameYPercent: layout.nameYPercent,
    nameSizePercent: layout.nameSizePercent,
    showName: layout.showName ?? true,
  };
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, Math.round(value * 10) / 10));
}

export function BirthdayBackgroundsPage() {
  const [backgrounds, setBackgrounds] = useState<BirthdayBackground[]>([]);
  const [groups, setGroups] = useState<BirthdayGroup[]>([]);
  const [input, setInput] = useState<BirthdayBackgroundInput>(defaultInput);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [activeTool, setActiveTool] = useState<EditorTarget>('photo');
  const [isFontMenuOpen, setIsFontMenuOpen] = useState(false);
  const [fontMenuPosition, setFontMenuPosition] = useState<FontMenuPosition | null>(null);
  const [previewOrientation, setPreviewOrientation] = useState<'portrait' | 'landscape'>('portrait');
  const editorPreviewRef = useRef<HTMLDivElement | null>(null);
  const dragStateRef = useRef<DragState | null>(null);
  const fontMenuRef = useRef<HTMLDivElement | null>(null);
  const fontTriggerRef = useRef<HTMLButtonElement | null>(null);

  function handleToggleBackgroundForm() {
    setIsFormOpen((current) => {
      const nextOpen = !current;
      if (nextOpen) {
        setEditingId(null);
        setInput(defaultInput);
        setActiveTool('photo');
        setIsFontMenuOpen(false);
      }
      return nextOpen;
    });
  }

  useEffect(() => {
    async function loadData() {
      try {
        const [backgroundResponse, groupResponse] = await Promise.all([
          listBirthdayBackgroundsRequest(),
          listBirthdayGroupsRequest(),
        ]);
        setBackgrounds(backgroundResponse);
        setGroups(groupResponse);
      } catch {
        setError('Não foi possível carregar os fundos.');
      } finally {
        setIsLoading(false);
      }
    }

    void loadData();
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (!isFontMenuOpen) {
        return;
      }
      const target = event.target as Node | null;
      if (fontMenuRef.current && target && !fontMenuRef.current.contains(target)) {
        setIsFontMenuOpen(false);
      }
    }

    window.addEventListener('mousedown', handleClickOutside);
    return () => window.removeEventListener('mousedown', handleClickOutside);
  }, [isFontMenuOpen]);

  useEffect(() => {
    if (!isFontMenuOpen) {
      return;
    }

    const margin = 12;
    const menuWidth = 260;
    const offset = 10;

    function updateFontMenuPosition() {
      const trigger = fontTriggerRef.current;
      if (!trigger) {
        return;
      }

      const rect = trigger.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      const rightX = rect.right + offset;
      const leftX = rect.left - menuWidth - offset;
      const hasRoomRight = viewportWidth - rect.right >= menuWidth + margin;
      const hasRoomLeft = rect.left >= menuWidth + margin;

      let left = hasRoomRight || !hasRoomLeft ? rightX : leftX;
      left = clamp(left, margin, Math.max(margin, viewportWidth - menuWidth - margin));

      let top = rect.top;
      top = clamp(top, margin, Math.max(margin, viewportHeight - 180));
      const maxHeight = Math.max(200, viewportHeight - top - margin);

      setFontMenuPosition({
        left,
        top,
        maxHeight,
      });
    }

    updateFontMenuPosition();
    window.addEventListener('resize', updateFontMenuPosition);
    window.addEventListener('scroll', updateFontMenuPosition, true);
    return () => {
      window.removeEventListener('resize', updateFontMenuPosition);
      window.removeEventListener('scroll', updateFontMenuPosition, true);
    };
  }, [isFontMenuOpen]);

  useEffect(() => {
    if (!input.imageUrl?.trim()) {
      setPreviewOrientation('portrait');
      return;
    }

    const image = new Image();
    image.onload = () => {
      setPreviewOrientation(image.naturalWidth >= image.naturalHeight ? 'landscape' : 'portrait');
    };
    image.onerror = () => {
      setPreviewOrientation('portrait');
    };
    image.src = resolveApiAssetUrl(input.imageUrl);
  }, [input.imageUrl]);

  const orderedBackgrounds = useMemo(
    () => [...backgrounds].sort((a, b) => a.name.localeCompare(b.name, 'pt-BR')),
    [backgrounds],
  );

  const activeGroups = useMemo(() => groups.filter((group) => group.active), [groups]);
  const layout = normalizeLayout(input.layout);
  const selectedNameFont = getBirthdayNameFontOption(input.nameFontKey);
  const handwrittenFonts = useMemo(
    () => BIRTHDAY_NAME_FONTS.filter((item) => item.category === 'handwritten'),
    [],
  );
  const diverseFonts = useMemo(() => BIRTHDAY_NAME_FONTS.filter((item) => item.category === 'diverse'), []);

  function updateLayoutPosition(target: EditorTarget, clientX: number, clientY: number, offsetX = 0, offsetY = 0) {
    const preview = editorPreviewRef.current;
    if (!preview) {
      return;
    }

    const rect = preview.getBoundingClientRect();
    if (!rect.width || !rect.height) {
      return;
    }

    const xPercent = clamp((((clientX - offsetX) - rect.left) / rect.width) * 100, 5, 95);
    const yPercent = clamp((((clientY - offsetY) - rect.top) / rect.height) * 100, 5, 95);

    setInput((current) => {
      const currentLayout = normalizeLayout(current.layout);
      if (target === 'photo') {
        return {
          ...current,
          layout: {
            ...currentLayout,
            photoXPercent: xPercent,
            photoYPercent: yPercent,
          },
        };
      }

      return {
        ...current,
        layout: {
          ...currentLayout,
          nameXPercent: xPercent,
          nameYPercent: yPercent,
        },
      };
    });
  }

  useEffect(() => {
    function handleMouseMove(event: MouseEvent) {
      const dragState = dragStateRef.current;
      if (!dragState) {
        return;
      }

      updateLayoutPosition(dragState.target, event.clientX, event.clientY, dragState.offsetX, dragState.offsetY);
    }

    function handleMouseUp() {
      dragStateRef.current = null;
    }

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  function startDrag(target: EditorTarget, event: ReactMouseEvent<HTMLButtonElement>) {
    event.preventDefault();
    setActiveTool(target);
    const preview = editorPreviewRef.current;
    if (!preview) {
      return;
    }

    const rect = preview.getBoundingClientRect();
    const currentLayout = normalizeLayout(input.layout);
    const centerXPercent = target === 'photo' ? currentLayout.photoXPercent : currentLayout.nameXPercent;
    const centerYPercent = target === 'photo' ? currentLayout.photoYPercent : currentLayout.nameYPercent;
    const centerX = rect.left + (rect.width * centerXPercent) / 100;
    const centerY = rect.top + (rect.height * centerYPercent) / 100;

    dragStateRef.current = {
      target,
      offsetX: event.clientX - centerX,
      offsetY: event.clientY - centerY,
    };
  }

  function toggleEditorTarget(target: EditorTarget) {
    setInput((current) => {
      const currentLayout = normalizeLayout(current.layout);
      if (target === 'photo') {
        const nextShowPhoto = !currentLayout.showPhoto;
        return {
          ...current,
          layout: {
            ...currentLayout,
            showPhoto: nextShowPhoto,
          },
        };
      }

      const nextShowName = !currentLayout.showName;
      return {
        ...current,
        layout: {
          ...currentLayout,
          showName: nextShowName,
        },
      };
    });

    if (target === 'photo') {
      if (layout.showPhoto) {
        if (activeTool === 'photo' && layout.showName) {
          setActiveTool('name');
        }
      } else {
        setActiveTool('photo');
      }
      return;
    }

    if (layout.showName) {
      if (activeTool === 'name' && layout.showPhoto) {
        setActiveTool('photo');
      }
    } else {
      setActiveTool('name');
    }
  }

  function adjustActiveSize(step: number) {
    setInput((current) => {
      const currentLayout = normalizeLayout(current.layout);
      if (activeTool === 'photo') {
        return {
          ...current,
          layout: {
            ...currentLayout,
            photoSizePercent: clamp(currentLayout.photoSizePercent + step, 12, 90),
          },
        };
      }

      return {
        ...current,
        layout: {
          ...currentLayout,
          nameSizePercent: clamp(currentLayout.nameSizePercent + step, 8, 40),
        },
      };
    });
  }

  async function uploadBackgroundFile(file: File) {
    try {
      setIsUploading(true);
      const base64Data = await fileToBase64(file);
      const fallbackExtension = file.type.split('/')[1] || 'png';
      const safeFileName = file.name?.trim() ? file.name : `clipboard-${Date.now()}.${fallbackExtension}`;
      const response = await uploadImageAssetRequest({
        fileName: safeFileName,
        mimeType: file.type || 'image/png',
        base64Data,
      });

      setInput((current) => ({ ...current, imageUrl: response.assetUrl }));
      setError('');
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : 'Não foi possível enviar a imagem.');
    } finally {
      setIsUploading(false);
    }
  }

  async function handleUploadBackground(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    await uploadBackgroundFile(file);
    event.target.value = '';
  }

  function extractImageFromClipboard(dataTransfer: DataTransfer | null) {
    if (!dataTransfer) {
      return null;
    }

    const pastedFile = Array.from(dataTransfer.files).find((file) => file.type.startsWith('image/'));
    if (pastedFile) {
      return pastedFile;
    }

    const pastedItem = Array.from(dataTransfer.items).find((item) => item.type.startsWith('image/'));
    return pastedItem?.getAsFile() ?? null;
  }

  function handlePasteUpload(event: ReactClipboardEvent<HTMLDivElement>) {
    const file = extractImageFromClipboard(event.clipboardData);
    if (!file) {
      return;
    }

    event.preventDefault();
    void uploadBackgroundFile(file);
  }

  async function handlePasteFromSystemClipboard() {
    if (!navigator.clipboard?.read) {
      setError('Seu navegador não permite leitura direta. Clique no campo e use Ctrl+V.');
      return;
    }

    try {
      const clipboardItems = await navigator.clipboard.read();
      for (const clipboardItem of clipboardItems) {
        const imageType = clipboardItem.types.find((type) => type.startsWith('image/'));
        if (!imageType) {
          continue;
        }

        const blob = await clipboardItem.getType(imageType);
        const extension = imageType.split('/')[1] || 'png';
        const file = new File([blob], `clipboard-${Date.now()}.${extension}`, { type: imageType });
        await uploadBackgroundFile(file);
        return;
      }

      setError('Não foi encontrada imagem na área de transferência.');
    } catch {
      setError('Não foi possível acessar a área de transferência. Use Ctrl+V no campo.');
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');

    if (!input.name.trim()) {
      setError('Informe o nome do fundo.');
      return;
    }

    if (!input.imageUrl.trim()) {
      setError('Informe ou envie uma imagem de fundo.');
      return;
    }

    if (input.scope === 'group' && !input.groupId?.trim()) {
      setError('Selecione um grupo para escopo por grupo.');
      return;
    }

    setIsSaving(true);

    try {
      const payload: BirthdayBackgroundInput = {
        name: input.name.trim(),
        imageUrl: input.imageUrl.trim(),
        scope: input.scope,
        groupId: input.scope === 'group' ? input.groupId?.trim() || '' : '',
        photoMaskShape: input.photoMaskShape || 'circle',
        nameFontKey: input.nameFontKey?.trim() || DEFAULT_BIRTHDAY_NAME_FONT_KEY,
        layout: normalizeLayout(input.layout),
        active: input.active,
      };

      if (editingId) {
        const updated = await updateBirthdayBackgroundRequest(editingId, payload);
        setBackgrounds((current) => current.map((entry) => (entry.id === editingId ? updated : entry)));
      } else {
        const created = await createBirthdayBackgroundRequest(payload);
        setBackgrounds((current) => [created, ...current]);
      }

      setInput(defaultInput);
      setEditingId(null);
      setIsFormOpen(false);
      setActiveTool('photo');
      setIsFontMenuOpen(false);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Não foi possível salvar o fundo.');
    } finally {
      setIsSaving(false);
    }
  }

  function resolveGroupName(groupId: string | undefined) {
    if (!groupId) {
      return 'Global';
    }

    return groups.find((group) => group.id === groupId)?.name || 'Grupo não encontrado';
  }

  return (
    <section className="page">
      <header className="page__header page__header--row">
        <div>
          <h2>Fundos de Aniversário</h2>
          <p>Cadastre fundos globais (full) ou por grupo, com editor livre para foto e nome.</p>
        </div>
        <button className="button button--primary" type="button" onClick={handleToggleBackgroundForm}>
          <Plus size={16} />
          {isFormOpen ? 'Fechar cadastro' : 'Novo fundo'}
        </button>
      </header>

      {isFormOpen ? (
        <div
          className="modal-overlay"
          role="dialog"
          aria-modal="true"
          aria-label={editingId ? 'Editar fundo de aniversário' : 'Novo fundo de aniversário'}
          onClick={() => setIsFormOpen(false)}
        >
          <article
            className={
              previewOrientation === 'landscape'
                ? 'modal-card birthday-background-modal birthday-background-modal--landscape'
                : 'modal-card birthday-background-modal'
            }
            onClick={(event) => event.stopPropagation()}
          >
          <form className="form birthday-background-modal__form" onSubmit={handleSubmit}>
            <div className="birthday-background-layout">
              <section className="birthday-background-layout__left">
                {input.imageUrl ? (
                  <>
                    <div className="birthday-editor birthday-editor--dock">
                      <div
                        className={
                          previewOrientation === 'landscape'
                            ? 'birthday-background-preview birthday-background-preview--guide birthday-background-preview--landscape birthday-editor__canvas'
                            : 'birthday-background-preview birthday-background-preview--guide birthday-editor__canvas'
                        }
                        ref={editorPreviewRef}
                      >
                        <img src={resolveApiAssetUrl(input.imageUrl)} alt={`Prévia de ${input.name || 'fundo'}`} />
                        <div className="birthday-editor__overlay" aria-hidden="true">
                          {layout.showPhoto ? (
                            <button
                              type="button"
                              className={`birthday-editor__handle birthday-editor__photo ${
                                activeTool === 'photo' ? 'is-active' : ''
                              } ${(input.photoMaskShape || 'circle') === 'square' ? 'is-square' : ''}`}
                              style={{
                                left: `${layout.photoXPercent}%`,
                                top: `${layout.photoYPercent}%`,
                                width: `${layout.photoSizePercent}%`,
                              }}
                              onMouseDown={(event) => startDrag('photo', event)}
                            />
                          ) : null}
                          {layout.showName ? (
                            <button
                              type="button"
                              className={`birthday-editor__handle birthday-editor__name ${
                                activeTool === 'name' ? 'is-active' : ''
                              }`}
                              style={{
                                left: `${layout.nameXPercent}%`,
                                top: `${layout.nameYPercent}%`,
                                fontSize: `${layout.nameSizePercent * 3.4}px`,
                                fontFamily: selectedNameFont.cssStack,
                              }}
                              onMouseDown={(event) => startDrag('name', event)}
                            >
                              Nome/Apelido
                            </button>
                          ) : null}
                        </div>
                      </div>

                      <aside className="birthday-editor__tools">
                        <button
                          type="button"
                          className={layout.showPhoto ? 'birthday-editor__tool is-active' : 'birthday-editor__tool'}
                          onClick={() => toggleEditorTarget('photo')}
                          title={layout.showPhoto ? 'Ocultar foto' : 'Mostrar foto'}
                          aria-label={layout.showPhoto ? 'Ocultar foto' : 'Mostrar foto'}
                        >
                          <ScanFace size={18} />
                        </button>
                        <button
                          type="button"
                          className={layout.showName ? 'birthday-editor__tool is-active' : 'birthday-editor__tool'}
                          onClick={() => toggleEditorTarget('name')}
                          title={layout.showName ? 'Ocultar texto' : 'Mostrar texto'}
                          aria-label={layout.showName ? 'Ocultar texto' : 'Mostrar texto'}
                        >
                          <TypeIcon size={18} />
                        </button>
                        <div className="birthday-editor__font-picker" ref={fontMenuRef}>
                          <button
                            ref={fontTriggerRef}
                            type="button"
                            className={isFontMenuOpen ? 'birthday-editor__tool is-active' : 'birthday-editor__tool'}
                            onClick={() => setIsFontMenuOpen((current) => !current)}
                            title="Selecionar fonte do nome"
                            aria-label="Selecionar fonte do nome"
                            aria-expanded={isFontMenuOpen}
                          >
                            F
                          </button>
                          {isFontMenuOpen ? (
                            <div
                              className="birthday-editor__font-menu birthday-editor__font-menu--floating"
                              style={
                                fontMenuPosition
                                  ? {
                                      left: `${fontMenuPosition.left}px`,
                                      top: `${fontMenuPosition.top}px`,
                                      maxHeight: `${fontMenuPosition.maxHeight}px`,
                                    }
                                  : undefined
                              }
                            >
                              <p className="birthday-editor__font-title">Manuscritas (10)</p>
                              {handwrittenFonts.map((font) => (
                                <button
                                  key={font.key}
                                  type="button"
                                  className={
                                    (input.nameFontKey || DEFAULT_BIRTHDAY_NAME_FONT_KEY) === font.key
                                      ? 'birthday-editor__font-item is-active'
                                      : 'birthday-editor__font-item'
                                  }
                                  onClick={() => {
                                    setInput((current) => ({ ...current, nameFontKey: font.key }));
                                    setIsFontMenuOpen(false);
                                  }}
                                  style={{ fontFamily: font.cssStack }}
                                >
                                  {font.label}
                                </button>
                              ))}
                              <p className="birthday-editor__font-title">Diversas (20)</p>
                              {diverseFonts.map((font) => (
                                <button
                                  key={font.key}
                                  type="button"
                                  className={
                                    (input.nameFontKey || DEFAULT_BIRTHDAY_NAME_FONT_KEY) === font.key
                                      ? 'birthday-editor__font-item is-active'
                                      : 'birthday-editor__font-item'
                                  }
                                  onClick={() => {
                                    setInput((current) => ({ ...current, nameFontKey: font.key }));
                                    setIsFontMenuOpen(false);
                                  }}
                                  style={{ fontFamily: font.cssStack }}
                                >
                                  {font.label}
                                </button>
                              ))}
                            </div>
                          ) : null}
                        </div>
                        <button
                          type="button"
                          className="birthday-editor__tool"
                          onClick={() => adjustActiveSize(-1.2)}
                          title="Diminuir tamanho"
                          aria-label="Diminuir tamanho"
                        >
                          <Minus size={18} />
                        </button>
                        <button
                          type="button"
                          className="birthday-editor__tool"
                          onClick={() => adjustActiveSize(1.2)}
                          title="Aumentar tamanho"
                          aria-label="Aumentar tamanho"
                        >
                          <Plus size={18} />
                        </button>
                        <button
                          type="button"
                          className="birthday-editor__tool"
                          onClick={() =>
                            setInput((current) => ({
                              ...current,
                              photoMaskShape: current.photoMaskShape === 'square' ? 'circle' : 'square',
                            }))
                          }
                          title="Alternar formato da foto"
                          aria-label="Alternar formato da foto"
                        >
                          {input.photoMaskShape === 'square' ? <Square size={18} /> : <Circle size={18} />}
                        </button>
                        <button
                          type="button"
                          className="birthday-editor__tool"
                          onClick={() =>
                            setInput((current) => ({
                              ...current,
                              layout: { ...defaultLayout },
                            }))
                          }
                          title="Resetar composição"
                          aria-label="Resetar composição"
                        >
                          <RotateCcw size={18} />
                        </button>
                      </aside>
                    </div>
                    <p className="settings-card__hint">Arraste foto e nome na imagem e ajuste pelos ícones ao lado.</p>
                  </>
                ) : (
                  <div className="birthday-background-layout__placeholder">
                    <p>Adicione a URL ou envie uma imagem para iniciar o editor visual.</p>
                  </div>
                )}
              </section>

              <section className="birthday-background-layout__right">
                <div className="birthday-background-form-row birthday-background-form-row--top">
                  <label className="field">
                    <span>Nome do fundo</span>
                    <input
                      autoFocus
                      value={input.name}
                      onChange={(event) => setInput((current) => ({ ...current, name: event.target.value }))}
                      placeholder="Ex: Dourado premium"
                      required
                    />
                  </label>

                  <label className="field">
                    <span>Escopo</span>
                    <select
                      value={input.scope}
                      onChange={(event) =>
                        setInput((current) => ({
                          ...current,
                          scope: event.target.value as BirthdayBackground['scope'],
                          groupId: event.target.value === 'group' ? current.groupId : '',
                        }))
                      }
                    >
                      <option value="global">Global</option>
                      <option value="group">Por grupo</option>
                    </select>
                  </label>

                  <label className="field">
                    <span>Grupo</span>
                    <select
                      value={input.groupId || ''}
                      onChange={(event) => setInput((current) => ({ ...current, groupId: event.target.value }))}
                      disabled={input.scope !== 'group'}
                    >
                      <option value="">Selecione</option>
                      {activeGroups.map((group) => (
                        <option key={group.id} value={group.id}>
                          {group.name}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>

                <label className="field">
                  <span>URL da imagem de fundo</span>
                  <input
                    value={input.imageUrl}
                    onChange={(event) => setInput((current) => ({ ...current, imageUrl: event.target.value }))}
                    placeholder="https://... ou /uploads/..."
                    required
                  />
                </label>

                <label className="field">
                  <span>Enviar imagem do PC</span>
                  <div
                    className="birthday-upload-row"
                    onPaste={handlePasteUpload}
                    onClick={(event) => event.currentTarget.focus()}
                    tabIndex={0}
                  >
                    <input type="file" accept="image/*" onChange={handleUploadBackground} />
                    <button
                      className="button button--ghost birthday-upload-row__paste"
                      type="button"
                      onClick={() => {
                        void handlePasteFromSystemClipboard();
                      }}
                      disabled={isUploading}
                    >
                      <Clipboard size={14} />
                      Colar
                    </button>
                  </div>
                  <small className="field-help-inline">Clique no bloco e pressione Ctrl+V para colar imagem.</small>
                </label>

                <label className="settings-switch birthday-background-active-switch">
                  <span className="settings-switch__text">Fundo ativo</span>
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
              </section>
            </div>

            <div className="actions birthday-background-modal__footer">
              {editingId ? (
                <button
                  className="button button--ghost"
                  type="button"
                  onClick={() => {
                    setEditingId(null);
                    setInput(defaultInput);
                    setIsFormOpen(false);
                    setActiveTool('photo');
                    setIsFontMenuOpen(false);
                  }}
                >
                  Cancelar edição
                </button>
              ) : null}
              <button className="button button--primary" type="submit" disabled={isSaving || isUploading}>
                {isUploading ? (
                  <>
                    <Upload size={16} />
                    Enviando imagem...
                  </>
                ) : isSaving ? (
                  'Salvando...'
                ) : editingId ? (
                  'Salvar edição'
                ) : (
                  'Salvar fundo'
                )}
              </button>
            </div>
          </form>
          </article>
        </div>
      ) : null}

      <article className="card">
        {isLoading ? <p className="empty-message">Carregando fundos...</p> : null}
        {!isLoading && orderedBackgrounds.length === 0 ? (
          <p className="empty-message">Nenhum fundo cadastrado ainda.</p>
        ) : null}
        {error ? <p className="field-error">{error}</p> : null}
        {!isLoading && orderedBackgrounds.length > 0 ? (
          <div className="stack birthday-list">
            {orderedBackgrounds.map((background) => (
              <article className="birthday-item" key={background.id}>
                <div className="birthday-item__head">
                  <div>
                    <h3>{background.name}</h3>
                    <p>
                      {background.scope === 'global' ? 'Escopo global' : `Grupo: ${resolveGroupName(background.groupId)}`} ·{' '}
                      Fonte: {getBirthdayNameFontOption(background.nameFontKey).label}
                    </p>
                  </div>
                  <span className="badge">{background.active ? 'Ativo' : 'Inativo'}</span>
                </div>

                <div className="birthday-background-preview birthday-background-preview--small">
                  <img src={resolveApiAssetUrl(background.imageUrl)} alt={`Prévia de ${background.name}`} />
                </div>

                <div className="birthday-item__actions">
                  <button
                    className="button button--ghost"
                    type="button"
                    onClick={() => {
                      setEditingId(background.id);
                      setInput({
                        name: background.name,
                        imageUrl: background.imageUrl,
                        scope: background.scope,
                        groupId: background.groupId || '',
                        photoMaskShape: background.photoMaskShape || 'circle',
                        nameFontKey: background.nameFontKey || DEFAULT_BIRTHDAY_NAME_FONT_KEY,
                        layout: normalizeLayout(background.layout),
                        active: background.active,
                      });
                      setIsFormOpen(true);
                      setActiveTool('photo');
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
