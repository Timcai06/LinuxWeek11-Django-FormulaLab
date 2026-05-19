---
version: alpha
name: Formula-Lab-mission-control-design-system
description: >
  Formula Lab is a formula-recognition workbench styled as a lightweight mission
  control interface. The selected base style is the SpaceX DESIGN.md language:
  stark black and white, fixed top navigation, uppercase microcopy, industrial
  sans typography, ghost-outline controls, full-bleed dark surfaces, and a
  futuristic task-stage atmosphere. This project adapts that cinematic aerospace
  language into a usable web tool for uploading equation images, tracking
  recognition jobs, reading LaTeX output, rendering formulas, and reviewing
  history. Do not build a generic SaaS dashboard.
selected_base_design:
  name: SpaceX DESIGN.md
  source: https://raw.githubusercontent.com/VoltAgent/awesome-design-md/main/design-md/spacex/DESIGN.md
adaptation_notes:
  - Keep the SpaceX black-white austerity, uppercase micro-labels, fixed top nav, and mission-stage language.
  - Replace rocket photography with formula, grid, telemetry, and control-surface metaphors.
  - Preserve readability for Chinese UI, LaTeX source, and history records.
  - Use full-bleed dark sections selectively; do not turn every work surface into a marketing hero.
  - Keep upload, copy, retry, and history actions obvious even when using ghost-outline styling.
---

# Formula Lab DESIGN.md

This file is the visual source of truth for Formula Lab. When implementing UI, read this file before editing templates, CSS, or frontend JavaScript.

## 1. Visual Theme & Atmosphere

Formula Lab should feel like a compact formula-recognition mission control room. The user is not browsing a landing page; they are launching a recognition job, monitoring stages, and inspecting output.

The selected visual base is SpaceX-inspired:

- Stark black and white.
- Fixed top navigation.
- Uppercase English micro-labels.
- Condensed industrial display type.
- Ghost-outline pill controls.
- Minimal chrome.
- Deep dark code and telemetry surfaces.
- Strong task-stage language.

Formula Lab adapts this for a real tool:

- The first screen is a workbench, not a full-screen marketing hero.
- Chinese labels remain readable and should not be forced into all caps.
- LaTeX source and rendered formula previews are first-class product content.
- History and system status pages can be denser than a SpaceX marketing page.
- Model and queue status should feel like mission telemetry, not backend jargon.

## 2. Color Palette & Roles

### Core

| Token | Hex | Role |
| --- | --- | --- |
| `canvas-night` | `#000000` | Primary dark canvas and top navigation |
| `canvas-night-soft` | `#0A0A0A` | Slightly lifted dark surface |
| `canvas-night-panel` | `#111111` | Workbench panels, progress surfaces |
| `canvas-light` | `#FFFFFF` | Formula preview and light utility panels |
| `canvas-cool` | `#F0F0FA` | Pale light hover or inactive fill |
| `ink` | `#000000` | Text on light surfaces |
| `on-night` | `#FFFFFF` | Primary text on dark surfaces |
| `on-night-muted` | `#F0F0FA` | Secondary text on dark surfaces |
| `ink-muted` | `#5A5A5F` | Secondary text on light surfaces |
| `hairline-on-dark` | `#3A3A3F` | 1px borders on dark UI chrome |
| `hairline-on-light` | `#E0E0E8` | 1px borders on light UI chrome |

### Semantic

SpaceX-style black and white remain dominant. Semantic color is intentionally scarce and should not become a brand palette.

| Token | Hex | Role |
| --- | --- | --- |
| `success` | `#FFFFFF` | Success text/border on dark surfaces |
| `warning` | `#F0F0FA` | Slow queue/model warmup state |
| `error` | `#FF4D4D` | Recognition failure or unreachable service |
| `focus` | `#FFFFFF` | Keyboard focus outline on dark surfaces |

### Color Rules

- Black and white do almost all chromatic work.
- Do not introduce a colored CTA system.
- Use red only for real failure states.
- Use white outlines and text for primary dark-surface actions.
- Use light panels only when readability requires it, especially formula previews and history rows.
- Avoid gradients, glows, tinted decorative backgrounds, and colorful badges.

## 3. Typography Rules

### Font Families

Use a D-DIN-inspired stack for display and UI. If D-DIN is unavailable, use narrow or industrial fallbacks.

```css
font-family: "D-DIN", "D-DIN Exp", "Arial Narrow", Arial, "PingFang SC",
  "Microsoft YaHei", sans-serif;
```

