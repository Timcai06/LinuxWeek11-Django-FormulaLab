# React 编辑器岛 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在 Project Workspace 中引入 React + TypeScript 编辑器岛，提升论文公式审校、LaTeX 编辑、预览和版本管理体验，同时保留 Django 模板作为全站骨架。

**Architecture:** Django templates 继续渲染页面框架、导航、权限和初始数据；React 只挂载在 Project Workspace 的复杂编辑区域；Django JSON API 负责读取和保存 FormulaItem、版本历史和审校状态。

**Tech Stack:** Django、React、TypeScript、Vite、KaTeX、CodeMirror 6、现有 Pretext layout intelligence。

---

## 为什么不用全站 SPA

当前 Formula Lab 已经有稳定页面：

```text
landing
workbench
history
system
mission report
project workspace
```

其中 landing、history、system、report 大多是服务端渲染页面，不需要完整 SPA。真正复杂的是 Project Workspace：

- 公式队列筛选和分页。
- FormulaItem Inspector。
- Paper Fit Preview。
- Review Drawer。
- LaTeX 编辑与 KaTeX 预览。
- 后续版本历史和 diff。

因此 B 阶段采用 island 架构：

```text
Django template
  -> 页面骨架、初始 JSON、静态资源入口
  -> React mount point
       -> Formula editor
       -> Preview
       -> Diff
       -> Review actions
```

## 前置条件

B 阶段不应早于以下能力：

- FormulaItem 具备版本历史表。
- Project Workspace 已有稳定 JSON API。
- A 阶段模型服务化完成或至少不再频繁改 OCR 调用链。

## 数据模型升级

新增 `FormulaItemVersion`：

```text
FormulaItemVersion
  id
  item
  latex
  source
  created_at
  created_by_label
  note
```

推荐 `source`：

```text
ocr
manual
system_correction
export_snapshot
```

`FormulaItem.latex_current` 继续作为当前版本快照，避免列表页每次都查最新版本。

## API 设计

```text
GET    /api/projects/<project_id>/items/
GET    /api/formula-items/<item_id>/
PATCH  /api/formula-items/<item_id>/
GET    /api/formula-items/<item_id>/versions/
POST   /api/formula-items/<item_id>/versions/
POST   /api/formula-items/<item_id>/versions/<version_id>/restore/
POST   /api/formula-items/<item_id>/review/
```

返回数据应包含：

```json
{
  "id": "uuid",
  "display_index": 12,
  "latex_current": "\\frac{a}{b}",
  "review_status": "needs_review",
  "source_job_code": "FL-20260522-0012",
  "updated_at": "2026-05-22T10:00:00Z"
}
```

## 前端文件结构

```text
frontend/formulas/workspace_editor/
  main.tsx
  api.ts
  types.ts
  components/
    FormulaEditor.tsx
    FormulaPreview.tsx
    FormulaDiff.tsx
    VersionTimeline.tsx
    ReviewToolbar.tsx
  hooks/
    useFormulaItem.ts
    useAutosave.ts
  styles/
    workspace-editor.css
```

构建输出：

```text
apps/formulas/static/formulas/js/generated/workspace-editor.js
apps/formulas/static/formulas/css/generated/workspace-editor.css
```

## Task 1: 版本历史后端

- [x] 新增 `FormulaItemVersion` 模型和迁移。
- [x] 在 OCR 成功沉淀为 `FormulaItem` 时创建 `source=ocr` 初始版本。
- [x] 在人工修改时创建 `source=manual` 新版本。
- [x] 增加 service：`update_formula_item_latex(item, latex, source, note)`。
- [x] 增加测试：确认更新当前 LaTeX 时会同时创建版本记录。

当前实现说明：

- `FormulaItem.latex_current` 仍然是当前快照，保证列表页和导出路径读取简单。
- `FormulaItemVersion` 通过 `item.versions` 关联，默认按最新创建时间倒序。
- OCR 成功时记录 `source=ocr`、`created_by_label=<engine_name>`。
- Review Drawer 人工确认非空 LaTeX 时记录 `source=manual`、`created_by_label=review`。
- 空白确认只更新审校状态，不产生无意义版本。

