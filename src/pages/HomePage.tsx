import { CalendarDays, CheckCircle2, Clock3, Smartphone } from 'lucide-react';
import { Link } from 'react-router-dom';

const highlights = [
  {
    title: 'Agenda organizada',
    description: 'Centralize atendimentos com status, filtros e contexto de cliente em uma tela limpa.',
    icon: CalendarDays,
  },
  {
    title: 'Fluxo rapido',
    description: 'Crie, edite e acompanhe compromissos com poucos cliques e sem friccao.',
    icon: Clock3,
  },
  {
    title: 'MVP pronto para portfolio',
    description: 'UI polida, arquitetura modular e base preparada para escalar para banco real.',
    icon: CheckCircle2,
  },
  {
    title: 'Experiencia mobile',
    description: 'PWA com instalacao local para acesso facil no desktop e no celular.',
    icon: Smartphone,
  },
];

export function HomePage() {
  return (
    <section className="home-page">
      <header className="home-hero">
        <div className="home-hero__content">
          <p className="home-hero__eyebrow">Agenda Facilitada</p>
          <h1>Gestao de atendimentos com visual premium e fluxo objetivo</h1>
          <p className="home-hero__subtitle">
            Projeto full stack em TypeScript, pronto para portifolio agora e com tokens do Supabase já mapeados no
            .env para a próxima fase.
          </p>
          <div className="home-hero__actions">
            <Link className="button button--primary" to="/login">
              Entrar no painel
            </Link>
            <Link className="button button--ghost" to="/dashboard">
              Ver dashboard
            </Link>
          </div>
        </div>
        <article className="home-hero__panel">
          <p className="home-hero__panel-title">Status do projeto</p>
          <ul>
            <li>
              <span>Frontend</span>
              <strong>ativo</strong>
            </li>
            <li>
              <span>API Express</span>
              <strong>ativo</strong>
            </li>
            <li>
              <span>Banco local</span>
              <strong>pronto</strong>
            </li>
            <li>
              <span>Supabase</span>
              <strong>em espera</strong>
            </li>
          </ul>
        </article>
      </header>

      <section className="home-grid">
        {highlights.map((item) => {
          const Icon = item.icon;
          return (
            <article className="home-feature" key={item.title}>
              <div className="home-card__icon">
                <Icon size={20} />
              </div>
              <h3>{item.title}</h3>
              <p>{item.description}</p>
            </article>
          );
        })}
      </section>
    </section>
  );
}
