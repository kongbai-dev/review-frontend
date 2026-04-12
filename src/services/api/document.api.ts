import { isAxiosError } from 'axios';
import { API_CONFIG } from '@/config';
import { http } from '@/services/http';
import { mockDocumentApi } from '@/services/mock/document.mock';
import type { PagedListResponse } from '@/types/api';
import type {
  BatchSyncStartPayload,
  BatchSyncTaskStatus,
  DocumentListQuery,
  DocumentStats,
  DocumentStatus,
  DocumentType,
  IngestionTaskStatus,
  KnowledgeDocument,
  QAGenerationPayload,
  QAGenerationStartResult,
  UploadDocumentPairPayload,
  UploadDocumentResult,
  UploadMode
} from '@/types/domain';

const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 20;

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const expectString = (value: unknown, path: string): string => {
  if (typeof value !== 'string') {
    throw new Error(`Contract mismatch: ${path} must be string`);
  }
  return value;
};

const expectOptionalString = (value: unknown, path: string): string | undefined => {
  if (value === undefined || value === null) {
    return undefined;
  }
  return expectString(value, path);
};

const expectNumber = (value: unknown, path: string): number => {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    throw new Error(`Contract mismatch: ${path} must be number`);
  }
  return value;
};

const expectOptionalNumber = (value: unknown, path: string): number | undefined => {
  if (value === undefined || value === null) {
    return undefined;
  }
  return expectNumber(value, path);
};

const expectStringArray = (value: unknown, path: string): string[] => {
  if (!Array.isArray(value) || value.some((item) => typeof item !== 'string')) {
    throw new Error(`Contract mismatch: ${path} must be string[]`);
  }
  return value;
};

const expectDocumentStatus = (value: unknown, path: string): DocumentStatus => {
  const status = expectString(value, path);
  if (status === 'indexed' || status === 'processing' || status === 'failed') {
    return status;
  }
  throw new Error(`Contract mismatch: ${path} has invalid status`);
};

const expectOptionalDocumentType = (value: unknown, path: string): DocumentType | undefined => {
  if (value === undefined || value === null) {
    return undefined;
  }

  const docType = expectString(value, path);
  if (
    docType === 'paper' ||
    docType === 'conference' ||
    docType === 'book' ||
    docType === 'manual' ||
    docType === 'code' ||
    docType === 'data'
  ) {
    return docType;
  }

  return undefined;
};

const expectOptionalUploadMode = (value: unknown, path: string): UploadMode | undefined => {
  if (value === undefined || value === null) {
    return undefined;
  }
  const mode = expectString(value, path);
  if (mode === 'sync' || mode === 'batch') {
    return mode;
  }
  return undefined;
};

const parseDocument = (raw: unknown, path = 'document'): KnowledgeDocument => {
  if (!isObject(raw)) {
    throw new Error(`Contract mismatch: ${path} must be object`);
  }

  const id = raw.document_id ?? raw.id;
  if (typeof id !== 'string' || !id.trim()) {
    throw new Error(`Contract mismatch: ${path}.document_id is required`);
  }

  return {
    document_id: id,
    title: expectOptionalString(raw.title, `${path}.title`),
    file_name: expectString(raw.file_name, `${path}.file_name`),
    file_type: expectString(raw.file_type, `${path}.file_type`),
    file_size: expectNumber(raw.file_size, `${path}.file_size`),
    uploaded_at: expectString(raw.uploaded_at, `${path}.uploaded_at`),
    uploaded_by: expectString(raw.uploaded_by, `${path}.uploaded_by`),
    uploaded_by_name: expectOptionalString(raw.uploaded_by_name, `${path}.uploaded_by_name`),
    document_type: expectOptionalDocumentType(raw.document_type ?? raw.type, `${path}.document_type`),
    knowledge_base: expectOptionalString(raw.knowledge_base, `${path}.knowledge_base`),
    status: expectDocumentStatus(raw.status, `${path}.status`),
    fragment_count: expectNumber(raw.fragment_count, `${path}.fragment_count`),
    qa_count: expectNumber(raw.qa_count, `${path}.qa_count`),
    latest_task_status: expectOptionalString(raw.latest_task_status, `${path}.latest_task_status`)
  };
};

