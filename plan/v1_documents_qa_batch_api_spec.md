# QA 批量生成接口对接规范（前端）

更新时间：2026-05-19  
适用范围：`/api/v1/knowledge/documents/qa-generation/batch-start`、`/api/v1/knowledge/documents/qa-generation/batch-tasks/{batch_task_id}`

## 1. 鉴权与权限
- 鉴权方式：`Authorization: Bearer <token>`
- `POST /batch-start`：`admin`、`reviewer` 可调用
- `GET /batch-tasks/{batch_task_id}`：`admin`、`reviewer`、`observer` 可调用

---

## 2. 启动批量任务

说明：
- 该接口现在只负责创建批量任务与任务子项，不再在请求线程中串行执行文档 QA 生成。
- 实际处理由后端常驻 worker pool 异步消费。
- 返回 `200` 仅表示“任务已入队”，不表示任务已经完成。

### 2.1 接口
- 方法：`POST`
- 路径：`/api/v1/knowledge/documents/qa-generation/batch-start`

### 2.2 请求体
```json
{
  "document_ids": ["doc_a", "doc_b"],
  "target_count": 10,
  "mode": "append",
  "fail_fast": false
}
```

字段说明：
- `document_ids`：`string[]`，必填，1~200；服务端会去重和 trim
- `target_count`：`int`，可选，默认 `10`，范围 `1~100`
- `mode`：`append | replace`，可选，默认 `append`
- `fail_fast`：`boolean`，可选，默认 `false`

### 2.3 成功响应（200）
```json
{
  "batch_task_id": "9a0f7f6a-3c68-4966-becf-7b56d6b2349a",
  "status": "queued",
  "total_documents": 2,
  "queued_documents": 2,
  "target_count_per_document": 10,
  "mode": "append",
  "message": "qa batch generation task started"
}
```

### 2.4 失败响应
- `401`：未登录/Token 无效
- `403`：角色无权限
- `404`：文档不存在（会返回缺失文档 ID 列表）
```json
{
  "detail": {
    "message": "some documents not found",
    "missing_document_ids": ["doc_not_found_1", "doc_not_found_2"]
  }
}
```
- `422`：
  - 参数校验错误（FastAPI 标准 `detail[]`）
  - 或 `document_ids` 清洗后为空：
```json
{
  "detail": "document_ids is empty after normalization"
}
```

---

## 3. 查询批量任务详情

### 3.1 接口
- 方法：`GET`
- 路径：`/api/v1/knowledge/documents/qa-generation/batch-tasks/{batch_task_id}`

### 3.2 路径参数
- `batch_task_id`：批量任务 ID（字符串，通常为 UUID）

### 3.3 成功响应（200）
```json
{
  "batch_task_id": "9a0f7f6a-3c68-4966-becf-7b56d6b2349a",
  "status": "running",
  "total_documents": 2,
  "queued_documents": 1,
  "processed_documents": 1,
  "success_documents": 1,
  "failed_documents": 0,
  "skipped_documents": 0,
  "target_count_per_document": 10,
  "mode": "append",
  "message": "processed=1, success=1, failed=0, skipped=0, queued=1, processing=0",
  "stop_requested": false,
  "started_at": "2026-04-16T10:00:00Z",
  "finished_at": null,
  "items": [
    {
      "document_id": "doc_a",
      "ingestion_task_id": "af915f2f-876c-43da-bcb9-2ab20e94de5d",
      "status": "completed",
      "generated_qas": 10,
      "error_message": null,
      "started_at": "2026-04-16T10:00:01Z",
      "finished_at": "2026-04-16T10:00:04Z",
      "attempt_count": 1,
      "updated_at": "2026-04-16T10:00:04Z"
    },
    {
      "document_id": "doc_b",
      "ingestion_task_id": null,
      "status": "queued",
      "generated_qas": 0,
      "error_message": null,
      "started_at": null,
      "finished_at": null,
      "attempt_count": 0,
      "updated_at": "2026-04-16T10:00:00Z"
    }
  ]
}
```

### 3.4 失败响应
- `401`：未登录/Token 无效
- `403`：角色无权限
- `404`：任务不存在
```json
{
  "detail": "qa batch generation task not found"
}
```

---

## 4. 状态值约定（前端渲染建议）

批任务 `status`：
- `queued`：排队中
- `running`：执行中
- `completed`：全部成功
- `partial_failed`：部分失败
- `failed`：全部失败或任务异常终止

子项 `items[].status`：
- `queued`：未开始
- `processing`：处理中
- `completed`：成功
- `failed`：失败
- `skipped`：跳过（仅 `fail_fast=true` 且前序失败时）

---

## 5. 前端轮询建议
- 先调 `POST /batch-start` 拿到 `batch_task_id`
- 再每 `2~3s` 轮询 `GET /batch-tasks/{batch_task_id}`
- 当 `status in [completed, partial_failed, failed]` 停止轮询

## 5.1 并发模式下 `fail_fast` 语义
- `fail_fast=false`：单个文档失败不会阻止其他文档继续执行
- `fail_fast=true`：
  - 首个失败发生后，批任务会设置 `stop_requested=true`
  - worker 不再 claim 该批任务下新的 `queued` item
  - 已经进入 `processing` 的 item 允许自然结束
  - 剩余尚未开始的 `queued` item 会被标记为 `skipped`

---

## 6. 兼容性说明
- `document_ids` 会被服务端“去重 + trim”，前端无需自行去重，但建议保持输入清洁
- `target_count_per_document` 表示“每个文档目标 QA 数”，不是总数
- 单文档接口 `POST /api/v1/knowledge/documents/qa-generation/start` 在文档已被其他 QA 任务占用时可能返回 `409`
