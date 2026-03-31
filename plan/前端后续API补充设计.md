# 前端后续 API 补充设计

## 1. 目的

基于当前 [`rest_api_spec.md`](D:\javascrip\review-frontend\plan\rest_api_spec.md) 已定义的资源模型和命名风格，补出前端后续构建真正需要的 API。

这份设计有两个目标：

1. 新增页面能够直接落地
2. 现有前端接口能够逐步收口到统一规范

---

## 2. 设计原则

### 2.1 尽量复用现有资源

当前规范已经有这些核心资源：

- `KnowledgeDocument`
- `QAPair`
- `IngestionTask`

因此前端后续 API 设计应尽量沿用：

- 文档相关继续放在 `/api/v1/knowledge/documents`
- QA 相关继续放在 `/api/v1/qa-pairs`

### 2.2 聚合类接口单独归类

“成员排行”本质上不是原子资源，而是聚合统计结果，因此建议单独放到：

- `/api/v1/analytics/...`

这样可以避免把统计型接口混进 `documents` 或 `qa-pairs` 的资源路径里。

### 2.3 列表接口统一返回结构

建议前端所有列表接口统一返回：

```json
{
  "items": [],
  "total": 0,
  "page": 1,
  "page_size": 20
}
```

这和当前前端 [`api.ts`](D:\javascrip\review-frontend\src\api.ts) / [`types/api.ts`](D:\javascrip\review-frontend\src\types\api.ts) 的使用习惯更一致。

### 2.4 时间与枚举统一

- 时间格式：`ISO-8601 UTC`
- 状态值尽量用小写枚举
- 排序字段使用稳定英文值，不在接口层传中文

---

## 3. 当前规范可直接复用的接口

这些接口已经在当前规范中存在，前端可以直接基于它们实现：

### 3.1 文档管理

- `POST /api/v1/knowledge/documents`
- `GET /api/v1/knowledge/documents`
- `GET /api/v1/knowledge/documents/{document_id}`
- `DELETE /api/v1/knowledge/documents/{document_id}`

### 3.2 QA 归档与查询

- `GET /api/v1/qa-pairs`
- `GET /api/v1/qa-pairs/{qa_pair_id}`

### 3.3 检索与摘要

- `POST /api/v1/knowledge/retrievals`
- `POST /api/v1/knowledge/rag-summaries`

---

## 4. 前端后续必须补充的 API

## 4.1 文档管理页需要补充的 API

当前规范已经有文档上传、列表、详情、删除，但还缺前端页面真正需要的“统计”和“下载”能力。

### 4.1.1 获取文档总览统计

`GET /api/v1/knowledge/documents/stats`

用途：

- 文档管理页顶部统计卡片
- 后续 Dashboard 也可复用

建议响应：

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

说明：

- 前端首版至少需要 `document_count`、`fragment_count`、`qa_count`
- 后面的 `indexed_count`、`processing_count`、`failed_count` 是可选增强字段，便于后续展示导入状态

### 4.1.2 下载文档

`GET /api/v1/knowledge/documents/{document_id}/download`

用途：

- 文档管理页表格中的下载操作

建议行为二选一：

1. 接口直接返回二进制流
2. 接口返回 302 跳转到签名下载地址

前端更推荐第二种，因为实现更简单、浏览器兼容性更稳定。

### 4.1.3 扩展文档列表字段

现有规范里虽然定义了 `GET /api/v1/knowledge/documents`，但没有明确响应字段。为了满足前端页面，需要把列表字段定清楚。

建议查询参数：

- `page`
- `page_size`
- `file_type`
- `keyword`
- `status`
- `sort_by`
- `order`

建议 `sort_by` 值：

- `uploaded_at`
- `file_name`
- `fragment_count`
- `qa_count`

建议响应：

