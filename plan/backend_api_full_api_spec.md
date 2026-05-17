# Backend API 全量接口总览（自动生成）

更新时间：2026-05-16 20:40:39

说明：
- 本文由 `testagent.backend_api.main:app` 的 `openapi()` 自动导出整理。
- 机器可用总规范见：`testagent/backend_api/openapi/backend_api_full.openapi.yaml`
- 若代码路由变更，请重新生成该文档与 YAML。

## 概览

- 路径数量：74
- 接口数量（method + path）：88
- 标签数量：15

## 标签分组

- `health`: 6 个接口
- `review-logs`: 2 个接口
- `v1-analytics`: 1 个接口
- `v1-auth`: 4 个接口
- `v1-chat`: 13 个接口
- `v1-code-files`: 5 个接口
- `v1-code-qa-pairs`: 5 个接口
- `v1-datasets`: 12 个接口
- `v1-documents`: 21 个接口
- `v1-permissions`: 3 个接口
- `v1-physics-engine`: 1 个接口
- `v1-physics-full-report`: 1 个接口
- `v1-physics-rules`: 6 个接口
- `v1-qa-pairs`: 7 个接口
- `v1-search`: 1 个接口

## health

### `GET /api/v1/health`

- Summary: Health
- OperationId: `health_api_v1_health_get`
- 鉴权要求: 否
- Responses:
  - `200` Successful Response | application/json: {"additionalProperties": true, "type": "object", "title": "Response Health Api V1 Health Get"}
### `GET /api/v1/health/dependencies`

- Summary: Dependency Health
- OperationId: `dependency_health_api_v1_health_dependencies_get`
- 鉴权要求: 否
- Responses:
  - `200` Successful Response | application/json: {"additionalProperties": true, "type": "object", "title": "Response Dependency Health Api V1 Health Dependencies Get"}
### `GET /api/v1/health/readiness`

- Summary: Readiness
- OperationId: `readiness_api_v1_health_readiness_get`
- 鉴权要求: 否
- Responses:
  - `200` Successful Response | application/json: {"additionalProperties": true, "type": "object", "title": "Response Readiness Api V1 Health Readiness Get"}
### `GET /health`

- Summary: Health
- OperationId: `health_health_get`
- 鉴权要求: 否
- Responses:
  - `200` Successful Response | application/json: {"additionalProperties": true, "type": "object", "title": "Response Health Health Get"}
### `GET /health/dependencies`

- Summary: Dependency Health
- OperationId: `dependency_health_health_dependencies_get`
- 鉴权要求: 否
- Responses:
  - `200` Successful Response | application/json: {"additionalProperties": true, "type": "object", "title": "Response Dependency Health Health Dependencies Get"}
### `GET /health/readiness`

- Summary: Readiness
- OperationId: `readiness_health_readiness_get`
- 鉴权要求: 否
- Responses:
  - `200` Successful Response | application/json: {"additionalProperties": true, "type": "object", "title": "Response Readiness Health Readiness Get"}

## review-logs

### `GET /review-logs`

- Summary: List Review Logs
- OperationId: `list_review_logs_review_logs_get`
- 鉴权要求: 是
- 参数:
  - `qa_pair_id` (query, required=false, type={"anyOf": [{"type": "integer", "minimum": 1}, {"type": "null"}], "title": "Qa Pair Id"})
  - `page` (query, required=false, type=integer)
  - `page_size` (query, required=false, type=integer)
- Responses:
  - `200` Successful Response | application/json: {"type": "array", "items": {"$ref": "#/components/schemas/ReviewLogItem"}, "title": "Response List Review Logs Review Logs Get"}
  - `422` Validation Error | application/json: HTTPValidationError
### `POST /review-logs`

- Summary: Create Review Log
- OperationId: `create_review_log_review_logs_post`
- 鉴权要求: 是
- RequestBody: required=true
  - `application/json`: `ReviewLogCreateRequest`
- Responses:
  - `200` Successful Response | application/json: ReviewLogCreateResponse
  - `422` Validation Error | application/json: HTTPValidationError

## v1-analytics

### `GET /api/v1/analytics/member-rankings`

- Summary: Member Rankings
- OperationId: `member_rankings_api_v1_analytics_member_rankings_get`
- 鉴权要求: 是
- 参数:
  - `sort_by` (query, required=false, type=string)
  - `order` (query, required=false, type=string)
  - `page` (query, required=false, type=integer)
  - `page_size` (query, required=false, type=integer)
- Responses:
  - `200` Successful Response | application/json: MemberRankingResponse
  - `422` Validation Error | application/json: HTTPValidationError

## v1-auth

### `POST /api/v1/auth/login`

- Summary: Login
- OperationId: `login_api_v1_auth_login_post`
- 鉴权要求: 否
- RequestBody: required=true
  - `application/json`: `V1LoginRequest`
- Responses:
  - `200` Successful Response | application/json: V1LoginResponse
  - `422` Validation Error | application/json: HTTPValidationError
### `POST /api/v1/auth/logout`

- Summary: Logout
- OperationId: `logout_api_v1_auth_logout_post`
- 鉴权要求: 是
- Responses:
  - `200` Successful Response | application/json: {"additionalProperties": {"type": "string"}, "type": "object", "title": "Response Logout Api V1 Auth Logout Post"}
### `GET /api/v1/auth/me`

- Summary: Me
- OperationId: `me_api_v1_auth_me_get`
- 鉴权要求: 是
- Responses:
  - `200` Successful Response | application/json: V1UserInfo
### `GET /api/v1/auth/me/permissions`

- Summary: Me Permissions
- OperationId: `me_permissions_api_v1_auth_me_permissions_get`
- 鉴权要求: 是
- Responses:
  - `200` Successful Response | application/json: V1PermissionInfo

