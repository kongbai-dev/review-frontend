# 前端文件上传批处理 UI 改进方案（按后端已发布接口细化）

更新时间：2026-04-12  
接口依据：
- [v1_documents_batch_sync_api_spec.md](D:\javascrip\review-frontend\plan\v1_documents_batch_sync_api_spec.md)
- [v1_documents_batch_sync.openapi.yaml](D:\javascrip\review-frontend\plan\v1_documents_batch_sync.openapi.yaml)

---

## 1. 本次细化结论（先看变化）

基于后端已落地接口，原方案需要按以下事实收口：

1. 上传接口当前是“单对提交”（`file + metadata_csv`），不是一次多对批量上传。
2. 子目录字段名是 `subdir`（不是 `storage_subdir`）。
3. 去重没有独立“预检查接口”，重复由上传接口返回 `409`。
4. 批处理能力由独立接口触发：`POST /batch-sync/start`，并通过任务接口查询状态。
5. 手动 QA 生成已明确：`POST /qa-generation/start`，单文档触发，`target_count` 范围 `1~100`。

因此前端 UI 方案改为：

- 支持“多对文件队列”，但按“逐对调用上传接口”执行。
- 去重结果来自上传返回，不做上传前的服务端去重检查按钮。
- 新增“批处理控制台”区块，用于配置 N/T 等参数并启动批处理任务。
- 文档管理页“生成 QA”严格按单文档触发，支持 `append/replace`。

---

## 2. 信息架构（DocumentManagePage）

页面建议分 4 块：

1. 文档上传区（文档+CSV 绑定，支持上传模式）
2. 批处理控制台（启动 batch sync + 查看任务进度）
3. 文档列表区（选择文档 + 下载 + 手动生成 QA 入口）
4. QA 任务状态区（最近一次手动生成 QA 的任务状态）

---

## 3. 上传 UI 细化（严格映射接口）

接口：`POST /api/v1/knowledge/documents`  
Content-Type：`multipart/form-data`

## 3.1 表单字段映射

| UI 字段 | 接口字段 | 必填策略 |
| --- | --- | --- |
| 文档文件 | `file` | 必填 |
| 元数据 CSV | `metadata_csv` | 必填 |
| 上传模式 | `upload_mode` | 必填（UI 默认 `sync`） |
| 知识库 | `knowledge_base` | 选填（UI 默认 `default`） |
| 文档类型 | `document_type` | 选填 |
| 标题覆盖 | `title` | 选填 |
| 存储子目录 | `subdir` | 后端选填，但前端按产品要求设为必填 |

说明：
- `type` 为兼容字段，前端统一只传 `document_type`，避免双字段冲突。
- `document_type` 建议可选值：`paper|conference|book|manual|code|data`。

## 3.2 上传面板交互

### A. 单对编辑器
- 一次编辑 1 对：文档文件 + CSV 文件。
- 选择后即时校验同名主文件名（如 `a.pdf` + `a.csv`）。
- 不同名时禁止“加入队列”。

### B. 队列区（支持多对）
- 队列项字段：`docName/csvName/upload_mode/subdir/status/error`。
- 点击“开始上传”后按队列顺序逐条请求上传接口。
- 每条独立结果：`成功 / 失败(含错误码)`。

> 这样可以满足“批量上传体验”，同时不违背后端“单对上传”接口约束。

## 3.3 前端本地校验（提交前）