## Task 2: Workspace JSON API

- [x] 新增 project item list API。
- [x] 新增 formula item detail API。
- [x] 新增 formula item patch API。
- [x] 新增 formula item versions API。
- [x] 所有写操作走 service，不在 view 中直接改模型字段。

当前实现说明：

- `GET /api/projects/<project_id>/items/` 返回项目和 FormulaItem 列表。
- `GET /api/formula-items/<item_id>/` 返回单条 FormulaItem 和最新版本。
- `PATCH /api/formula-items/<item_id>/` 更新 `latex_current`，标记为 `edited`，并创建 `source=manual` 版本。
- `GET /api/formula-items/<item_id>/versions/` 返回版本时间线。
- `POST /api/formula-items/<item_id>/versions/` 创建人工版本并同步当前快照。

## Task 3: React 构建链

- [x] 安装 `react`、`react-dom`、`typescript`、`vite`、`@vitejs/plugin-react`。
- [x] 新增 `vite.config.ts`。
- [x] Makefile 增加 `editor-build` 和 `editor-check`。
- [x] `npm run check:frontend` 纳入 TypeScript 检查。

当前实现说明：

- 编辑器源码位于 `frontend/formulas/workspace_editor/`。
- TypeScript 检查使用 `tsconfig.workspace-editor.json`。
- Vite 配置文件为 `vite.workspace-editor.config.ts`。
- 构建输出固定为 `apps/formulas/static/formulas/js/generated/workspace-editor.js` 和 `apps/formulas/static/formulas/css/generated/workspace-editor.css`。
- Vite 当前固定在 6.x，避免为了编辑器岛升级既有 `esbuild` 构建链。

## Task 4: React mount

- [x] 在 `project_workspace.html` 增加 mount point：

```html
<div
  id="workspace-editor-root"
  data-project-id="{{ project.id }}"
  data-initial-item-id="{{ selected_item.id|default:'' }}"
></div>
```

- [ ] Django 模板继续保留无 JS fallback 的关键信息。
- [x] Django 模板继续保留无 JS fallback 的关键信息。
- [x] React 只接管编辑器和版本区域，不接管全页布局。

当前实现说明：

- `workspace-editor-root` 挂在 Project Workspace 页面顶部，携带 `project_id`、初始 item id 和 project items API URL。
- React 第一片已经加载项目 items、渲染编辑器、保存当前公式并刷新版本时间线。
- 旧的 Django 模板、Review Drawer 和项目导出入口继续作为可用 fallback。

## Task 5: 编辑器体验

- [ ] 用 CodeMirror 6 提供 LaTeX 编辑区。
- [x] 编辑时实时更新 KaTeX preview。
- [x] 保存按钮触发 `PATCH /api/formula-items/<id>/`。
- [x] 成功保存后刷新版本时间线。
- [x] 保存失败时显示不覆盖内容的错误提示。
- [x] 版本时间线支持审计式 restore，恢复旧 LaTeX 时创建新的 `source=manual` 版本。

当前实现说明：

- 第一版 React 编辑器使用受控 textarea，先打通真实保存链路。
- 保存请求带 `X-CSRFToken`，后端写入 `FormulaItem.latex_current` 并创建 `source=manual` 版本。
- 版本时间线通过 `GET /api/formula-items/<item_id>/versions/` 加载。
- React 内部 KaTeX preview 读取全局 `window.katex`，保留与全站 KaTeX 资产一致的渲染能力。
- `POST /api/formula-items/<item_id>/versions/<version_id>/restore/` 不修改旧版本，而是把目标版本的 LaTeX 写回当前快照并生成一条新的人工版本，保证历史可审计。
- CodeMirror 6 留到下一片，避免在没有确认 LaTeX language package 的情况下引入不稳定依赖。

## Task 6: 验收标准

- [ ] 未启用 React bundle 时，Project Workspace 仍能看到基本公式信息。
- [x] React 编辑器可以编辑并保存 `FormulaItem.latex_current`。
- [x] 每次保存都会产生版本历史。
- [x] KaTeX preview 和现有项目视觉风格一致。
- [x] 旧版本可从 timeline 恢复，并产生新的审计版本。
- [ ] 不影响 landing、history、system、report 页面。
- [ ] `make frontend-check` 和 Django tests 通过。