## v1-chat

### `GET /api/v1/chat/conversations`

- Summary: List Conversations
- OperationId: `list_conversations_api_v1_chat_conversations_get`
- 鉴权要求: 否
- 参数:
  - `user_id` (query, required=true, type=string)
- Responses:
  - `200` Successful Response | application/json: {}
  - `422` Validation Error | application/json: HTTPValidationError
### `POST /api/v1/chat/conversations`

- Summary: Create Conversation
- OperationId: `create_conversation_api_v1_chat_conversations_post`
- 鉴权要求: 否
- 参数:
  - `user_id` (query, required=true, type=string)
- RequestBody: required=true
  - `application/json`: `CreateConversationRequest`
- Responses:
  - `200` Successful Response | application/json: {}
  - `422` Validation Error | application/json: HTTPValidationError
### `GET /api/v1/chat/conversations/{conversation_id}`

- Summary: Get Conversation
- OperationId: `get_conversation_api_v1_chat_conversations__conversation_id__get`
- 鉴权要求: 否
- 参数:
  - `conversation_id` (path, required=true, type=string)
  - `user_id` (query, required=true, type=string)
- Responses:
  - `200` Successful Response | application/json: {}
  - `422` Validation Error | application/json: HTTPValidationError
### `DELETE /api/v1/chat/conversations/{conversation_id}`

- Summary: Delete Conversation
- OperationId: `delete_conversation_api_v1_chat_conversations__conversation_id__delete`
- 鉴权要求: 否
- 参数:
  - `conversation_id` (path, required=true, type=string)
  - `user_id` (query, required=true, type=string)
- Responses:
  - `200` Successful Response | application/json: {}
  - `422` Validation Error | application/json: HTTPValidationError
### `POST /api/v1/chat/conversations/{conversation_id}/messages`

- Summary: Send Message
- OperationId: `send_message_api_v1_chat_conversations__conversation_id__messages_post`
- 鉴权要求: 否
- 参数:
  - `conversation_id` (path, required=true, type=string)
  - `user_id` (query, required=true, type=string)
- RequestBody: required=true
  - `application/json`: `SendMessageRequest`
- Responses:
  - `200` Successful Response | application/json: {}
  - `422` Validation Error | application/json: HTTPValidationError
### `DELETE /api/v1/chat/conversations/{conversation_id}/messages/{message_id}`

- Summary: Delete Message
- OperationId: `delete_message_api_v1_chat_conversations__conversation_id__messages__message_id__delete`
- 鉴权要求: 否
- 参数:
  - `conversation_id` (path, required=true, type=string)
  - `message_id` (path, required=true, type=string)
  - `user_id` (query, required=true, type=string)
- Responses:
  - `200` Successful Response | application/json: {}
  - `422` Validation Error | application/json: HTTPValidationError
### `POST /api/v1/chat/intent`

- Summary: Analyze Message Intent
- OperationId: `analyze_message_intent_api_v1_chat_intent_post`
- 鉴权要求: 否
- 参数:
  - `user_id` (query, required=true, type=string)
- RequestBody: required=true
  - `application/json`: `IntentAnalyzeRequest`
- Responses:
  - `200` Successful Response | application/json: IntentAnalyzeResponse
  - `422` Validation Error | application/json: HTTPValidationError
### `POST /api/v1/chat/login`

- Summary: Login
- OperationId: `login_api_v1_chat_login_post`
- 鉴权要求: 否
- RequestBody: required=true
  - `application/json`: `ChatLoginRequest`
- Responses:
  - `200` Successful Response | application/json: {}
  - `422` Validation Error | application/json: HTTPValidationError
### `GET /api/v1/chat/me`

- Summary: Get Me
- OperationId: `get_me_api_v1_chat_me_get`
- 鉴权要求: 否
- 参数:
  - `user_id` (query, required=true, type=string)
- Responses:
  - `200` Successful Response | application/json: {}
  - `422` Validation Error | application/json: HTTPValidationError
### `DELETE /api/v1/chat/me`

- Summary: Delete Me
- OperationId: `delete_me_api_v1_chat_me_delete`
- 鉴权要求: 否
- 参数:
  - `user_id` (query, required=true, type=string)
- Responses:
  - `200` Successful Response | application/json: {}
  - `422` Validation Error | application/json: HTTPValidationError
### `POST /api/v1/chat/register`

- Summary: Register
- OperationId: `register_api_v1_chat_register_post`
- 鉴权要求: 否
- RequestBody: required=true
  - `application/json`: `ChatRegisterRequest`
- Responses:
  - `200` Successful Response | application/json: {}
  - `422` Validation Error | application/json: HTTPValidationError
### `GET /api/v1/chat/traces/{thread_id}/history`

- Summary: Get Trace History
- OperationId: `get_trace_history_api_v1_chat_traces__thread_id__history_get`
- 鉴权要求: 否
- 参数:
  - `thread_id` (path, required=true, type=string)
  - `user_id` (query, required=true, type=string)
- Responses:
  - `200` Successful Response | application/json: {}
  - `422` Validation Error | application/json: HTTPValidationError
### `GET /api/v1/chat/traces/{thread_id}/{message_id}`

- Summary: Get Trace Snapshot
- OperationId: `get_trace_snapshot_api_v1_chat_traces__thread_id___message_id__get`
- 鉴权要求: 否
- 参数:
  - `thread_id` (path, required=true, type=string)
  - `message_id` (path, required=true, type=string)
  - `user_id` (query, required=true, type=string)
- Responses:
  - `200` Successful Response | application/json: {}
  - `422` Validation Error | application/json: HTTPValidationError

## v1-code-files

### `GET /api/v1/knowledge/code-files`

