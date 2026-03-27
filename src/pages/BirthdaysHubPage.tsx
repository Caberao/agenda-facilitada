import { Brush, ContactRound, FolderTree, Send, MessagesSquare } from 'lucide-react';
import { requestWorkspaceTab } from '../lib/workspace-tabs';

const modules = [
  {
    title: 'Contatos',
    description: 'Cadastro de pessoas, WhatsApp e data de aniversário.',
    path: '/birthdays/contacts',
    label: 'Aniversários · Contatos',
    icon: ContactRound,
  },
  {
    title: 'Fundos',
    description: 'Gerencie fundos globais e por grupo para mensagens em imagem.',
    path: '/birthdays/backgrounds',
    label: 'Aniversários · Fundos',
    icon: Brush,
  },
  {
    title: 'Grupos',
    description: 'Crie grupos para organizar contatos e associar fundos.',
    path: '/birthdays/groups',
    label: 'Aniversários · Grupos',
    icon: FolderTree,
  },
  {
    title: 'Envio em lote',
    description: 'Filtre aniversariantes do dia, selecione contatos e gere artes em um clique.',
    path: '/birthdays/batch',
    label: 'Aniversários · Envio em lote',
    icon: Send,
  },
  {
    title: 'Templates',
    description: 'Monte modelos de texto e imagem para felicitações.',
    path: '/birthdays/templates',
    label: 'Aniversários · Templates',
    icon: MessagesSquare,
  },
];

export function BirthdaysHubPage() {
  return (
    <section className="page">
      <header className="page__header">
        <h2>Aniversariantes</h2>
        <p>Escolha um módulo para continuar: contatos, fundos, grupos ou templates.</p>
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
