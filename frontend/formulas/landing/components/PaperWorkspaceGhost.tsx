const REVIEW_ITEMS = ["Gaussian integral", "Matrix inverse", "Boundary condition"];

export function PaperWorkspaceGhost() {
  return (
    <section className="paper-workspace-ghost cinematic-overlay" aria-label="Paper workspace preview">
      <div className="paper-workspace-ghost-editor">
        <span className="cinematic-kicker">main.tex</span>
        <pre>{String.raw`\begin{equation}
  E = mc^2
\end{equation}`}</pre>
      </div>
      <div className="paper-workspace-ghost-inbox">
        <span className="cinematic-kicker">Review inbox</span>
        {REVIEW_ITEMS.map((item) => (
          <span className="paper-workspace-ghost-item" key={item}>
            {item}
          </span>
        ))}
      </div>
      <div className="paper-workspace-ghost-preview" aria-hidden="true">
        <span />
        <span />
        <span />
      </div>
    </section>
  );
}