- Summary: List Code Files
- OperationId: `list_code_files_api_v1_knowledge_code_files_get`
- 鉴权要求: 是
- 参数:
  - `page` (query, required=false, type=integer)
  - `page_size` (query, required=false, type=integer)
  - `knowledge_base` (query, required=false, type={"anyOf": [{"type": "string"}, {"type": "null"}], "title": "Knowledge Base"})
  - `code_type` (query, required=false, type={"anyOf": [{"type": "string"}, {"type": "null"}], "title": "Code Type"})
  - `language` (query, required=false, type={"anyOf": [{"type": "string"}, {"type": "null"}], "title": "Language"})
  - `project_id` (query, required=false, type={"anyOf": [{"type": "string"}, {"type": "null"}], "title": "Project Id"})
  - `project_role` (query, required=false, type={"anyOf": [{"type": "string"}, {"type": "null"}], "title": "Project Role"})
  - `keyword` (query, required=false, type={"anyOf": [{"type": "string"}, {"type": "null"}], "title": "Keyword"})
- Responses:
  - `200` Successful Response | application/json: CodeFileListResponse
  - `422` Validation Error | application/json: HTTPValidationError
### `POST /api/v1/knowledge/code-files`

- Summary: Upload Code File
- OperationId: `upload_code_file_api_v1_knowledge_code_files_post`
- 鉴权要求: 是
- RequestBody: required=true
  - `multipart/form-data`: `Body_upload_code_file_api_v1_knowledge_code_files_post`
- Responses:
  - `200` Successful Response | application/json: CodeFileUploadResponse
  - `422` Validation Error | application/json: HTTPValidationError
### `GET /api/v1/knowledge/code-files/{file_id}`

- Summary: Get Code File Detail
- OperationId: `get_code_file_detail_api_v1_knowledge_code_files__file_id__get`
- 鉴权要求: 是
- 参数:
  - `file_id` (path, required=true, type=string)
- Responses:
  - `200` Successful Response | application/json: CodeFileDetailResponse
  - `422` Validation Error | application/json: HTTPValidationError
### `GET /api/v1/knowledge/code-files/{file_id}/dependencies`

- Summary: List Code Dependencies
- OperationId: `list_code_dependencies_api_v1_knowledge_code_files__file_id__dependencies_get`
- 鉴权要求: 是
- 参数:
  - `file_id` (path, required=true, type=string)
- Responses:
  - `200` Successful Response | application/json: CodeDependencyListResponse
  - `422` Validation Error | application/json: HTTPValidationError
### `GET /api/v1/knowledge/code-files/{file_id}/fragments`

- Summary: List Code Fragments
- OperationId: `list_code_fragments_api_v1_knowledge_code_files__file_id__fragments_get`
- 鉴权要求: 是
- 参数:
  - `file_id` (path, required=true, type=string)
  - `page` (query, required=false, type=integer)
  - `page_size` (query, required=false, type=integer)
- Responses:
  - `200` Successful Response | application/json: CodeFragmentListResponse
  - `422` Validation Error | application/json: HTTPValidationError

## v1-code-qa-pairs

### `GET /api/v1/knowledge/code-qa-pairs`

- Summary: List Code Qa Pairs
- OperationId: `list_code_qa_pairs_api_v1_knowledge_code_qa_pairs_get`
- 鉴权要求: 是
- 参数:
  - `status` (query, required=false, type={"anyOf": [{"type": "string"}, {"type": "null"}], "title": "Status"})
  - `knowledge_base` (query, required=false, type={"anyOf": [{"type": "string"}, {"type": "null"}], "title": "Knowledge Base"})
  - `project_id` (query, required=false, type={"anyOf": [{"type": "string"}, {"type": "null"}], "title": "Project Id"})
  - `project_role` (query, required=false, type={"anyOf": [{"type": "string"}, {"type": "null"}], "title": "Project Role"})
  - `code_type` (query, required=false, type={"anyOf": [{"type": "string"}, {"type": "null"}], "title": "Code Type"})
  - `language` (query, required=false, type={"anyOf": [{"type": "string"}, {"type": "null"}], "title": "Language"})
  - `keyword` (query, required=false, type={"anyOf": [{"type": "string"}, {"type": "null"}], "title": "Keyword"})
  - `page` (query, required=false, type=integer)
  - `page_size` (query, required=false, type=integer)
- Responses:
  - `200` Successful Response | application/json: CodeQAPairListResponse
  - `422` Validation Error | application/json: HTTPValidationError
### `POST /api/v1/knowledge/code-qa-pairs`

- Summary: Create Code Qa Pair
- OperationId: `create_code_qa_pair_api_v1_knowledge_code_qa_pairs_post`
- 鉴权要求: 是
- RequestBody: required=true
  - `application/json`: `CodeQAPairCreateRequest`
- Responses:
  - `201` Successful Response | application/json: CodeQAPairDetailResponse
  - `422` Validation Error | application/json: HTTPValidationError
### `GET /api/v1/knowledge/code-qa-pairs/stats`

- Summary: Get Code Qa Stats
- OperationId: `get_code_qa_stats_api_v1_knowledge_code_qa_pairs_stats_get`
- 鉴权要求: 是
- 参数:
  - `knowledge_base` (query, required=false, type={"anyOf": [{"type": "string"}, {"type": "null"}], "title": "Knowledge Base"})
  - `project_id` (query, required=false, type={"anyOf": [{"type": "string"}, {"type": "null"}], "title": "Project Id"})
  - `project_role` (query, required=false, type={"anyOf": [{"type": "string"}, {"type": "null"}], "title": "Project Role"})
- Responses:
  - `200` Successful Response | application/json: CodeQAPairStatsResponse
  - `422` Validation Error | application/json: HTTPValidationError
### `GET /api/v1/knowledge/code-qa-pairs/{qa_id}`

