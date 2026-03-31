# 审核前端 API 对接说明（基于 `testagent/backend_api`）

更新时间：2026-03-30

## 1. 对接范围

本文档面向“审核前端（内部使用）”，后端服务为：
- Python 入口：[main.py](/D:/pythoncodes/AI_TCAD/testagent/backend_api/main.py)
- 路由目录：`testagent/backend_api/routers`

默认部署约定：
- 后端端口：`8001`
- Base URL：`http://<host>:8001`
- 业务接口统一前缀：`/api/v1/*`

说明：
- 除登录与健康检查外，其他接口都需要 Bearer Token。
- 本文只覆盖当前已实现接口；返回 `501` 的接口视为占位未实现。

---

## 2. 通用约定

### 2.1 认证头

```http
Authorization: Bearer <token>
```

### 2.2 登录返回字段（重要）

登录接口返回字段是：
- `token`
- 不是 `access_token`

### 2.3 角色与权限

角色：
- `admin`
- `reviewer`
- `observer`

权限概览：
- `admin/reviewer`：可上传文档、分配 QA、提交审核
- `observer`：只读（列表、详情、统计、排行）

---

## 3. 认证接口

### 3.1 登录

- 方法：`POST`
- 路径：`/api/v1/auth/login`

请求体：
```json
{
  "username": "reviewer",
  "password": "reviewer123456"
}
```

成功响应：
```json
{
  "token": "<jwt>",
  "token_type": "bearer",
  "expires_in": 28799,
  "user": {
    "id": 2,
    "username": "reviewer",
    "name": "Default Reviewer",
    "role": "reviewer",
    "status": "active",
    "created_at": "2026-03-29T10:00:00Z",
    "last_active_at": "2026-03-29T12:00:00Z"
  }
}
```

失败：
- `401`：`invalid username or password`
- `403`：`account is disabled`

### 3.2 当前用户

- 方法：`GET`
- 路径：`/api/v1/auth/me`
- 需要认证：是

响应结构与登录响应中的 `user` 一致。

### 3.3 退出登录

- 方法：`POST`
- 路径：`/api/v1/auth/logout`
- 需要认证：是

成功响应：
```json
{
  "message": "logout success"
}
```

---

## 4. 文档工作台接口

前缀：`/api/v1/knowledge/documents`

### 4.1 文档统计

- `GET /api/v1/knowledge/documents/stats`

响应：
```json
{
  "document_count": 128,
  "fragment_count": 5621,
  "qa_count": 2140,
  "indexed_count": 120,
  "processing_count": 6,
  "failed_count": 2
}
```

### 4.2 文档列表

- `GET /api/v1/knowledge/documents`

查询参数：
- `page`（默认 1）
- `page_size`（默认 20，最大 200）
- `file_type`
- `document_type`
- `keyword`
- `status`（`indexed / processing / failed`）
- `sort_by`（`uploaded_at / file_name / fragment_count / qa_count`）
- `order`（`asc / desc`）
- `knowledge_base`

响应：
```json
{
  "items": [
    {
      "document_id": "0d1d...",
      "title": "TCAD Manual",
      "file_name": "tcad_manual.pdf",
      "file_type": "pdf",
      "file_size": 2457600,
      "uploaded_at": "2026-03-29T12:00:00Z",
      "uploaded_by": "reviewer",
      "uploaded_by_name": "Default Reviewer",
      "knowledge_base": "default",
      "status": "indexed",
      "fragment_count": 124,
      "qa_count": 57,
      "document_type": "manual"
    }
  ],
  "total": 128,
  "page": 1,
  "page_size": 20
}
```

### 4.3 文档详情

- `GET /api/v1/knowledge/documents/{document_id}`

返回包含：基础信息 + 哈希/对象路径 + 最近任务状态（如 `latest_task_status`）。

### 4.4 上传文档

- `POST /api/v1/knowledge/documents`
- 请求类型：`multipart/form-data`

表单字段：
- `file`（必填）
- `title`（可选）
- `document_type`（可选，默认 `manual`）
- `type`（兼容字段，可与 `document_type` 二选一）
- `knowledge_base`（可选，默认 `default`）

`document_type/type` 可选值：
- `paper`
- `conference`
- `book`
- `manual`
- `code`
- `data`

成功响应：
```json
{
  "document_id": "0d1d...",
  "title": "TCAD Manual",
  "file_name": "tcad_manual.pdf",
  "document_type": "manual",
  "knowledge_base": "default",
  "status": "indexed",
  "fragment_count": 124,
  "generated_pending_qas": 15,
  "ingestion_task_id": "2f2a..."
}
```

### 4.5 目前未实现（返回 501）

- `GET /api/v1/knowledge/documents/{document_id}/download`
- `DELETE /api/v1/knowledge/documents/{document_id}`

---

## 5. QA 审核工作台接口

前缀：`/api/v1/qa-pairs`

### 5.1 QA 统计

- `GET /api/v1/qa-pairs/stats`

响应：
```json
{
  "pending": 120,
  "reviewed": 820,
  "deprecated": 35
}
```

### 5.2 QA 列表

