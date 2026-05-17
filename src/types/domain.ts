export type UserRole = 'admin' | 'reviewer' | 'observer';

export type QAStatus = 'pending' | 'reviewed' | 'deprecated';
export type DocumentStatus = string;
export type DocumentSortField = 'uploaded_at' | 'file_name' | 'fragment_count' | 'qa_count';
export type DocumentType = 'paper' | 'conference' | 'book' | 'manual' | 'code' | 'data';
export type UploadMode = 'sync' | 'batch' | 'batch_direct';
export type MetadataMode = 'auto' | 'csv_required' | 'file_only';
export type QAGenerationMode = 'append' | 'replace';
export type DocumentPairStatus = 'pending_pair' | 'paired' | 'missing_csv' | 'invalid_csv' | 'ambiguous_pair';
export type MemberRankingSortField = 'default' | 'uploaded_docs' | 'reviewed_qa' | 'processed_qa';
export type SortOrder = 'asc' | 'desc';

export interface QAPair {
  id: string;
  question: string;
  answer: string;
  topics: string[];
  scenes: string[];
  confidence: number;
  status: QAStatus;
  assignee?: string;
  reviewer?: string;
  reviewed_at?: string;
  review_notes?: string;
  version: number;
}

export interface Fragment {
  id: string;
  fragment_type: 'text' | 'code' | 'table' | 'figure';
  content: string;
  page_start?: number;
  page_end?: number;
  source?: string;
}

export interface FragmentDraft {
  fragment_type: Fragment['fragment_type'];
  content: string;
  page_start?: number;
  page_end?: number;
  source?: string;
}

export interface QADetail extends QAPair {
  fragments: Fragment[];
}

export interface QAStats {
  pending: number;
  reviewed: number;
  deprecated: number;
}

export interface ReviewPayload {
  question: string;
  answer: string;
  topics: string[];
  scenes: string[];
  confidence: number;
  review_notes: string;
  status: QAStatus;
  version: number;
  assignee?: string;
  reviewer?: string;
}

export interface CreateQAPayload {
  question: string;
  answer: string;
  topics: string[];
  scenes: string[];
  confidence: number;
  review_notes: string;
  assignee?: string;
  reviewer?: string;
  fragments: FragmentDraft[];
}

export interface AssignPayload {
  qa_ids: string[];
  assignee: string;
}

export interface DocumentStats {
  document_count: number;
  fragment_count: number;
  qa_count: number;
  indexed_count?: number;
  processing_count?: number;
  failed_count?: number;
}

export interface KnowledgeDocument {
  document_id: string;
  title?: string;
  file_name: string;
  file_type: string;
  file_size: number;
  uploaded_at: string;
  uploaded_by: string;
  uploaded_by_name?: string;
  document_type?: DocumentType;
  knowledge_base?: string;
  status: DocumentStatus;
  fragment_count: number;
  qa_count: number;
  sync_mode?: UploadMode;
  sync_status?: string;
  local_file_path?: string;
  local_csv_path?: string;
  upload_session_id?: string;
  pair_status?: DocumentPairStatus | string;
  pair_error?: string;
  csv_file_name?: string;
  file_md5?: string;
  object_key?: string;
  latest_task_status?: string;
}

export interface DocumentListQuery {
  page: number;
  page_size: number;
  keyword?: string;
  file_type?: string;
  document_type?: DocumentType | '';
  knowledge_base?: string;
  status?: DocumentStatus | '';
  sort_by?: DocumentSortField;
  order?: SortOrder;
}

export interface UploadDocumentResult {
  document_id: string;
  title?: string;
  file_name: string;
  document_type?: DocumentType;
  knowledge_base?: string;
  file_md5?: string;
  object_key?: string;
  status: string;
  fragment_count?: number;
  generated_pending_qas?: number;
  ingestion_task_id?: string;
  sync_mode?: UploadMode;
  sync_status?: string;
}

export interface UploadSyncDocumentPayload {
  file: File;
  metadata_csv?: File;
  metadata_mode?: MetadataMode;
  knowledge_base?: string;
  document_type?: DocumentType;
  title?: string;
}

export interface BatchUploadFileItem {
  file_name: string;
  status: string;
  message?: string;
  document_id?: string;
  csv_id?: string;
}

