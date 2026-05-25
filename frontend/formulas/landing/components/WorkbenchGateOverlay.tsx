export function WorkbenchGateOverlay() {
  return (
    <div className="workbench-gate" aria-label="Formula Lab Workbench entry">
      <div className="workbench-gate-aura" aria-hidden="true" />
      <div className="workbench-gate-shell">
        <span className="workbench-gate-kicker">Formula Lab is ready</span>
        <p className="workbench-gate-copy">Turn rough formulas into a working paper space.</p>
        <a className="button primary workbench-gate-cta" href="/workbench/">
          Enter Workbench
        </a>
      </div>
    </div>
  );
}