```json
{
  "items": [
    {
      "document_id": "doc_91f2",
      "file_name": "sdevice_ug.pdf",
      "file_type": "pdf",
      "file_size": 2457600,
      "uploaded_at": "2026-03-27T10:30:00Z",
      "uploaded_by": "alice",
      "knowledge_base": "default",
      "status": "indexed",
      "fragment_count": 124,
      "qa_count": 57
    }
  ],
  "total": 128,
  "page": 1,
  "page_size": 20
}
```

说明：

- `uploaded_by` 是前端表格必需字段，当前规范里未明确，需要补充
- `fragment_count` 和 `qa_count` 也是前端页面必需字段
- `status` 建议复用上传接口响应里的状态值，例如 `indexed`、`processing`、`failed`

### 4.1.4 扩展文档详情字段

`GET /api/v1/knowledge/documents/{document_id}`

建议响应：

```json
{
  "document_id": "doc_91f2",
  "file_name": "sdevice_ug.pdf",
  "file_type": "pdf",
  "file_size": 2457600,
  "file_md5": "abc123...",
  "object_key": "raw/abc123/sdevice_ug.pdf",
  "knowledge_base": "default",
  "status": "indexed",
  "uploaded_at": "2026-03-27T10:30:00Z",
  "uploaded_by": "alice",
  "fragment_count": 124,
  "qa_count": 57
}
```

这个接口不是文档管理页首版必需，但只要前端后面要做“文档详情弹窗”或“文档处理状态查看”，就最好一次定下来。

---

## 4.2 成员排行页需要新增的 API

当前规范没有成员排行接口，这部分建议新增到 `analytics` 命名空间。

### 4.2.1 获取成员排行

`GET /api/v1/analytics/member-rankings`

用途：

- 成员排行页主列表

建议查询参数：

- `sort_by`
- `order`
- `page`
- `page_size`

建议 `sort_by` 值：

- `default`
- `uploaded_docs`
- `reviewed_qa`

建议 `order` 值：

- `asc`
- `desc`

建议响应：

```json
{
  "items": [
    {
      "rank": 1,
      "user_id": "u_001",
      "username": "alice",
      "display_name": "Alice",
      "uploaded_document_count": 18,
      "reviewed_qa_count": 220,
      "last_active_at": "2026-03-27T09:15:00Z"
    }
  ],
  "total": 20,
  "page": 1,
  "page_size": 20
}
```

说明：

- `rank` 建议由后端直接返回，前端无需自行计算跨页排名
- `display_name` 可选，但建议保留，便于后面兼容真实人员姓名
- `last_active_at` 虽然不是当前硬需求，但对排行结果解释很有帮助

### 4.2.2 默认排序规则建议

如果 `sort_by=default`，建议后端明确以下规则中的一种：

1. 按组织预设顺序
2. 按用户名升序
3. 按最近活跃时间降序

这部分必须在接口文档里写死，否则前后端会理解不一致。

---

## 4.3 为现有审核前端补齐的 API

这一组接口不是“文档管理页”和“成员排行页”新增页面本身必需的，但如果要让当前前端项目最终统一到 `rest_api_spec.md`，这一组必须补。

原因很直接：

当前前端代码仍然依赖这些历史接口：

- `/qa/pending`
- `/qa/{id}`
- `/qa/stats`

同时认证能力也需要统一收口到 `/api/v1/auth/*`，否则后面会一直存在混用和歧义。
### 4.3.1 获取待审核 / 已审核 QA 列表

`GET /api/v1/qa-pairs`

说明：

当前规范里已经有这个接口，但查询能力不足以支撑审核台，需要补查询参数。

建议新增查询参数：

- `status`
- `reviewer`
- `keyword`
- `topic`
- `scene`
- `min_confidence`
- `page`
- `page_size`
- `sort_by`
- `order`

建议 `status` 值：

- `pending`
- `reviewed`
- `deprecated`

建议响应：

