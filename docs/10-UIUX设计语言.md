# UIUX设计语言

根目录 [DESIGN.md](../DESIGN.md) 是本项目 UI 设计语言的单一来源。本文件用于中文解释设计决策和项目语境；后续写页面、模板、CSS 和交互时，应优先读取并遵守根目录 `DESIGN.md`。

## 当前主参考

当前选定的主参考风格是 `awesome-design-md` 仓库中的 `design-md/spacex/DESIGN.md`。

我们不是直接复制 SpaceX 官网，而是采用它的设计语言内核：

- 黑白高对比。
- 固定顶部导航。
- 大写英文微标签。
- 工业感字体。
- 幽灵描边胶囊按钮。
- 极少装饰。
- 任务阶段感。
- 深色控制台气质。

Formula Lab 的最终方向是：

```text
SpaceX-inspired Formula Recognition Mission Control + Paper Formula Workbench
```

也就是一个公式识别任务控制台和论文公式资产工作台，而不是普通 SaaS 面板。

## 为什么选择 SpaceX

SpaceX 风格的优势是强烈、克制、有记忆点。它能把“上传图片识别公式”这件事包装成一次可观察的任务流程：

```text
上传锁定
进入队列
模型预热
图片预处理
模型推理
LaTeX 后处理
结果就绪
```

这比普通表单页面更有产品感，也更适合我们想做的真实工具体验。

## 必须改造的部分

SpaceX 原始设计语言偏航天品牌官网，强调全屏摄影、视频、巨型全大写标题和极少 UI。Formula Lab 是工具型网站，所以必须改造：

- 不做火箭图片或太空图片装饰。
- 不做纯宣传型 hero。
- 不把所有中文文字强行处理成大写英文风格。
- 不让电影感压过上传、复制、历史记录这些真实操作。
- 不让纯黑背景影响 LaTeX 阅读和公式预览。

我们保留 SpaceX 的冷峻与任务感，但把它落到工具 UI 上。

## 信息架构

全局采用顶部导航的任务控制台结构，不采用左侧侧边栏。

```text
顶部导航
  FORMULA LAB
  PROJECTS
  WORKBENCH
  MISSION LOG
  SYSTEM

主内容
  根据页面切换任务工作区
```

选择顶部导航的原因：

- 更符合 SpaceX 风格。
- 页面数量少，不需要厚重侧边栏。
- 老师线下验收时第一眼能看到上传入口。
- 移动端更容易折叠。

## 工程命名与界面叙事

代码层继续使用清晰工程命名：

```text
FormulaJob
Recognition task
Progress stage
System health
```

界面层使用 Mission Control 叙事：

```text
FormulaJob        -> Mission
Celery task       -> Recognition sequence
Progress stages   -> Launch sequence
History page      -> Mission log
System status     -> Telemetry
Result page       -> Mission report
LaTeX source      -> Control console output
Rendered formula  -> Payload preview
```

这个映射只影响文案和视觉表达，不要求数据库模型也改名为 Mission。

## 色彩系统

第一版色彩以黑白为核心：

```text
主背景         #000000  黑色任务控制台
深色面板       #111111
浅黑面板       #0A0A0A
白色面板       #FFFFFF  公式渲染和高可读区域
主文字-暗面    #FFFFFF
次文字-暗面    #F0F0FA
主文字-亮面    #000000
次文字-亮面    #5A5A5F
暗面边框       #3A3A3F
亮面边框       #E0E0E8
错误色         #FF4D4D
```

不要建立绿色、蓝色、橙色等 SaaS CTA 系统。黑白是主系统，红色只用于真实错误。

## 字体系统

建议字体：

```text
展示 / UI：D-DIN / Arial Narrow / Arial / 中文系统字体
代码 / LaTeX：JetBrains Mono / ui-monospace
公式渲染：KaTeX 默认字体
```

英文导航和阶段标签可以使用全大写：

```text
WORKBENCH
MODEL WARMUP
RESULT READY
SYSTEM
```

中文正文保持正常阅读节奏，不要强行加大字距。

## 页面设计方向

