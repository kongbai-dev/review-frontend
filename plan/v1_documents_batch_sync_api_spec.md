# backend_api 文档接口对接说明（同步上传 + 分离批处理）

更新时间：2026-04-13  
适用目录：`testagent/backend_api`

对应 OpenAPI：`testagent/backend_api/openapi/v1_documents_batch_sync.openapi.yaml`

## 1. 对接范围

本说明覆盖 `v1_documents` 全量接口（前缀 `/api/v1/knowledge/documents`）：

1. `GET /stats`
2. `GET /`
3. `GET /{document_id}`
4. `GET /{document_id}/download`
5. `POST /`
6. `POST /batch-upload/doc-files`
7. `POST /batch-upload/csv-files`
8. `GET /batch-upload/session/current`
9. `POST /batch-sync/start`
10. `GET /batch-sync/tasks/{task_id}`
11. `POST /qa-generation/start`
12. `GET /qa-generation/tasks/{task_id}`
13. `DELETE /{document_id}`

## 2. 认证与权限

统一鉴权：`Authorization: Bearer <token>`

Token 获取：

- `POST /api/v1/auth/login`
- body: `{"username":"...","password":"..."}`
- 返回字段里 `token` 即 Bearer Token

角色权限：

1. 读类接口（列表/详情/状态/统计）：`admin|reviewer|observer`
2. 写类接口（上传/触发同步/触发QA/删除）：`admin|reviewer`

## 3. 本次关键变更（前端必须同步）

1. 单文件上传接口 `POST /api/v1/knowledge/documents` 已收口为仅 `sync`。
2. `upload_mode` 仅接受 `sync`；传 `batch` 会返回 `422`。
3. 批量模式改为分离上传：
   - 文档批量上传：`/batch-upload/doc-files`
   - CSV 批量上传：`/batch-upload/csv-files`
4. 批处理同步通过 `session` 运行：`/batch-sync/start` 仅处理当前 open session 的已配对文档。
5. 新增 `strict_pairing`：开启后只要存在未配对文档就拒绝启动批同步（`422`）。

## 4. 接口说明

### 4.1 单文档同步上传

接口：`POST /api/v1/knowledge/documents`  
`Content-Type: multipart/form-data`

请求字段：

1. `file`（必填，文档文件）
2. `metadata_csv`（必填，元数据 CSV）
3. `upload_mode`（可选，默认 `sync`，当前只允许 `sync`）
4. `knowledge_base`（可选，默认 `default`）
5. `document_type` / `type`（可选）
6. `title`（可选）
7. `subdir`（可选）

校验规则：

1. `file` 与 `metadata_csv` 必须同 basename（如 `a.pdf` + `a.csv`）。
2. `metadata_csv` 必须 UTF-8，且首行数据必须包含 `title/year/type`。
3. `scenes` 仅允许：`engineer|researcher|student|support`。
4. `language` 仅允许：`zh|en`。
5. `paper` 类型必须有 `journal`；`conference` 类型必须有 `conference`。
6. `knowledge_base + file_md5` 去重，重复上传返回 `409`。

行为：

1. 文件先落地到 `knowledge_data/docs/sync` 与 `knowledge_data/csv/sync`。
2. 随后立即同步到 MinIO（同步上传成功后 `sync_status=synced`）。
3. 本接口不自动生成 QA 对。

### 4.2 批量上传文档文件

接口：`POST /api/v1/knowledge/documents/batch-upload/doc-files`  
`Content-Type: multipart/form-data`

请求字段：

1. `files[]`（必填，多个文档文件）
2. `knowledge_base`（可选，默认 `default`）

行为：

1. 自动获取/创建当前用户 + knowledge_base 的 open session。
2. 文件落地到 `knowledge_data/docs/{session_id}/`。
3. 写入 `documents`，`sync_mode=batch`、`pair_status` 初始为待配对状态。
4. 上传后返回每个文件处理结果（`stored/duplicate/rejected`）。

### 4.3 批量上传 CSV 文件

接口：`POST /api/v1/knowledge/documents/batch-upload/csv-files`  
`Content-Type: multipart/form-data`