- Summary: Get Code Qa Pair Detail
- OperationId: `get_code_qa_pair_detail_api_v1_knowledge_code_qa_pairs__qa_id__get`
- 鉴权要求: 是
- 参数:
  - `qa_id` (path, required=true, type=string)
- Responses:
  - `200` Successful Response | application/json: CodeQAPairDetailResponse
  - `422` Validation Error | application/json: HTTPValidationError
### `PUT /api/v1/knowledge/code-qa-pairs/{qa_id}`

- Summary: Update Code Qa Pair
- OperationId: `update_code_qa_pair_api_v1_knowledge_code_qa_pairs__qa_id__put`
- 鉴权要求: 是
- 参数:
  - `qa_id` (path, required=true, type=string)
- RequestBody: required=true
  - `application/json`: `CodeQAPairUpdateRequest`
- Responses:
  - `200` Successful Response | application/json: CodeQAPairDetailResponse
  - `422` Validation Error | application/json: HTTPValidationError

## v1-datasets

### `GET /api/v1/knowledge/datasets`

- Summary: List Datasets
- OperationId: `list_datasets_api_v1_knowledge_datasets_get`
- 鉴权要求: 是
- 参数:
  - `page` (query, required=false, type=integer)
  - `page_size` (query, required=false, type=integer)
  - `knowledge_base` (query, required=false, type={"anyOf": [{"type": "string"}, {"type": "null"}], "default": "default", "title": "Knowledge Base"})
  - `source` (query, required=false, type={"anyOf": [{"type": "string"}, {"type": "null"}], "title": "Source"})
  - `data_type` (query, required=false, type={"anyOf": [{"type": "string"}, {"type": "null"}], "title": "Data Type"})
  - `sub_type` (query, required=false, type={"anyOf": [{"type": "string"}, {"type": "null"}], "title": "Sub Type"})
  - `device_type` (query, required=false, type={"anyOf": [{"type": "string"}, {"type": "null"}], "title": "Device Type"})
  - `material_system` (query, required=false, type={"anyOf": [{"type": "string"}, {"type": "null"}], "title": "Material System"})
  - `phenomenon` (query, required=false, type={"anyOf": [{"type": "string"}, {"type": "null"}], "title": "Phenomenon"})
  - `parse_status` (query, required=false, type={"anyOf": [{"type": "string"}, {"type": "null"}], "title": "Parse Status"})
  - `vector_status` (query, required=false, type={"anyOf": [{"type": "string"}, {"type": "null"}], "title": "Vector Status"})
  - `keyword` (query, required=false, type={"anyOf": [{"type": "string"}, {"type": "null"}], "title": "Keyword"})
- Responses:
  - `200` Successful Response | application/json: DatasetListResponse
  - `422` Validation Error | application/json: HTTPValidationError
### `POST /api/v1/knowledge/datasets/qa-generation/start`

- Summary: Generate Dataset Qas Batch
- OperationId: `generate_dataset_qas_batch_api_v1_knowledge_datasets_qa_generation_start_post`
- 鉴权要求: 是
- RequestBody: required=true
  - `application/json`: `DataQAGenerationRequest`
- Responses:
  - `200` Successful Response | application/json: DataQAGenerationResponse
  - `422` Validation Error | application/json: HTTPValidationError
### `GET /api/v1/knowledge/datasets/qa-generation/tasks/{task_id}`

- Summary: Get Dataset Qa Generation Task
- OperationId: `get_dataset_qa_generation_task_api_v1_knowledge_datasets_qa_generation_tasks__task_id__get`
- 鉴权要求: 是
- 参数:
  - `task_id` (path, required=true, type=string)
- Responses:
  - `200` Successful Response | application/json: DataQAGenerationResponse
  - `422` Validation Error | application/json: HTTPValidationError
### `POST /api/v1/knowledge/datasets/qa/{qa_id}/review`

- Summary: Review Dataset Qa
- OperationId: `review_dataset_qa_api_v1_knowledge_datasets_qa__qa_id__review_post`
- 鉴权要求: 是
- 参数:
  - `qa_id` (path, required=true, type=string)
- RequestBody: required=true
  - `application/json`: `DataQAReviewRequest`
- Responses:
  - `200` Successful Response | application/json: DataQAReviewResponse
  - `422` Validation Error | application/json: HTTPValidationError
### `POST /api/v1/knowledge/datasets/upload`

- Summary: Upload Dataset
- OperationId: `upload_dataset_api_v1_knowledge_datasets_upload_post`
- 鉴权要求: 是
- RequestBody: required=true
  - `multipart/form-data`: `Body_upload_dataset_api_v1_knowledge_datasets_upload_post`
- Responses:
  - `200` Successful Response | application/json: DatasetUploadResponse
  - `422` Validation Error | application/json: HTTPValidationError
### `GET /api/v1/knowledge/datasets/{dataset_id}`

- Summary: Get Dataset Detail
- OperationId: `get_dataset_detail_api_v1_knowledge_datasets__dataset_id__get`
- 鉴权要求: 是
- 参数:
  - `dataset_id` (path, required=true, type=string)
- Responses:
  - `200` Successful Response | application/json: DatasetDetailResponse
  - `422` Validation Error | application/json: HTTPValidationError
### `DELETE /api/v1/knowledge/datasets/{dataset_id}`

- Summary: Delete Dataset
- OperationId: `delete_dataset_api_v1_knowledge_datasets__dataset_id__delete`
- 鉴权要求: 是
- 参数:
  - `dataset_id` (path, required=true, type=string)
- Responses:
  - `200` Successful Response | application/json: DatasetDeleteResponse
  - `422` Validation Error | application/json: HTTPValidationError
### `GET /api/v1/knowledge/datasets/{dataset_id}/download`