### 工作台首页

首页不是营销页，而是任务控制台。

推荐结构：

```text
顶部：FORMULA LAB / PROJECTS / WORKBENCH / MISSION LOG / SYSTEM
主体左侧：上传指令区和图片预览
主体右侧：模型状态、队列状态、最近任务
底部：最近任务日志
```

上传区要像 command zone，不像普通文件表单。

### 进度页

进度页像 launch sequence：

```text
左侧：上传的公式图片
右侧：任务阶段 checklist
下方：进度条、任务 ID、时间戳
```

阶段名称可以更任务化：

```text
UPLOAD LOCKED
QUEUED
MODEL WARMUP
IMAGE PREPROCESS
INFERENCE
LATEX POSTPROCESS
RESULT READY
```

### 结果页

结果页像 mission report：

```text
原图
深色 LaTeX 控制台
白底公式渲染预览
任务元数据
复制 / 重新识别 / 查看历史
```

公式预览必须用白底或高可读浅色区，不为了黑色风格牺牲阅读。

Paper Fit Preview 是辅助仪表，不是主角。它可以使用暗色半透明 telemetry strip、细网格、ruler 和指标，但不能用大面积纯白卡片抢走 KaTeX Preview 和 LaTeX Source 的视觉优先级。

### Project Workspace

Project Workspace 的视觉目标是轻量工作台：

```text
左侧：公式队列，紧凑可扫读
中间：Formula Inspector，展示当前公式源码、预览、Paper Fit 和 Review 入口
右侧：Workflow Status，展示完成率、最近批次和后续智能能力占位
```

它不应像后台表格，也不应把所有信息堆成卡片墙。公式审校链路应一眼可见：选择公式 -> 看渲染 -> 看适配 -> 打开 Review -> 导出。

### 历史记录页

历史记录页像 mission log：

```text
缩略图
任务状态
LaTeX 摘要
创建时间
耗时
查看结果
复制 LaTeX
```

桌面端可以是紧凑列表，移动端变成日志卡片。

### 系统状态页

系统状态页像 telemetry：

```text
Django Web
PostgreSQL
Redis
Celery Worker
Recognition Model
Last Recognition Job
```

这里可以展示技术名词；主工作台不要把技术栈当装饰。

## 组件原则

- 主按钮使用幽灵描边胶囊按钮。
- 深色背景上的按钮默认白边白字，hover 变白底黑字。
- 亮色背景上的按钮默认黑边黑字，hover 变黑底白字。
- 上传区使用虚线边框和深色面板。
- LaTeX 源码使用深色等宽代码面板。
- 公式渲染使用白色预览面板。
- Paper Fit 使用低权重 telemetry 面板，不使用抢眼大白卡。
- 错误提示使用红色文字和边框，但不要大面积红色背景。

## 动效原则

动效只服务任务反馈。

允许：

- 上传拖拽高亮。
- 阶段 checklist 当前项切换。
- 进度条平滑推进。
- 复制成功状态。
- 失败信息展开。

避免：

- 火箭、星空、粒子、火焰等装饰动画。
- 大面积背景视频。
- 为了电影感延迟任务反馈。
- 浮动 orb、bokeh 或与任务无关的装饰物。
- Paper Fit、状态灯或 telemetry 元素抢走主要工作内容。

## 设计禁忌

- 不使用火箭/太空图片装饰。
- 不做营销型全屏 hero。
- 不把所有中文都做成字距很大的标题。
- 不引入彩色 SaaS 徽章系统。
- 不用渐变、光晕、bokeh 背景。
- 不让 SpaceX 气质压过实际工具可用性。
- 不隐藏上传、复制、重试、历史记录这些核心动作。

## 验收时的界面叙事

线下验收时，页面应该自然讲出这个故事：

```text
进入 Formula Lab Mission Control
上传公式图片
任务进入识别序列
观察真实阶段进度
获得 LaTeX 源码
看到公式渲染预览
复制结果并在历史日志中回看
```

这比普通“上传图片 -> 显示文本”的页面更有记忆点，也更能体现完整 Web 产品设计。