export interface BatchUploadResponse {
  session_id: string;
  knowledge_base: string;
  total_files: number;
  accepted_count: number;
  rejected_count: number;
  items: BatchUploadFileItem[];
  paired_count: number;
  unpaired_count: number;
}

export interface SessionUnmatchedDocumentItem {
  document_id: string;
  file_name: string;
  pair_status: string;
  pair_error?: string;
}

export interface SessionOrphanCsvItem {
  file_name: string;
  parse_status: string;
  parse_error?: string;
}

export interface UploadSessionSummary {
  session_id?: string;
  status?: string;
  knowledge_base: string;
  doc_file_count: number;
  csv_file_count: number;
  paired_count: number;
  unpaired_count: number;
  unmatched_documents: SessionUnmatchedDocumentItem[];
  orphan_csv_files: SessionOrphanCsvItem[];
}

export interface BatchSyncStartPayload {
  min_batch_size?: number;
  max_wait_seconds?: number;
  max_docs?: number;
  max_workers?: number;
  include_failed?: boolean;
  knowledge_base?: string;
  strict_pairing?: boolean;
}

export interface BatchSyncSkippedDocument {
  document_id?: string;
  file_name?: string;
  reason?: string;
  [key: string]: unknown;
}

export interface BatchSyncTaskStatus {
  task_id: string;
  status: string;
  session_id?: string;
  queued_count: number;
  processed_count: number;
  success_count: number;
  failed_count: number;
  skipped_count: number;
  message: string;
  started_at?: string;
  finished_at?: string;
  failed_documents: string[];
  skipped_documents: BatchSyncSkippedDocument[];
}

export interface BatchUploadRequestPayload {
  files: File[];
  knowledge_base?: string;
}

export interface QAGenerationPayload {
  document_id: string;
  target_count?: number;
  mode?: QAGenerationMode;
}

export interface QAGenerationStartResult {
  task_id: string;
  document_id: string;
  status: string;
  generated_qas: number;
  message: string;
}

export interface IngestionTaskStatus {
  id: string;
  document_id: string;
  task_type: string;
  status: string;
  stage: string;
  created_by_user_id?: number;
  total_fragments: number;
  total_generated_qas: number;
  retry_count: number;
  error_message?: string;
  started_at: string;
  finished_at?: string;
  created_at: string;
  updated_at: string;
}

export interface KnowledgeCodeFile {
  id: string;
  file_name: string;
  file_path: string;
  knowledge_base: string;
  code_type: string;
  language: string;
  sub_type?: string;
  simulation_tool?: string;
  tool_version?: string;
  tool_version_exact?: string;
  file_version?: string;
  source?: string;
  project_id?: string;
  project_role?: string;
  source_doc_id?: string;
  source_doc_page?: number;
  source_doc_block_index?: number;
  topics: string[];
  scenes: string[];
  tags: string[];
  authors: string[];
  owner?: string;
  license?: string;
  file_hash: string;
  file_size?: number;
  line_count?: number;
  encoding?: string;
  description?: string;
  summary_for_retrieval?: string;
  retrieval_boost?: number;
  is_active?: boolean;
  is_verified?: boolean;
  verified_by?: string;
  verified_at?: string;
  created_by_user_id?: number;
  created_at?: string;
  updated_at?: string;
  fragment_count: number;
}

export interface CodeFileListQuery {
  page: number;
  page_size: number;
  knowledge_base?: string;
  code_type?: string;
  language?: string;
  project_id?: string;
  project_role?: string;
  keyword?: string;
}

export interface UploadCodeFilePayload {
  code_file: File;
  knowledge_base?: string;
  source?: string;
  project_id?: string;
  project_role?: string;
  code_type?: string;
  language?: string;
  sub_type?: string;
}

export interface UploadCodeFileResult {
  file_id: string;
  file_name: string;
  knowledge_base: string;
  code_type: string;
  language: string;
  sub_type?: string;
  fragment_count: number;
  dependency_count: number;
  queued_vector_jobs: number;
}

export interface CodeDependency {
  id: string;
  source_fragment_id: string;
  target_fragment_id?: string;
  target_external?: string;
  relation_type: string;
  relation_meta?: Record<string, unknown>;
  strength?: number;
  created_at?: string;
}

