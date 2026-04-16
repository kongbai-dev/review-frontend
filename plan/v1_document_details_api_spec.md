# backend_api 文档详情接口对接规范

更新时间：2026-04-15  
适用目录：`testagent/backend_api`  
实现基准：`testagent/backend_api/routers/v1_documents.py` + `testagent/backend_api/schemas_v1.py`

## 1. 接口路径

当前已支持两条等价路径（返回结构一致）：

1. 推荐路径：`GET /api/v1/knowledge/documents/{document_id}/details`
2. 兼容路径：`GET /api/v1/knowledge/documents/{document_id}`

## 2. 认证与权限

1. 认证方式：`Authorization: Bearer <JWT>`
2. 允许角色：`admin` / `reviewer` / `observer`

## 3. 请求参数

路径参数：

1. `document_id`（必填，string）：文档主键 ID（UUID 字符串）

请求体：无

## 4. 响应说明

成功响应：

1. HTTP `200`
2. `application/json`
3. 返回 `DocumentDetailResponse`

主要字段分组：

1. 基础信息：
   `document_id`, `title`, `file_name`, `file_type`, `file_size`, `document_type`
2. 来源与状态：
   `knowledge_base`, `status`, `sync_mode`, `sync_status`, `qa_status`
3. 元数据：
   `authors`, `year`, `journal`, `conference`, `publisher`, `volume`, `issue`, `pages`, `doi`, `abstract`, `topics`, `scenes`, `language`
4. 路径与对象：
   `source_path`, `local_file_path`, `local_csv_path`, `object_key`, `upload_session_id`, `csv_file_name`, `csv_md5`
5. 统计与任务：
   `fragment_count`, `qa_count`, `indexed_at`, `latest_task_id`, `latest_task_status`, `latest_task_stage`, `latest_task_error_message`, `latest_task_updated_at`
6. 错误与追踪：
   `last_error_code`, `last_error_message`, `sync_attempts`, `sync_last_error`, `minio_uploaded_at`, `uploaded_by`, `uploaded_by_name`, `uploaded_by_user_id`, `uploaded_at`

## 5. 错误码

1. `401`：未登录或 token 无效
2. `403`：无权限访问
3. `404`：文档不存在（含已删除文档）

## 6. 示例响应（200）

```json
{
  "document_id": "6f58d8f7-2435-49de-983d-6ca31a7f3e88",
  "title": "TCAD Handbook",
  "file_name": "tcad_handbook.pdf",
  "source_path": "knowledge_data/docs/sync/tcad_handbook.pdf",
  "file_type": "pdf",
  "file_size": 2530141,
  "uploaded_at": "2026-04-15T10:23:11.145321+00:00",
  "uploaded_by": "alice",
  "uploaded_by_name": "Alice Wang",
  "knowledge_base": "default",
  "status": "synced",
  "fragment_count": 0,
  "qa_count": 0,
  "document_type": "manual",
  "authors": ["A. Wang"],
  "year": 2026,
  "journal": null,
  "conference": null,
  "publisher": null,
  "volume": null,
  "issue": null,
  "pages": null,
  "doi": null,
  "abstract": null,
  "topics": ["TCAD"],
  "scenes": ["engineer"],
  "language": "zh",
  "sync_mode": "sync",
  "sync_status": "synced",
  "local_file_path": "knowledge_data/docs/sync/tcad_handbook.pdf",
  "local_csv_path": "knowledge_data/csv/sync/tcad_handbook.csv",
  "upload_session_id": null,
  "pair_status": "paired",
  "pair_error": null,
  "csv_file_name": "tcad_handbook.csv",
  "file_md5": "ab12cd34ef56...",
  "object_key": "raw-docs/manuals/2026/tcad_handbook.pdf",
  "indexed_at": null,
  "last_error_code": null,
  "last_error_message": null,
  "uploaded_by_user_id": 1,
  "latest_task_id": "b4f8985a-151e-431d-a444-630b94380710",
  "latest_task_status": "completed",
  "latest_task_stage": "synced",
  "latest_task_error_message": null,
  "latest_task_updated_at": "2026-04-15T10:23:13.002361+00:00",
  "sync_attempts": 0,
  "sync_last_error": "",
  "minio_uploaded_at": "2026-04-15T10:23:12.431122+00:00",
  "qa_status": "qa_pending",
  "csv_md5": "9922aa11bb33..."
}
```

## 7. OpenAPI 文件

对应 OpenAPI 文件：
`testagent/backend_api/openapi/v1_document_details.openapi.yaml`

