# Pretext 第二阶段：公式审查收件箱计划

## 目标

把 Project Workspace 里的 Formula Materials 升级成 Formula Review Inbox，让用户像处理论文审稿意见一样处理识别出来的公式资产。

这一阶段的核心不是再做一个漂亮列表，而是建立一个可长期扩展的公式审查工作流：

```text
OCR 结果
  -> Formula Review Inbox
  -> 修正 / 确认 / 拒绝 / 批量处理
  -> 插入论文草稿
  -> 后续进入 AI sidecar 与协作审阅
```

Pretext 在这里的角色是前端布局智能：预测文本和公式卡片高度、稳定长列表、处理富文本行内元素，而不是参与 OCR 正确性或数据库真相。

## 产品定位

Formula Review Inbox 是 Formula Lab 区别于普通 OCR 工具的第一块核心产品面。

它解决三个问题：

- 识别结果很多时，用户需要一个审查收件箱，而不是散落的结果页。
- 公式是论文资产，应该有来源、版本、状态和插入位置。
- AI / 协作能力要围绕可审计公式资产发生，而不是直接改一段不可追踪文本。

## 信息架构

推荐在 Project Workspace 中形成三层：

```text
Paper Workspace
  文件树 / CodeMirror / preview / save

Formula Review Inbox
  状态筛选 / masonry list / formula card / batch review

Inspector + AI Sidecar 入口
  公式详情 / 版本 / KaTeX / paper insertion / future AI suggestions
```

第一版不新增全局导航页，仍放在 Project Workspace 内，避免用户在论文编辑和公式审查之间跳来跳去。

## 数据基础

优先复用现有模型：

- `FormulaJob`：来源任务、OCR 状态、错误信息、耗时。
- `FormulaItem`：公式资产、当前 LaTeX、审查状态、来源任务。
- `FormulaItemVersion`：OCR 初始版本、人工修改版本、后续 AI 建议接受版本。
- `PaperFile`：当前论文文件和草稿内容。

第一版不新增数据库表。只有当协作批注进入 D 阶段时，再考虑新增 `CommentThread` / `ReviewSuggestion`。

## Pretext 使用点

### 1. Masonry / Height Prediction

用途：

- FormulaItem 卡片内容长短差异很大。
- 有的公式很短，有的公式包含多行矩阵、piecewise、align。
- 普通 grid 容易出现大空洞或滚动跳动。

实现边界：

- Pretext 预测卡片中 summary、error、note 的文本高度。
- CSS 控制卡片外壳和列宽。
- React 记录预测高度用于初始布局，真实渲染后做轻量校正。

### 2. Rich Inline

用途：

- 卡片中混合 mission code、status chip、engine、duration、LaTeX 片段和 reviewer note。
- AI sidecar 后续会产生带公式、代码、引用和操作按钮的文本。

实现边界：

- 用 Pretext rich-inline 处理行内 token 的测量和换行。
- 不把 rich inline 当 markdown 全功能渲染器。
- KaTeX 仍由 KaTeX 渲染，Pretext 只负责周边文本排布。

### 3. Stable Truncation

用途：

- 长错误、长公式、长 notes 需要稳定两行或三行截断。
- 用户展开卡片时需要知道真实高度，避免跳动。

实现边界：

- 用 Pretext 计算截断文本和原始行数。
- 展开内容时用真实 `scrollHeight` 做动画。
- 不再用 Pretext 动态控制卡片宽度。

## 第一片：Inbox 骨架

### 任务

- [x] 在 React editor island 内新增 `FormulaReviewInbox` 组件。
- [x] 复用 `fetchProjectItems` 读取公式资产。
- [x] 增加状态分组：Needs Review、Auto Ready、Edited、Confirmed、Exported、Rejected。
- [x] 每张卡展示公式编号、状态、来源 mission、LaTeX 摘要、KaTeX 小预览和最近更新时间。
- [x] 点击卡片时同步当前选中公式，与现有 Inspector / Paper insertion 链路打通。

### 验收

- Project Workspace 首屏仍以论文编辑为主，不被 Inbox 抢走。
- Formula Review Inbox 可以处理 30 条以上公式资产。
- 不影响现有 Formula Materials 的插入论文能力。

## 第二片：Pretext Masonry

### 任务

- [x] 在 `frontend/formulas/layout_intelligence.js` 中补充卡片高度测量 helper。
- [x] 在 Inbox 中按预测高度安排稳定 masonry 布局。
- [x] 对长 LaTeX 做三行稳定截断；错误信息待后续 API 暴露后接入。
- [x] 增加前端 guard，防止 Pretext 再次接管卡片外壳宽度。

### 验收

- 不同长度公式卡片不会造成明显空洞。
- 浏览器刷新后列表初始布局稳定。
- 卡片 hover 和点击目标不闪动。

## 第三片：批量审查

### 任务

- [ ] 支持多选 FormulaItem。
- [ ] 支持批量确认、批量拒绝、批量标记需要复查。
- [ ] 如需后端批处理，新增 `POST /api/projects/<project_id>/formula-items/bulk-review/`。
- [ ] 批量操作返回成功和失败列表。

### 验收

- 批量审查只改变状态，不误改 LaTeX。
- 单条失败不会阻塞整批操作。
- 操作后 FormulaItem 列表、Inspector 和版本历史保持一致。

## 第四片：AI Sidecar 入口

### 任务

- [ ] 在 Inbox / Inspector 增加 AI suggestion 的入口位，但先不接真实大模型。
- [ ] 定义建议类型：修复 LaTeX、解释公式、检查符号一致性、建议插入位置。
- [ ] 设计建议卡片状态：draft、accepted、rejected。

### 验收

- AI 建议不会自动修改论文正文。
- 接受建议时必须经过现有 `FormulaItemVersion` 或 `PaperFile` 保存链路。
- 拒绝建议不污染版本历史。

## 不做

当前阶段明确不做：

- 不做多人实时协同。
- 不做完整 PDF 编译服务。
- 不做全站 React 重写。
- 不新增独立公式数据库或绕过 Django API。
- 不把 Pretext 用作 LaTeX 语义判断工具。

## 推荐验证命令

```bash
make frontend-check
./.conda/bin/python manage.py test tests.formulas tests.model_service -v 2
make governance-check
```

如果涉及真实页面视觉：

```bash
make local
./.conda/bin/python scripts/create_fail_case.py
```

浏览器检查：

```text
http://127.0.0.1:8000/projects/<project_id>/
http://127.0.0.1:8000/history/
```
