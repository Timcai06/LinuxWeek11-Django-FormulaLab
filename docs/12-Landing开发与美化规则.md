# Landing开发与美化规则

本文是 Formula Lab Landing Page 后续开发、美化、性能治理和视觉验收的规则文档。它不替代根目录 [DESIGN.md](../DESIGN.md)，也不替代 [UIUX设计语言](./10-UIUX设计语言.md)，而是专门约束 Landing 这一类高强度动效页面。

Landing 的目标不是堆叠酷炫动画，而是把 Formula Lab 的产品心智讲清楚：

```text
Formula Lab 品牌出现
  -> 草稿纸作为物理对象登场
  -> 公式识别与审阅能力展开
  -> 草稿纸转化为论文工作台
  -> 用户进入 Workbench 开始真实工作
```

后续任何视觉升级、GSAP 动效、Three.js 场景、SVG 转场、SplitText 文本动画，都必须服务于这条叙事。

## 1. 总原则

Landing 是作品感入口，Workbench 是真实产品入口。

开发 Landing 时必须同时满足四个目标：

- 视觉上有电影感、空间感和品牌记忆点。
- 交互上滚动节奏清楚，有关键帧停顿和吸附感。
- 工程上模块边界清楚，不污染普通业务页面。
- 性能上丝滑、低耗电、可暂停、可清理、可测量。

不允许出现的方向：

- 只为了炫技增加无意义动画。
- 把 Workbench、History、Report、System 的样式一起改乱。
- 为了性能直接牺牲主要视觉质量。
- 每个动画模块都自己监听滚动、自己开启 rAF、自己判断暂停。
- 新增一套旧逻辑并保留旧逻辑并行运行，导致入口重复、状态重复、难以维护。

## 2. 叙事规则

每一段 Landing 动画都必须回答四个问题：

- 用户现在应该看哪里？
- 这一段表达 Formula Lab 的哪种能力？
- 滚动一次之后应该抵达哪个关键帧？
- 这一段结束后，用户是否明确知道下一步？

推荐叙事结构：

```text
Brand Intro
  黑场中的 FORMULA / LAB 两个词以真实首屏标题为锚点入场

Hero Lock
  真实首屏组件完成落位，按钮可用，草稿纸与公式场建立视觉中心

Manuscript Focus
  草稿纸居中，背景信息退场，用户专注于物理草稿

Decode Sequence
  悬浮组件按顺序出现，展示识别、审阅、论文适配等能力

Liquid Transition
  SVG / mask 幕布进入绿幕或下一叙事空间

SplitText Narrative
  以段落为单位解释产品能力，每段有足够停留时间

Letter Storm
  大字号公式、字母、关键词形成强视觉过渡，但必须完整展示

Workbench Gate
  收束到明确入口，用户可以进入 Workbench
```

如果新增一段动画，必须说明它属于上面哪个阶段。不能插入只好看但不承担叙事功能的段落。

## 3. 首屏规则

首屏是 Landing 的视觉锚点。后续美化不能让首屏变成割裂的两套 DOM。

首屏开发规则：

- 开场动画应尽量驱动真实首屏组件，而不是用一份临时标题动画结束后再闪切到真实标题。
- `FORMULA` 和 `LAB` 的最终位置必须和首屏真实标题完全一致。
- 如果使用临时 overlay 做过渡，必须在视觉上无缝交接，不能出现字体突变、位置闪动、模糊重绘。
- 首屏按钮不能是摆设，必须始终能进入 Workbench 或 Mission Log。
- 副标题、角标、小组件可以弱化，但主标题和入口按钮必须清晰。
- 首屏草稿纸、背景、按钮、小标题出现时要有方向性，不能像普通元素突然显示。

首屏动画应该像：

```text
黑场品牌字
  -> 字形变化和空间移动
  -> FORMULA / LAB 精确落入首屏标题位置
  -> 草稿纸、按钮、辅助信息以同一节奏进入
```

不要做成：

```text
临时标题播完
  -> 临时标题消失
  -> 真实首屏重新出现
```

## 4. 滚动节奏规则

Landing 是滚动叙事，不是普通长页面。滚动距离、关键帧和停顿必须被设计。

核心要求：

- 用户一次自然滑动，应该大致抵达一个明确状态。
- 草稿纸居中、悬浮组件出现、进入绿幕、SplitText 段落、进入 footer 前，都应该有停顿感。
- 关键节点可以有轻微吸附，但不能让用户感觉页面被卡住。
- 后半段不能因为高度不足导致滚动字幕和 SplitText 一闪而过。
- 高速滚轮或触控板惯性滚动下，也不能跳过核心内容。