Use this stack for LaTeX source, task ids, commands, and diagnostics:

```css
font-family: "JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, Monaco,
  Consolas, "Liberation Mono", monospace;
```

KaTeX keeps its own formula fonts.

### Type Scale

| Token | Size | Weight | Line Height | Letter Spacing | Use |
| --- | ---: | ---: | ---: | ---: | --- |
| `display-xl` | 56px | 700 | 0.98 | 1.2px | Large mission/workbench title |
| `display-lg` | 42px | 700 | 1.05 | 1px | Page title |
| `heading-lg` | 28px | 700 | 1.18 | 0.6px | Section opener |
| `heading-md` | 20px | 700 | 1.25 | 0.4px | Panel title |
| `body` | 16px | 400 | 1.55 | 0.2px | Default Chinese/English text |
| `body-sm` | 13px | 400 | 1.45 | 0.2px | Metadata and helper text |
| `micro-cap` | 12px | 700 | 1.6 | 1px | Uppercase labels, nav, stage tags |
| `button-cap` | 13px | 700 | 1 | 1.1px | Buttons |
| `code` | 13px | 400 | 1.55 | 0 | LaTeX/code blocks |

### Type Rules

- English nav items, status labels, and stage labels use uppercase.
- Chinese interface copy stays normal Chinese; do not fake uppercase behavior with wide spacing.
- Display headings may use uppercase English, for example `FORMULA LAB` or `MISSION CONTROL`.
- Avoid serif fonts.
- Avoid playful rounded sans styles.
- Do not use huge hero type inside tool panels.

## 4. Component Styling

### Top Navigation

Top navigation is mandatory.

Specs:

- Fixed or sticky at top.
- Height: 64px.
- Background: `canvas-night`.
- Text: `on-night`.
- Bottom border: `1px solid hairline-on-dark`.
- Left: `FORMULA LAB` wordmark.
- Center/left-center: `WORKBENCH`, `HISTORY`, `SYSTEM STATUS`.
- Right: compact model state and upload action.

The nav should feel like a spacecraft control header, but it must remain usable. The active item uses a white underline or brighter text, not color.

### Buttons

Primary button on dark:

- Transparent or black background.
- Border: `1px solid on-night`.
- Text: `on-night`.
- Shape: pill, 32px radius.
- Padding: 14px 22px.
- Typography: `button-cap`, uppercase for English.
- Hover: white background, black text.

Primary button on light:

- White background.
- Border: `1px solid ink`.
- Text: `ink`.
- Same pill geometry.
- Hover: black background, white text.

Secondary action:

- Transparent background.
- Border: `1px solid hairline-on-dark` on dark surfaces.
- Text: muted white.
- Hover border becomes white.

Icon buttons:

- Minimal SVG icons only.
- 40px square hit target.
- No colorful icon fills.
- Always include accessible labels.

### Upload Zone

The upload zone is the home page command center.

Default dark version:

- Background: `canvas-night-panel`.
- Border: `1px dashed hairline-on-dark`.
- Radius: 8px.
- Minimum height: 320px desktop, 240px mobile.
- Text: `on-night`.

Drag-over:

- Border: `1px solid on-night`.
- Background: `canvas-night-soft`.
- Use a subtle outline, not a glow.

Selected file:

- Show image preview on a dark stage.
- Show filename, size, and format.
- Enable `START RECOGNITION`.

Error:

- Use red text and border only for real errors.
- Explain the exact issue.

### Progress View

Progress should feel like a launch sequence or telemetry stage list.

Elements:

- Formula image preview.
- Stage checklist.
- Horizontal progress bar.
- Current stage label.
- Task id and timestamps.
- Failure panel when needed.

Stage labels:

```text
UPLOAD LOCKED
QUEUED
MODEL WARMUP
IMAGE PREPROCESS
INFERENCE
LATEX POSTPROCESS
RESULT READY
```

Progress bar:

- Track: `hairline-on-dark`.
- Fill: white.
- Smooth transition allowed, but final value comes from API.

### Result View

Result view is the mission report.

Required panels:

1. Original image.
2. LaTeX source.
3. Rendered formula preview.
4. Task metadata.

LaTeX source panel:

- Dark surface.
- Monospace text.
- Copy button top-right.
- Include raw formula and Markdown-ready formula when useful.

Rendered formula preview:

- Light surface for maximum readability.
- Black text.
- Hairline border.
- Large enough for tall formulas.

