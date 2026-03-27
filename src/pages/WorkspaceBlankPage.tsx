interface WorkspaceBlankPageProps {
  title: string;
}

export function WorkspaceBlankPage({ title }: WorkspaceBlankPageProps) {
  return (
    <section className="workspace-blank">
      <header className="workspace-blank__header">
        <h2>{title}</h2>
        <p>Área em branco por enquanto para montar os dados com calma.</p>
      </header>
      <div className="workspace-blank__board" />
    </section>
  );
}