- Summary: Download Dataset
- OperationId: `download_dataset_api_v1_knowledge_datasets__dataset_id__download_get`
- 鉴权要求: 是
- 参数:
  - `dataset_id` (path, required=true, type=string)
- Responses:
  - `200` Successful Response | application/json: {}
  - `422` Validation Error | application/json: HTTPValidationError
### `POST /api/v1/knowledge/datasets/{dataset_id}/parse`

- Summary: Parse Dataset
- OperationId: `parse_dataset_api_v1_knowledge_datasets__dataset_id__parse_post`
- 鉴权要求: 是
- 参数:
  - `dataset_id` (path, required=true, type=string)
- Responses:
  - `200` Successful Response | application/json: DatasetParseResponse
  - `422` Validation Error | application/json: HTTPValidationError
### `GET /api/v1/knowledge/datasets/{dataset_id}/qas`

- Summary: List Dataset Qas
- OperationId: `list_dataset_qas_api_v1_knowledge_datasets__dataset_id__qas_get`
- 鉴权要求: 是
- 参数:
  - `dataset_id` (path, required=true, type=string)
  - `review_status` (query, required=false, type={"anyOf": [{"type": "string"}, {"type": "null"}], "title": "Review Status"})
  - `page` (query, required=false, type=integer)
  - `page_size` (query, required=false, type=integer)
- Responses:
  - `200` Successful Response | application/json: DataQAListResponse
  - `422` Validation Error | application/json: HTTPValidationError
### `GET /api/v1/knowledge/datasets/{dataset_id}/records`

- Summary: List Dataset Records
- OperationId: `list_dataset_records_api_v1_knowledge_datasets__dataset_id__records_get`
- 鉴权要求: 是
- 参数:
  - `dataset_id` (path, required=true, type=string)
  - `page` (query, required=false, type=integer)
  - `page_size` (query, required=false, type=integer)
- Responses:
  - `200` Successful Response | application/json: DatasetRecordListResponse
  - `422` Validation Error | application/json: HTTPValidationError
### `POST /api/v1/knowledge/datasets/{dataset_id}/vector-sync`

- Summary: Trigger Dataset Vector Sync
- OperationId: `trigger_dataset_vector_sync_api_v1_knowledge_datasets__dataset_id__vector_sync_post`
- 鉴权要求: 是
- 参数:
  - `dataset_id` (path, required=true, type=string)
- Responses:
  - `200` Successful Response | application/json: DatasetVectorSyncResponse
  - `422` Validation Error | application/json: HTTPValidationError

## v1-documents

### `GET /api/v1/knowledge/documents`

- Summary: List Documents
- OperationId: `list_documents_api_v1_knowledge_documents_get`
- 鉴权要求: 是
- 参数:
  - `page` (query, required=false, type=integer)
  - `page_size` (query, required=false, type=integer)
  - `file_type` (query, required=false, type={"anyOf": [{"type": "string"}, {"type": "null"}], "title": "File Type"})
  - `document_type` (query, required=false, type={"anyOf": [{"type": "string"}, {"type": "null"}], "title": "Document Type"})
  - `type` (query, required=false, type={"anyOf": [{"type": "string"}, {"type": "null"}], "title": "Type"})
  - `keyword` (query, required=false, type={"anyOf": [{"type": "string"}, {"type": "null"}], "title": "Keyword"})
  - `status` (query, required=false, type={"anyOf": [{"type": "string"}, {"type": "null"}], "title": "Status"})
  - `sort_by` (query, required=false, type=string)
  - `order` (query, required=false, type=string)
  - `knowledge_base` (query, required=false, type={"anyOf": [{"type": "string"}, {"type": "null"}], "title": "Knowledge Base"})
- Responses:
  - `200` Successful Response | application/json: DocumentListResponse
  - `422` Validation Error | application/json: HTTPValidationError
### `POST /api/v1/knowledge/documents`

- Summary: Upload Document
- OperationId: `upload_document_api_v1_knowledge_documents_post`
- 鉴权要求: 是
- RequestBody: required=true
  - `multipart/form-data`: `Body_upload_document_api_v1_knowledge_documents_post`
- Responses:
  - `201` Successful Response | application/json: DocumentUploadResponse
  - `422` Validation Error | application/json: HTTPValidationError
### `POST /api/v1/knowledge/documents/batch-sync/start`

- Summary: Start Batch Sync
- OperationId: `start_batch_sync_api_v1_knowledge_documents_batch_sync_start_post`
- 鉴权要求: 是
- RequestBody: required=true
  - `application/json`: `BatchSyncStartRequest`
- Responses:
  - `200` Successful Response | application/json: BatchSyncStartResponse
  - `422` Validation Error | application/json: HTTPValidationError
### `GET /api/v1/knowledge/documents/batch-sync/tasks/{task_id}`

- Summary: Get Batch Sync Task
- OperationId: `get_batch_sync_task_api_v1_knowledge_documents_batch_sync_tasks__task_id__get`
- 鉴权要求: 是
- 参数:
  - `task_id` (path, required=true, type=string)
- Responses:
  - `200` Successful Response | application/json: BatchSyncTaskStatusResponse
  - `422` Validation Error | application/json: HTTPValidationError
### `POST /api/v1/knowledge/documents/batch-upload/csv-files`

- Summary: Batch Upload Csv Files
- OperationId: `batch_upload_csv_files_api_v1_knowledge_documents_batch_upload_csv_files_post`
- 鉴权要求: 是
- RequestBody: required=true
  - `multipart/form-data`: `Body_batch_upload_csv_files_api_v1_knowledge_documents_batch_upload_csv_files_post`
- Responses:
  - `200` Successful Response | application/json: BatchUploadResponse
  - `422` Validation Error | application/json: HTTPValidationError
### `POST /api/v1/knowledge/documents/batch-upload/doc-files`