### History List

History should feel like a mission log.

Each item:

- Thumbnail.
- Mission/job status.
- LaTeX summary.
- Created time.
- Duration.
- View result.
- Copy LaTeX.

Use dense rows on desktop and stacked log cards on mobile.

### System Status

System Status is the technical telemetry page.

Show:

- Django Web.
- PostgreSQL.
- Redis.
- Celery worker.
- pix2tex model.
- Last recognition job.

Use framework/service names here. Do not put them on the main workbench as decoration.

## 5. Layout Principles

### Page Shell

```text
Fixed black top navigation
Dark mission-control canvas
Page-specific work area
Optional light formula/result surfaces
```

Container:

- Max width: 1240px.
- Horizontal padding: 32px desktop, 18px mobile.
- Vertical rhythm: 32px to 48px.

### Home Workbench

Desktop:

```text
Top: compact mission heading and model state
Left 2/3: upload command zone and image preview
Right 1/3: queue/model telemetry and recent tasks
Bottom: recent mission log
```

Mobile:

```text
Mission heading
Upload
Model state
Recent tasks
History
```

### Progress Page

Use a command-sequence layout:

```text
Left: uploaded formula image
Right: stage checklist + progress + task telemetry
```

### Result Page

Use contrast intentionally:

```text
Top: mission summary
Left: original image and metadata
Right: dark LaTeX source
Bottom or side: light rendered formula preview
```

### History Page

Use a dense mission-log list. Avoid heavy dashboards or analytics charts in the first version.

## 6. Depth & Elevation

Use flat surfaces, borders, and photography-like contrast. Do not use shadows as the primary depth system.

Levels:

| Level | Treatment | Use |
| --- | --- | --- |
| 0 | `canvas-night` | Main background |
| 1 | `canvas-night-panel` + dark hairline | Workbench panels |
| 2 | `canvas-night-soft` + white/dark hairline | Active upload/progress |
| 3 | `surface-code` equivalent dark panels | LaTeX/code |
| 4 | `canvas-light` + light hairline | Formula render preview |

No nested cards inside cards unless the inner element is a real tool surface such as a code block or rendered formula panel.

## 7. Motion & Interaction

Motion is task feedback, not decoration.

Allowed:

- Upload drag highlight.
- Progress bar width transition.
- Stage checklist current-state transition.
- Copy success state.
- Failure state reveal.

Rules:

- Keep transitions 120-220ms.
- Respect `prefers-reduced-motion`.
- Do not animate large background elements.
- Do not use rocket/fire/space animations.
- Do not delay task feedback for cinematic effect.

## 8. Responsive Behavior

Check at:

- 375px mobile.
- 768px tablet.
- 1024px small desktop.
- 1440px desktop.

Responsive rules:

- Top nav collapses below 768px.
- Mission heading drops from 56px to 40px on mobile.
- Workbench becomes single-column below 900px.
- Result panels stack below 900px.
- Buttons must remain at least 44px tall on touch screens.
- Long LaTeX strings scroll inside code blocks without breaking layout.

## 9. Do's and Don'ts

### Do

- Make the upload command visible in the first viewport.
- Use mission-stage language for progress.
- Use black/white contrast as the main visual system.
- Keep history as a mission log.
- Show LaTeX source in a dark control panel.
- Show rendered formula on a clean light panel.
- Keep system status as telemetry.

### Don't

- Do not copy SpaceX rocket imagery.
- Do not make a pure marketing hero page.
- Do not force all Chinese text into letter-spaced display styling.
- Do not hide core controls behind cinematic visuals.
- Do not introduce colorful SaaS badges.
- Do not use decorative gradients, glows, or bokeh.
- Do not make every surface pure black if readability suffers.
- Do not let the SpaceX mood override task clarity.

## 10. Agent Prompt Guide

When building UI for this project, follow this short prompt:

```text
Build Formula Lab as a SpaceX-inspired formula-recognition mission control
workbench. Use a fixed black top nav, stark black-white palette, uppercase English
micro-labels, D-DIN-inspired typography, ghost-outline pill controls, dark upload
and LaTeX panels, backend-driven launch-sequence progress, a light rendered formula
preview, mission-log history, and a telemetry-style system status page. Preserve
Chinese readability and tool clarity. Do not build a marketing hero, use rocket
imagery, add colorful SaaS badges, or hide upload/result controls behind cinematic
decoration.
```

