# Landing 第三阶段 Product Preview Reveal 设计

## 目标

把 Landing 的最终滚动状态从“进入 Workbench 的按钮页”升级为“可理解产品价值的迷你工作台预览”。

第二阶段已经完成了草稿纸、公式场、居中扫描和工作台线框的基础叙事。第三阶段不继续堆叠抽象特效，而是把纸张居中后的终点落到真实产品形态：用户应该在最后一屏看见 Formula Lab 如何从图像公式进入论文编辑、公式审查和协作批注。

最终按钮仍然保留，但它们不再是画面主角。按钮应该嵌入产品预览里，像真实工作台中的自然操作。

## 核心判断

当前 Landing 的风险是视觉已经足够强，但最后仍像传统 CTA 页面：用户看完动画后只看到 `Start Recognition` 和 `Open Workspace`，还没有真正看见产品如何工作。

第三阶段的核心改动是：

- 从 `Final CTA Reveal` 改为 `Product Preview Reveal`。
- 从“线框装饰”改为“论文工作台预览”。
- 从“我可以进入 Workbench”改为“我已经看见 Workbench 为什么有用”。

## 用户应理解的产品价值

最后一屏必须让用户在 3 秒内理解四件事：

1. Formula Lab 不只是 OCR，它把图片公式接入论文上下文。
2. 识别结果不是孤立文本，而是可校对、可插入、可追踪的公式块。
3. Project Workspace 是论文生产现场，包含文件、正文、预览和审查流。
4. 长期方向是多人协作：批注、修改建议、版本痕迹、审阅状态。

## 滚动叙事调整

### 1. Intro

保留现有首屏：品牌、公式场、草稿纸、手稿质感和轻量工作台导航。首屏仍然负责吸引用户进入故事。

设计约束：

- 不新增第二张纸或额外主视觉。
- 不让工作台预览提前出现，避免首屏信息过载。
- 公式必须继续由 KaTeX 渲染，不允许裸 TeX fallback。

### 2. Absorb / Center

继续沿用第二阶段机制：标题、背景公式和辅助文字消散，草稿纸移动到视觉中心。这里的重点是建立“纸张是输入源”的认知。

设计约束：

- 文字和星图要消散或被吸收，不以 blur 作为主要退场。
- 纸张居中后应清晰、稳定，给后续 product morph 留出视觉空间。
- 不在这个阶段显示大段产品说明。

### 3. Decode

纸张表面出现识别扫描，局部公式区域被点亮。识别结果应该以少量浮层形式从纸面抽离，形成 Formula Review Inbox 的前奏。

建议表现：

- 2 到 3 个公式选区框从纸面出现。
- 选区旁边短暂浮现 KaTeX 预览或 LaTeX 结构线。
- 识别卡片不要铺满屏幕，只做“系统正在理解”的信号。

设计约束：

- 不做真实 OCR 调用。
- 不显示过多示例文字，避免 landing 变成说明文。
- 公式预览优先使用真实 KaTeX，失败时隐藏，不显示 raw TeX。

### 4. Product Preview Reveal

这是第三阶段的核心。草稿纸不只是停在中心，而是成为工作台的一部分：纸张背后或下方展开一个桌面端论文工作台预览。

最终画面结构：

- 左侧：Project Context
  - `main.tex`
  - `figures/`
  - `references.bib`
  - `missions`
  - 用文件树和状态点暗示项目上下文。

- 中间：Paper Workspace
  - 论文正文区域。
  - 公式插入点。
  - 轻量 PDF/paper preview 面板。
  - 草稿纸可以悬浮在中间区域上方或转化为输入来源，不再喧宾夺主。

- 右侧：Formula Review Inbox
  - 2 到 3 条公式审查卡片。
  - 每条包含原图切片占位、KaTeX 预览线、置信状态、Accept/Edit 状态。
  - 它要像真实产品的 review queue，而不是普通装饰卡片。

- 上层：Collaboration Signals
  - 一个批注气泡。
  - 一个协作者光标或头像点。
  - 一条版本/建议标记。
  - 用极少文字暗示多人协作，不展开完整协作系统。

## CTA 新位置

CTA 不再作为最终画面中心的大按钮组。

新的 CTA 设计：

- `Start Recognition` 放入 Formula Review Inbox 或工作台顶部右侧，像“开始处理新输入”的产品动作。
- `Open Workspace` 放入工作台顶部栏，像“进入真实项目”的产品动作。
- CTA 仍然必须清晰可点，但视觉权重低于产品预览本身。

验收判断：如果遮住 CTA，用户仍然能理解产品形态；如果遮住工作台，只剩 CTA，则设计失败。

## 模块设计

### WorkspaceRevealOverlay

继续作为 Product Preview 的承载模块，但需要从线框骨架升级为语义化预览。

