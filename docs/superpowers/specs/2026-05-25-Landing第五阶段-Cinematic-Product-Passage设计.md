# Landing 第五阶段：Cinematic Product Passage 设计

## 1. 背景

Formula Lab 的 landing page 已经完成了第四阶段 Workbench Gate：滚动到最后可以得到一个明确的 `Enter Workbench` 入口。这个结果干净、可靠，但当前叙事仍偏短：草稿纸聚焦后过快进入按钮，缺少足够的产品想象力和高级交互层次。

第五阶段的目标是把 landing 从“草稿纸动画 + 最终入口”升级为一段可滚动的产品电影。用户滚动时应该感到：混乱的公式、手写草稿、OCR 识别、论文编辑、公式审查、多人协作这些能力被逐步召唤出来，最后才自然进入 Workbench。

## 2. 参考灵感

本阶段吸收这些参考方向，但不照搬它们的行业语境：

- GSAP Showcase：强调强滚动叙事、微交互、文字动效和高完成度视觉节奏。
- Luke Baffait：强调艺术化作品集气质、视差、文字编排、画面切换的高级感。
- Studio375 / Webflow 方向：强调品牌电影式页面、明确的滚动旅程和视觉化 timeline 思维。
- San Rita：强调“进入一个世界”的仪式感、地图/路径隐喻、加载过程中的世界构建文案和地形式视觉层次。

这些参考给 Formula Lab 的启发是：landing 不只是介绍功能，而是让用户穿过一个公式世界，最终抵达论文工作台。

## 3. 设计原则

1. 保留 Formula Lab 的产品身份。
   页面可以更艺术，但必须始终让用户理解这是面向 LaTeX 论文、公式识别、公式审查和论文协作的产品。

2. 保留当前 manuscript 作为视觉核心。
   草稿纸仍是主角，不替换为完全无关的抽象 3D 物体。新的视觉内容应该围绕草稿纸展开。

3. 不恢复旧 Product Preview 卡片堆。
   第三阶段的产品预览思路有价值，但旧实现容易变成密集 dashboard。第五阶段只保留“产品能力闪现”，用线框、幽灵层、光标、批注、公式片段表达能力。

4. 最终仍落到 Workbench Gate。
   结尾需要一个明确入口。按钮不是孤立出现，而是在论文工作台被构建完成后出现。

5. 滚动动画必须真实退出。
   背景公式、首屏文字和过渡元素在对应阶段需要消散、分解、转化或离场，不能只靠 blur 掩盖。

6. 动效强度受性能边界约束。
   页面可以大胆，但不能让 Mac 本机持续高负载。WebGL 粒子、DPR、shader、ScrollTrigger 更新频率都需要有上限。

## 4. 总体叙事

第五阶段采用 6 幕结构：

### 4.1 Formula Storm

首屏仍是 Formula Lab 的公式宇宙。公式不再只是背景，而是待整理的信息云。标题和副标题使用 SplitText 式文字节奏进入，滚动时逐字、逐行分解为粒子或细线，向草稿纸方向迁移。

用户感受到的重点：Formula Lab 面对的是复杂、混乱、真实的科研公式材料。

### 4.2 Manuscript Gravity

草稿纸移动到画面中心，成为引力核心。公式场和首屏文字被吸附到纸张附近，背景内容降低密度并真正消散。Three.js 负责纸张的轻微 3D 倾斜、边缘光、扫描反应和深度感。

用户感受到的重点：粗糙草稿开始变成可计算、可编辑的对象。

### 4.3 Decode Chamber

纸面开启扫描阶段。页面出现短暂的公式抽取层：几个公式片段从纸张中浮出，显示为 KaTeX glyph、结构框、候选修正和置信度信号。它像实验室仪器的观测界面，而不是完整后台页面。

用户感受到的重点：Formula Lab 不只上传图片，而是在理解公式结构。

### 4.4 Paper Workspace Ghost

画面短暂显露一个论文工作台幽灵轮廓：左侧 LaTeX editor island、中间 formula review inbox、右侧 PDF / paper preview。该层必须是轻量线框、半透明轮廓和局部内容闪现，不展示完整静态 dashboard。