- Summary: Batch Upload Doc Files
- OperationId: `batch_upload_doc_files_api_v1_knowledge_documents_batch_upload_doc_files_post`
- 鉴权要求: 是
- RequestBody: required=true
  - `multipart/form-data`: `Body_batch_upload_doc_files_api_v1_knowledge_documents_batch_upload_doc_files_post`
- Responses:
  - `200` Successful Response | application/json: BatchUploadResponse
  - `422` Validation Error | application/json: HTTPValidationError
### `GET /api/v1/knowledge/documents/batch-upload/session/current`

- Summary: Get Current Batch Upload Session
- OperationId: `get_current_batch_upload_session_api_v1_knowledge_documents_batch_upload_session_current_get`
- 鉴权要求: 是
- 参数:
  - `knowledge_base` (query, required=false, type=string)
- Responses:
  - `200` Successful Response | application/json: UploadSessionSummaryResponse
  - `422` Validation Error | application/json: HTTPValidationError
### `GET /api/v1/knowledge/documents/qa-generation/backfill/current`

- Summary: Get Current Qa Backfill Task
- OperationId: `get_current_qa_backfill_task_api_v1_knowledge_documents_qa_generation_backfill_current_get`
- 鉴权要求: 是
- Responses:
  - `200` Successful Response | application/json: QABackfillTaskStatusResponse
### `GET /api/v1/knowledge/documents/qa-generation/backfill/log`

- Summary: Get Current Qa Backfill Log
- OperationId: `get_current_qa_backfill_log_api_v1_knowledge_documents_qa_generation_backfill_log_get`
- 鉴权要求: 是
- 参数:
  - `lines` (query, required=false, type=integer)
- Responses:
  - `200` Successful Response | application/json: QABackfillTaskLogResponse
  - `422` Validation Error | application/json: HTTPValidationError
### `POST /api/v1/knowledge/documents/qa-generation/backfill/start`

- Summary: Start Qa Backfill Task
- OperationId: `start_qa_backfill_task_api_v1_knowledge_documents_qa_generation_backfill_start_post`
- 鉴权要求: 是
- RequestBody: required=true
  - `application/json`: `QABackfillTaskRequest`
- Responses:
  - `200` Successful Response | application/json: QABackfillTaskStartResponse
  - `422` Validation Error | application/json: HTTPValidationError
### `POST /api/v1/knowledge/documents/qa-generation/backfill/stop`

- Summary: Stop Current Qa Backfill Task
- OperationId: `stop_current_qa_backfill_task_api_v1_knowledge_documents_qa_generation_backfill_stop_post`
- 鉴权要求: 是
- Responses:
  - `200` Successful Response | application/json: QABackfillTaskStopResponse
### `POST /api/v1/knowledge/documents/qa-generation/batch-start`

- Summary: Start Qa Generation Batch
- OperationId: `start_qa_generation_batch_api_v1_knowledge_documents_qa_generation_batch_start_post`
- 鉴权要求: 是
- RequestBody: required=true
  - `application/json`: `QABatchGenerationRequest`
- Responses:
  - `200` Successful Response | application/json: QABatchGenerationStartResponse
  - `422` Validation Error | application/json: HTTPValidationError
### `GET /api/v1/knowledge/documents/qa-generation/batch-tasks/{batch_task_id}`

- Summary: Get Qa Generation Batch Task
- OperationId: `get_qa_generation_batch_task_api_v1_knowledge_documents_qa_generation_batch_tasks__batch_task_id__get`
- 鉴权要求: 是
- 参数:
  - `batch_task_id` (path, required=true, type=string)
- Responses:
  - `200` Successful Response | application/json: QABatchGenerationTaskResponse
  - `422` Validation Error | application/json: HTTPValidationError
### `POST /api/v1/knowledge/documents/qa-generation/start`

- Summary: Generate Document Qas
- OperationId: `generate_document_qas_api_v1_knowledge_documents_qa_generation_start_post`
- 鉴权要求: 是
- RequestBody: required=true
  - `application/json`: `QAGenerationRequest`
- Responses:
  - `200` Successful Response | application/json: QAGenerationResponse
  - `422` Validation Error | application/json: HTTPValidationError
### `GET /api/v1/knowledge/documents/qa-generation/tasks/{task_id}`

- Summary: Get Qa Generation Task
- OperationId: `get_qa_generation_task_api_v1_knowledge_documents_qa_generation_tasks__task_id__get`
- 鉴权要求: 是
- 参数:
  - `task_id` (path, required=true, type=string)
- Responses:
  - `200` Successful Response | application/json: {"type": "object", "additionalProperties": true, "title": "Response Get Qa Generation Task Api V1 Knowledge Documents Qa Generation Tasks  Task Id  Get"}
  - `422` Validation Error | application/json: HTTPValidationError
### `GET /api/v1/knowledge/documents/stats`

- Summary: Document Stats
- OperationId: `document_stats_api_v1_knowledge_documents_stats_get`
- 鉴权要求: 是
- Responses:
  - `200` Successful Response | application/json: DocumentStatsResponse
### `GET /api/v1/knowledge/documents/{document_id}`

- Summary: Get Document Detail
- OperationId: `get_document_detail_api_v1_knowledge_documents__document_id__get`
- 鉴权要求: 是
- 参数:
  - `document_id` (path, required=true, type=string)
- Responses:
  - `200` Successful Response | application/json: DocumentListItem
  - `422` Validation Error | application/json: HTTPValidationError
### `DELETE /api/v1/knowledge/documents/{document_id}`

- Summary: Delete Document
- OperationId: `delete_document_api_v1_knowledge_documents__document_id__delete`
- 鉴权要求: 是
- 参数:
  - `document_id` (path, required=true, type=string)