const parseStats = (raw: unknown): DocumentStats => {
  if (!isObject(raw)) {
    throw new Error('Contract mismatch: document stats response must be object');
  }

  return {
    document_count: expectNumber(raw.document_count, 'stats.document_count'),
    fragment_count: expectNumber(raw.fragment_count, 'stats.fragment_count'),
    qa_count: expectNumber(raw.qa_count, 'stats.qa_count'),
    indexed_count: expectOptionalNumber(raw.indexed_count, 'stats.indexed_count'),
    processing_count: expectOptionalNumber(raw.processing_count, 'stats.processing_count'),
    failed_count: expectOptionalNumber(raw.failed_count, 'stats.failed_count')
  };
};

const parseDocumentList = (raw: unknown, fallbackPage: number, fallbackPageSize: number): PagedListResponse<KnowledgeDocument> => {
  if (Array.isArray(raw)) {
    return {
      items: raw.map((item, index) => parseDocument(item, `documents[${index}]`)),
      total: raw.length,
      page: fallbackPage,
      page_size: fallbackPageSize
    };
  }

  if (!isObject(raw) || !Array.isArray(raw.items)) {
    throw new Error('Contract mismatch: document list response must be { items, total, page, page_size }');
  }

  return {
    items: raw.items.map((item, index) => parseDocument(item, `documents[${index}]`)),
    total: raw.total === undefined ? raw.items.length : expectNumber(raw.total, 'documents.total'),
    page: raw.page === undefined ? fallbackPage : expectNumber(raw.page, 'documents.page'),
    page_size: raw.page_size === undefined ? fallbackPageSize : expectNumber(raw.page_size, 'documents.page_size')
  };
};

const parseUploadResult = (raw: unknown): UploadDocumentResult => {
  if (!isObject(raw)) {
    throw new Error('Contract mismatch: upload response must be object');
  }

  return {
    document_id: expectString(raw.document_id, 'upload.document_id'),
    title: expectOptionalString(raw.title, 'upload.title'),
    file_name: expectString(raw.file_name, 'upload.file_name'),
    document_type: expectOptionalDocumentType(raw.document_type ?? raw.type, 'upload.document_type'),
    knowledge_base: expectOptionalString(raw.knowledge_base, 'upload.knowledge_base'),
    file_md5: expectOptionalString(raw.file_md5, 'upload.file_md5'),
    object_key: expectOptionalString(raw.object_key, 'upload.object_key'),
    status: expectString(raw.status, 'upload.status'),
    fragment_count: expectOptionalNumber(raw.fragment_count, 'upload.fragment_count'),
    generated_pending_qas: expectOptionalNumber(raw.generated_pending_qas, 'upload.generated_pending_qas'),
    ingestion_task_id: expectOptionalString(raw.ingestion_task_id, 'upload.ingestion_task_id'),
    sync_mode: expectOptionalUploadMode(raw.sync_mode, 'upload.sync_mode'),
    sync_status: expectOptionalString(raw.sync_status, 'upload.sync_status')
  };
};

const parseBatchSyncTask = (raw: unknown, path = 'batchSyncTask'): BatchSyncTaskStatus => {
  if (!isObject(raw)) {
    throw new Error(`Contract mismatch: ${path} must be object`);
  }

  return {
    task_id: expectString(raw.task_id, `${path}.task_id`),
    status: expectString(raw.status, `${path}.status`),
    queued_count: expectNumber(raw.queued_count, `${path}.queued_count`),
    processed_count: expectNumber(raw.processed_count, `${path}.processed_count`),
    success_count: expectNumber(raw.success_count, `${path}.success_count`),
    failed_count: expectNumber(raw.failed_count, `${path}.failed_count`),
    message: expectString(raw.message, `${path}.message`),
    started_at: expectOptionalString(raw.started_at, `${path}.started_at`),
    finished_at: expectOptionalString(raw.finished_at, `${path}.finished_at`),
    failed_documents: raw.failed_documents === undefined ? [] : expectStringArray(raw.failed_documents, `${path}.failed_documents`)
  };
};

