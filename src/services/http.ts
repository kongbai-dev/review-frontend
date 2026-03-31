import axios, { isAxiosError } from 'axios';
import { API_CONFIG } from '@/config';

export const http = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  timeout: API_CONFIG.TIMEOUT,
  headers: {
    'Content-Type': 'application/json'
  }
});

http.interceptors.request.use((config) => {
  const token = localStorage.getItem(API_CONFIG.AUTH_TOKEN_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

http.interceptors.response.use(
  (response) => response,
  (error) => {
    if (!isAxiosError(error)) {
      return Promise.reject(error);
    }

    const status = error.response?.status;
    const requestUrl = error.config?.url ?? '';
    const isLoginRequest = requestUrl.includes(API_CONFIG.ENDPOINTS.AUTH_LOGIN);

    if (status === 401 && !isLoginRequest) {
      localStorage.removeItem(API_CONFIG.AUTH_TOKEN_KEY);
      localStorage.removeItem(API_CONFIG.AUTH_ROLE_KEY);
      localStorage.removeItem(API_CONFIG.AUTH_USERNAME_KEY);

      if (!window.location.hash.includes('/login')) {
        window.location.hash = '#/login';
      }
    }

    return Promise.reject(error);
  }
);