- Responses:
  - `200` Successful Response | application/json: DocumentDeleteResponse
  - `422` Validation Error | application/json: HTTPValidationError
### `GET /api/v1/knowledge/documents/{document_id}/download`

- Summary: Download Document
- OperationId: `download_document_api_v1_knowledge_documents__document_id__download_get`
- 鉴权要求: 是
- 参数:
  - `document_id` (path, required=true, type=string)
- Responses:
  - `200` Successful Response | application/json: {}
  - `422` Validation Error | application/json: HTTPValidationError
### `GET /api/v1/knowledge/documents/{document_id}/download-url`

- Summary: Get Document Download Url
- OperationId: `get_document_download_url_api_v1_knowledge_documents__document_id__download_url_get`
- 鉴权要求: 是
- 参数:
  - `document_id` (path, required=true, type=string)
- Responses:
  - `200` Successful Response | application/json: {"type": "object", "additionalProperties": {"type": "string"}, "title": "Response Get Document Download Url Api V1 Knowledge Documents  Document Id  Download Url Get"}
  - `422` Validation Error | application/json: HTTPValidationError
### `GET /api/v1/knowledge/documents/{document_id}/file`

- Summary: Stream Document File
- OperationId: `stream_document_file_api_v1_knowledge_documents__document_id__file_get`
- 鉴权要求: 是
- 参数:
  - `document_id` (path, required=true, type=string)
- Responses:
  - `200` Successful Response | application/json: {}
  - `422` Validation Error | application/json: HTTPValidationError

## v1-permissions

### `GET /api/v1/admin/permissions/users`

- Summary: List Permission Users
- OperationId: `list_permission_users_api_v1_admin_permissions_users_get`
- 鉴权要求: 是
- Responses:
  - `200` Successful Response | application/json: V1PermissionUsersResponse
### `PUT /api/v1/admin/permissions/users/{username}`

- Summary: Update User Permissions
- OperationId: `update_user_permissions_api_v1_admin_permissions_users__username__put`
- 鉴权要求: 是
- 参数:
  - `username` (path, required=true, type=string)
- RequestBody: required=true
  - `application/json`: `V1PermissionUpdateRequest`
- Responses:
  - `200` Successful Response | application/json: V1PermissionInfo
  - `422` Validation Error | application/json: HTTPValidationError
### `POST /api/v1/admin/permissions/users/{username}/grant-all`

- Summary: Grant All Permissions
- OperationId: `grant_all_permissions_api_v1_admin_permissions_users__username__grant_all_post`
- 鉴权要求: 是
- 参数:
  - `username` (path, required=true, type=string)
- Responses:
  - `200` Successful Response | application/json: V1PermissionInfo
  - `422` Validation Error | application/json: HTTPValidationError

## v1-physics-engine

### `POST /api/v1/physics/pre-simulation-check`

- Summary: Pre Simulation Check
- OperationId: `pre_simulation_check_api_v1_physics_pre_simulation_check_post`
- 鉴权要求: 是
- RequestBody: required=true
  - `application/json`: `PreSimulationCheckRequest`
- Responses:
  - `200` Successful Response | application/json: PreSimulationCheckResponse
  - `422` Validation Error | application/json: HTTPValidationError

## v1-physics-full-report

### `POST /api/v1/physics/full-report`

- Summary: Generate Full Physics Report
- OperationId: `generate_full_physics_report_api_v1_physics_full_report_post`
- 鉴权要求: 是
- RequestBody: required=true
  - `application/json`: `PhysicsFullReportRequest`
- Responses:
  - `200` Successful Response | application/json: PhysicsFullReportResponse
  - `422` Validation Error | application/json: HTTPValidationError

## v1-physics-rules

### `POST /api/v1/physics/check-consistency`

- Summary: Check Physics Consistency
- OperationId: `check_physics_consistency_api_v1_physics_check_consistency_post`
- 鉴权要求: 是
- RequestBody: required=true
  - `application/json`: `PhysicsConsistencyCheckRequest`
- Responses:
  - `200` Successful Response | application/json: PhysicsConsistencyCheckResponse
  - `422` Validation Error | application/json: HTTPValidationError
### `GET /api/v1/physics/rules`

- Summary: List Physics Rules
- OperationId: `list_physics_rules_api_v1_physics_rules_get`
- 鉴权要求: 是
- 参数:
  - `page` (query, required=false, type=integer)
  - `page_size` (query, required=false, type=integer)
  - `status` (query, required=false, type={"anyOf": [{"type": "string"}, {"type": "null"}], "title": "Status"})
  - `rule_type` (query, required=false, type={"anyOf": [{"type": "string"}, {"type": "null"}], "title": "Rule Type"})
  - `severity` (query, required=false, type={"anyOf": [{"type": "string"}, {"type": "null"}], "title": "Severity"})
  - `domain_scope` (query, required=false, type={"anyOf": [{"type": "string"}, {"type": "null"}], "title": "Domain Scope"})
  - `applicable_asset` (query, required=false, type={"anyOf": [{"type": "string"}, {"type": "null"}], "title": "Applicable Asset"})
- Responses:
  - `200` Successful Response | application/json: PhysicsRuleListResponse
  - `422` Validation Error | application/json: HTTPValidationError
### `POST /api/v1/physics/rules`

- Summary: Create Physics Rule
- OperationId: `create_physics_rule_api_v1_physics_rules_post`
- 鉴权要求: 是
- RequestBody: required=true
  - `application/json`: `PhysicsRuleCreateRequest`
- Responses:
  - `201` Successful Response | application/json: PhysicsRuleItem
  - `422` Validation Error | application/json: HTTPValidationError
### `GET /api/v1/physics/rules/{rule_id}`

- Summary: Get Physics Rule
- OperationId: `get_physics_rule_api_v1_physics_rules__rule_id__get`
- 鉴权要求: 是
- 参数:
  - `rule_id` (path, required=true, type=string)
