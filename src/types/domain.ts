export type UserRole = 'admin' | 'reviewer' | 'observer';

export type QAStatus = 'pending' | 'reviewed' | 'deprecated';
export type DocumentStatus = 'indexed' | 'processing' | 'failed';
export type DocumentSortField = 'uploaded_at' | 'file_name' | 'fragment_count' | 'qa_count';
export type DocumentType = 'paper' | 'conference' | 'book' | 'manual' | 'code' | 'data';
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