```json
{
  "items": [
    {
      "id": "qa_10021",
      "question": "在使用 GNN 模型做器件仿真时，如何加入物理约束？",
      "answer": "...",
      "topics": ["TCAD", "GNN"],
      "scenes": ["engineer"],
      "confidence": 0.91,
      "status": "pending",
      "reviewer": "reviewer-01",
      "reviewed_at": null,
      "review_notes": null,
      "version": 3
    }
  ],
  "total": 180,
  "page": 1,
  "page_size": 20
}
```

### 4.3.2 获取单条 QA 详情

`GET /api/v1/qa-pairs/{qa_pair_id}`

当前规范已存在，但建议明确详情需要包含前端审核页必须使用的上下文字段。

建议响应：

```json
{
  "id": "qa_10021",
  "question": "在使用 GNN 模型做器件仿真时，如何加入物理约束？",
  "answer": "...",
  "topics": ["TCAD", "GNN"],
  "scenes": ["engineer"],
  "confidence": 0.91,
  "status": "pending",
  "reviewer": "reviewer-01",
  "reviewed_at": null,
  "review_notes": null,
  "version": 3,
  "fragments": [
    {
      "id": "frag_01",
      "fragment_type": "text",
      "content": "...",
      "page_start": 12,
      "page_end": 13,
      "source": "sdevice_ug.pdf"
    }
  ]
}
```

### 4.3.3 提交审核结果

`PUT /api/v1/qa-pairs/{qa_pair_id}`

用途：

- 审核通过
- 标记废弃
- 修改问题、答案、标签、备注
- 更新负责人

建议请求体：

```json
{
  "question": "修订后的问题",
  "answer": "修订后的答案",
  "topics": ["TCAD"],
  "scenes": ["engineer"],
  "confidence": 0.96,
  "review_notes": "审核通过",
  "status": "reviewed",
  "version": 3,
  "reviewer": "reviewer-01"
}
```

建议响应直接返回完整详情对象，和 `GET /api/v1/qa-pairs/{qa_pair_id}` 一致。

说明：

- 这里推荐继续用 `PUT`，因为当前前端已经是这个调用模式，迁移成本最低
- `version` 建议保留，用于乐观锁和并发冲突检测

### 4.3.4 QA 统计

`GET /api/v1/qa-pairs/stats`

用途：

- 审核统计页
- 审核首页卡片

建议响应：

```json
{
  "pending": 120,
  "reviewed": 820,
  "deprecated": 35
}
```

### 4.3.5 批量分配审核任务

`POST /api/v1/qa-pairs/assignments`

建议请求体：

```json
{
  "qa_ids": ["qa_10021", "qa_10022"],
  "assignee": "reviewer-02"
}
```

建议响应：

```json
{
  "updated_count": 2
}
```

### 4.3.6 人工新增 QA

`POST /api/v1/qa-pairs`

用途：

- 审核台中“人工添加问答对”

建议请求体：

```json
{
  "question": "问题",
  "answer": "答案",
  "topics": ["TCAD"],
  "scenes": ["engineer"],
  "confidence": 0.9,
  "review_notes": "人工录入",
  "reviewer": "reviewer-01",
  "fragments": [
    {
      "fragment_type": "text",
      "content": "原始内容",
      "page_start": 1,
      "page_end": 1,
      "source": "manual"
    }
  ]
}
```

建议响应：

返回完整的 `QAPair` 详情对象。

---

## 4.4 登录鉴权接口

当前 `rest_api_spec.md` 还没有 auth 相关内容，但前端已经有登录和会话逻辑，因此建议把它们一并标准化。

### 4.4.1 登录

`POST /api/v1/auth/login`

建议请求体：

```json
{
  "username": "alice",
  "password": "******"
}
```

建议响应：

```json
{
  "token": "jwt-or-session-token",
  "token_type": "bearer",
  "expires_in": 28799,
  "user": {
    "id": 1,
    "username": "alice",
    "name": "Alice",
    "role": "reviewer",
    "status": "active",
    "created_at": "2026-03-01T00:00:00Z",
    "last_active_at": "2026-03-01T08:30:00Z"
  }
}
```

### 4.4.2 当前用户信息