建议把滚动叙事拆成阶段，而不是用一个超长 timeline 硬塞所有内容：

```text
stage: intro       duration: short-medium
stage: hero        duration: medium
stage: cards       duration: medium, snap by card
stage: curtain     duration: medium, must show wave body
stage: narrative   duration: long enough per paragraph
stage: letters     duration: long enough for full pass
stage: gate        duration: short, clear CTA
```

滚动高度不是越长越好。判断标准是：

- 是否能完整看懂每段内容。
- 是否能感觉到关键帧。
- 是否需要过度滚动才到达目标状态。
- 是否出现“刚看到就没了”的段落。

## 5. 动画技术分工

不同技术只负责自己最擅长的事情。

```text
GSAP / ScrollTrigger
  负责时间线、滚动阶段、关键帧、吸附、文字动画和 DOM transform

Three.js
  负责空间、光影、纸张深度、少量高价值视觉层

SVG / Mask
  负责液态幕布、图形遮罩、少量可控形变

CSS
  负责基础布局、色彩、字体、响应式、普通状态

React
  负责组件结构、数据组织、生命周期边界
```

不要让多个系统抢同一个元素的控制权。例如同一个元素不能同时被 CSS transition、GSAP timeline 和 React state 高频更新。

## 6. Motion Runtime 规则

Landing 后续性能治理的方向是统一 runtime，而不是让各模块各自运行。

目标结构：

```text
MotionRuntime
  -> ScrollDirector
  -> StageRegistry
  -> FrameBudget
  -> QualityController
  -> CleanupRegistry
  -> animation modules
```

### 6.1 统一滚动源

不鼓励每个模块直接写：

```js
window.addEventListener("scroll", handler)
```

推荐由统一 ScrollDirector 读取滚动位置、速度和当前阶段，再分发给动画模块。

好处：

- 减少重复滚动监听。
- 避免多个模块反复读取 layout。
- 方便统一调试关键帧和吸附点。
- 方便 E2E 和性能测试稳定复现。

### 6.2 统一 rAF

不鼓励每个模块都自己开启：

```js
requestAnimationFrame(loop)
```

推荐由 MotionRuntime 提供统一帧循环：

```text
read input
  -> compute stage state
  -> update Three.js / SVG / DOM
  -> flush style writes
```

好处：

- 控制每帧执行顺序。
- 降低重复 JS 开销。
- 更容易适配 ProMotion 高刷新率屏幕。
- 更容易在页面隐藏或空闲时暂停。

### 6.3 统一暂停和清理

所有动画模块必须支持：

- `pause`
- `resume`
- `destroy`
- `refresh`

页面隐藏时应暂停非必要更新。页面重新显示时应刷新 ScrollTrigger、尺寸和 WebGL 状态。组件销毁时必须清理：

- event listener
- rAF callback
- ScrollTrigger instance
- GSAP timeline
- ResizeObserver
- IntersectionObserver
- WebGL texture / geometry / material

## 7. 性能规则

性能优化的目标是视觉不变、体感更丝滑、CPU/GPU 更安静。

优先做：

- 合并 rAF。
- 页面隐藏时暂停。
- 离屏阶段不更新。
- 降低不必要的 SVG path 每帧拼接。
- 避免频繁 `getBoundingClientRect()`。
- 把 layout read 和 style write 分离。
- 使用 `transform` 和 `opacity` 做高频动画。
- Three.js 只在需要时渲染，不要全程空转。
- 按阶段激活重模块，离开阶段后释放或休眠。

谨慎做：

- 盲目降低 DPR。
- 直接删掉视觉层。
- 大幅降低纹理质量。
- 把动画强制锁到低帧率。

不允许做：

- 为了省性能让核心画面明显变差。
- 页面隐藏后继续跑高强度 rAF。
- 用户离开 Landing 后还保留 ScrollTrigger 或 WebGL 循环。
- 大量 DOM 元素每帧修改 `top`、`left`、`width`、`height`。

## 8. SVG 液态转场规则

SVG 液态幕布是高价值视觉段落，但也容易变成性能和节奏问题。

设计要求：

