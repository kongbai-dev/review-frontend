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
  QABatchGenerationPayload,
  QABatchGenerationStartResult,
  QABatchGenerationTaskStatus,
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
  if (mode === 'sync' || mode === 'batch' || mode === 'batch_direct') {
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

  const itemsRaw = Array.isArray(raw.items) ? raw.items : [];

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

  const unmatchedRaw = Array.isArray(raw.unmatched_documents) ? raw.unmatched_documents : [];
  const orphanRaw = Array.isArray(raw.orphan_csv_files) ? raw.orphan_csv_files : [];

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

const parseQABatchGenerationStartResult = (raw: unknown): QABatchGenerationStartResult => {
  if (!isObject(raw)) {
    throw new Error('Contract mismatch: qa batch generation start response must be object');
  }

  const mode = expectString(raw.mode, 'qaBatchGeneration.mode');
  if (mode !== 'append' && mode !== 'replace') {
    throw new Error('Contract mismatch: qaBatchGeneration.mode must be append|replace');
  }

  return {
    batch_task_id: expectString(raw.batch_task_id, 'qaBatchGeneration.batch_task_id'),
    status: expectString(raw.status, 'qaBatchGeneration.status'),
    total_documents: expectNumber(raw.total_documents, 'qaBatchGeneration.total_documents'),
    queued_documents: expectNumber(raw.queued_documents, 'qaBatchGeneration.queued_documents'),
    target_count_per_document: expectNumber(raw.target_count_per_document, 'qaBatchGeneration.target_count_per_document'),
    mode,
    message: expectString(raw.message, 'qaBatchGeneration.message')
  };
};

const parseQABatchGenerationTaskStatus = (raw: unknown): QABatchGenerationTaskStatus => {
  if (!isObject(raw)) {
    throw new Error('Contract mismatch: qa batch generation task response must be object');
  }

  const mode = expectString(raw.mode, 'qaBatchTask.mode');
  if (mode !== 'append' && mode !== 'replace') {
    throw new Error('Contract mismatch: qaBatchTask.mode must be append|replace');
  }

  const stopRequestedRaw = raw.stop_requested;
  const itemsRaw = Array.isArray(raw.items) ? raw.items : [];

  return {
    batch_task_id: expectString(raw.batch_task_id, 'qaBatchTask.batch_task_id'),
    status: expectString(raw.status, 'qaBatchTask.status'),
    total_documents: expectNumber(raw.total_documents, 'qaBatchTask.total_documents'),
    queued_documents: expectOptionalNumber(raw.queued_documents, 'qaBatchTask.queued_documents') ?? 0,
    processed_documents: expectNumber(raw.processed_documents, 'qaBatchTask.processed_documents'),
    success_documents: expectNumber(raw.success_documents, 'qaBatchTask.success_documents'),
    failed_documents: expectNumber(raw.failed_documents, 'qaBatchTask.failed_documents'),
    skipped_documents: expectOptionalNumber(raw.skipped_documents, 'qaBatchTask.skipped_documents') ?? 0,
    target_count_per_document: expectNumber(raw.target_count_per_document, 'qaBatchTask.target_count_per_document'),
    mode,
    message: expectOptionalString(raw.message, 'qaBatchTask.message') ?? '',
    stop_requested: typeof stopRequestedRaw === 'boolean' ? stopRequestedRaw : false,
    started_at: raw.started_at === null ? null : expectOptionalString(raw.started_at, 'qaBatchTask.started_at'),
    finished_at: raw.finished_at === null ? null : expectOptionalString(raw.finished_at, 'qaBatchTask.finished_at'),
    items: itemsRaw.map((item, index) => {
      if (!isObject(item)) {
        throw new Error(`Contract mismatch: qaBatchTask.items[${index}] must be object`);
      }

      return {
        document_id: expectString(item.document_id, `qaBatchTask.items[${index}].document_id`),
        ingestion_task_id:
          item.ingestion_task_id === null
            ? null
            : expectOptionalString(item.ingestion_task_id, `qaBatchTask.items[${index}].ingestion_task_id`),
        status: expectString(item.status, `qaBatchTask.items[${index}].status`),
        generated_qas: expectOptionalNumber(item.generated_qas, `qaBatchTask.items[${index}].generated_qas`) ?? 0,
        error_message:
          item.error_message === null
            ? null
            : expectOptionalString(item.error_message, `qaBatchTask.items[${index}].error_message`),
        started_at:
          item.started_at === null
            ? null
            : expectOptionalString(item.started_at, `qaBatchTask.items[${index}].started_at`),
        finished_at:
          item.finished_at === null
            ? null
            : expectOptionalString(item.finished_at, `qaBatchTask.items[${index}].finished_at`),
        attempt_count: expectOptionalNumber(item.attempt_count, `qaBatchTask.items[${index}].attempt_count`) ?? 0,
        updated_at:
          item.updated_at === null
            ? null
            : expectOptionalString(item.updated_at, `qaBatchTask.items[${index}].updated_at`)
      };
    })
  };
};

const parseIngestionTaskStatus = (raw: unknown, fallbackTaskId = ''): IngestionTaskStatus => {
  if (!isObject(raw)) {
    throw new Error('Contract mismatch: ingestion task status response must be object');
  }

  const getString = (...candidates: unknown[]): string | undefined =>
    candidates.find((value): value is string => typeof value === 'string' && value.trim().length > 0);

  const status = getString(raw.status);
  if (!status) {
    throw new Error('Contract mismatch: ingestion task status missing status');
  }

  return {
    id: getString(raw.id, raw.task_id, raw.ingestion_task_id, fallbackTaskId) ?? fallbackTaskId,
    document_id: getString(raw.document_id) ?? '',
    task_type: getString(raw.task_type) ?? 'qa_generation',
    status,
    stage: getString(raw.stage) ?? '',
    created_by_user_id: expectOptionalNumber(raw.created_by_user_id, 'ingestionTask.created_by_user_id'),
    total_fragments: expectOptionalNumber(raw.total_fragments, 'ingestionTask.total_fragments') ?? 0,
    total_generated_qas: expectOptionalNumber(raw.total_generated_qas, 'ingestionTask.total_generated_qas') ?? 0,
    retry_count: expectOptionalNumber(raw.retry_count, 'ingestionTask.retry_count') ?? 0,
    error_message: expectOptionalString(raw.error_message, 'ingestionTask.error_message'),
    started_at: getString(raw.started_at) ?? '',
    finished_at: expectOptionalString(raw.finished_at, 'ingestionTask.finished_at'),
    created_at: getString(raw.created_at) ?? '',
    updated_at: getString(raw.updated_at) ?? ''
  };
};

const parseDownloadUrl = (raw: unknown): string => {
  if (typeof raw === 'string') {
    return raw;
  }

  if (!isObject(raw)) {
    throw new Error('Contract mismatch: download response must be string or object');
  }

  const candidates = [raw.download_url, raw.url, raw.signed_url, ...Object.values(raw)];
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
    formData.append('metadata_mode', payload.metadata_mode ?? 'auto');
    formData.append('upload_mode', 'sync');
    formData.append('knowledge_base', payload.knowledge_base?.trim() || 'default');

    if (payload.metadata_csv) {
      formData.append('metadata_csv', payload.metadata_csv);
    }

    if (payload.title?.trim()) {
      formData.append('title', payload.title.trim());
    }

    if (payload.document_type) {
      formData.append('document_type', payload.document_type);
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

  async batchUploadDirectDocFiles(payload: BatchUploadRequestPayload): Promise<BatchUploadResponse> {
    if (API_CONFIG.USE_MOCK) {
      const mockDocumentApi = await getDocumentMockApi();
      return mockDocumentApi.batchUploadDirectDocFiles(payload);
    }

    const formData = new FormData();
    payload.files.forEach((file) => {
      formData.append('files', file);
    });
    formData.append('knowledge_base', payload.knowledge_base?.trim() || 'default');

    const response = await http.post<unknown>(API_CONFIG.ENDPOINTS.DOCUMENT_BATCH_UPLOAD_DIRECT_DOC_FILES, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });

    return parseBatchUploadResponse(response.data, 'batchUploadDirectDocs');
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

  async getCurrentDirectBatchSession(knowledgeBase = 'default'): Promise<UploadSessionSummary> {
    if (API_CONFIG.USE_MOCK) {
      const mockDocumentApi = await getDocumentMockApi();
      return mockDocumentApi.getCurrentDirectBatchSession(knowledgeBase);
    }

    const response = await http.get<unknown>(API_CONFIG.ENDPOINTS.DOCUMENT_BATCH_UPLOAD_DIRECT_SESSION_CURRENT, {
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

  async startDirectBatchSync(payload: BatchSyncStartPayload): Promise<BatchSyncTaskStatus> {
    if (API_CONFIG.USE_MOCK) {
      const mockDocumentApi = await getDocumentMockApi();
      return mockDocumentApi.startDirectBatchSync(payload);
    }

    const response = await http.post<unknown>(API_CONFIG.ENDPOINTS.DOCUMENT_BATCH_SYNC_DIRECT_START, payload);
    return parseBatchSyncTask(response.data, 'batchDirectSyncStart');
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

  async startQaBatchGeneration(payload: QABatchGenerationPayload): Promise<QABatchGenerationStartResult> {
    if (API_CONFIG.USE_MOCK) {
      const mockDocumentApi = await getDocumentMockApi();
      return mockDocumentApi.startQaBatchGeneration(payload);
    }

    const requestBody: QABatchGenerationPayload = {
      document_ids: payload.document_ids,
      target_count: payload.target_count,
      mode: payload.mode,
      fail_fast: payload.fail_fast
    };

    const response = await http.post<unknown>(API_CONFIG.ENDPOINTS.DOCUMENT_QA_GENERATION_BATCH_START, requestBody);
    return parseQABatchGenerationStartResult(response.data);
  },

  async getQaGenerationTask(taskId: string): Promise<IngestionTaskStatus> {
    if (API_CONFIG.USE_MOCK) {
      const mockDocumentApi = await getDocumentMockApi();
      return mockDocumentApi.getQaGenerationTask(taskId);
    }

    const response = await http.get<unknown>(API_CONFIG.ENDPOINTS.DOCUMENT_QA_GENERATION_TASK(taskId));
    return parseIngestionTaskStatus(response.data, taskId);
  },

  async getQaBatchGenerationTask(batchTaskId: string): Promise<QABatchGenerationTaskStatus> {
    if (API_CONFIG.USE_MOCK) {
      const mockDocumentApi = await getDocumentMockApi();
      return mockDocumentApi.getQaBatchGenerationTask(batchTaskId);
    }

    const response = await http.get<unknown>(API_CONFIG.ENDPOINTS.DOCUMENT_QA_GENERATION_BATCH_TASK(batchTaskId));
    return parseQABatchGenerationTaskStatus(response.data);
  },

  async getDownloadUrl(documentId: string): Promise<string> {
    if (API_CONFIG.USE_MOCK) {
      const mockDocumentApi = await getDocumentMockApi();
      return mockDocumentApi.getDownloadUrl(documentId);
    }

    try {
      const response = await http.get<unknown>(API_CONFIG.ENDPOINTS.DOCUMENT_DOWNLOAD_URL(documentId));
      return parseDownloadUrl(response.data);
    } catch (error) {
      if (isAxiosError(error) && [404, 405, 501].includes(error.response?.status ?? 0)) {
        const legacyResponse = await http.get<unknown>(API_CONFIG.ENDPOINTS.DOCUMENT_DOWNLOAD(documentId));
        return parseDownloadUrl(legacyResponse.data);
      }
      throw error;
    }
  }
};