用户感受到的重点：识别结果会回到论文写作流程，而不是停留在一次性 OCR 输出。

### 4.5 Collaboration Signals

工作台幽灵层继续演化出多人协作信号：批注气泡、修改建议、accept/reject 轨迹、协作者 cursor、版本差异线。它们只短暂出现，重点展示未来产品形态，而不是把功能列表铺满。

用户感受到的重点：Formula Lab 的长期目标接近 Overleaf 级别的论文协作，但拥有公式识别与审查的差异化入口。

### 4.6 Workbench Gate

所有信号收束为最终入口。Workbench Gate 保留当前第四阶段的清晰结构，但周围环境变成“已经构建完成的论文工作台入口”。CTA 文案可以继续使用 `Enter Workbench`，也可以在下一步实现时评估是否改为 `Open live workspace`。

用户感受到的重点：电影结束后不是宣传语，而是可以马上进入产品。

## 5. 技术架构

### 5.1 ScrollTrigger 作为总导演

`ScrollDirector.tsx` 继续是唯一的滚动时间轴所有者。它负责：

- 维护 0 到 1 的全局滚动 progress。
- 计算当前 phase。
- 写入 CSS custom properties。
- 将 progress 通过 ref 提供给 Three.js canvas。
- 管理 reduced motion fallback。

第五阶段不应把多个组件各自注册 ScrollTrigger。所有滚动状态从 `ScrollDirector` 分发。

### 5.2 Three.js 负责空间感

`ManuscriptCanvas` 继续负责草稿纸、shader、粒子深度和扫描质感。新增能力应该集中在：

- manuscript 周围的吸附粒子。
- 扫描光和纸张表面反应。
- 低成本的深度层、漂浮碎片和光场。

不把真实 UI 文本、CTA 或完整产品面板做进 canvas。

### 5.3 DOM/CSS 负责产品信息

Decode Chamber、Paper Workspace Ghost、Collaboration Signals、Workbench Gate 应该以 React DOM 组件实现。原因：

- KaTeX、按钮、可访问文本更可靠。
- 测试可以通过 DOM guard 检查。
- 后续文案和布局更容易迭代。

### 5.4 SplitText 式文字动效

如果直接使用 GSAP SplitText 插件可用，则用 SplitText 管理标题字符/词/行的进入与离场。如果插件不可用，则实现轻量本地 text-split helper，只服务 landing，不引入全站依赖。

文字动效重点是节奏和离场：

- 标题进入时有逐行/逐词的呼吸节奏。
- 滚动进入 Manuscript Gravity 时逐步解体。
- 不在主要文案上使用难读的长期抖动或极端扭曲。

## 6. 组件边界

第五阶段建议新增或调整这些组件：

- `DecodeChamberOverlay`
  展示公式抽取、结构识别、候选修正和置信度信号。

- `PaperWorkspaceGhost`
  展示论文编辑器、公式审查 inbox、paper preview 的线框化工作台轮廓。

- `CollaborationSignalField`
  展示批注、修改建议、协作者 cursor 和版本差异信号。

- `WorkbenchGateOverlay`
  保留为最终入口组件，但允许周围加入更强的产品上下文。

- `ScrollDirector`
  扩展 CSS vars 和 phase mapping，但保持单一职责：只导演，不渲染具体 UI。

`LandingScrollStory` 继续保持组合层职责，不承载滚动计算和复杂布局逻辑。

## 7. 动效时间轴

建议将滚动 progress 映射为：

- `0.00 - 0.16`：Formula Storm 进入。
- `0.16 - 0.34`：标题与公式开始向 manuscript 聚合。
- `0.34 - 0.50`：Manuscript Gravity，草稿纸居中并建立视觉重心。
- `0.50 - 0.66`：Decode Chamber，扫描和公式抽取出现。
- `0.66 - 0.82`：Paper Workspace Ghost，工作台轮廓出现。
- `0.82 - 0.92`：Collaboration Signals，多人协作信号闪现。
- `0.92 - 1.00`：Workbench Gate，所有内容收束为入口。

