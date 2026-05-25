export type UserRole = 'admin' | 'reviewer' | 'observer';

const parseBoolean = (value: string | undefined, fallback: boolean): boolean => {
  if (value === undefined) return fallback;
  return value.toLowerCase() === 'true';
};

export const API_CONFIG = {
  BASE_URL: import.meta.env.VITE_API_BASE_URL || '/api/v1',
  USE_MOCK: parseBoolean(import.meta.env.VITE_USE_MOCK, true),
  TIMEOUT: Number(import.meta.env.VITE_API_TIMEOUT || 10000),
  QA_CREATE_ENDPOINT: import.meta.env.VITE_QA_CREATE_ENDPOINT || '',
  AUTH_TOKEN_KEY: 'review_auth_token',
  AUTH_ROLE_KEY: 'review_auth_role',
  AUTH_USERNAME_KEY: 'review_auth_username',
  ENDPOINTS: {
    AUTH_LOGIN: '/auth/login',
    AUTH_ME: '/auth/me',
    AUTH_LOGOUT: '/auth/logout',
    DOCUMENT_STATS: '/knowledge/documents/stats',
    DOCUMENT_LIST: '/knowledge/documents',
    DOCUMENT_UPLOAD: '/knowledge/documents',
    DOCUMENT_DOWNLOAD: (id: string) => `/knowledge/documents/${id}/download`,
    DOCUMENT_DOWNLOAD_URL: (id: string) => `/knowledge/documents/${id}/download-url`,
    DOCUMENT_BATCH_UPLOAD_DOC_FILES: '/knowledge/documents/batch-upload/doc-files',
    DOCUMENT_BATCH_UPLOAD_DIRECT_DOC_FILES: '/knowledge/documents/batch-upload/direct/doc-files',
    DOCUMENT_BATCH_UPLOAD_CSV_FILES: '/knowledge/documents/batch-upload/csv-files',
    DOCUMENT_BATCH_UPLOAD_SESSION_CURRENT: '/knowledge/documents/batch-upload/session/current',
    DOCUMENT_BATCH_UPLOAD_DIRECT_SESSION_CURRENT: '/knowledge/documents/batch-upload/direct/session/current',
    DOCUMENT_BATCH_SYNC_START: '/knowledge/documents/batch-sync/start',
    DOCUMENT_BATCH_SYNC_DIRECT_START: '/knowledge/documents/batch-sync/direct/start',
    DOCUMENT_BATCH_SYNC_TASK: (taskId: string) => `/knowledge/documents/batch-sync/tasks/${taskId}`,
    DOCUMENT_QA_GENERATION_START: '/knowledge/documents/qa-generation/start',
    DOCUMENT_QA_GENERATION_TASK: (taskId: string) => `/knowledge/documents/qa-generation/tasks/${taskId}`,
    DOCUMENT_QA_GENERATION_BATCH_START: '/knowledge/documents/qa-generation/batch-start',
    DOCUMENT_QA_GENERATION_BATCH_TASK: (batchTaskId: string) => `/knowledge/documents/qa-generation/batch-tasks/${batchTaskId}`,
    CODE_FILE_LIST: '/knowledge/code-files',
    CODE_FILE_UPLOAD: '/knowledge/code-files',
    CODE_FILE_DETAIL: (fileId: string) => `/knowledge/code-files/${fileId}`,
    CODE_FILE_DEPENDENCIES: (fileId: string) => `/knowledge/code-files/${fileId}/dependencies`,
    CODE_FILE_FRAGMENTS: (fileId: string) => `/knowledge/code-files/${fileId}/fragments`,
    DATASET_LIST: '/knowledge/datasets',
    DATASET_UPLOAD: '/knowledge/datasets/upload',
    DATASET_DETAIL: (datasetId: string) => `/knowledge/datasets/${datasetId}`,
    DATASET_DOWNLOAD: (datasetId: string) => `/knowledge/datasets/${datasetId}/download`,
    DATASET_PARSE: (datasetId: string) => `/knowledge/datasets/${datasetId}/parse`,
    DATASET_QAS: (datasetId: string) => `/knowledge/datasets/${datasetId}/qas`,
    DATASET_RECORDS: (datasetId: string) => `/knowledge/datasets/${datasetId}/records`,
    DATASET_VECTOR_SYNC: (datasetId: string) => `/knowledge/datasets/${datasetId}/vector-sync`,
    DATASET_QA_GENERATION_START: '/knowledge/datasets/qa-generation/start',
    DATASET_QA_GENERATION_TASK: (taskId: string) => `/knowledge/datasets/qa-generation/tasks/${taskId}`,
    MEMBER_RANKINGS: '/analytics/member-rankings',
    QA_PAIRS: '/qa-pairs',
    QA_RESOURCE: (id: string) => `/qa-pairs/${id}`,
    QA_STATS: '/qa-pairs/stats',
    QA_ASSIGNMENTS: '/qa-pairs/assignments',
    QA_CREATE: import.meta.env.VITE_QA_CREATE_ENDPOINT || ''
  }
} as const;

export const DOCUMENT_BATCH_SYNC_CONFIG = {
  min_batch_size: 1,
  max_wait_seconds: 300,
  max_docs: 200,
  max_workers: 8,
  include_failed: true,
  strict_pairing: false
} as const;

export const DOCUMENT_QA_BATCH_CONFIG = {
  fail_fast: false,
  polling_interval_ms: 2500,
  max_polls: 180
} as const;
