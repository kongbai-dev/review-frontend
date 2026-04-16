import { isAxiosError } from 'axios';
import { API_CONFIG } from '@/config';
import { expectNumber, expectOptionalNumber, expectOptionalString, expectString, expectStringArray, isObject } from '@/lib/contract';
import { http } from '@/services/http';
import type { PagedListResponse } from '@/types/api';
import type {
  BatchSyncSkippedDocument,
  BatchSyncStartPayload,
  BatchSyncTaskStatus,
  BatchUploadRequestPayload,
  BatchUploadResponse,
  DocumentListQuery,
  DocumentStats,
  DocumentStatus,
  DocumentType,
  IngestionTaskStatus,
  KnowledgeDocument,
  QAGenerationPayload,
  QAGenerationStartResult,
  UploadSessionSummary,
  UploadSyncDocumentPayload,
  UploadDocumentResult,
  UploadMode
} from '@/types/domain';

const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 20;

let documentMockApiPromise: Promise<typeof import('@/services/mock/document.mock').mockDocumentApi> | null = null;

const getDocumentMockApi = async (): Promise<typeof import('@/services/mock/document.mock').mockDocumentApi> => {
  if (!documentMockApiPromise) {
    documentMockApiPromise = import('@/services/mock/document.mock').then((module) => module.mockDocumentApi);
  }
  return documentMockApiPromise;
};

