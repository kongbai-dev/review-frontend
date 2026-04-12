# backend_api 新增接口规范（文档上传批处理）

更新时间：2026-04-12  
适用目录：`testagent/backend_api`  
实现基准：`testagent/backend_api/routers/v1_documents.py` + `testagent/backend_api/schemas_v1.py`

## 1. 对接范围

本规范覆盖当前已落地的 5 个新增/改造接口：

1. `POST /api/v1/knowledge/documents`
2. `POST /api/v1/knowledge/documents/batch-sync/start`
3. `GET /api/v1/knowledge/documents/batch-sync/tasks/{task_id}`
4. `POST /api/v1/knowledge/documents/qa-generation/start`
5. `GET /api/v1/knowledge/documents/qa-generation/tasks/{task_id}`

统一认证方式：`Authorization: Bearer <JWT>`。

## 2. 角色权限

1. 上传文档：`admin` / `reviewer`
2. 触发批处理：`admin` / `reviewer`
3. 查询批处理任务：`admin` / `reviewer` / `observer`
4. 触发 QA 生成：`admin` / `reviewer`
5. 查询 QA 任务：`admin` / `reviewer` / `observer`

## 3. 接口规范

### 3.1 上传文档（支持 sync/batch）

- 方法与路径：`POST /api/v1/knowledge/documents`
- Content-Type：`multipart/form-data`

请求字段：

1. `file`（必填，binary）文档文件
2. `metadata_csv`（必填，binary）CSV 元数据文件
3. `upload_mode`（可选，默认 `sync`）：`sync | batch`
4. `knowledge_base`（可选，默认 `default`）
5. `document_type`（可选）：`paper|conference|book|manual|code|data`
6. `type`（可选，兼容字段，同上）
7. `title`（可选）
8. `subdir`（可选）

关键校验规则（后端已实现）：

1. `file` 与 `metadata_csv` 必须同名主文件名（如 `a.pdf` + `a.csv`），否则 `422`
2. `metadata_csv` 必须是 UTF-8 编码，且首行数据必须含 `title/year/type`
3. `scenes` 仅允许：`engineer|researcher|student|support`
4. `language` 仅允许：`zh|en`
5. `type=paper` 时必须有 `journal`
6. `type=conference` 时必须有 `conference`
7. 按 `knowledge_base + file_md5` 去重，重复上传返回 `409`

处理语义：

1. 无论 `sync/batch`，都会先落地本地 `knowledge_data` 并写入文档记录
2. `sync`：立即同步 MinIO，成功后 `sync_status=synced`
3. `batch`：仅入队，`sync_status=sync_pending`，等待批处理接口触发
4. 上传接口不自动生成 QA

成功响应（201）核心字段：

1. `document_id`
2. `ingestion_task_id`
3. `status`
4. `sync_mode`
5. `sync_status`

### 3.2 触发批处理同步

- 方法与路径：`POST /api/v1/knowledge/documents/batch-sync/start`
- Content-Type：`application/json`

请求体：

1. `min_batch_size`（默认 10，范围 1~1000）
2. `max_wait_seconds`（默认 300，范围 0~86400）
3. `max_docs`（默认 200，范围 1~2000）
4. `max_workers`（默认 8，范围 1~64）
5. `include_failed`（默认 `true`）

执行策略（后端实际行为）：

1. 候选集来源：`sync_status in ('sync_pending','sync_failed')` 且重试次数未超限
2. 当 `queued_count < min_batch_size` 且最早文档等待时间 `< max_wait_seconds` 时，任务状态会进入 `skipped`
3. 文档级失败不阻断整批，失败文档记录在 `failed_documents`

成功响应（200）核心字段：

1. `task_id`
2. `status`（初始 `queued`）
3. `queued_count/success_count/failed_count`

### 3.3 查询批处理任务状态

- 方法与路径：`GET /api/v1/knowledge/documents/batch-sync/tasks/{task_id}`

成功响应（200）核心字段：

1. `task_id`
2. `status`（`queued|running|skipped|completed|failed`）
3. `queued_count/processed_count/success_count/failed_count`
4. `failed_documents`
5. `started_at/finished_at`

### 3.4 手动触发 QA 生成

- 方法与路径：`POST /api/v1/knowledge/documents/qa-generation/start`
- Content-Type：`application/json`

请求体：

1. `document_id`（必填）
2. `target_count`（可选，默认 10，范围 1~100）
3. `mode`（可选，默认 `append`）：`append | replace`

处理语义：

1. `replace` 会先删除该文档已有 QA，再重建
2. 后端会复用已有 fragment；若无 fragment 会先补建
3. 完成后文档 `qa_status` 更新为 `qa_done`（失败为 `qa_failed`）

成功响应（200）核心字段：

1. `task_id`
2. `document_id`
3. `status`（当前实现返回 `completed`）
4. `generated_qas`

### 3.5 查询 QA 生成任务状态

- 方法与路径：`GET /api/v1/knowledge/documents/qa-generation/tasks/{task_id}`

成功响应（200）返回 `ingestion_tasks` 记录，核心字段：

1. `id`
2. `document_id`
3. `task_type`（固定 `qa_generation`）
4. `status`
5. `stage`
6. `total_fragments`
7. `total_generated_qas`
8. `error_message`
9. `started_at/finished_at/updated_at`

## 4. 错误码约定（前端需要处理）

1. `401`：未登录、token 失效、token 被撤销
2. `403`：角色无权限
3. `404`：文档或任务不存在
4. `409`：文档重复上传（MD5 去重）等冲突
5. `422`：参数或业务校验失败（如文件不同名、CSV 字段不合法）
6. `500`：服务内部异常
7. `502`：依赖 MinIO 等外部服务失败（主要出现在 QA 读取对象阶段）

## 5. OpenAPI 文件

本规范对应 OpenAPI 文件：  
`testagent/backend_api/openapi/v1_documents_batch_sync.openapi.yaml`

