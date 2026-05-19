# Formula Lab Mission Control

SpaceX-inspired formula recognition mission control for Linux System and Programming Practice.

## 中文说明

本项目用于《Linux系统与编程实践》大实验 2：上传公式图片，使用 pix2tex / LaTeX-OCR 识别为 LaTeX，并在网页中展示可复制源码和 KaTeX 渲染预览。

第一版实现包含：

- Landing page、Workbench、Mission Progress、Mission Report、Mission Log、System Telemetry
- Django 表单上传与 PNG/JPG/JPEG 真实图片校验
- PostgreSQL 持久化任务历史
- Redis + Celery 异步识别任务
- pix2tex 懒加载识别引擎
- 失败任务重试与历史记录
- Docker Compose 运行方案

## Quick Start

```bash
cp .env.example .env
make up
```

Open: http://localhost:8000/

## Useful Commands

```bash
make verify
make warmup
make e2e
make test
```

## Local Development

本机开发可使用项目内 `.conda` 环境：

```bash
make dev-migrate
make dev
```

Open: http://127.0.0.1:8000/

本机单元测试：

```bash
make dev-check
make dev-test
```

开发模式默认使用项目内 `db.sqlite3` 和 `redis://localhost:6379/0`。不启动 Redis/Celery worker 时，可以浏览页面和验证基础接口，但公式识别异步任务不会完整执行。Docker Compose 是最终运行方式。

## Documentation

- [文档索引](docs/00-文档索引.md)
- [实施计划](docs/superpowers/plans/2026-05-19-formula-lab-mission-control.md)
- [UI 设计语言](DESIGN.md)