const expectDocumentStatus = (value: unknown, path: string): DocumentStatus => {
  return expectString(value, path);
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

const parseSkippedDocuments = (value: unknown, path: string): BatchSyncSkippedDocument[] => {
  if (value === undefined || value === null) {
    return [];
  }

  if (!Array.isArray(value)) {
    throw new Error(`Contract mismatch: ${path} must be array`);
  }

  return value.map((item, index) => {
    if (!isObject(item)) {
      throw new Error(`Contract mismatch: ${path}[${index}] must be object`);
    }
    return {
      document_id: expectOptionalString(item.document_id, `${path}[${index}].document_id`),
      file_name: expectOptionalString(item.file_name, `${path}[${index}].file_name`),
      reason: expectOptionalString(item.reason, `${path}[${index}].reason`),
      ...item
    };
  });
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
    file_type: expectOptionalString(raw.file_type, `${path}.file_type`) ?? 'unknown',
    file_size: expectOptionalNumber(raw.file_size, `${path}.file_size`) ?? 0,
    uploaded_at: expectOptionalString(raw.uploaded_at, `${path}.uploaded_at`) ?? '',
    uploaded_by: expectOptionalString(raw.uploaded_by, `${path}.uploaded_by`) ?? '',
    uploaded_by_name: expectOptionalString(raw.uploaded_by_name, `${path}.uploaded_by_name`),
    document_type: expectOptionalDocumentType(raw.document_type ?? raw.type, `${path}.document_type`),
    knowledge_base: expectOptionalString(raw.knowledge_base, `${path}.knowledge_base`),
    status: expectDocumentStatus(raw.status, `${path}.status`),
    fragment_count: expectOptionalNumber(raw.fragment_count, `${path}.fragment_count`) ?? 0,
    qa_count: expectOptionalNumber(raw.qa_count, `${path}.qa_count`) ?? 0,
    sync_mode: expectOptionalUploadMode(raw.sync_mode, `${path}.sync_mode`),
    sync_status: expectOptionalString(raw.sync_status, `${path}.sync_status`),
    local_file_path: expectOptionalString(raw.local_file_path, `${path}.local_file_path`),
    local_csv_path: expectOptionalString(raw.local_csv_path, `${path}.local_csv_path`),
    upload_session_id: expectOptionalString(raw.upload_session_id, `${path}.upload_session_id`),
    pair_status: expectOptionalString(raw.pair_status, `${path}.pair_status`),
    pair_error: expectOptionalString(raw.pair_error, `${path}.pair_error`),
    csv_file_name: expectOptionalString(raw.csv_file_name, `${path}.csv_file_name`),
    file_md5: expectOptionalString(raw.file_md5, `${path}.file_md5`),
    object_key: expectOptionalString(raw.object_key, `${path}.object_key`),
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

const parseBatchUploadResponse = (raw: unknown, path = 'batchUpload'): BatchUploadResponse => {
  if (!isObject(raw)) {
    throw new Error(`Contract mismatch: ${path} response must be object`);
  }

  const itemsRaw = raw.items;
  if (!Array.isArray(itemsRaw)) {
    throw new Error(`Contract mismatch: ${path}.items must be array`);
  }

  return {
    session_id: expectString(raw.session_id, `${path}.session_id`),
    knowledge_base: expectString(raw.knowledge_base, `${path}.knowledge_base`),
    total_files: expectNumber(raw.total_files, `${path}.total_files`),
    accepted_count: expectNumber(raw.accepted_count, `${path}.accepted_count`),
    rejected_count: expectNumber(raw.rejected_count, `${path}.rejected_count`),
    paired_count: expectOptionalNumber(raw.paired_count, `${path}.paired_count`) ?? 0,
    unpaired_count: expectOptionalNumber(raw.unpaired_count, `${path}.unpaired_count`) ?? 0,
    items: itemsRaw.map((item, index) => {
      if (!isObject(item)) {
        throw new Error(`Contract mismatch: ${path}.items[${index}] must be object`);
      }

      return {
        file_name: expectString(item.file_name, `${path}.items[${index}].file_name`),
        status: expectString(item.status, `${path}.items[${index}].status`),
        message: expectOptionalString(item.message, `${path}.items[${index}].message`),
        document_id: expectOptionalString(item.document_id, `${path}.items[${index}].document_id`),
        csv_id: expectOptionalString(item.csv_id, `${path}.items[${index}].csv_id`)
      };
    })
  };
};

const parseUploadSessionSummary = (raw: unknown): UploadSessionSummary => {
  if (!isObject(raw)) {
    throw new Error('Contract mismatch: upload session summary response must be object');
  }

  const unmatchedRaw = raw.unmatched_documents;
  const orphanRaw = raw.orphan_csv_files;

  if (!Array.isArray(unmatchedRaw) || !Array.isArray(orphanRaw)) {
    throw new Error('Contract mismatch: unmatched_documents/orphan_csv_files must be array');
  }

  return {
    session_id: expectOptionalString(raw.session_id, 'session.session_id'),
    status: expectOptionalString(raw.status, 'session.status'),
    knowledge_base: expectString(raw.knowledge_base, 'session.knowledge_base'),
    doc_file_count: expectOptionalNumber(raw.doc_file_count, 'session.doc_file_count') ?? 0,
    csv_file_count: expectOptionalNumber(raw.csv_file_count, 'session.csv_file_count') ?? 0,
    paired_count: expectOptionalNumber(raw.paired_count, 'session.paired_count') ?? 0,
    unpaired_count: expectOptionalNumber(raw.unpaired_count, 'session.unpaired_count') ?? 0,
    unmatched_documents: unmatchedRaw.map((item, index) => {
      if (!isObject(item)) {
        throw new Error(`Contract mismatch: unmatched_documents[${index}] must be object`);
      }
      return {
        document_id: expectString(item.document_id, `session.unmatched_documents[${index}].document_id`),
        file_name: expectString(item.file_name, `session.unmatched_documents[${index}].file_name`),
        pair_status: expectString(item.pair_status, `session.unmatched_documents[${index}].pair_status`),
        pair_error: expectOptionalString(item.pair_error, `session.unmatched_documents[${index}].pair_error`)
      };
    }),
    orphan_csv_files: orphanRaw.map((item, index) => {
      if (!isObject(item)) {
        throw new Error(`Contract mismatch: orphan_csv_files[${index}] must be object`);
      }
      return {
        file_name: expectString(item.file_name, `session.orphan_csv_files[${index}].file_name`),
        parse_status: expectString(item.parse_status, `session.orphan_csv_files[${index}].parse_status`),
        parse_error: expectOptionalString(item.parse_error, `session.orphan_csv_files[${index}].parse_error`)
      };
    })
  };
};

const parseBatchSyncTask = (raw: unknown, path = 'batchSyncTask'): BatchSyncTaskStatus => {
  if (!isObject(raw)) {
    throw new Error(`Contract mismatch: ${path} must be object`);
  }

  return {
    task_id: expectString(raw.task_id, `${path}.task_id`),
    status: expectString(raw.status, `${path}.status`),
    session_id: expectOptionalString(raw.session_id, `${path}.session_id`),
    queued_count: expectNumber(raw.queued_count, `${path}.queued_count`),
    processed_count: expectNumber(raw.processed_count, `${path}.processed_count`),
    success_count: expectNumber(raw.success_count, `${path}.success_count`),
    failed_count: expectNumber(raw.failed_count, `${path}.failed_count`),
    skipped_count: expectOptionalNumber(raw.skipped_count, `${path}.skipped_count`) ?? 0,
    message: expectOptionalString(raw.message, `${path}.message`) ?? '',
    started_at: expectOptionalString(raw.started_at, `${path}.started_at`),
    finished_at: expectOptionalString(raw.finished_at, `${path}.finished_at`),
    failed_documents: raw.failed_documents === undefined ? [] : expectStringArray(raw.failed_documents, `${path}.failed_documents`),
    skipped_documents: parseSkippedDocuments(raw.skipped_documents, `${path}.skipped_documents`)
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
      const mockDocumentApi = await getDocumentMockApi();
      return mockDocumentApi.getStats();
    }

    const response = await http.get<unknown>(API_CONFIG.ENDPOINTS.DOCUMENT_STATS);
    return parseStats(response.data);
  },

  async getList(query: DocumentListQuery): Promise<PagedListResponse<KnowledgeDocument>> {
    if (API_CONFIG.USE_MOCK) {
      const mockDocumentApi = await getDocumentMockApi();
      return mockDocumentApi.getList(query);
    }

    const response = await http.get<unknown>(API_CONFIG.ENDPOINTS.DOCUMENT_LIST, {
      params: buildListParams(query)
    });

    return parseDocumentList(response.data, query.page ?? DEFAULT_PAGE, query.page_size ?? DEFAULT_PAGE_SIZE);
  },

  async uploadSyncDocument(payload: UploadSyncDocumentPayload): Promise<UploadDocumentResult> {
    if (API_CONFIG.USE_MOCK) {
      const mockDocumentApi = await getDocumentMockApi();
      return mockDocumentApi.uploadSyncDocument(payload);
    }

    const formData = new FormData();
    formData.append('file', payload.file);
    formData.append('metadata_csv', payload.metadata_csv);
    formData.append('upload_mode', 'sync');
    formData.append('knowledge_base', payload.knowledge_base?.trim() || 'default');

    if (payload.title?.trim()) {
      formData.append('title', payload.title.trim());
    }

    if (payload.document_type) {
      formData.append('document_type', payload.document_type);
    }

    if (payload.subdir?.trim()) {
      formData.append('subdir', payload.subdir.trim());
    }

    const response = await http.post<unknown>(API_CONFIG.ENDPOINTS.DOCUMENT_UPLOAD, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });

    return parseUploadResult(response.data);
  },

  async batchUploadDocFiles(payload: BatchUploadRequestPayload): Promise<BatchUploadResponse> {
    if (API_CONFIG.USE_MOCK) {
      const mockDocumentApi = await getDocumentMockApi();
      return mockDocumentApi.batchUploadDocFiles(payload);
    }

    const formData = new FormData();
    payload.files.forEach((file) => {
      formData.append('files', file);
    });
    formData.append('knowledge_base', payload.knowledge_base?.trim() || 'default');

    const response = await http.post<unknown>(API_CONFIG.ENDPOINTS.DOCUMENT_BATCH_UPLOAD_DOC_FILES, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });

    return parseBatchUploadResponse(response.data, 'batchUploadDocs');
  },

  async batchUploadCsvFiles(payload: BatchUploadRequestPayload): Promise<BatchUploadResponse> {
    if (API_CONFIG.USE_MOCK) {
      const mockDocumentApi = await getDocumentMockApi();
      return mockDocumentApi.batchUploadCsvFiles(payload);
    }

    const formData = new FormData();
    payload.files.forEach((file) => {
      formData.append('files', file);
    });
    formData.append('knowledge_base', payload.knowledge_base?.trim() || 'default');

    const response = await http.post<unknown>(API_CONFIG.ENDPOINTS.DOCUMENT_BATCH_UPLOAD_CSV_FILES, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });

    return parseBatchUploadResponse(response.data, 'batchUploadCsv');
  },

  async getCurrentBatchSession(knowledgeBase = 'default'): Promise<UploadSessionSummary> {
    if (API_CONFIG.USE_MOCK) {
      const mockDocumentApi = await getDocumentMockApi();
      return mockDocumentApi.getCurrentBatchSession(knowledgeBase);
    }

    const response = await http.get<unknown>(API_CONFIG.ENDPOINTS.DOCUMENT_BATCH_UPLOAD_SESSION_CURRENT, {
      params: {
        knowledge_base: knowledgeBase
      }
    });

    return parseUploadSessionSummary(response.data);
  },

  async startBatchSync(payload: BatchSyncStartPayload): Promise<BatchSyncTaskStatus> {
    if (API_CONFIG.USE_MOCK) {
      const mockDocumentApi = await getDocumentMockApi();
      return mockDocumentApi.startBatchSync(payload);
    }

    const response = await http.post<unknown>(API_CONFIG.ENDPOINTS.DOCUMENT_BATCH_SYNC_START, payload);
    return parseBatchSyncTask(response.data, 'batchSyncStart');
  },

  async getBatchSyncTask(taskId: string): Promise<BatchSyncTaskStatus> {
    if (API_CONFIG.USE_MOCK) {
      const mockDocumentApi = await getDocumentMockApi();
      return mockDocumentApi.getBatchSyncTask(taskId);
    }

    const response = await http.get<unknown>(API_CONFIG.ENDPOINTS.DOCUMENT_BATCH_SYNC_TASK(taskId));
    return parseBatchSyncTask(response.data, 'batchSyncTask');
  },

  async startQaGeneration(payload: QAGenerationPayload): Promise<QAGenerationStartResult> {
    if (API_CONFIG.USE_MOCK) {
      const mockDocumentApi = await getDocumentMockApi();
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
      const mockDocumentApi = await getDocumentMockApi();
      return mockDocumentApi.getQaGenerationTask(taskId);
    }

    const response = await http.get<unknown>(API_CONFIG.ENDPOINTS.DOCUMENT_QA_GENERATION_TASK(taskId));
    return parseIngestionTaskStatus(response.data);
  },

  async getDownloadUrl(documentId: string): Promise<string> {
    if (API_CONFIG.USE_MOCK) {
      const mockDocumentApi = await getDocumentMockApi();
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
  }
};
