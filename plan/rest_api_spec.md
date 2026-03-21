# AI TCAD 知识库解耦 RESTful API 设计（v1）

## 1. 设计目标
- 将知识库相关数据解耦到三类存储：
  - PostgreSQL：文档元数据、问答对、任务状态
  - MinIO：原始文件（PDF/TXT 等）
  - Weaviate：向量分片与检索
- 保持与现有调用方式一致：`rag_summarize(query)`
- 为未来上云提供无状态 API 层，支持容器化部署和横向扩展

## 2. 资源模型
- `KnowledgeDocument`：知识文档主记录（PostgreSQL）
- `DocumentObject`：原始文件对象（MinIO）
- `DocumentChunk`：向量分片（Weaviate）
- `QAPair`：问答对（PostgreSQL）
- `IngestionTask`：异步导入任务（PostgreSQL/队列）

## 3. 鉴权与通用约定
- Base URL：`/api/v1`
- 当前阶段：不做鉴权（内网/本地联调环境）
- 未来上云：再接入 `Authorization: Bearer <token>` 或网关鉴权
- Content-Type：`application/json`（文件上传接口除外）
- 时间格式：ISO-8601（UTC）
- 幂等键：`Idempotency-Key`（可选，推荐用于导入）

## 4. API 列表

### 4.1 知识库导入

#### `POST /api/v1/knowledge/ingestions`
从本地目录批量导入（对应当前 `VectorStoreService.load_document()` 行为）。

请求体：
```json
{
  "source_path": "testagent/data",
  "allow_file_types": ["pdf", "txt"],
  "splitter": {
    "chunk_size": 1000,
    "chunk_overlap": 200
  },
  "dry_run": false
}
```

响应：
```json
{
  "task_id": "ing_6f0f8f64",
  "status": "queued"
}
```

#### `GET /api/v1/knowledge/ingestions/{task_id}`
查询导入任务进度。

响应：
```json
{
  "task_id": "ing_6f0f8f64",
  "status": "running",
  "stats": {
    "total": 42,
    "processed": 30,
    "skipped": 5,
    "failed": 1
  }
}
```

### 4.2 文档管理

#### `POST /api/v1/knowledge/documents`
上传单个文档（multipart/form-data）。
- 文件写入 MinIO
- 元数据写入 PostgreSQL
- 分片向量写入 Weaviate

表单字段：
- `file`: 二进制文件
- `knowledge_base`: 可选，默认 `default`

响应：
```json
{
  "document_id": "doc_91f2",
  "file_name": "sdevice_ug.pdf",
  "file_md5": "abc123...",
  "object_key": "raw/abc123/sdevice_ug.pdf",
  "status": "indexed"
}
```

#### `GET /api/v1/knowledge/documents`
分页查询文档元数据。

查询参数：
- `page`（默认 1）
- `page_size`（默认 20）
- `file_type`（可选）
- `keyword`（可选）

#### `GET /api/v1/knowledge/documents/{document_id}`
查询单文档详情。

#### `DELETE /api/v1/knowledge/documents/{document_id}`
删除文档（同步删除 PG + MinIO + Weaviate）。

### 4.3 检索与问答（对应现有 `rag_summarize`）

#### `POST /api/v1/knowledge/retrievals`
仅做向量召回，不走 LLM 总结。

请求体：
```json
{
  "query": "在使用GNN模型做器件仿真时，如何加入物理约束？",
  "top_k": 5,
  "filters": {
    "file_type": ["pdf"]
  }
}
```

响应：
```json
{
  "items": [
    {
      "document_id": "doc_91f2",
      "chunk_index": 12,
      "score": 0.83,
      "content": "...",
      "metadata": {
        "file_name": "sdevice_ug.pdf",
        "object_key": "raw/..."
      }
    }
  ]
}
```

#### `POST /api/v1/knowledge/rag-summaries`
与当前 `rag_summarize(query)` 对齐：检索 + 汇总生成 + 问答入库。

请求体：
```json
{
  "query": "在使用GNN模型做器件仿真时，如何加入物理约束？",
  "thread_id": "userA_9a5d",
  "top_k": 5
}
```

响应：
```json
{
  "answer": "...",
  "context": [
    {
      "document_id": "doc_91f2",
      "content": "...",
      "metadata": {
        "file_name": "sdevice_ug.pdf",
        "chunk_index": 12
      }
    }
  ],
  "qa_pair_id": "qa_10021"
}
```

### 4.4 问答对管理

#### `GET /api/v1/qa-pairs`
查询问答对（用于复盘/审计）。

查询参数：
- `thread_id`（可选）
- `start_time`（可选）
- `end_time`（可选）
- `page`、`page_size`

#### `GET /api/v1/qa-pairs/{qa_pair_id}`
查询单条问答详情。

### 4.5 健康检查

#### `GET /api/v1/health`
返回应用健康状态。

#### `GET /api/v1/health/dependencies`
返回依赖健康状态（PostgreSQL/MinIO/Weaviate）。

## 5. 错误码建议
- `400` 参数错误
- `401` 未认证
- `403` 无权限
- `404` 资源不存在
- `409` 重复导入（MD5 冲突）
- `422` 文件格式不支持
- `500` 内部错误
- `503` 依赖不可用（PG/MinIO/Weaviate）

## 6. 与现有代码映射
- 现有入口：`rag_summarize(query)`
- 新接口对应：`POST /api/v1/knowledge/rag-summaries`
- 现有检索：`retriever.invoke(query)`
- 新接口对应：`POST /api/v1/knowledge/retrievals`
- 现有入库：`load_document()`
- 新接口对应：`POST /api/v1/knowledge/ingestions`

## 7. SQL“查询地址变量化”规范
- 禁止在代码中硬编码数据库地址。
- 统一通过环境变量注入：`RAG_POSTGRES_DSN`。
- SQL 中的筛选条件（例如 `thread_id`、时间范围、分页）必须参数化绑定，避免拼接字符串。

示例（规范说明，不是实现代码）：
- `WHERE thread_id = :thread_id`
- `LIMIT :limit OFFSET :offset`

## 8. 迁移上云建议
- API 服务无状态化，状态落在 PG/MinIO/Weaviate。
- 通过环境变量切换云上托管地址（RDS、S3、托管向量库）。
- 文档导入与向量化建议异步化（任务队列 + Worker）。
