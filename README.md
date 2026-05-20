# Formula Lab Mission Control
![Django](https://img.shields.io/badge/Django-092E20?style=for-the-badge&logo=django&logoColor=green) ![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white) ![Redis](https://img.shields.io/badge/redis-%23DD0031.svg?style=for-the-badge&logo=redis&logoColor=white) ![Celery](https://img.shields.io/badge/celery-%2337814A.svg?style=for-the-badge&logo=celery&logoColor=white) ![Docker](https://img.shields.io/badge/docker-%230db7ed.svg?style=for-the-badge&logo=docker&logoColor=white)

A high-performance, asynchronous formula recognition workbench inspired by aerospace control centers. Upload mathematical formula images and convert them to interactive LaTeX code through a configurable OCR engine. The current local development baseline uses **PaddleOCR Formula Recognition** for higher accuracy, while `pix2tex` remains available as a comparison engine.

## 🌟 Key Features | 核心特性

- **🌌 Aerospace Monochrome UI**: A meticulously crafted, hardware-accelerated black-and-white UI featuring glassmorphism and dynamic micro-animations.
- **⚡ Asynchronous AI Pipeline**: Utilizes **Celery** and **Redis** to offload heavy OCR inference, ensuring the web interface remains responsive.
- **🧠 Configurable Recognition Engine**: Supports PaddleOCR Formula Recognition as the local default and keeps `pix2tex` as a fallback/comparison path.
- **🐳 Zero-Config Docker Engine**: Fully containerized environment using Docker Compose. Just build and launch. (Now optimized with global/Tsinghua PyPI mirrors for lightning-fast deployments).
- **📝 Real-time KaTeX Engine**: Instant preview of parsed formulas via KaTeX integration, with one-click copy to clipboard functionality.
- **🛡️ Mission Resilience**: Comprehensive task tracking, automated retry mechanisms for failed inferences, and persistent mission logs backed by PostgreSQL.

---

## 📖 中文说明 (Project Context)

本项目为《Linux系统与编程实践》大实验设计。核心业务流：
1. 用户在 **Workbench** (工作台) 上传公式图片。
2. 任务持久化至 **PostgreSQL** 并被推入 **Redis** 消息队列。
3. 后台 **Celery Worker** 拦截任务，加载 PaddleOCR Formula Recognition 或 `pix2tex` 模型执行推理。
4. 前端通过 **Mission Progress** (任务进度页) 追踪状态。
5. 完成后在 **Result** (报告页) 展示格式化后的 LaTeX 源码与 KaTeX 实时渲染画面。

## 🚀 Quick Start | 快速启动

1. Clone the repository and configure environments:
```bash
cp .env.example .env
```

2. Launch the entire mission stack via Docker Compose:
```bash
# This will build and spin up the Web Server, Redis, DB, and Celery Worker
make up
```

3. Access the Mission Control Center:
👉 Open http://localhost:8000/ in your browser.

Product-core pages begin at `http://localhost:8000/projects/`, while the existing single-image recognition flow remains available from Workbench.

The Docker image installs both the base web stack and PaddleOCR Formula Recognition dependencies. The default Compose environment uses:

```bash
FORMULA_LAB_OCR_ENGINE=paddle
```

Model files are cached under `.model-cache/` through a Compose volume mount, so the first warmup or recognition may be slow, but later runs reuse the downloaded Paddle model.

## 🛠️ Local Development | 本地开发

当前本机开发优先使用 PaddleOCR Formula Recognition。依赖和模型权重已经落在本机 `.conda` 与 `.model-cache/` 中，启动时直接运行：

```bash
make local
```
👉 Open http://127.0.0.1:8000/

For the Projects-first product core, open http://127.0.0.1:8000/projects/ after the local server starts.

`make local` 会并行启动 Redis、Django Web 和 Celery Worker，并默认设置：

```bash
FORMULA_LAB_OCR_ENGINE=paddle
```

如果需要和旧模型做对照，可以运行：

```bash
make local-pix2tex
```

Report and history pages use a Node-built layout intelligence bundle based on `@chenglou/pretext`. KaTeX is vendored into local Django static files so formula rendering does not depend on CDN access. If files under `frontend/` or package-managed static vendors change, rebuild the browser assets before running or committing:

```bash
make frontend-build
```

## 🧪 Testing & CI | 测试与验证

Run backend unit tests locally:
```bash
make dev-check
make dev-test
```

Run Playwright E2E Tests (End-to-End browser simulation):
```bash
make e2e
```

## 📚 Documentation 

- [文档索引 (Document Index)](docs/00-文档索引.md)
- [UI 设计语言 (Design System)](DESIGN.md)
