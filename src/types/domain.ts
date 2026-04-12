export type UserRole = 'admin' | 'reviewer' | 'observer';

export type QAStatus = 'pending' | 'reviewed' | 'deprecated';
export type DocumentStatus = 'indexed' | 'processing' | 'failed';
export type DocumentSortField = 'uploaded_at' | 'file_name' | 'fragment_count' | 'qa_count';
export type DocumentType = 'paper' | 'conference' | 'book' | 'manual' | 'code' | 'data';
export type UploadMode = 'sync' | 'batch';
export type QAGenerationMode = 'append' | 'replace';
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

export interface UploadDocumentPairPayload {
  file: File;
  metadata_csv: File;
  upload_mode?: UploadMode;
  knowledge_base?: string;
  document_type?: DocumentType;
  title?: string;
  subdir: string;
}

export type DocumentUploadQueueItemStatus = 'ready' | 'uploading' | 'success' | 'error' | 'conflict';

export interface DocumentUploadQueueItem extends UploadDocumentPairPayload {
  id: string;
  status: DocumentUploadQueueItemStatus;
  message?: string;
  response?: UploadDocumentResult;
}

export interface BatchSyncStartPayload {
  min_batch_size?: number;
  max_wait_seconds?: number;
  max_docs?: number;
  max_workers?: number;
  include_failed?: boolean;
}

export interface BatchSyncTaskStatus {
  task_id: string;
  status: string;
  queued_count: number;
  processed_count: number;
  success_count: number;
  failed_count: number;
  message: string;
  started_at?: string;
  finished_at?: string;
  failed_documents: string[];
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