- `GET /api/v1/qa-pairs`

查询参数：
- `status`（`pending / reviewed / deprecated`）
- `assignee`
- `reviewer`
- `keyword`
- `topic`
- `scene`
- `min_confidence`
- `page`
- `page_size`
- `sort_by`（`created_at / updated_at / reviewed_at / confidence`）
- `order`（`asc / desc`）

响应包含：题干、答案、标签、状态、版本、分配人、审核人、文档关联等。

### 5.3 QA 详情

- `GET /api/v1/qa-pairs/{qa_pair_id}`

响应额外包含 `fragments`（原文片段）用于审核页面展示。

### 5.4 提交审核（更新 QA）

- `PUT /api/v1/qa-pairs/{qa_pair_id}`

请求体示例：
```json
{
  "question": "修订后的问题",
  "answer": "修订后的答案",
  "topics": ["TCAD Simulation"],
  "scenes": ["engineer"],
  "confidence": 0.96,
  "review_notes": "审核通过",
  "status": "reviewed",
  "version": 3,
  "assignee": "reviewer"
}
```

字段说明：
- `version` 必填，用于并发控制
- `status`：`pending / reviewed / deprecated`
- `assignee` 可选，不传则保持当前分配

版本冲突返回：
- HTTP `409`
- Body：
```json
{
  "detail": {
    "message": "version conflict",
    "current_version": 4
  }
}
```

前端建议：
- 提交前保存详情里的 `version`
- 收到 `409` 后，重新拉取详情并提示用户“数据已被他人更新”

### 5.5 批量分配

- `POST /api/v1/qa-pairs/assignments`

请求体：
```json
{
  "qa_ids": ["qa_001", "qa_002"],
  "assignee": "reviewer"
}
```

成功响应：
```json
{
  "updated_count": 2,
  "assignee": "reviewer",
  "assignee_user_id": 2
}
```

### 5.6 目前未实现（返回 501）

- `POST /api/v1/qa-pairs`（手工新建 QA）

---

## 6. 成员排行接口

前缀：`/api/v1/analytics`

### 6.1 成员排名

- `GET /api/v1/analytics/member-rankings`

查询参数：
- `sort_by`：`default / uploaded_docs / reviewed_qa / processed_qa`
- `order`：`asc / desc`
- `page`
- `page_size`

响应包含：
- `uploaded_document_count`
- `reviewed_qa_count`
- `deprecated_qa_count`
- `processed_qa_count`
- `last_active_at`

---

## 7. 健康检查接口（无鉴权）

- `GET /health`
- `GET /health/dependencies`

示例：
```json
{
  "postgres": "ok",
  "status": "ok"
}
```

---

## 8. 前端集成建议

### 8.1 API 封装

建议分层：
- `authApi`：登录、当前用户、退出
- `documentApi`：文档统计/列表/详情/上传
- `qaApi`：QA 列表/详情/更新/分配
- `analyticsApi`：成员排行

### 8.2 Axios 拦截器（示意）

```ts
import axios from "axios";

export const http = axios.create({
  baseURL: "http://<host>:8001",
  timeout: 15000,
});

http.interceptors.request.use((config) => {
  const token = localStorage.getItem("review_token");
  if (token) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

http.interceptors.response.use(
  (res) => res,
  (err) => {
    const code = err?.response?.status;
    if (code === 401) {
      localStorage.removeItem("review_token");
      window.location.href = "/login";
    }
    return Promise.reject(err);
  }
);
```

### 8.3 页面初始化建议顺序

1. 登录：`POST /api/v1/auth/login`
2. 拉用户：`GET /api/v1/auth/me`
3. 首页统计：
   - `GET /api/v1/knowledge/documents/stats`
   - `GET /api/v1/qa-pairs/stats`
   - `GET /api/v1/analytics/member-rankings`
4. 列表页：
   - 文档页：`GET /api/v1/knowledge/documents`
   - QA页：`GET /api/v1/qa-pairs?status=pending`

---

## 9. 最小联调清单

建议先联通以下接口：
- 认证：`/api/v1/auth/login`、`/api/v1/auth/me`
- QA 审核：`/api/v1/qa-pairs`、`/api/v1/qa-pairs/{id}`、`PUT /api/v1/qa-pairs/{id}`
- 分配：`POST /api/v1/qa-pairs/assignments`
- 文档：`/api/v1/knowledge/documents/stats`、`/api/v1/knowledge/documents`、`POST /api/v1/knowledge/documents`
- 排行：`/api/v1/analytics/member-rankings`

---

## 10. 现阶段已知限制

- 文档下载、文档删除、手工新建 QA 尚未实现（返回 `501`）
- 上传依赖 `python-multipart`
- 若未配置 QA 生成模型密钥，上传仍可成功，但自动生成 QA 可能偏少（会走兜底生成）
- 当前无单独“上传任务查询”API；上传接口返回时通常已完成主要处理

---

## 11. 可选：遗留日志接口（非 v1 主流程）

当前服务还保留：
- `POST /review-logs`
- `GET /review-logs`

该组接口不是审核前端主流程必需，建议前端优先使用 `/api/v1/*`。
