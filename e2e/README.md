# Formula Lab E2E

The suite is split into three layers:

- `make e2e-smoke` checks the core page surfaces against an already running app.
- `make e2e-real-model` runs the real OCR mission flow against an already running app.
- `make e2e-visual` compares Playwright screenshots against local baselines.

For a self-contained local run, use:

```bash
make e2e-local-smoke
make e2e-local
```

The first visual run needs to create baselines:

```bash
make e2e-visual-update
```

After that, run:

```bash
make e2e-visual
```

Visual tests intentionally hide highly dynamic WebGL / morphing canvas regions and disable transitions, so they catch layout, hierarchy, spacing, and contrast regressions without being noisy about frame-by-frame animation.
