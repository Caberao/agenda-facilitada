import { PlugZap, ShieldCheck } from 'lucide-react';
import { requestWorkspaceTab } from '../lib/workspace-tabs';

const modules = [
  {
    title: 'Integrações',
    description: 'Status técnico do ambiente, deploys e conexões ativas.',
    path: '/admin/integrations',
    label: 'Admin · Integrações',
    icon: PlugZap,
  },
  {
    title: 'Usuários e Bancos',
    description: 'Gerencie usuários, subusuários e qual banco cada conta utiliza.',
    path: '/admin/access',
    label: 'Admin de acessos',
    icon: ShieldCheck,
  },
];

export function AdminHubPage() {
  return (
    <section className="page">
      <header className="page__header">
        <h2>Administração</h2>
        <p>Escolha uma área: integrações ou gestão de usuários e bancos.</p>
      </header>

      <article className="card birthdays-hub">
        {modules.map((module) => {
          const Icon = module.icon;
          return (
            <button
              key={module.path}
              className="birthdays-hub__item"
              type="button"
              onClick={() => requestWorkspaceTab({ path: module.path, label: module.label })}
            >
              <span className="birthdays-hub__icon">
                <Icon size={18} />
              </span>
              <strong>{module.title}</strong>
              <p>{module.description}</p>
            </button>
          );
        })}
      </article>
    </section>
  );
}
