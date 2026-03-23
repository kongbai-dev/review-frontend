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
    QA_PENDING: '/qa/pending',
    QA_RESOURCE: (id: string) => `/qa/${id}`,
    QA_STATS: '/qa/stats',
    QA_PAIRS: '/qa-pairs',
    QA_CREATE: import.meta.env.VITE_QA_CREATE_ENDPOINT || ''
  }
} as const;