这些数值是设计约束，不是最终像素级实现。实现时可以微调，但 guard 需要保护关键关系：最终 CTA 只在末段可点击，旧 Product Preview 不能回归，首屏文字和公式必须在中段真实退出。

## 8. 视觉语言

### 8.1 画面质感

整体保持 Formula Lab 当前黑白工业仪表基底，但允许局部出现绿色、冷白、微弱蓝灰作为扫描和协作信号。不要转向彩色霓虹赛博，也不要变成暖色品牌站。

### 8.2 版式

首屏文字仍然大、克制、有仪式感。后续产品层不要堆太多真实 UI 卡片，应以“线框、切片、局部闪现、轨迹”的方式表达。

### 8.3 真实产品信息

可出现的产品信号包括：

- `LaTeX candidate`
- `Review inbox`
- `Accept change`
- `Comment`
- `PDF preview`
- `main.tex`
- `Formula item`
- `Confidence`

避免虚假的 GPU、VRAM、AI 神话式文案。动效可以艺术化，信息必须产品化。

## 9. 可访问性与降级

### 9.1 Reduced motion

当用户启用 `prefers-reduced-motion`：

- 直接展示最终可读状态。
- 背景公式和 manuscript 保持静态。
- Workbench Gate 可见且 CTA 可点击。
- 不触发长滚动 scrub 动画。

### 9.2 键盘与链接

最终 CTA 必须是正常 `<a>` 链接，保持键盘可聚焦。CTA 在不可见阶段必须 `pointer-events: none` 且不应干扰 tab 顺序。

### 9.3 文案可读性

文字动效不能让核心信息长期处于不可读状态。SplitText 只用于进入、离场和短暂强调，不用于持续干扰阅读。

## 10. 性能边界

实现必须遵守这些边界：

- WebGL DPR 上限保持在当前策略附近，不追求全分辨率重 shader。
- 粒子数量继续有明确上限。
- ScrollTrigger 只注册一个主实例。
- DOM overlay 数量可控，避免数百个持续布局元素。
- 不在滚动中频繁读取 layout 后再写 layout。
- 动画属性优先使用 `transform`、`opacity`、CSS vars。
- 浏览器验证时检查 idle 后 CPU/GPU 是否持续异常。

## 11. 测试与验收

第五阶段需要更新或新增 frontend guard：

1. `landing_scroll_story_guard.mjs`
   检查阶段阈值、CTA 可见性、旧 Product Preview 不回归、关键 CSS vars 存在。

2. `landing_phase_modules_guard.mjs`
   检查新增 overlay 组件存在，并确保 `LandingScrollStory` 仍是组合层。

3. 视觉 smoke check
   在浏览器检查首屏、中段、末段：
   - 首屏有公式场和 hero。
   - 中段公式/文字真实消散。
   - Decode / Workspace / Collaboration 信号按顺序出现。
   - 最终只有明确 Workbench 入口可点击。

4. 常规检查
   - `npm run check:frontend`
   - `./.conda/bin/python manage.py check`
   - `./.conda/bin/python scripts/check_repository_governance.py`
   - `git diff --check`

## 12. 非目标

本阶段不做：

- 完整编辑器功能开发。
- 真实多人协作后端。
- 新的 OCR 模型或任务队列改造。
- 全站 UI 重构。
- Webflow 迁移。
- 用纯视频替代实时页面。
- 恢复旧 Product Preview 卡片堆。

## 13. 成功标准

第五阶段完成后，用户在 landing page 上应该获得三个明确感受：

1. 这是一个高级、艺术化、强交互的产品入口，而不是课堂 demo。
2. Formula Lab 的差异化不是“图片转 LaTeX”，而是“把复杂公式材料带入论文写作与协作流程”。
3. 最终进入 Workbench 的行为自然、有动机，而不是看完动画后只剩一个孤立按钮。

## 14. 自检结果

- 没有保留待定项。
- 设计范围限定在 landing page 第五阶段，不触碰 OCR、数据库、Docker 或真实协作后端。
- 保留第四阶段 Workbench Gate 的可靠入口，同时补足用户希望的大胆叙事内容。
- 明确了组件边界、动效时间轴、性能边界、可访问性和验收方式。