export interface CodeFragment {
  id: string;
  file_id: string;
  project_id?: string;
  fragment_type: string;
  symbol_name?: string;
  language?: string;
  content: string;
  summary_for_retrieval?: string;
  line_start?: number;
  line_end?: number;
  retrieval_weight?: number;
  source?: string;
  created_at?: string;
}

export interface KnowledgeDataset {
  id: string;
  dataset_name: string;
  source: string;
  data_type: string;
  sub_type?: string;
  format: string;
  file_name: string;
  file_size?: number;
  knowledge_base: string;
  bucket_name: string;
  object_key: string;
  device_type?: string;
  material_system?: string;
  phenomenon?: string;
  row_count?: number;
  column_count?: number;
  parse_status: string;
  qa_status: string;
  vector_status: string;
  confidence_overall?: number;
  is_active?: boolean;
  created_by?: string;
  created_at?: string;
  updated_at?: string;
  topics: string[];
  scenes: string[];
}

export interface DatasetListQuery {
  page: number;
  page_size: number;
  knowledge_base?: string;
  source?: string;
  data_type?: string;
  sub_type?: string;
  device_type?: string;
  material_system?: string;
  phenomenon?: string;
  parse_status?: string;
  vector_status?: string;
  keyword?: string;
}

export interface UploadDatasetPayload {
  data_file: File;
  knowledge_base?: string;
  source?: string;
  data_type?: string;
  sub_type?: string;
  version?: string;
  dataset_name?: string;
  device_type?: string;
  material_system?: string;
  phenomenon?: string;
}

export interface UploadDatasetResult {
  dataset_id: string;
  dataset_name: string;
  object_key: string;
  parse_status: string;
  vector_status: string;
  row_count?: number;
  column_count?: number;
  parsed_record_count?: number;
}

export interface DatasetParseResult {
  dataset_id: string;
  parse_status: string;
  row_count?: number;
  column_count?: number;
  parsed_record_count?: number;
  message: string;
}

export interface DatasetVectorSyncResult {
  dataset_id: string;
  queued: boolean;
  job_type: string;
  vector_status: string;
}

export interface DatasetRecord {
  id: string;
  dataset_id: string;
  record_index: number;
  record_name?: string;
  record_type: string;
  record_values?: Record<string, unknown>;
  conditions_specific?: Record<string, unknown>;
  labels?: Record<string, unknown>;
  quality_flags?: Record<string, unknown>;
  retrieval_text?: string;
  created_at?: string;
}

export interface DatasetQAItem {
  id: string;
  dataset_id: string;
  record_id?: string;
  question: string;
  answer: string;
  qa_type?: string;
  source: string;
  review_status: string;
  reviewer_id?: string;
  reviewed_at?: string;
  confidence_score?: number;
  retrieval_text?: string;
}

export interface DatasetQAGenerationPayload {
  dataset_ids: string[];
  qa_count_per_dataset?: number;
  qa_types?: string[];
  mode?: QAGenerationMode;
}

export interface DatasetQAGenerationTask {
  task_id: string;
  status: string;
  total_datasets: number;
  processed_datasets: number;
  success_datasets?: number;
  failed_datasets?: number;
  generated_total: number;
  qa_count_per_dataset: number;
  mode: QAGenerationMode;
  started_at?: string;
  finished_at?: string;
}

export interface MemberRankingItem {
  rank: number;
  user_id: string;
  username: string;
  display_name?: string;
  uploaded_document_count: number;
  reviewed_qa_count: number;
  deprecated_qa_count: number;
  processed_qa_count: number;
  last_active_at?: string;
}

export interface MemberRankingQuery {
  sort_by: MemberRankingSortField;
  order: SortOrder;
  page?: number;
  page_size?: number;
}

export interface QAFilters {
  keyword: string;
  topic: string;
  scene: string;
  minConfidence: number | null;
  assignee: string;
  onlyMine: boolean;
}

export interface LoginPayload {
  username: string;
  password: string;
}

export interface SessionInfo {
  token: string;
  username: string;
  role: UserRole;
}

export interface MeInfo {
  id: number;
  username: string;
  role: UserRole;
  name?: string;
  status?: string;
  created_at?: string;
  last_active_at?: string;
}
