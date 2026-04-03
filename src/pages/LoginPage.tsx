import { useState } from 'react';
import type { FormEvent } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAppStore } from '../store/app-store';

export function LoginPage() {
  const navigate = useNavigate();
  const login = useAppStore((state) => state.login);
  const isAuthenticated = useAppStore((state) => state.isAuthenticated);
  const isLoading = useAppStore((state) => state.isLoading);

  const [email, setEmail] = useState('demo@example.com');
  const [password, setPassword] = useState('admin123');
  const [error, setError] = useState('');

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const isValid = await login({
      email: email.trim().toLowerCase(),
      password,
    });

    if (!isValid) {
      setError('Falha no login. Verifique credenciais e confirme se o backend está rodando em http://localhost:3333.');
      return;
    }

    setError('');
    sessionStorage.setItem('agenda_reset_tabs_after_login', '1');
    navigate('/dashboard', { replace: true });
  }

  return (
    <section className="auth-page">
      <article className="auth-card">
        <p className="auth-card__eyebrow">Bem-vindo(a)</p>
        <h1>Acesse seu painel</h1>
        <p className="auth-card__subtitle">
          Faça login para acompanhar sua agenda, atualizar status e manter o dia sob controle.
        </p>

        <form className="form" onSubmit={handleSubmit}>
          <label className="field">
            <span>Email</span>
            <input value={email} onChange={(event) => setEmail(event.target.value)} type="email" required />
          </label>

          <label className="field">
            <span>Senha</span>
            <input
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              type="password"
              autoComplete="current-password"
              required
            />
          </label>

          {error ? <p className="field-error">{error}</p> : null}

          <button className="button button--primary login-submit-button" type="submit" disabled={isLoading}>
            <span>{isLoading ? 'Entrando...' : 'Entrar'}</span>
          </button>
        </form>
      </article>
    </section>
  );
}