请求字段：

1. `files[]`（必填，多个 CSV）
2. `knowledge_base`（可选，默认 `default`）

行为：

1. 自动获取/创建 open session。
2. 文件落地到 `knowledge_data/csv/{session_id}/`。
3. 解析并校验 CSV，写入 `uploaded_csv_files`。
4. 刷新 session 配对状态，返回每个 CSV 结果（`stored/invalid/duplicate/rejected`）。

### 4.4 查询当前 session 配对状态

接口：`GET /api/v1/knowledge/documents/batch-upload/session/current?knowledge_base=default`

返回核心字段：

1. `session_id`
2. `status`
3. `doc_file_count/csv_file_count/paired_count/unpaired_count`
4. `unmatched_documents[]`
5. `orphan_csv_files[]`

### 4.5 启动批处理同步到 MinIO

接口：`POST /api/v1/knowledge/documents/batch-sync/start`  
`Content-Type: application/json`

请求体示例：

```json
{
  "knowledge_base": "default",
  "min_batch_size": 10,
  "max_wait_seconds": 300,
  "max_docs": 200,
  "max_workers": 8,
  "include_failed": true,
  "strict_pairing": false
}
```

行为：

1. 只处理当前 open session 下 `pair_status=paired` 的文档。
2. `strict_pairing=true` 且存在未配对文档时，返回 `422`。
3. `strict_pairing=false` 时，未配对文档跳过并记录到 `skipped_documents`。
4. 返回 `task_id` 后异步执行，可用任务状态接口轮询。

### 4.6 查询批处理任务状态

接口：`GET /api/v1/knowledge/documents/batch-sync/tasks/{task_id}`

返回核心字段：

1. `task_id`
2. `status`（`queued|running|skipped|completed|failed`）
3. `session_id`
4. `queued_count/processed_count/success_count/failed_count/skipped_count`
5. `failed_documents[]`
6. `skipped_documents[]`

### 4.7 触发单文档 QA 生成

接口：`POST /api/v1/knowledge/documents/qa-generation/start`  
`Content-Type: application/json`

请求体示例：

```json
{
  "document_id": "<doc_id>",
  "target_count": 10,
  "mode": "append"
}
```

说明：

1. `mode=replace` 会先删除该文档已有 QA 再生成。
2. 生成完成后返回 `generated_qas`。

### 4.8 查询 QA 生成任务状态

接口：`GET /api/v1/knowledge/documents/qa-generation/tasks/{task_id}`

返回 `ingestion_tasks` 记录（包含 `status/stage/total_generated_qas/error_message` 等）。

### 4.9 文档删除

接口：`DELETE /api/v1/knowledge/documents/{document_id}`

行为：

1. 尝试删除 MinIO 对象。
2. 尝试删除本地文档和 CSV 文件。
3. 删除数据库文档记录。

## 5. 前端推荐调用流程

### 5.1 单文件实时入库（sync）

1. 登录取 token。
2. 调 `POST /api/v1/knowledge/documents`（`file + metadata_csv`）。
3. 上传成功后可直接从列表/详情读取状态。

### 5.2 批量入库（doc/csv 分离）

1. 先调 `POST /batch-upload/doc-files` 上传文档。
2. 再调 `POST /batch-upload/csv-files` 上传 CSV。
3. 调 `GET /batch-upload/session/current` 检查 `paired/unpaired`。
4. 调 `POST /batch-sync/start` 触发同步。
5. 轮询 `GET /batch-sync/tasks/{task_id}`，处理 `failed_documents/skipped_documents`。

## 6. 错误码处理建议

1. `401`：未登录或 token 失效，前端应跳转登录并清理本地 token。
2. `403`：角色无权限，前端应提示并隐藏不可操作按钮。
3. `404`：资源不存在（文档/任务/session）。
4. `409`：冲突（重复上传、状态冲突）。
5. `422`：参数/业务校验失败（重点展示后端 detail）。
6. `500/502`：后端或依赖异常，建议可重试并提示联系管理员。
