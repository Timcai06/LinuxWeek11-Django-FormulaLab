# Landing 第四阶段 Workbench Gate 设计

## 目标

把 Landing 的最终滚动状态从“产品预览工作台”收束为一个更克制、更有作品感的 Workbench 入口界面。

第三阶段的 Product Preview Reveal 证明了 Formula Lab 可以把手稿、论文项目、公式审查和协作信号串成一个完整产品叙事。但用户现在更明确地倾向于 Luke Baffait 式的视觉节奏：过程可以强烈、艺术、沉浸，终点不需要展示复杂工作台，只需要留下一个清晰、有力量的进入 Workbench 的按钮界面。

第四阶段不是推翻前面的 Living Manuscript。它要保留现有公式场、草稿纸、扫描解码和 scroll story 的骨架，只把最后的 reveal 从“迷你产品预览”改成“Workbench Gate”。

## 核心判断

当前 Landing 最后一屏的信息密度偏高。左侧项目树、中间论文预览、右侧公式审查、协作信号同时出现，会让页面从艺术作品突然变成 dashboard demo。

新的判断是：

- Landing 负责建立吸引力、记忆点和产品气质。
- Workbench 负责承载真实产品结构。
- Landing 最后只需要完成一次明确转场：从混乱手稿进入可工作的 Formula Lab。

因此，最终一屏应当像一个仪式性的入口，而不是产品功能说明页。

## 用户应感受到什么

目标用户滚动到最后时应感到：

1. 公式、草稿、论文材料已经被系统理解。
2. 视觉噪声已经收束，下一步是真正进入工作台。
3. Formula Lab 不是普通上传页，而是一个面向论文写作的高质感工具。

用户不需要在 landing 末尾看懂全部 Project Workspace 结构。那些结构应该在进入 Workbench 或 Project Workspace 后自然出现。

## 滚动叙事

### 1. Ignition

保留现有首屏的品牌、公式场、草稿纸和轻量顶部导航。

设计约束：

- 不新增第二张纸。
- 不引入大面积产品卡片。
- 标题和背景公式保持真实 KaTeX 或已经验证过的视觉渲染，不暴露 raw TeX。

### 2. Absorption

标题、辅助文本和公式场逐渐被草稿纸吸收。

设计约束：

- 背景公式和文字必须真实消散、位移或转入粒子语义。
- 不以 blur 作为主要退场方式。
- 消散后不要留下右侧怪异公式堆叠。

### 3. Manuscript Center

草稿纸移动到视觉中心，成为唯一主视觉。

设计约束：

- 以肉眼视觉中心为准，而不是只看数学坐标。
- 纸张周围可以保留轻微能量场，但不保留大面积雾层。
- 中心阶段不展示复杂 UI。

### 4. Decode

草稿纸表面进入扫描、识别、结构化的状态。

建议表现：

- 纸张纹理上的扫描光。
- 局部公式轨迹或识别线短暂出现。
- 少量光点从纸面脱离，并向最终按钮界面聚合。

设计约束：

- 不做真实 OCR 调用。
- 不显示完整产品面板。
- 不在页面右侧堆示例公式。

### 5. Workbench Gate

全部公式场、标题文案、扫描噪声和复杂浮层收束。最终画面只保留：

- 居中或略微后退的草稿纸残影。
- 一句极短的产品落点文案。
- 一个主按钮：`Enter Workbench`。

可选但默认不做第二按钮。若后续需要，第二按钮只能是低权重文本链接，例如 `View Mission Log`，不能和主按钮争抢视觉权重。

验收判断：最后一屏应该像一个高级产品的入口，而不是普通 SaaS landing 的 CTA section。

## 模块设计

### ScrollDirector

继续作为滚动时间线导演。

职责：

- 保留 `intro / absorb / center / scan / reveal / cta` 或等价阶段。
- 将最终 `reveal / cta` 的语义从 Product Preview 改为 Workbench Gate。
- 输出 gate 需要的 CSS 变量，例如 gate opacity、按钮可点状态、纸张最终透明度、星图最终透明度。
- 保持滚动进度通过 ref 传给 Three.js，不引入逐帧 React state。

非职责：

- 不直接渲染按钮 DOM。
- 不直接写 shader 细节。

### WorkspaceRevealOverlay

第三阶段的 `WorkspaceRevealOverlay` 不再承担最终产品预览。

推荐改名或替换为 `WorkbenchGateOverlay`。

职责：

- 渲染最终极简入口。
- 控制最终文案和按钮可访问性。
- 确保按钮只在最终阶段可点击。

非职责：

- 不展示 Project Context、Paper Workspace、Review Inbox、Collaboration Signals 的完整结构。
- 不接入真实项目数据。
- 不模拟编辑器操作。

### ManuscriptCanvas

继续负责草稿纸、粒子和扫描。

