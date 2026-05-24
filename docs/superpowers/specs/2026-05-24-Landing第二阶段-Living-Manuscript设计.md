# Landing 第二阶段 Living Manuscript 设计

## 目标

把 Formula Lab 的 landing page 从“已有的电影式手稿场景”升级为一个完整的产品叙事：混乱科研手稿进入系统视野，公式星图被吸收，纸张被扫描理解，最后展开成可协作的在线论文工作台入口。

本阶段不是重做首页，也不是堆叠 WebGL 特效。它要在当前已经合入 main 的 React/Vite landing island、GSAP ScrollTrigger、Three.js manuscript canvas 基础上继续增强，让视觉效果服务产品理解。

## 设计定位

推荐方向是 `Scientific Instrument + Product Cinema`，局部吸收 `Shader Art Piece`。

`Scientific Instrument` 提供可信度：黑底、细线、低饱和光、精密扫描、科研仪器感。

`Product Cinema` 提供产品落点：每一段动画最终揭示真实功能，而不是只展示抽象视觉。

`Shader Art Piece` 只用于关键瞬间：纸张表面扫描、公式粒子吸收、手稿向工作台过渡。不要把整个页面做成不可控的 shader 实验。

## 用户感受

目标用户是用 LaTeX 写论文的学生、科研工作者和需要整理公式材料的人。用户进入页面时应感到：

- 这个系统能理解凌乱手稿，而不只是上传图片。
- 这个产品最终会落到论文写作、公式审查、批注协作和版本整理。
- 视觉上有前沿感，但不是游戏页面，也不是普通 AI SaaS 模板。

## 滚动叙事

### 1. Ignition

页面第一段保留当前品牌识别和轻量工作台入口。标题和辅助文本通过 SplitText 做仪器启动式显影：按行或按词进入，短暂出现字符错位、亮度扫描，然后稳定。

设计约束：

- 不做弹跳、旋转、过度娱乐化文字动画。
- SplitText 只服务“启动”和“消散”，不让文字成为页面长期主角。
- 导航和 CTA 保持 DOM 层，保证可访问性和真实点击。

### 2. Absorb

背景公式星图、标题和界面辅助文字在滚动中消散，并被草稿纸吸收。公式不再作为固定右侧列表出现。

设计约束：

- 消散主要使用 opacity、clip/mask、位移、粒子 handoff，不使用 blur 作为主要消失方式。
- DOM KaTeX 适合远景公式，Three.js particles 适合近景吸收。
- 公式只出现在三个语义位置：背景星图、纸张表面识别、最终工作台中的真实内容。

### 3. Center

草稿纸成为绝对视觉主角。它不是数学坐标意义上的居中，而是按视觉重量居中。当前纸张右侧更亮、更完整，所以需要继续保留视觉补偿，避免肉眼感觉偏右。

设计约束：

- 纸张最终位置以真实浏览器预览为准。
- 不允许出现两层纸张或 CSS 伪元素重复绘制手稿。
- 粒子吸收点必须跟随纸张视觉中心，而不是停留在页面右侧。

### 4. Scan

当前的斜向扫描光需要升级为纸张表面扫描。光应该沿纸张纹理流动，局部高亮手写痕迹，并产生“系统正在理解”的感觉。

设计约束：

- 优先使用轻量 ShaderMaterial 实现纹理高光、噪声流动和扫描波纹。
- shader 只作用在纸张或纸张附近，不污染整个页面。
- 扫描阶段不显示固定右侧公式列。

### 5. Workspace Reveal

扫描结束后，手稿下方或前景展开产品工作台骨架。它应该逐步显现真实产品结构：左侧 paper outline，中间 LaTeX/PDF 工作区，右侧 formula review/comment 区。

设计约束：

- 工作台不是普通装饰线框，而是产品形态预告。
- Reveal 层必须和我们现有 Project Workspace、Formula Review Inbox、Paper Workspace 方向一致。
- 第一版可以是无文字骨架，后续再逐渐加入少量真实产品标签。

### 6. CTA

最后出现明确产品入口：`Start Recognition` 和 `Open Workspace`。艺术体验最终要导向可用产品，而不是停在视觉展示。

设计约束：

- CTA 不抢占前几段叙事。
- CTA 出现时，背景动效降低复杂度，避免干扰点击。
- 用户应该能理解下一步可以上传公式，也可以进入项目工作台。

