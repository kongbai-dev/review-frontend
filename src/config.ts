export type UserRole = 'admin' | 'reviewer' | 'viewer';

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
    DOCUMENT_RESOURCE: (id: string) => `/knowledge/documents/${id}`,
    DOCUMENT_DOWNLOAD: (id: string) => `/knowledge/documents/${id}/download`,
    MEMBER_RANKINGS: '/analytics/member-rankings',
    QA_PENDING: '/qa/pending',
    QA_RESOURCE: (id: string) => `/qa/${id}`,
    QA_STATS: '/qa/stats',
    QA_PAIRS: '/qa-pairs',
    QA_CREATE: import.meta.env.VITE_QA_CREATE_ENDPOINT || ''
  }
} as const;