职责：

- 在吸收阶段成为视觉重心。
- 在 decode 阶段提供纸面扫描和公式结构化感。
- 在 Workbench Gate 阶段降低复杂度，让 CTA 可读。

约束：

- 纸张不应在最后喧宾夺主。
- WebGL 失败时，最终按钮仍应可见可点。
- DPR、粒子数和 shader 成本继续受控。

### FormulaConstellationField

负责背景公式场的出现、消散和吸收语义。

职责：

- 公式远近层次保持高级感。
- absorb 后彻底退场。
- 不在最终 gate 阶段残留影响阅读。

### SplitTextTitleSequence

继续负责标题和短句的进入、拆散、消散。

职责：

- 首屏建立仪式感。
- 吸收阶段把文字拆解为视觉粒子或真实 opacity / transform 退场。
- 不在最终 gate 继续占据主视觉。

## 视觉语言

第四阶段的关键词：

- 黑色深场。
- 单一草稿纸视觉重心。
- 精密扫描。
- 文字真实消散。
- 极简 Workbench 入口。

最终按钮界面建议：

- 背景接近纯黑，但保留细微纸张余光或网格暗纹。
- 按钮不做过度赛博风，应像高级仪器面板里的唯一确认动作。
- `Enter Workbench` 使用明确、短促、有行动感的文案。
- 文案量控制在一句以内，例如 `Turn rough formulas into a working paper space.`。

避免：

- 最后一屏继续出现三栏工作台。
- 大量说明文案。
- 多个同权重 CTA。
- 白底卡片。
- 右侧公式瀑布。
- 产品预览像普通 dashboard 截图。

## 技术策略

### 保留现有基础

继续使用：

- React / Vite landing island。
- GSAP ScrollTrigger。
- Three.js / react-three-fiber。
- `ScrollDirector` CSS 变量。
- 现有 manuscript texture。
- 现有 landing build 输出链路。

### 收束第三阶段产物

第三阶段的 Product Preview Reveal 不直接删除为“无用代码”。它的产品结构判断仍然有价值，但应该转移到：

- Project Workspace 页面。
- 后续产品介绍区。
- Workbench 内的新用户引导。
- 未来“产品截面”式 section，而不是当前 Landing 最后一屏。

第四阶段第一版只处理 Landing 最终阶段，不扩展其他页面。

### 动画实现原则

- ScrollTrigger 驱动一个主时间线。
- 最终 gate 的出现要与 paper decode 连续，不做突兀切屏。
- 星图和文案退场以 opacity、mask、clip-path、transform、particle handoff 为主。
- Lenis 平滑滚动可以作为后续增强，不作为本阶段必需项。
- 不复制 Luke Baffait 的大量 JPG frame sequence，本项目应继续使用实时 Three.js 和 shader 形成自己的视觉语言。

## 可访问性与退化

- 最终 `Enter Workbench` 必须是普通可点击链接或按钮。
- `prefers-reduced-motion` 下跳过长滚动叙事，直接显示可用入口。
- WebGL 初始化失败时，显示静态草稿纸背景和 Workbench Gate。
- 最终阶段按钮可见时才开启 pointer events。
- 首屏导航不被 canvas 覆盖。

## 验收标准

- 最后一屏只有一个明确主 CTA：`Enter Workbench`。
- 复杂 Product Preview 不再作为 Landing 终点主画面。
- 草稿纸居中、扫描、收束、入口出现的叙事连续。
- 背景公式和标题在最终阶段真实消散，不只是模糊。
- 最终按钮界面可读、可点、和现有 Formula Lab 黑色工业视觉一致。
- 无裸 TeX、重复纸张、右侧公式堆叠、过亮雾层。
- `npm run check:frontend` 通过。
- `./.conda/bin/python manage.py check` 通过。
- `python scripts/check_repository_governance.py` 通过。
- 真实浏览器桌面端检查首屏、纸张居中、decode、final gate 四个关键状态。

## 非目标

- 不重做整个 Landing 架构。
- 不在本阶段实现真实 Project Workspace 功能。
- 不在 Landing 末尾模拟多人协作。
- 不新增后端接口。
- 不引入 React Router 或整站 SPA。
- 不追求移动端完整适配，当前仍以 Web 桌面端为主。
- 不把页面改成 Luke Baffait 的复制品，只学习其节奏、收束和性能意识。

## 与第三阶段的关系

第三阶段提出的产品预览方向没有被否定。它回答的是“Formula Lab 未来完整产品形态是什么”。第四阶段回答的是“Landing 的最后 5 秒应该如何落地”。

结论：

- Product Preview 适合 Workbench、Project Workspace 或后续产品区。
- Workbench Gate 适合 Landing 最终画面。
- Landing 先让用户想进入，进入后再让用户理解完整产品结构。
