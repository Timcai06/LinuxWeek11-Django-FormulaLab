# Docker运行方案

## 运行目标

Formula Lab 只采用 Docker Compose 作为运行方式。Mac 开发和 Ubuntu 验收都使用同一套 Compose 配置，减少环境差异。

目标命令：

```bash
docker compose up --build
```

启动后应包含：

- Django Web 服务。
- Celery Worker 服务。
- PostgreSQL 数据库。
- Redis 消息队列。

镜像构建使用 `uv pip install --system` 安装 Python 依赖，并通过 BuildKit cache 缓存 `/root/.cache/uv`。这样比直接 `pip install -r requirements.txt` 更适合包含 `torch`、`torchvision`、`pix2tex` 的重依赖构建。

## 服务设计

```text
web
  Django 开发服务器
  对外暴露 8000 端口

worker
  Celery worker
  调用 pix2tex 模型

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
- 调用 pix2tex。
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

建议配置：

```text
postgres_data   保存数据库
media_data      保存上传图片
model_cache     保存 pix2tex 模型缓存
```

模型缓存很重要，因为 pix2tex 可能需要下载模型权重。如果每次重建容器都重新下载，会明显影响开发体验和验收稳定性。

## 环境变量

`.env.example` 应提供：

```text
DEBUG=1
DJANGO_SECRET_KEY=change-me
DATABASE_URL=postgres://formula_lab:formula_lab_password@db:5432/formula_lab
REDIS_URL=redis://redis:6379/0
MEDIA_ROOT=/app/media
```

第一版不保存真实密钥，不连接外部服务。

## 前端与静态资源

第一版使用 Tailwind CDN 辅助布局，同时保留本地 CSS 作为设计语言落地层。

视觉资产放在：

```text
static/formulas/visuals/
  landing-mission-bg.png
  result-texture.png
```

这些视觉资产纳入版本库，保证 Mac 和 Ubuntu 环境都能直接呈现完整页面。

媒体文件和模型缓存仍然不进入版本库：

```text
media/
.model-cache/
```