const parseQAGenerationResult = (raw: unknown): QAGenerationStartResult => {
  if (!isObject(raw)) {
    throw new Error('Contract mismatch: qa generation start response must be object');
  }

  return {
    task_id: expectString(raw.task_id, 'qaGeneration.task_id'),
    document_id: expectString(raw.document_id, 'qaGeneration.document_id'),
    status: expectString(raw.status, 'qaGeneration.status'),
    generated_qas: expectNumber(raw.generated_qas, 'qaGeneration.generated_qas'),
    message: expectString(raw.message, 'qaGeneration.message')
  };
};

const parseIngestionTaskStatus = (raw: unknown): IngestionTaskStatus => {
  if (!isObject(raw)) {
    throw new Error('Contract mismatch: ingestion task status response must be object');
  }

  return {
    id: expectString(raw.id, 'ingestionTask.id'),
    document_id: expectString(raw.document_id, 'ingestionTask.document_id'),
    task_type: expectString(raw.task_type, 'ingestionTask.task_type'),
    status: expectString(raw.status, 'ingestionTask.status'),
    stage: expectString(raw.stage, 'ingestionTask.stage'),
    created_by_user_id: expectOptionalNumber(raw.created_by_user_id, 'ingestionTask.created_by_user_id'),
    total_fragments: expectNumber(raw.total_fragments, 'ingestionTask.total_fragments'),
    total_generated_qas: expectNumber(raw.total_generated_qas, 'ingestionTask.total_generated_qas'),
    retry_count: expectNumber(raw.retry_count, 'ingestionTask.retry_count'),
    error_message: expectOptionalString(raw.error_message, 'ingestionTask.error_message'),
    started_at: expectString(raw.started_at, 'ingestionTask.started_at'),
    finished_at: expectOptionalString(raw.finished_at, 'ingestionTask.finished_at'),
    created_at: expectString(raw.created_at, 'ingestionTask.created_at'),
    updated_at: expectString(raw.updated_at, 'ingestionTask.updated_at')
  };
};

const parseDownloadUrl = (raw: unknown): string => {
  if (typeof raw === 'string') {
    return raw;
  }

  if (!isObject(raw)) {
    throw new Error('Contract mismatch: download response must be string or object');
  }

  const candidates = [raw.download_url, raw.url, raw.signed_url];
  const url = candidates.find((value) => typeof value === 'string');
  if (!url || typeof url !== 'string') {
    throw new Error('Contract mismatch: download response missing download_url');
  }
  return url;
};

const buildListParams = (query: DocumentListQuery): Record<string, string | number> => {
  const params: Record<string, string | number> = {
    page: query.page,
    page_size: query.page_size,
    sort_by: query.sort_by ?? 'uploaded_at',
    order: query.order ?? 'desc'
  };

  if (query.keyword?.trim()) {
    params.keyword = query.keyword.trim();
  }

  if (query.file_type?.trim()) {
    params.file_type = query.file_type.trim();
  }

  if (query.document_type) {
    params.document_type = query.document_type;
  }

  if (query.knowledge_base?.trim()) {
    params.knowledge_base = query.knowledge_base.trim();
  }

  if (query.status) {
    params.status = query.status;
  }

  return params;
};

