export function WorkspaceRevealOverlay() {
  return (
    <div className="workspace-reveal">
      <div className="workspace-shell" aria-hidden="true">
        <div className="workspace-pane workspace-pane-outline">
          <span />
          <span />
          <span />
          <span />
        </div>
        <div className="workspace-pane workspace-pane-paper">
          <span />
          <span />
          <span />
        </div>
        <div className="workspace-pane workspace-pane-review">
          <span />
          <span />
          <span />
        </div>
      </div>
      <div className="workspace-cta">
        <a className="button primary" href="/workbench/">
          Start Recognition
        </a>
        <a className="button secondary" href="/projects/">
          Open Workspace
        </a>
      </div>
    </div>
  );
}