## 模块边界

### ScrollDirector

统一管理 landing 的滚动阶段：`intro / absorb / center / scan / reveal / cta`。它负责 ScrollTrigger 的 pin、scrub、阶段标签和 CSS 变量输出。

职责：

- 将滚动进度转换为稳定阶段变量。
- 把 DOM 层和 WebGL 层同步到同一时间线。
- 保持 `prefers-reduced-motion` 分支。

不负责：

- 直接绘制 Three.js 粒子。
- 直接包含大量 CSS 视觉细节。

### SplitTextTitleSequence

负责标题、短句、CTA 前文案的进入和消散。它应包裹现有标题结构，而不是替换品牌文案。

职责：

- SplitText 初始化和销毁。
- 响应式重拆。
- 避免把 inline transform 写到后续滚动控制的容器上。

### FormulaConstellationField

负责公式星图的层次。远景可继续使用 DOM KaTeX，近景吸收使用 Three.js particles。

职责：

- 控制公式远近、大小、虚实、粒子吸收。
- 保证公式不是裸 TeX 文本。
- 在 absorb 阶段把公式从背景语义转移到纸张语义。

### ManuscriptShaderScan

负责纸张表面扫描效果。它可以通过 ShaderMaterial 或材质 uniform 扩展现有 manuscript texture。

职责：

- 时间驱动扫描纹理。
- 纹理高光、噪声流动、局部识别波纹。
- 不让 shader 成本扩散到整页。

### WorkspaceRevealOverlay

负责最终工作台骨架。它是 DOM 层或轻量 CSS 层，和 WebGL 纸张配合出现。

职责：

- 呈现 paper outline、editor/preview、formula review/comment 的空间关系。
- 为后续接入真实 Project Workspace 截面留接口。
- 保持无文字或少文字版本，避免回到普通说明页。

### MotionQualityGate

负责性能和可用性约束。

职责：

- 限制 DPR、粒子数、shader uniform 更新频率。
- 保持 reduced-motion 体验。
- 确保首屏内容可见，WebGL 失败时有可接受退化。

## 技术原则

- GSAP ScrollTrigger 是时间轴导演。
- React state 不用于逐帧动画；滚动进度通过 ref 桥接给 `useFrame`。
- Three.js 负责手稿、粒子和空间灯光。
- DOM 负责导航、CTA、可访问文本和最终可点击入口。
- Shader 只用于高价值瞬间，不作为所有视觉的默认答案。
- 验证以真实浏览器预览为主，截图作为辅助，因为本机 headless 截图曾低估 WebGL 显示状态。

## 风险

### 性能风险

Three.js chunk 已经较大，继续加 shader 和粒子会增加加载和运行成本。必须控制粒子数量、DPR 和 shader 复杂度。

### 叙事风险

如果效果过多，用户会只记住“炫酷”，不理解产品。每段动画必须回答一个产品问题：识别什么、理解什么、如何进入工作台。

### 视觉风险

纸张素材右侧亮度更高，容易导致视觉重心偏右。任何位置调整都必须用真实浏览器预览判断。

### 可维护性风险

landing 已经从 Django template 进入 React/Vite island。后续需要拆出模块，避免把所有逻辑继续堆在 `LandingScrollStory.tsx` 或 `ManuscriptCanvas.tsx`。

## 验收标准

- 滚动阶段能清楚读出 `Ignition -> Absorb -> Center -> Scan -> Workspace Reveal -> CTA`。
- 标题和背景公式在吸收阶段真实消散，不靠模糊伪装。
- 纸张居中后是页面主角，不再有右侧固定公式列。
- 扫描效果发生在纸张表面或纸张附近，而不是页面边缘。
- 工作台 reveal 能让用户理解这是论文编辑、公式审查和协作批注产品。
- CTA 最终清晰可点。
- `npm run check:frontend`、`python manage.py check`、`python scripts/check_repository_governance.py` 通过。
- 真实浏览器预览中，桌面端首屏和滚动关键帧无明显遮挡、重复纸张、裸 TeX 或错位。

## 非目标

- 不在本阶段重做 Project Workspace 的真实功能。
- 不在本阶段接入多人协作后端。
- 不在本阶段把整个站点迁移到 React SPA。
- 不在本阶段追求移动端完整适配；当前重点是 Web 桌面端。
- 不为了炫技引入不可控的大型 shader 系统。