export const documentApi = {
  async getStats(): Promise<DocumentStats> {
    if (API_CONFIG.USE_MOCK) {
      return mockDocumentApi.getStats();
    }

    const response = await http.get<unknown>(API_CONFIG.ENDPOINTS.DOCUMENT_STATS);
    return parseStats(response.data);
  },

  async getList(query: DocumentListQuery): Promise<PagedListResponse<KnowledgeDocument>> {
    if (API_CONFIG.USE_MOCK) {
      return mockDocumentApi.getList(query);
    }

    const response = await http.get<unknown>(API_CONFIG.ENDPOINTS.DOCUMENT_LIST, {
      params: buildListParams(query)
    });

    return parseDocumentList(response.data, query.page ?? DEFAULT_PAGE, query.page_size ?? DEFAULT_PAGE_SIZE);
  },

  async uploadPair(payload: UploadDocumentPairPayload): Promise<UploadDocumentResult> {
    if (API_CONFIG.USE_MOCK) {
      return mockDocumentApi.uploadPair(payload);
    }

    const formData = new FormData();
    formData.append('file', payload.file);
    formData.append('metadata_csv', payload.metadata_csv);
    formData.append('upload_mode', payload.upload_mode ?? 'sync');

    const knowledgeBase = payload.knowledge_base?.trim() || 'default';
    formData.append('knowledge_base', knowledgeBase);

    if (payload.title?.trim()) {
      formData.append('title', payload.title.trim());
    }

    if (payload.document_type) {
      formData.append('document_type', payload.document_type);
    }

    if (payload.subdir.trim()) {
      formData.append('subdir', payload.subdir.trim());
    }

    const response = await http.post<unknown>(API_CONFIG.ENDPOINTS.DOCUMENT_UPLOAD, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });

    return parseUploadResult(response.data);
  },

  async startBatchSync(payload: BatchSyncStartPayload): Promise<BatchSyncTaskStatus> {
    if (API_CONFIG.USE_MOCK) {
      return mockDocumentApi.startBatchSync(payload);
    }

    const response = await http.post<unknown>(API_CONFIG.ENDPOINTS.DOCUMENT_BATCH_SYNC_START, payload);
    return parseBatchSyncTask(response.data, 'batchSyncStart');
  },

  async getBatchSyncTask(taskId: string): Promise<BatchSyncTaskStatus> {
    if (API_CONFIG.USE_MOCK) {
      return mockDocumentApi.getBatchSyncTask(taskId);
    }

    const response = await http.get<unknown>(API_CONFIG.ENDPOINTS.DOCUMENT_BATCH_SYNC_TASK(taskId));
    return parseBatchSyncTask(response.data, 'batchSyncTask');
  },

  async startQaGeneration(payload: QAGenerationPayload): Promise<QAGenerationStartResult> {
    if (API_CONFIG.USE_MOCK) {
      return mockDocumentApi.startQaGeneration(payload);
    }

    const requestBody: QAGenerationPayload = {
      document_id: payload.document_id,
      target_count: payload.target_count,
      mode: payload.mode
    };

    const response = await http.post<unknown>(API_CONFIG.ENDPOINTS.DOCUMENT_QA_GENERATION_START, requestBody);
    return parseQAGenerationResult(response.data);
  },

  async getQaGenerationTask(taskId: string): Promise<IngestionTaskStatus> {
    if (API_CONFIG.USE_MOCK) {
      return mockDocumentApi.getQaGenerationTask(taskId);
    }

    const response = await http.get<unknown>(API_CONFIG.ENDPOINTS.DOCUMENT_QA_GENERATION_TASK(taskId));
    return parseIngestionTaskStatus(response.data);
  },

  async getDownloadUrl(documentId: string): Promise<string> {
    if (API_CONFIG.USE_MOCK) {
      return mockDocumentApi.getDownloadUrl(documentId);
    }

    try {
      const response = await http.get<unknown>(API_CONFIG.ENDPOINTS.DOCUMENT_DOWNLOAD(documentId));
      return parseDownloadUrl(response.data);
    } catch (error) {
      if (isAxiosError(error) && error.response?.status === 501) {
        throw new Error('Backend has not implemented document download endpoint yet (501).');
      }
      throw error;
    }
  },

  async getDetail(documentId: string): Promise<KnowledgeDocument> {
    if (API_CONFIG.USE_MOCK) {
      return mockDocumentApi.getDetail(documentId);
    }

    const response = await http.get<unknown>(API_CONFIG.ENDPOINTS.DOCUMENT_RESOURCE(documentId));
    return parseDocument(response.data, 'documentDetail');
  },

  async remove(documentId: string): Promise<void> {
    if (API_CONFIG.USE_MOCK) {
      await mockDocumentApi.remove(documentId);
      return;
    }

    try {
      await http.delete(API_CONFIG.ENDPOINTS.DOCUMENT_RESOURCE(documentId));
    } catch (error) {
      if (isAxiosError(error) && error.response?.status === 501) {
        throw new Error('Backend has not implemented document delete endpoint yet (501).');
      }
      throw error;
    }
  }
};
