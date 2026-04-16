# 文档管理 Page UI 优化方案（细化版，含文档详情接口接入）

更新时间：2026-04-15  
关联规范：
- `plan/v1_document_details_api_spec.md`
- `plan/v1_document_details.openapi.yaml`

## 1. 目标与边界
- 目标：在不改业务逻辑前提下，提升文档管理页的可用性，并新增“选中文档的 MinIO 元数据可视化”。
- 边界：不改后端接口契约、不改现有业务判定（筛选、批处理、QA、下载），仅补齐前端接入与展示层。
- 接口要求：接入已封装但未在 UI 使用的 `GET /api/v1/knowledge/documents/{document_id}`。

## 2. 现状差距（对照代码）
- API 层已有 `documentApi.getDetail(documentId)`，但页面和 store 未消费。
- `getDetail` 当前返回 `KnowledgeDocument`，会丢失 `minio_uploaded_at`、`csv_md5`、`latest_task_stage` 等详情字段。
- 文档管理页目前没有“选中文档详情区”，用户无法直观看到对象存储侧元数据。

## 3. UI 优化总览（保持原业务流）
### 3.1 页面结构
- 顶部：标题/总量 + 快捷操作 + 紧凑统计卡。
- 中部：可折叠上传与批处理区 + 筛选区。
- 内容区：选择操作条（sticky）+ QA 区 + 文档表格。
- 新增：**选中文档详情面板（MinIO 元数据）**，位置在选择操作条下方、表格上方。

### 3.2 文档详情面板目标
- 仅在“恰好选中 1 个文档”时展示详情。
- 展示四类信息：
1. 基础信息：`document_id`, `file_name`, `knowledge_base`, `uploaded_by`, `uploaded_at`
2. MinIO 元数据：`object_key`, `minio_uploaded_at`, `file_md5`, `csv_md5`
3. 本地/来源路径：`source_path`, `local_file_path`, `local_csv_path`, `upload_session_id`
4. 任务追踪：`latest_task_id`, `latest_task_status`, `latest_task_stage`, `latest_task_updated_at`, `sync_attempts`, `sync_last_error`
- 保持 loading / empty / error / success 四态。

## 4. 接口接入策略（GET /knowledge/documents/{id}）
- 优先直接使用现有 `documentApi.getDetail(documentId)`。
- 仅新增前端解析与展示，不新增后端请求参数。
- 角色权限沿用规范（`admin/reviewer/observer` 可访问）。

## 5. 文件级改动清单（落实到具体文件）
### A. 类型层
文件：`src/types/domain.ts`
- 新增 `DocumentDetail` 类型（建议 `extends KnowledgeDocument`），补充以下字段：
`source_path`, `authors`, `year`, `journal`, `conference`, `publisher`, `volume`, `issue`, `pages`, `doi`, `abstract`, `topics`, `scenes`, `language`, `indexed_at`, `last_error_code`, `last_error_message`, `uploaded_by_user_id`, `latest_task_id`, `latest_task_stage`, `latest_task_error_message`, `latest_task_updated_at`, `sync_attempts`, `sync_last_error`, `minio_uploaded_at`, `qa_status`, `csv_md5`。
- 原 `KnowledgeDocument` 保持不变，避免影响列表接口及既有业务调用。

### B. API 层
文件：`src/services/api/document.api.ts`
- 新增 `parseDocumentDetail(raw, path)`，完整解析 `DocumentDetailResponse`。
- 将 `getDetail(documentId)` 返回值从 `Promise<KnowledgeDocument>` 调整为 `Promise<DocumentDetail>`。
- 保持 URL 使用 `DOCUMENT_RESOURCE(documentId)`（即 `/knowledge/documents/{id}`），满足你的接入要求。

文件：`src/config.ts`
- 可选：新增 `DOCUMENT_DETAIL` endpoint 常量（可与 `DOCUMENT_RESOURCE` 等价映射），仅为语义清晰；非必须。

### C. Store 层
文件：`src/stores/document.store.ts`
- `state` 新增：
1. `selectedDocumentDetail: DocumentDetail | null`
2. `detailLoading: boolean`
3. `detailError: string`
4. `detailDocumentId: string`
5. `detailCache: Record<string, DocumentDetail>`（可选，用于减少重复请求）
- 新增 action：
1. `fetchDocumentDetail(documentId: string, force = false)`
2. `clearDocumentDetail()`
- 在 `setSelectedDocumentIds` 之后不改业务选择逻辑，只由页面决定何时触发详情拉取。

### D. 页面层
文件：`src/pages/DocumentManagePage.vue`
- 基于 `selectedDocumentIds` 增加监听：
1. 选中 1 条 -> 调 `documentStore.fetchDocumentDetail(id)`
2. 选中 0 条 -> `clearDocumentDetail()`
3. 选中 >1 条 -> 不请求详情，显示提示“仅支持单文档详情”
- 在 QA 区下方插入详情面板组件：
`<DocumentDetailPanel :detail="..." :loading="..." :error="..." />`
- 不改变现有筛选、分页、QA、批处理调用链。

### E. 组件层
新增文件：`src/components/business/DocumentDetailPanel.vue`
- 负责展示选中文档详情（纯展示组件）：
1. 显式定义 `props`：`detail`, `loading`, `error`, `selected-count`
2. 提供 loading skeleton / error message / empty hint / details 四态模板
3. 使用 Tailwind 保持紧凑信息密度（两列 key-value + 可复制长字段）
- MinIO 区块重点突出 `object_key`、`minio_uploaded_at`、`file_md5`、`csv_md5`。

### F. Mock 对齐
文件：`src/services/mock/document.mock.ts`
- `getDetail` 返回类型调整为 `DocumentDetail`。
- 为 mock 详情补齐最小可展示字段：
`object_key`, `file_md5`, `csv_md5`, `minio_uploaded_at`, `latest_task_*`, `sync_attempts`。
- 保证 `VITE_USE_MOCK=true` 时 UI 可完整演示详情面板。

## 6. 页面交互流程（落地行为）
1. 用户在表格勾选一条文档。
2. 页面监听到单选，触发 `fetchDocumentDetail(document_id)`。
3. 详情面板显示 loading -> 成功后展示 MinIO 元数据。
4. 若接口失败，面板展示 error，不影响列表和其他业务操作。
5. 用户改为多选，详情面板切换为提示态，不发详情请求。

## 7. 验收标准（新增接口场景）
- 选中单文档时，能看到 `object_key`、`minio_uploaded_at`、`file_md5`、`csv_md5`。
- 不选或多选时，不显示错误详情，页面操作连续性正常。
- 列表筛选/分页/下载/QA/批处理行为与改造前一致。
- `npm run build` 通过；mock 和真实 API 模式都可运行。

## 8. 风险与规避
- 风险：详情接口字段可能部分为空，导致 UI 空值噪音。
- 规避：统一空值展示为 `-`，并对长字符串使用截断 + title。
- 风险：频繁切换选择触发重复请求。
- 规避：加入 `detailCache` 和“相同 document_id 不重复请求”策略。

## 9. 建议实施顺序（可直接开工）
1. 类型与 API 解析（`domain.ts` + `document.api.ts`）。
2. store 状态与 action（`document.store.ts`）。
3. 新增详情面板组件（`DocumentDetailPanel.vue`）。
4. 页面接线与状态展示（`DocumentManagePage.vue`）。
5. mock 字段补齐（`document.mock.ts`）。
6. 构建与手测回归。