`GET /api/v1/auth/me`

建议响应：

```json
{
  "id": 1,
  "username": "alice",
  "role": "reviewer",
  "name": "Alice",
  "status": "active",
  "created_at": "2026-03-01T00:00:00Z"
}
```

### 4.4.3 登出

`POST /api/v1/auth/logout`

如果系统使用纯 JWT 无服务端 session，这个接口可以保留为空操作；但为了前端统一调用，建议仍保留。

---

## 5. 推荐的最终接口清单

## 5.1 文档管理页

- `GET /api/v1/knowledge/documents/stats`
- `GET /api/v1/knowledge/documents`
- `GET /api/v1/knowledge/documents/{document_id}`
- `GET /api/v1/knowledge/documents/{document_id}/download`
- `POST /api/v1/knowledge/documents`
- `DELETE /api/v1/knowledge/documents/{document_id}`

## 5.2 成员排行页

- `GET /api/v1/analytics/member-rankings`

## 5.3 审核工作台

- `GET /api/v1/qa-pairs`
- `GET /api/v1/qa-pairs/{qa_pair_id}`
- `PUT /api/v1/qa-pairs/{qa_pair_id}`
- `GET /api/v1/qa-pairs/stats`
- `POST /api/v1/qa-pairs/assignments`
- `POST /api/v1/qa-pairs`

## 5.4 鉴权

- `POST /api/v1/auth/login`
- `GET /api/v1/auth/me`
- `POST /api/v1/auth/logout`

---

## 6. 对前端配置的建议映射

如果后端按这份设计收口，前端 [`config.ts`](D:\javascrip\review-frontend\src\config.ts) 建议最终映射为：

```ts
ENDPOINTS: {
  AUTH_LOGIN: '/api/v1/auth/login',
  AUTH_ME: '/api/v1/auth/me',
  AUTH_LOGOUT: '/api/v1/auth/logout',

  DOCUMENT_STATS: '/api/v1/knowledge/documents/stats',
  DOCUMENT_LIST: '/api/v1/knowledge/documents',
  DOCUMENT_UPLOAD: '/api/v1/knowledge/documents',
  DOCUMENT_RESOURCE: (id: string) => `/api/v1/knowledge/documents/${id}`,
  DOCUMENT_DOWNLOAD: (id: string) => `/api/v1/knowledge/documents/${id}/download`,

  MEMBER_RANKINGS: '/api/v1/analytics/member-rankings',

  QA_PAIRS: '/api/v1/qa-pairs',
  QA_RESOURCE: (id: string) => `/api/v1/qa-pairs/${id}`,
  QA_STATS: '/api/v1/qa-pairs/stats',
  QA_ASSIGNMENTS: '/api/v1/qa-pairs/assignments'
}
```

这比当前项目里的：

- `/qa/pending`
- `/qa/{id}`
- `/qa/stats`

更容易和统一 REST 规范对齐。

---

## 7. 还需要后端确认的点

为了让前端直接开始接入，后端还需要最终确认这些点：

1. 文档下载到底返回文件流、302 跳转，还是签名 URL
2. `member-rankings` 的默认排序规则
3. 文档状态枚举是否固定为 `indexed / processing / failed`
4. `uploaded_by` 是否从 token 推导，还是由前端显式传入
5. `GET /api/v1/qa-pairs` 是否允许直接承担“待审核列表”和“历史列表”两种场景
6. `PUT /api/v1/qa-pairs/{id}` 是否接受全量更新，还是只允许审核字段更新

---

## 8. 结论

基于当前 `rest_api_spec.md`，前端后续构建并不需要推翻已有规范，重点是补三类缺口：

1. 文档页缺少统计和下载接口
2. 成员排行页缺少聚合排行接口
3. 现有审核前端缺少和规范一致的 QA 工作台接口

如果按这份补充设计推进，前端后面可以统一收口到 `/api/v1` 下的一套规范，不会再长期并存“审核接口一套、知识库接口一套”的问题。

