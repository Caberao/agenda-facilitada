import { Plus } from 'lucide-react';

export function BirthdayTemplatesPage() {
  return (
    <section className="page">
      <header className="page__header page__header--row">
        <div>
          <h2>Templates de Mensagem</h2>
          <p>Configure modelos de texto e imagem para envio manual com personalização por nome/apelido.</p>
        </div>
        <button className="button button--primary" type="button">
          <Plus size={16} />
          Novo template
        </button>
      </header>

      <article className="card">
        <p className="empty-message">
          Em breve: criar template textual, escolher fundo, posição do nome e combinar com foto da pessoa.
        </p>
      </article>
    </section>
  );
}