1. `file`、`metadata_csv` 必选。
2. 主文件名必须一致。
3. CSV 扩展名必须为 `.csv`。
4. `subdir` 必填（前端要求），且不允许：
   - 以 `/` 开头
   - 包含 `..`
   - 包含反斜杠 `\`
5. `document_type=paper` 时要求 CSV 中有 `journal`（前端可提示“建议先校验 CSV 模板”，最终以后端校验为准）。
6. `document_type=conference` 时要求 CSV 中有 `conference`（同上）。

说明：
- CSV UTF-8、首行字段 `title/year/type`、`scenes/language` 枚举校验仍以后端 `422` 为准，前端只做提示性校验。

## 3.4 上传结果反馈

成功（201）展示关键字段：

1. `document_id`
2. `sync_mode`
3. `sync_status`
4. `ingestion_task_id`

UI 文案建议：
- `sync_mode=sync && sync_status=synced`：上传并同步完成。
- `sync_mode=batch && sync_status=sync_pending`：已入队，等待批处理同步。

失败处理：
- `409`：标记为“重复文档（MD5）”。
- `422`：标记为“CSV/参数不合法”，展示 `detail`。

---

## 4. 批处理控制台 UI 细化

接口：
- 启动：`POST /api/v1/knowledge/documents/batch-sync/start`
- 查询任务：`GET /api/v1/knowledge/documents/batch-sync/tasks/{task_id}`

## 4.1 控制台表单

字段与默认值（按 OpenAPI）：

1. `min_batch_size`：默认 `10`，范围 `1~1000`
2. `max_wait_seconds`：默认 `300`，范围 `0~86400`
3. `max_docs`：默认 `200`，范围 `1~2000`
4. `max_workers`：默认 `8`，范围 `1~64`
5. `include_failed`：默认 `true`

按钮：
- `启动批处理同步`

## 4.2 任务状态展示

启动后展示任务卡片：

- `task_id`
- `status`：`queued|running|skipped|completed|failed`
- `queued_count / processed_count / success_count / failed_count`
- `message`
- `started_at / finished_at`

失败文档展示：
- `failed_documents` 列表（可展开）。

## 4.3 轮询策略

1. 启动任务后每 3 秒轮询一次任务状态。
2. 状态到 `skipped|completed|failed` 停止轮询。
3. `completed` 后刷新文档列表和统计。
4. `skipped` 文案明确说明原因：未达到 N 且未超过 T。

---

## 5. 文档列表与手动生成 QA UI 细化

接口：
- 触发：`POST /api/v1/knowledge/documents/qa-generation/start`
- 查询：`GET /api/v1/knowledge/documents/qa-generation/tasks/{task_id}`

## 5.1 列表选择规则

1. 支持多选，但“生成 QA”按钮仅在“选中 1 条”时可用。
2. 多选时按钮禁用并提示“当前只支持单文档生成”。

## 5.2 生成 QA 抽屉字段

1. `document_id`（只读）
2. `target_count`（默认 `10`，范围 `1~100`）
3. `mode`：
   - `append`（默认）
   - `replace`（危险操作）

当 `mode=replace` 时：
- 二次确认弹窗提示“将先删除该文档已有 QA 再重建”。

## 5.3 提交后反馈

成功（200）展示：

1. `task_id`
2. `status`
3. `generated_qas`
4. `message`

当前后端实现说明：`status` 可能直接返回 `completed`。  
即便如此，前端仍保留“查看任务状态”入口（兼容后续异步化）。

任务状态区展示字段（来自任务查询）：

1. `status`
2. `stage`
3. `total_fragments`
4. `total_generated_qas`
5. `error_message`
6. `started_at / finished_at / updated_at`

---

## 6. 权限与按钮显隐

按后端角色约束控制 UI：

1. `admin/reviewer`
   - 可见：上传、启动批处理、手动生成 QA。
2. `observer`
   - 仅可见：任务查询结果、列表浏览。
   - 上传/触发按钮隐藏或置灰并提示“无权限”。

---

## 7. 错误码到交互映射

| 错误码 | 场景 | UI 行为 |
| --- | --- | --- |
| `401` | token 失效/未登录 | 走现有拦截器登出并跳登录 |
| `403` | 权限不足 | 当前操作按钮报错 toast，不清空页面数据 |
| `404` | 文档或任务不存在 | 在任务卡片显示“任务不存在或已清理” |
| `409` | 重复上传 | 队列项标记“重复”，支持移除重试其他项 |
| `422` | 参数/CSV 业务校验失败 | 行级显示错误详情（保留原输入） |
| `500` | 内部错误 | toast + 行级失败状态 |
| `502` | 依赖失败（MinIO 等） | 对 QA 生成任务显示“外部依赖异常，可重试” |

---

## 8. 下载与去重说明（按现有契约）

1. 本次新增接口未提供“下载可用性”字段；下载逻辑沿用现有文档下载接口策略。
2. 本次新增接口未提供“去重预检查接口”；重复判断以后端上传 `409` 为准。
3. UI 上应把“去重检查”改为“上传后去重结果”，避免误导为上传前可预判。

---

## 9. 代码落地清单（当前项目）

## 9.1 `src/components/business/DocumentUploadPanel.vue`

1. 从单文件提交改为“单对编辑 + 队列上传”。
2. 新增字段：`upload_mode`、`knowledge_base`、`document_type`、`title`、`subdir`。
3. 新增队列状态标签：`ready/uploading/success/error/conflict`。

## 9.2 `src/services/api/document.api.ts`

新增方法：

1. `uploadPair(form)` -> `POST /knowledge/documents`
2. `startBatchSync(payload)` -> `POST /knowledge/documents/batch-sync/start`
3. `getBatchSyncTask(taskId)` -> `GET /knowledge/documents/batch-sync/tasks/{task_id}`
4. `startQaGeneration(payload)` -> `POST /knowledge/documents/qa-generation/start`
5. `getQaGenerationTask(taskId)` -> `GET /knowledge/documents/qa-generation/tasks/{task_id}`

## 9.3 `src/stores/document.store.ts`

新增状态：

1. 上传队列：`uploadQueue`
2. 批处理任务：`batchSyncTask`
3. QA 任务：`qaGenerationTask`

新增动作：

1. `uploadQueueItems()`
2. `triggerBatchSync()`
3. `pollBatchSyncTask(taskId)`
4. `triggerQaGeneration(documentId, targetCount, mode)`
5. `pollQaGenerationTask(taskId)`

## 9.4 `src/pages/DocumentManagePage.vue` / `DocumentTable.vue`

1. 增加批处理控制台区域。
2. 列表增加“选择 + 生成 QA”工具条。
3. 保留下载按钮，但错误提示按现有下载接口返回处理。

---

## 10. 验收标准（接口对齐版）

1. 上传面板提交字段与接口完全一致：`file`、`metadata_csv`、`upload_mode`、`subdir` 等。
2. 同名校验不通过时，前端不能入队/提交。
3. `batch` 模式上传后，能通过批处理控制台触发同步并看到任务状态流转。
4. 文档管理页可单文档触发 QA 生成，且 `target_count` 限制为 `1~100`。
5. `append/replace` 交互可用，`replace` 有二次确认。
6. `409/422/502` 等关键错误能被用户明确识别，不出现“静默失败”。