职责：

- 渲染 Project Context、Paper Workspace、Formula Review Inbox、Collaboration Signals。
- 接收 CSS 变量控制显隐、位移、缩放和局部强调。
- 保持 DOM 层可维护，不把所有结构塞进 canvas。

非职责：

- 不接入真实项目数据。
- 不做真实编辑器交互。
- 不承担 Project Workspace 页面本身的功能。

### ScrollDirector

保留现有阶段，但将最终 `cta` 语义改成产品预览完成态。

职责：

- 输出 `--workspace-opacity`、`--workspace-scale`、`--cta-opacity` 等现有变量。
- 增加或调整 Product Preview 子层变量，例如 project、paper、review、collab 的逐层显现。
- 保持滚动进度通过 ref 桥接给 WebGL，不引入逐帧 React state。

### ManuscriptCanvas

继续负责草稿纸、星图吸收和纸张扫描。

职责：

- 在 Product Preview Reveal 阶段降低纸张视觉权重，让工作台成为主角。
- 保持纸张仍然可见，作为输入来源和视觉记忆。
- 控制 shader 成本，保持 DPR 和粒子数上限。

### ProductPreviewCopy

如果需要少量文字，应拆成独立轻量组件，而不是散落在 overlay 结构里。

职责：

- 提供极少量产品语义标签。
- 保证 landing 不是长文案页面。

第一版可以不新增该组件，优先用界面结构表达产品。

## 视觉语言

第三阶段应从“航天仪器感”过渡到“科研生产力工作台”。

保留：

- 黑底。
- 细网格。
- 低饱和青绿色扫描光。
- 1px hairline。
- 工业字体和紧凑信息密度。

新增：

- 更真实的三栏工作台比例。
- 少量论文正文行、公式块、文件树和审查卡片。
- 协作标记使用克制亮色，不做社交产品式彩色头像墙。

避免：

- 大面积玻璃卡片。
- 过多圆角卡片。
- 只有按钮没有产品画面。
- 把最终工作台做成纯装饰线框。
- 再次出现右侧固定公式代码列。

## 交互策略

桌面端优先。

默认滚动路径：

1. 纸张扫描完成。
2. 工作台底座从暗处显现。
3. 左侧项目树先出现，说明这是论文项目。
4. 中间论文区域出现公式插入点。
5. 右侧 review inbox 出现识别卡片。
6. 批注和协作者信号短暂浮现。
7. CTA 在工作台内部变为可点击。

鼠标 hover：

- 可以轻微强调 review 卡片、项目文件或 CTA。
- 不做复杂 hover 交互，避免 landing 变成假产品 demo。

## 技术原则

- Product Preview 用 DOM/CSS 实现，便于维护和响应真实产品视觉。
- WebGL 继续只负责纸张、粒子和扫描，不绘制 UI。
- CSS 变量继续由 ScrollDirector 统一驱动。
- CTA 的 `pointer-events` 和 `visibility` 必须只在最终阶段打开。
- KaTeX 渲染失败时隐藏公式内容，不暴露 raw TeX。
- 所有新增视觉结构应进入现有 landing build，不新增独立前端应用。

## 验收标准

- 最终滚动状态明显是一个产品工作台预览，而不是按钮页。
- 用户能看出左侧项目、中间论文、右侧公式审查、上层协作信号。
- `Start Recognition` 和 `Open Workspace` 嵌入工作台内部，仍清晰可点击。
- 首屏不被 Product Preview 干扰。
- 没有裸 TeX、重复纸张、过亮雾层、右侧奇怪公式堆叠。
- WebGL 纸张在最终阶段不喧宾夺主。
- `npm run check:frontend` 通过。
- `.conda/bin/python manage.py check` 通过。
- `.conda/bin/python scripts/check_repository_governance.py` 通过。
- Chrome 桌面端真实浏览器截图能证明首屏、纸张居中、最终产品预览三帧成立。

## 非目标

- 不在本阶段实现真实多人协作后端。
- 不在本阶段实现真实项目编辑器。
- 不在本阶段把 Project Workspace 嵌入 Landing。
- 不在本阶段新增 React Router 或 SPA 架构。
- 不在本阶段追求移动端完整动画体验。
- 不在本阶段重写第二阶段已经稳定的 WebGL 基础。

## 后续计划入口

如果本设计确认，下一步实施计划应拆成四个任务：

1. Product Preview 结构升级：重做 `WorkspaceRevealOverlay` 的语义结构。
2. ScrollDirector 变量扩展：增加 project、paper、review、collab 的分层显现。
3. Landing CSS 精修：完成三栏工作台、内嵌 CTA、协作信号和 hover 稳定性。
4. 守卫与浏览器验证：确保最终不是按钮页、CTA 可点击、raw TeX 不可见、性能上限不回退。
