const PROJECT_FILES = [
  { name: "draft.tex", meta: "Paper Workspace" },
  { name: "formula-notes.md", meta: "Recognition Queue" },
  { name: "review-export.docx", meta: "Ready to Share" },
];

const REVIEW_ITEMS = [
  { formula: "\\int_0^1 x^2\\,dx", status: "Verified", action: "Send to paper" },
  { formula: "\\sum_{n=1}^{\\infty} \\frac{1}{n^2}", status: "Needs context", action: "Open reviewer" },
];

export function WorkspaceRevealOverlay() {
  return (
    <div className="workspace-reveal">
      <div className="workspace-shell product-preview-shell">
        <div className="product-preview-topbar">
          <div className="product-preview-title">
            <span>Formula Lab</span>
            <strong>Product Preview</strong>
          </div>
          <div className="workspace-cta">
            <a className="button secondary" href="/projects/">
              Open Workspace
            </a>
            <a className="button primary" href="/workbench/">
              Start Recognition
            </a>
          </div>
        </div>

        <div className="product-preview-grid">
          <section className="workspace-pane product-preview-project" aria-label="Project workspace">
            <header>
              <span>Project Files</span>
              <strong>Paper Workspace</strong>
            </header>
            <div>
              {PROJECT_FILES.map((file) => (
                <article key={file.name} className="project-file">
                  <strong>{file.name}</strong>
                  <span>{file.meta}</span>
                </article>
              ))}
            </div>
          </section>

          <section className="workspace-pane product-preview-paper" aria-label="Paper editor">
            <header>
              <span>Live Manuscript</span>
              <strong>Equation-aware editing</strong>
            </header>
            <p>Draft, inspect, and align recognition output directly inside the paper workflow.</p>
          </section>

          <section className="workspace-pane product-preview-review" aria-label="Formula review inbox">
            <header>
              <span>Review Inbox</span>
              <strong>Resolve before publish</strong>
            </header>
            <div>
              {REVIEW_ITEMS.map((item) => (
                <article key={item.formula} className="review-card">
                  <strong>{item.formula}</strong>
                  <div className="review-card-footer">
                    <span>{item.status}</span>
                    <span>{item.action}</span>
                  </div>
                </article>
              ))}
            </div>
          </section>
        </div>

        <aside className="workspace-pane product-preview-collab" aria-label="Collaboration activity">
          <span>Collaboration</span>
          <strong>Editor + reviewer aligned</strong>
          <p>Comments, exports, and verification status stay attached to the active manuscript.</p>
        </aside>
      </div>
    </div>
  );
}
