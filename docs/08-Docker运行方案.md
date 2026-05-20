# Docker运行方案

## 运行目标

Formula Lab 的 Linux 验收与最终部署仍以 Docker Compose 为目标；Mac 本机开发阶段可以直接使用 `.conda` 环境和 `make local` 提高迭代速度。

目标命令：

```bash
docker compose up --build
```

本机开发命令：

```bash
make local
```

启动后应包含：

- Django Web 服务。
- Celery Worker 服务。
- PostgreSQL 数据库。
- Redis 消息队列。

镜像构建使用 `uv pip install --system` 安装 Python 依赖，并通过 BuildKit cache 缓存 `/root/.cache/uv`。为了缓解大 wheel 下载超时，Dockerfile 设置了 `UV_HTTP_TIMEOUT=300`，并配置 PyPI 镜像源。

前端布局智能使用 Node 构建层生成静态 bundle。Docker 构建时先在 Node stage 运行 `npm run build`，再把生成的 `layout-intelligence.js` 复制进最终 Python 镜像。最终运行时仍然只有 Django、Celery、PostgreSQL 和 Redis，不启动 Node 服务。

## 服务设计

```text
web
  Django 开发服务器
  对外暴露 8000 端口

worker
  Celery worker
  调用公式识别模型

db
  PostgreSQL
  保存 FormulaJob 和历史记录

redis
  Redis
  作为 Celery broker 和 result backend
```

## web 服务

`web` 服务负责：

- 执行 Django migration。
- 启动开发服务器。
- 提供页面和 API。
- 读取和写入上传媒体文件。

开发阶段端口：

```text
http://localhost:8000/
```

在 Ubuntu 验收时，可以使用 Firefox 打开同一地址。

## worker 服务

`worker` 服务负责：

- 启动 Celery。
- 加载 Django settings。
- 从 Redis 获取任务。
- 调用当前配置的公式识别模型。
- 写入 PostgreSQL。

worker 和 web 使用同一个镜像，但启动命令不同。

## db 服务

PostgreSQL 使用 volume 持久化数据。

建议环境变量：

```text
POSTGRES_DB=formula_lab
POSTGRES_USER=formula_lab
POSTGRES_PASSWORD=formula_lab_password
```

## redis 服务

Redis 不保存业务数据，只作为消息队列。

如果 Redis 容器重启，已经完成的历史记录仍保存在 PostgreSQL 中。

## volume 设计

当前 Compose 配置使用两类持久化方式：

```text
postgres_data                 Docker 命名 volume，保存 PostgreSQL 数据
./media:/app/media            bind mount，保存上传图片和预处理图片
./.model-cache:/app/.model-cache  bind mount，保存 PaddleOCR / pix2tex 模型缓存
```

模型缓存很重要，因为 PaddleOCR 和 pix2tex 都可能需要下载模型权重。如果每次重建容器都重新下载，会明显影响开发体验和验收稳定性。

这种设计偏向课程验收和本地调试：宿主机可以直接看到上传文件和模型缓存。未来如果要做更接近生产环境的 Compose，可以把 `media` 和 `model_cache` 改成命名 volume，并拆出 `compose.prod.yml`。

## 环境变量

`.env.example` 应提供：

```text
DEBUG=1
DJANGO_SECRET_KEY=change-me
DATABASE_URL=postgres://formula_lab:formula_lab_password@db:5432/formula_lab
REDIS_URL=redis://redis:6379/0
MEDIA_ROOT=/app/media
FORMULA_LAB_OCR_ENGINE=paddle
FORMULA_LAB_PADDLE_MODEL_NAME=PP-FormulaNet_plus-S
```

第一版不保存真实密钥，不连接外部服务。

## 前端与静态资源

第一版使用 Tailwind CDN 辅助布局，同时保留本地 CSS 作为设计语言落地层。KaTeX 已经纳入本地静态资源，核心公式渲染不再依赖 CDN。构建时会执行：

```bash
npm run vendor:katex
```

该命令把 `node_modules/katex/dist` 中的 `katex.min.css`、`katex.min.js` 和字体文件复制到：

```text
apps/formulas/static/formulas/vendor/katex/
```

Pretext 布局智能源码位于：

```text
frontend/formulas/layout_intelligence.js
```

本机修改前端布局智能后运行：

```bash
make frontend-build
```

生成的浏览器静态资源位于：

```text
apps/formulas/static/formulas/js/generated/layout-intelligence.js
```

视觉资产放在：

```text
static/formulas/visuals/
  landing-mission-bg.png
```

Landing 背景资产纳入版本库，保证 Mac 和 Ubuntu 环境都能直接呈现完整首页；其余页面统一使用 CSS 全局细网格背景。

媒体文件和模型缓存仍然不进入版本库：

```text
media/
.model-cache/
```
