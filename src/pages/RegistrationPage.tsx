import { useEffect, useRef, useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import {
  getRegistrationRequest,
  resolveApiAssetUrl,
  updateRegistrationRequest,
  uploadRegistrationAvatarRequest,
} from '../lib/api';
import {
  formatCnpjInput,
  formatCpfInput,
  formatPhoneInput,
  formatZipCodeInput,
  isValidCnpj,
  isValidCpf,
  onlyDigits,
} from '../lib/utils';
import type { RegistrationProfile } from '../types/shared';

const emptyRegistration: RegistrationProfile = {
  id: 'registration_admin_1',
  type: 'pf',
  displayName: '',
  fullName: '',
  avatarUrl: '',
  cpf: '',
  email: '',
  phone: '',
  whatsapp: '',
  address: {
    zipCode: '',
    street: '',
    number: '',
    complement: '',
    district: '',
    city: '',
    state: '',
  },
  notes: '',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

export function RegistrationPage() {
  const [form, setForm] = useState<RegistrationProfile>(emptyRegistration);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isCepLoading, setIsCepLoading] = useState(false);
  const [cepFeedback, setCepFeedback] = useState('');
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [toastRunId, setToastRunId] = useState(0);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const lastFetchedCepRef = useRef('');

  async function readFileAsBase64(file: File) {
    return new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result;
        if (typeof result !== 'string') {
          reject(new Error('Não foi possível ler o arquivo.'));
          return;
        }

        const [, base64Data = ''] = result.split(',');
        if (!base64Data) {
          reject(new Error('Formato de arquivo inválido.'));
          return;
        }

        resolve(base64Data);
      };
      reader.onerror = () => reject(new Error('Erro ao ler arquivo.'));
      reader.readAsDataURL(file);
    });
  }

  async function handleAvatarFileChange(event: ChangeEvent<HTMLInputElement>) {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile) {
      return;
    }

    setError('');
    setMessage('');
    setIsUploadingAvatar(true);

    try {
      const base64Data = await readFileAsBase64(selectedFile);
      const upload = await uploadRegistrationAvatarRequest({
        fileName: selectedFile.name,
        mimeType: selectedFile.type,
        base64Data,
      });

      setForm((current) => ({
        ...current,
        avatarUrl: upload.avatarUrl,
      }));
      setMessage('Imagem enviada. Salve o cadastro para confirmar.');
    } catch (uploadError) {
      const text = uploadError instanceof Error ? uploadError.message : 'Falha no upload da imagem.';
      setError(text);
    } finally {
      setIsUploadingAvatar(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  }

  useEffect(() => {
    async function load() {
      try {
        const registration = await getRegistrationRequest();
        setForm(registration);
      } catch {
        setError('Não foi possível carregar o cadastro. Verifique o backend.');
      } finally {
        setIsLoading(false);
      }
    }

    void load();
  }, []);

  function validateForm() {
    const errors: Record<string, string> = {};

    if (!form.email.trim()) {
      errors.email = 'Informe o email.';
    }

    if (onlyDigits(form.phone).length < 10) {
      errors.phone = 'Telefone inválido.';
    }

    if (onlyDigits(form.address.zipCode).length !== 8) {
      errors.zipCode = 'CEP deve ter 8 dígitos.';
    }

    if (!form.address.street.trim()) {
      errors.street = 'Informe a rua.';
    }

    if (!form.address.number.trim()) {
      errors.number = 'Informe o número.';
    }

    if (!form.address.district.trim()) {
      errors.district = 'Informe o bairro.';
    }

    if (!form.address.city.trim()) {
      errors.city = 'Informe a cidade.';
    }

    if (!form.address.state.trim()) {
      errors.state = 'Informe o estado.';
    }

    if (form.type === 'pf') {
      if (!form.fullName?.trim()) {
        errors.fullName = 'Informe o nome completo.';
      }

      if (!isValidCpf(form.cpf || '')) {
        errors.cpf = 'CPF inválido.';
      }
    }

    if (form.type === 'pj') {
      if (!form.companyName?.trim()) {
        errors.companyName = 'Informe a razão social.';
      }

      if (!isValidCnpj(form.cnpj || '')) {
        errors.cnpj = 'CNPJ inválido.';
      }
    }

    return errors;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setMessage('');
    const errors = validateForm();
    setFieldErrors(errors);

    if (Object.keys(errors).length > 0) {
      setError('Revise os campos destacados.');
      return;
    }

    setIsSaving(true);

    try {
      const saved = await updateRegistrationRequest(form);
      setForm(saved);
      setMessage('Cadastro salvo com sucesso.');
      window.dispatchEvent(new Event('registration-updated'));
      setShowSuccessToast(true);
      setToastRunId((current) => current + 1);
    } catch (saveError) {
      const text = saveError instanceof Error ? saveError.message : 'Erro ao salvar cadastro.';
      setError(text);
    } finally {
      setIsSaving(false);
    }
  }

  useEffect(() => {
    const cepDigits = onlyDigits(form.address.zipCode);

    if (cepDigits.length !== 8) {
      setCepFeedback('');
      return;
    }

    if (cepDigits === lastFetchedCepRef.current) {
      return;
    }

    let cancelled = false;

    async function fetchCep() {
      setIsCepLoading(true);
      setCepFeedback('');

      try {
        const response = await fetch(`https://viacep.com.br/ws/${cepDigits}/json/`);
        const payload = (await response.json()) as {
          erro?: boolean;
          logradouro?: string;
          bairro?: string;
          localidade?: string;
          uf?: string;
        };

        if (!response.ok || payload.erro) {
          if (!cancelled) {
            setCepFeedback('CEP não encontrado.');
          }
          return;
        }

        if (!cancelled) {
          setForm((current) => ({
            ...current,
            address: {
              ...current.address,
              street: payload.logradouro || current.address.street,
              district: payload.bairro || current.address.district,
              city: payload.localidade || current.address.city,
              state: payload.uf || current.address.state,
            },
          }));
          setCepFeedback('Endereço preenchido automaticamente.');
          lastFetchedCepRef.current = cepDigits;
        }
      } catch {
        if (!cancelled) {
          setCepFeedback('Falha ao consultar CEP no momento.');
        }
      } finally {
        if (!cancelled) {
          setIsCepLoading(false);
        }
      }
    }

    void fetchCep();

    return () => {
      cancelled = true;
    };
  }, [form.address.zipCode]);

  useEffect(() => {
    if (!showSuccessToast) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setShowSuccessToast(false);
    }, 3000);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [showSuccessToast, toastRunId]);

  if (isLoading) {
    return (
      <section className="workspace-blank">
        <header className="workspace-blank__header">
          <h2>Cadastro</h2>
          <p>Carregando dados...</p>
        </header>
      </section>
    );
  }

  return (
    <section className="workspace-blank">
      {showSuccessToast ? (
        <div className="floating-toast floating-toast--success" role="status" aria-live="polite">
          <div className="floating-toast__content">
            <strong>Cadastro salvo</strong>
            <span>Os dados foram atualizados.</span>
          </div>
          <div key={toastRunId} className="floating-toast__progress" />
        </div>
      ) : null}

      <header className="workspace-blank__header">
        <h2>Cadastro</h2>
        <p>Dados pessoais/comerciais com suporte para PF e PJ.</p>
      </header>

      <form className="form registration-form" onSubmit={handleSubmit}>
        <div className="grid grid--three">
          <label className="field">
            <span>Nome de exibição</span>
            <input
              value={form.displayName || ''}
              onChange={(event) => setForm((current) => ({ ...current, displayName: event.target.value }))}
              placeholder={form.type === 'pj' ? 'Ex: Studio Orion' : 'Ex: Cris Ferreira'}
            />
          </label>
          <label className="field">
            <span>{form.type === 'pj' ? 'URL da logo' : 'URL da foto'}</span>
            <input
              value={form.avatarUrl || ''}
              onChange={(event) => setForm((current) => ({ ...current, avatarUrl: event.target.value }))}
              placeholder="https://..."
            />
          </label>
          <div className="field">
            <span>{form.type === 'pj' ? 'Upload da logo' : 'Upload da foto'}</span>
            <div className="avatar-upload">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/jpg,image/webp,image/gif"
                onChange={(event) => {
                  void handleAvatarFileChange(event);
                }}
                disabled={isUploadingAvatar}
              />
              <small className="field-help-inline">
                {isUploadingAvatar ? 'Enviando imagem...' : 'JPG, PNG, WEBP ou GIF (máx. 3MB).'}
              </small>
            </div>
          </div>
        </div>

        {form.avatarUrl ? (
          <div className="registration-avatar-preview">
            <img src={resolveApiAssetUrl(form.avatarUrl)} alt="Prévia da foto/logo do cadastro" />
          </div>
        ) : null}

        <div className="grid grid--three">
          <label className="field field--inline">
            <input
              type="radio"
              name="registrationType"
              checked={form.type === 'pf'}
              onChange={() => setForm((current) => ({ ...current, type: 'pf' }))}
            />
            <span>Pessoa Física (PF)</span>
          </label>

          <label className="field field--inline">
            <input
              type="radio"
              name="registrationType"
              checked={form.type === 'pj'}
              onChange={() => setForm((current) => ({ ...current, type: 'pj' }))}
            />
            <span>Pessoa Jurídica (PJ)</span>
          </label>
        </div>

        <div className="grid grid--two">
          {form.type === 'pf' ? (
            <>
              <label className="field">
                <span>Nome completo</span>
                <input
                  value={form.fullName || ''}
                  onChange={(event) => setForm((current) => ({ ...current, fullName: event.target.value }))}
                  required
                />
                {fieldErrors.fullName ? <small className="field-error-inline">{fieldErrors.fullName}</small> : null}
              </label>
              <label className="field">
                <span>CPF</span>
                <input
                  value={form.cpf || ''}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      cpf: formatCpfInput(event.target.value),
                    }))
                  }
                  required
                />
                {fieldErrors.cpf ? <small className="field-error-inline">{fieldErrors.cpf}</small> : null}
              </label>
            </>
          ) : (
            <>
              <label className="field">
                <span>Razão social</span>
                <input
                  value={form.companyName || ''}
                  onChange={(event) => setForm((current) => ({ ...current, companyName: event.target.value }))}
                  required
                />
                {fieldErrors.companyName ? (
                  <small className="field-error-inline">{fieldErrors.companyName}</small>
                ) : null}
              </label>
              <label className="field">
                <span>CNPJ</span>
                <input
                  value={form.cnpj || ''}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      cnpj: formatCnpjInput(event.target.value),
                    }))
                  }
                  required
                />
                {fieldErrors.cnpj ? <small className="field-error-inline">{fieldErrors.cnpj}</small> : null}
              </label>
              <label className="field">
                <span>Nome fantasia</span>
                <input
                  value={form.tradeName || ''}
                  onChange={(event) => setForm((current) => ({ ...current, tradeName: event.target.value }))}
                />
              </label>
            </>
          )}
        </div>

        <div className="grid grid--three">
          <label className="field">
            <span>Email</span>
            <input
              type="email"
              value={form.email}
              onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
              required
            />
            {fieldErrors.email ? <small className="field-error-inline">{fieldErrors.email}</small> : null}
          </label>
          <label className="field">
            <span>Telefone</span>
            <input
              value={form.phone}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  phone: formatPhoneInput(event.target.value),
                }))
              }
              required
            />
            {fieldErrors.phone ? <small className="field-error-inline">{fieldErrors.phone}</small> : null}
          </label>
          <label className="field">
            <span>WhatsApp</span>
            <input
              value={form.whatsapp || ''}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  whatsapp: formatPhoneInput(event.target.value),
                }))
              }
            />
          </label>
        </div>

        <div className="registration-address-row">
          <label className="field registration-address-row__cep">
            <span>CEP</span>
            <input
              value={form.address.zipCode}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  address: { ...current.address, zipCode: formatZipCodeInput(event.target.value) },
                }))
              }
              required
            />
            {fieldErrors.zipCode ? <small className="field-error-inline">{fieldErrors.zipCode}</small> : null}
            {isCepLoading ? <small className="field-help-inline">Buscando CEP...</small> : null}
            {!isCepLoading && cepFeedback ? <small className="field-help-inline">{cepFeedback}</small> : null}
          </label>
          <label className="field registration-address-row__street">
            <span>Rua</span>
            <input
              value={form.address.street}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  address: { ...current.address, street: event.target.value },
                }))
              }
              required
              />
            {fieldErrors.street ? <small className="field-error-inline">{fieldErrors.street}</small> : null}
          </label>
          <label className="field registration-address-row__number">
            <span>Número</span>
            <input
              value={form.address.number}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  address: { ...current.address, number: event.target.value },
                }))
              }
              required
              />
            {fieldErrors.number ? <small className="field-error-inline">{fieldErrors.number}</small> : null}
          </label>
          <label className="field registration-address-row__complement">
            <span>Complemento</span>
            <input
              value={form.address.complement || ''}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  address: { ...current.address, complement: event.target.value },
                }))
              }
            />
          </label>
          <label className="field registration-address-row__district">
            <span>Bairro</span>
            <input
              value={form.address.district}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  address: { ...current.address, district: event.target.value },
                }))
              }
              required
              />
            {fieldErrors.district ? <small className="field-error-inline">{fieldErrors.district}</small> : null}
          </label>
          <label className="field registration-address-row__city">
            <span>Cidade</span>
            <input
              value={form.address.city}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  address: { ...current.address, city: event.target.value },
                }))
              }
              required
              />
            {fieldErrors.city ? <small className="field-error-inline">{fieldErrors.city}</small> : null}
          </label>
          <label className="field registration-address-row__state">
            <span>Estado (UF)</span>
            <input
              value={form.address.state}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  address: { ...current.address, state: event.target.value },
                }))
              }
              required
              />
            {fieldErrors.state ? <small className="field-error-inline">{fieldErrors.state}</small> : null}
          </label>
        </div>

        <label className="field">
          <span>Observações</span>
          <input
            value={form.notes || ''}
            onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))}
          />
        </label>

        {message ? <p className="field-success">{message}</p> : null}
        {error ? <p className="field-error">{error}</p> : null}

        <div className="actions">
          <button className="button button--primary" type="submit" disabled={isSaving}>
            {isSaving ? 'Salvando...' : 'Salvar cadastro'}
          </button>
        </div>
      </form>
    </section>
  );
}