- Responses:
  - `200` Successful Response | application/json: PhysicsRuleItem
  - `422` Validation Error | application/json: HTTPValidationError
### `PATCH /api/v1/physics/rules/{rule_id}`

- Summary: Update Physics Rule
- OperationId: `update_physics_rule_api_v1_physics_rules__rule_id__patch`
- 鉴权要求: 是
- 参数:
  - `rule_id` (path, required=true, type=string)
- RequestBody: required=true
  - `application/json`: `PhysicsRuleUpdateRequest`
- Responses:
  - `200` Successful Response | application/json: PhysicsRuleItem
  - `422` Validation Error | application/json: HTTPValidationError
### `POST /api/v1/physics/rules/{rule_id}/status`

- Summary: Change Physics Rule Status
- OperationId: `change_physics_rule_status_api_v1_physics_rules__rule_id__status_post`
- 鉴权要求: 是
- 参数:
  - `rule_id` (path, required=true, type=string)
- RequestBody: required=true
  - `application/json`: `PhysicsRuleStatusChangeRequest`
- Responses:
  - `200` Successful Response | application/json: PhysicsRuleItem
  - `422` Validation Error | application/json: HTTPValidationError

## v1-qa-pairs

### `GET /api/v1/qa-pairs`

- Summary: List Qa Pairs
- OperationId: `list_qa_pairs_api_v1_qa_pairs_get`
- 鉴权要求: 是
- 参数:
  - `status` (query, required=false, type={"anyOf": [{"type": "string"}, {"type": "null"}], "title": "Status"})
  - `assignee` (query, required=false, type={"anyOf": [{"type": "string"}, {"type": "null"}], "title": "Assignee"})
  - `reviewer` (query, required=false, type={"anyOf": [{"type": "string"}, {"type": "null"}], "title": "Reviewer"})
  - `keyword` (query, required=false, type={"anyOf": [{"type": "string"}, {"type": "null"}], "title": "Keyword"})
  - `topic` (query, required=false, type={"anyOf": [{"type": "string"}, {"type": "null"}], "title": "Topic"})
  - `scene` (query, required=false, type={"anyOf": [{"type": "string"}, {"type": "null"}], "title": "Scene"})
  - `document_id` (query, required=false, type={"anyOf": [{"type": "string"}, {"type": "null"}], "title": "Document Id"})
  - `min_confidence` (query, required=false, type={"anyOf": [{"type": "number", "maximum": 1, "minimum": 0}, {"type": "null"}], "title": "Min Confidence"})
  - `page` (query, required=false, type=integer)
  - `page_size` (query, required=false, type=integer)
  - `sort_by` (query, required=false, type=string)
  - `order` (query, required=false, type=string)
- Responses:
  - `200` Successful Response | application/json: QAPairListResponse
  - `422` Validation Error | application/json: HTTPValidationError
### `POST /api/v1/qa-pairs`

- Summary: Create Manual Qa
- OperationId: `create_manual_qa_api_v1_qa_pairs_post`
- 鉴权要求: 是
- Responses:
  - `200` Successful Response | application/json: {}
### `POST /api/v1/qa-pairs/assignments`

- Summary: Assign Qa Pairs
- OperationId: `assign_qa_pairs_api_v1_qa_pairs_assignments_post`
- 鉴权要求: 是
- RequestBody: required=true
  - `application/json`: `AssignmentRequest`
- Responses:
  - `200` Successful Response | application/json: AssignmentResponse
  - `422` Validation Error | application/json: HTTPValidationError
### `POST /api/v1/qa-pairs/proposals`

- Summary: Submit Feedback Qa Proposal
- OperationId: `submit_feedback_qa_proposal_api_v1_qa_pairs_proposals_post`
- 鉴权要求: 是
- RequestBody: required=true
  - `application/json`: `QAFeedbackProposalRequest`
- Responses:
  - `201` Successful Response | application/json: QAFeedbackProposalResponse
  - `422` Validation Error | application/json: HTTPValidationError
### `GET /api/v1/qa-pairs/stats`

- Summary: Qa Stats
- OperationId: `qa_stats_api_v1_qa_pairs_stats_get`
- 鉴权要求: 是
- Responses:
  - `200` Successful Response | application/json: QAPairStatsResponse
### `GET /api/v1/qa-pairs/{qa_pair_id}`

- Summary: Get Qa Pair
- OperationId: `get_qa_pair_api_v1_qa_pairs__qa_pair_id__get`
- 鉴权要求: 是
- 参数:
  - `qa_pair_id` (path, required=true, type=string)
- Responses:
  - `200` Successful Response | application/json: QAPairDetailResponse
  - `422` Validation Error | application/json: HTTPValidationError
### `PUT /api/v1/qa-pairs/{qa_pair_id}`

- Summary: Update Qa Pair
- OperationId: `update_qa_pair_api_v1_qa_pairs__qa_pair_id__put`
- 鉴权要求: 是
- 参数:
  - `qa_pair_id` (path, required=true, type=string)
- RequestBody: required=true
  - `application/json`: `QAPairUpdateRequest`
- Responses:
  - `200` Successful Response | application/json: QAPairDetailResponse
  - `422` Validation Error | application/json: HTTPValidationError

## v1-search

### `POST /api/v1/search`

- Summary: Search
- OperationId: `search_api_v1_search_post`
- 鉴权要求: 是
- RequestBody: required=true
  - `application/json`: `SearchRequest`
- Responses:
  - `200` Successful Response | application/json: {"items": {"$ref": "#/components/schemas/SearchResultItem"}, "type": "array", "title": "Response Search Api V1 Search Post"}
  - `422` Validation Error | application/json: HTTPValidationError
