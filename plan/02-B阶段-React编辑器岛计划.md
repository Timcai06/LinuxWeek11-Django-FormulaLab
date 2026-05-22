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

- [ ] 新增 `FormulaItemVersion` 模型和迁移。
- [ ] 在 OCR 成功沉淀为 `FormulaItem` 时创建 `source=ocr` 初始版本。
- [ ] 在人工修改时创建 `source=manual` 新版本。
- [ ] 增加 service：`update_formula_item_latex(item, latex, source, note)`。
- [ ] 增加测试：确认更新当前 LaTeX 时会同时创建版本记录。

## Task 2: Workspace JSON API

- [ ] 新增 project item list API。
- [ ] 新增 formula item detail API。
- [ ] 新增 formula item patch API。
- [ ] 新增 formula item versions API。
- [ ] 所有写操作走 service，不在 view 中直接改模型字段。

## Task 3: React 构建链

- [ ] 安装 `react`、`react-dom`、`typescript`、`vite`、`@vitejs/plugin-react`。
- [ ] 新增 `vite.config.ts`。
- [ ] Makefile 增加 `editor-build` 和 `editor-check`。
- [ ] `npm run check:frontend` 纳入 TypeScript 检查。

## Task 4: React mount

- [ ] 在 `project_workspace.html` 增加 mount point：

```html
<div
  id="workspace-editor-root"
  data-project-id="{{ project.id }}"
  data-initial-item-id="{{ selected_item.id|default:'' }}"
></div>
```

- [ ] Django 模板继续保留无 JS fallback 的关键信息。
- [ ] React 只接管编辑器和版本区域，不接管全页布局。

## Task 5: 编辑器体验

- [ ] 用 CodeMirror 6 提供 LaTeX 编辑区。
- [ ] 编辑时实时更新 KaTeX preview。
- [ ] 保存按钮触发 `PATCH /api/formula-items/<id>/`。
- [ ] 成功保存后刷新版本时间线。
- [ ] 保存失败时显示不覆盖内容的错误提示。

## Task 6: 验收标准

- [ ] 未启用 React bundle 时，Project Workspace 仍能看到基本公式信息。
- [ ] React 编辑器可以编辑并保存 `FormulaItem.latex_current`。
- [ ] 每次保存都会产生版本历史。
- [ ] KaTeX preview 和现有项目视觉风格一致。
- [ ] 不影响 landing、history、system、report 页面。
- [ ] `make frontend-check` 和 Django tests 通过。

## 风险控制

- React 不直接读取 CSRF cookie 以外的全局状态，所有业务数据来自 Django JSON API。
- 不在第一版做多人协作、实时同步和 PDF 编译。
- 不把 Pretext 当作 LaTeX 真相，只作为布局辅助。

