const PROJECT_FILES = [
  { label: "main.tex", state: "active" },
  { label: "figures/", state: "idle" },
  { label: "references.bib", state: "idle" },
  { label: "missions", state: "queued" },
];

const REVIEW_ITEMS = [
  { status: "Ready", action: "Accept", confidence: "96%" },
  { status: "Check", action: "Edit", confidence: "81%" },
  { status: "Queued", action: "Review", confidence: "Pending" },
];

export function WorkspaceRevealOverlay() {
  return (
    <div className="workspace-reveal">
      <div className="product-preview-shell" aria-label="Formula Lab product workspace preview">
        <div className="product-preview-topbar">
          <span className="product-preview-title">Paper Workspace</span>
          <div className="workspace-cta">
            <a className="button secondary" href="/projects/">
              Open Workspace
            </a>
            <a className="button primary" href="/workbench/">
              Start Recognition
            </a>
          </div>
        </div>

        <div className="product-preview-grid" aria-hidden="true">
          <aside className="product-preview-project">
            <span className="product-preview-eyebrow">Project</span>
            {PROJECT_FILES.map((file) => (
              <span className={`project-file project-file-${file.state}`} key={file.label}>
                <i />
                {file.label}
              </span>
            ))}
          </aside>

          <section className="product-preview-paper">
            <span className="paper-line paper-line-title" />
            <span className="paper-line paper-line-wide" />
            <span className="paper-line paper-line-mid" />
            <div className="paper-equation-block">
              <span className="equation-gutter" />
              <span className="equation-line equation-line-long" />
              <span className="equation-line equation-line-short" />
            </div>
            <span className="paper-line paper-line-wide" />
            <span className="paper-insert-cursor" />
          </section>

          <aside className="product-preview-review">
            <span className="product-preview-eyebrow">Formula Review</span>
            {REVIEW_ITEMS.map((item) => (
              <div className="review-card" key={`${item.status}-${item.action}`}>
                <span className="review-image-slice" />
                <span className="review-katex-line" />
                <div className="review-card-footer">
                  <span>{item.confidence}</span>
                  <strong>{item.action}</strong>
                </div>
              </div>
            ))}
          </aside>
        </div>

        <div className="product-preview-collab" aria-hidden="true">
          <span className="collab-cursor" />
          <span className="collab-note">Suggested edit on Eq. 3</span>
          <span className="collab-version">v12 review</span>
        </div>
      </div>
    </div>
  );
}