## 风险控制

- React 不直接读取 CSRF cookie 以外的全局状态，所有业务数据来自 Django JSON API。
- 不在第一版做多人协作、实时同步和 PDF 编译。
- 不把 Pretext 当作 LaTeX 真相，只作为布局辅助。

## Task 7: 论文文件模型

- [x] 新增 `PaperDocument`，归属 `PaperProject`，记录 `document_code`、标题和 `root_file_path`。
- [x] 新增 `PaperFile`，归属 `PaperDocument`，记录相对路径、文件类型、内容和排序。
- [x] `PaperFile.path` 限制为安全相对路径，禁止绝对路径、`.`、`..`。
- [x] 同一篇文档内文件路径唯一。
- [x] 新增 service：`create_default_document(project, title)`，创建文档并生成 `main.tex`。
- [x] 新增 API：`GET/POST /api/projects/<project_id>/documents/`。
- [x] 新增 API：`GET/PATCH /api/document-files/<file_id>/`。

当前实现说明：

- 这一片只建立 Overleaf 型编辑器的后端地基，不直接引入 PDF 编译或多人协同。
- 默认文档会生成 `main.tex`，包含 `article` 文档类、`amsmath` 和项目标题。
- 文档 API 放在独立 `document_views.py`，避免继续扩大 `project_views.py`。
- 下一片可以让 React editor island 读取 documents/files API，把现有公式编辑区升级为论文文件编辑区。

## Task 8: 论文编辑器三栏雏形

- [x] React editor island 读取 `GET /api/projects/<project_id>/documents/`。
- [x] 当项目没有文档时，自动调用 `POST /api/projects/<project_id>/documents/` 创建默认文档。
- [x] 新增 `PaperWorkspace`，包含文件树、LaTeX 源码编辑区和源码预览区。
- [x] 新增 `PaperFileTree`，展示文档标题、文档编号和文件列表。
- [x] 新增 `PaperSourceEditor`，编辑当前 `PaperFile.content`。
- [x] 新增 `PaperPreview`，先以源码 preview 占位，后续替换为 PDF/LaTeX preview。
- [x] 保存文件调用 `PATCH /api/document-files/<file_id>/`。
- [x] 下方 Formula Materials 继续保留，作为 OCR 公式素材区。

当前实现说明：

- 第一版先做单人编辑闭环，不做多人 presence、批注或 PDF 编译。
- Paper Workspace 位于 Project Workspace 顶部，Formula Materials 位于下方，形成“论文编辑区 + 公式素材区”的产品层次。
- `main.tex` 保存后会同步 React 本地文件树状态，避免保存后预览和文件内容脱节。
- 下一片应从源码 preview 进入真正的 LaTeX 编辑体验：CodeMirror、插入公式、基础文件操作和 PDF 编译/预览入口。

## Task 9: 论文文件操作与编辑器壳

- [x] 新增 API：`POST /api/documents/<document_id>/files/`，在文档内创建安全相对路径文件。
- [x] `PATCH /api/document-files/<file_id>/` 支持同时更新 `content` 和 `path`，用于保存与重命名。
- [x] 后端根据扩展名推断 `tex`、`bib`、`markdown`、`text` 文件类型。
- [x] React 新增 `createPaperFile`、`renamePaperFile`，文件树可以新建和重命名文件。
- [x] 新增 `PaperCodeEditor`，用行号 gutter、等宽排版和稳定编辑区域替代裸 textarea，为后续接入 CodeMirror 留接口。
- [x] 文件操作更新本地 `PaperDocument.files` 状态，避免创建/重命名后必须整页刷新。

当前实现说明：

- 这一片仍然是单人编辑器，不处理多人冲突、锁定和 OT/CRDT。
- 新建/重命名暂时使用浏览器 prompt，后续 UI 美化时替换为项目内 drawer/modal。
- `PaperCodeEditor` 目前是 CodeMirror-ready 的轻量编辑器壳，还没有引入真实 CodeMirror 包；下一片再接入语法高亮、快捷键和搜索。
