import { isAxiosError } from 'axios';
import { API_CONFIG } from '@/config';
import { http } from '@/services/http';
import { mockDocumentApi } from '@/services/mock/document.mock';
import type { PagedListResponse } from '@/types/api';
import type { DocumentListQuery, DocumentStats, DocumentStatus, DocumentType, KnowledgeDocument, UploadDocumentResult } from '@/types/domain';

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
    indexed_count: raw.indexed_count === undefined ? undefined : expectNumber(raw.indexed_count, 'stats.indexed_count'),
    processing_count: raw.processing_count === undefined ? undefined : expectNumber(raw.processing_count, 'stats.processing_count'),
    failed_count: raw.failed_count === undefined ? undefined : expectNumber(raw.failed_count, 'stats.failed_count')
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
    fragment_count: raw.fragment_count === undefined ? undefined : expectNumber(raw.fragment_count, 'upload.fragment_count'),
    generated_pending_qas:
      raw.generated_pending_qas === undefined ? undefined : expectNumber(raw.generated_pending_qas, 'upload.generated_pending_qas'),
    ingestion_task_id: expectOptionalString(raw.ingestion_task_id, 'upload.ingestion_task_id')
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

  async upload(
    file: File,
    options: {
      knowledgeBase?: string;
      title?: string;
      documentType?: DocumentType;
    } = {}
  ): Promise<UploadDocumentResult> {
    if (API_CONFIG.USE_MOCK) {
      return mockDocumentApi.upload(file, options.knowledgeBase ?? 'default');
    }

    const formData = new FormData();
    formData.append('file', file);

    const knowledgeBase = options.knowledgeBase?.trim() || 'default';
    formData.append('knowledge_base', knowledgeBase);

    if (options.title?.trim()) {
      formData.append('title', options.title.trim());
    }

    if (options.documentType) {
      formData.append('document_type', options.documentType);
    }

    const response = await http.post<unknown>(API_CONFIG.ENDPOINTS.DOCUMENT_UPLOAD, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });

    return parseUploadResult(response.data);
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