- 用户必须能看到完整波形进入过程。
- 波峰波谷不要过大到像断裂或抽搐。
- 转场应该直接进入目标幕布，不要出现多余中间状态。
- 转场完成后应有轻微停顿，让用户确认已进入新阶段。
- 如果使用多层 path，层间 delay 要可控，不能让主体波形转瞬即逝。

工程要求：

- 避免多个 SVG path 在每帧做高成本字符串拼接。
- 能缓存的 path 尽量缓存。
- 能用 mask / clip-path / transform 表达的，不一定每帧重写 `d`。
- 如果继续使用 MorphSVG 类方案，要限定更新区间和激活阶段。

## 9. SplitText 与文字动画规则

文字动画必须先保证可读，再追求动感。

规则：

- 每段 SplitText 必须完整展示。
- 段落之间要有明显区分，不能连续糊成一团。
- 进入动画和退出动画要有方向性。
- 字符级随机位移可以用，但不能破坏阅读。
- 滚动字幕必须给足 horizontal travel 和 pinned duration。
- 大字号字母弹幕不能在入口出现前被过早打断。

推荐检查问题：

- 是否刚出现就进入下一段？
- 是否一半还没读完就到 Workbench Gate？
- 是否因为滚轮太敏感被跳过？
- 是否在高刷新屏上仍然感觉卡顿？

## 10. 视觉一致性规则

Landing 可以更艺术，但仍然必须属于 Formula Lab。

保留：

- 黑白高对比。
- 工业感字体。
- 真实纸张 / 草稿 / 公式语义。
- Mission Control 的冷静气质。
- 明确进入 Workbench 的产品入口。

避免：

- 彩色 SaaS 渐变。
- 大面积无意义粒子。
- 火箭、星球、太空飞船等 SpaceX 直译。
- 只像动画 demo，不像公式论文工具。
- footer 或幕布颜色脱离整体黑白工业风。

## 11. 与其他页面的边界

Landing 的强动效不应该影响普通工具页。

必须保持边界：

- Landing 专属 CSS 放在 Landing 构建产物或 Landing 页面样式中。
- Landing 专属 JS / React / Three.js 不进入 Workbench 普通流程。
- 不为了 Landing 修改全局按钮、全局字体、全局背景，除非明确是全站设计语言升级。
- Workbench、History、Report、System 仍然以可读性、效率和稳定性优先。

如果一次改动同时影响 Landing 和其他页面，必须单独说明影响范围，并进行额外验证。

## 12. 验收规则

每轮 Landing 美化完成后，至少检查：

- 首屏真实组件是否无闪动、无字体突变、无位置跳变。
- 按钮是否可点击并能进入 Workbench。
- 草稿纸居中是否自然。
- 悬浮组件是否按顺序出现。
- SVG 液态转场是否能完整观看。
- SplitText 段落是否能完整阅读。
- 尾屏滚动字幕是否完整展示。
- Workbench Gate 是否有明确 CTA。
- 切换页面后是否停止 Landing 的重动画。
- 页面隐藏后是否暂停 rAF / WebGL / SVG 高频更新。
- 页面可见但滚动、指针、转场都稳定后，WebGL 是否进入空闲停帧，而不是继续常驻满帧渲染。

推荐保留两类验证：

```text
视觉验证
  浏览器录屏 / 截图 / 人工检查关键帧

工程验证
  npm build / Django tests / Playwright E2E / runtime guard
```

当用户明确说“样式我来检查”时，自动化只需要确认页面可运行、入口可用、没有明显 console 级阻断错误，不要替用户做审美结论。

## 13. 后续开发检查清单

开发前：

- 明确本轮只改哪一段 Landing。
- 明确哪些视觉不能变。
- 明确是否允许改变滚动长度。
- 明确是否影响其他页面。

开发中：

- 优先复用 MotionRuntime / ScrollDirector / StageRegistry。
- 不新增孤立 rAF。
- 不新增孤立 scroll listener。
- 不让 React state 高频驱动逐帧动画。
- 不把临时实验代码留在主路径。

开发后：

- 检查构建产物是否由 Vite 正常生成。
- 检查是否有不需要的旧资源。
- 检查是否有未清理 listener / timeline / observer。
- 检查 E2E 是否覆盖核心入口。
- 更新本文件或 [架构与体验决策记录](./11-架构与体验决策记录.md) 中真正稳定下来的决策。

## 14. 一句话标准

后续 Landing 的每一次升级，都应该让它更像一个可持续演进的高性能产品叙事系统，而不是更像一组互相叠加的动画素材。
