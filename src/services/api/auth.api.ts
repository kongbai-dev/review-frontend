import { isAxiosError } from 'axios';
import { API_CONFIG } from '@/config';
import { http } from '@/services/http';
import type { LoginPayload, MeInfo, SessionInfo, UserRole } from '@/types/domain';

const normalizeRole = (role: string): UserRole => {
  if (role === 'admin' || role === 'reviewer' || role === 'observer') {
    return role;
  }

  // Backward compatibility for old client cache / old backend value.
  if (role === 'viewer') {
    return 'observer';
  }

  throw new Error(`Unknown role: ${role}`);
};

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const extractErrorMessage = (error: unknown, fallback: string): string => {
  if (isAxiosError(error)) {
    const status = error.response?.status;
    const data = error.response?.data;

    if (isObject(data)) {
      const detail = data.detail;
      if (typeof detail === 'string' && detail.trim()) {
        return detail;
      }
      if (isObject(detail) && typeof detail.message === 'string' && detail.message.trim()) {
        return detail.message;
      }
      if (typeof data.message === 'string' && data.message.trim()) {
        return data.message;
      }
    }

    if (status === 401) {
      return 'Invalid username or password';
    }

    if (status === 403) {
      return 'Account is disabled';
    }
  }

  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  return fallback;
};

const parseUserInfo = (raw: unknown): MeInfo => {
  if (!isObject(raw)) {
    throw new Error('Invalid user payload');
  }

  if (typeof raw.id !== 'number' || typeof raw.username !== 'string' || typeof raw.role !== 'string') {
    throw new Error('User payload missing required fields');
  }

  return {
    id: raw.id,
    username: raw.username,
    role: normalizeRole(raw.role),
    name: typeof raw.name === 'string' ? raw.name : undefined,
    status: typeof raw.status === 'string' ? raw.status : undefined,
    created_at: typeof raw.created_at === 'string' ? raw.created_at : undefined,
    last_active_at: typeof raw.last_active_at === 'string' ? raw.last_active_at : undefined
  };
};

export const authApi = {
  async login(payload: LoginPayload): Promise<SessionInfo> {
    if (!payload.username?.trim() || !payload.password?.trim()) {
      throw new Error('Username and password are required');
    }

    if (API_CONFIG.USE_MOCK) {
      return {
        token: `mock-token-${payload.username}`,
        username: payload.username,
        role: 'reviewer'
      };
    }

    try {
      const response = await http.post<unknown>(API_CONFIG.ENDPOINTS.AUTH_LOGIN, {
        username: payload.username,
        password: payload.password
      });

      const data = response.data;
      if (!isObject(data)) {
        throw new Error('Invalid login response format');
      }

      if (typeof data.token !== 'string' || !data.token.trim()) {
        throw new Error('Login response missing token');
      }

      // Contract response: { token, user: {...} }
      if (isObject(data.user)) {
        const user = parseUserInfo(data.user);
        return {
          token: data.token,
          username: user.username,
          role: user.role
        };
      }

      // Backward compatibility for legacy responses: { token, username, role }
      if (typeof data.username === 'string' && typeof data.role === 'string') {
        return {
          token: data.token,
          username: data.username,
          role: normalizeRole(data.role)
        };
      }

      throw new Error('Login response missing user payload');
    } catch (error) {
      throw new Error(extractErrorMessage(error, 'Login failed'));
    }
  },

  async me(): Promise<MeInfo> {
    if (API_CONFIG.USE_MOCK) {
      return {
        id: 1,
        username: 'mock-user',
        role: 'reviewer',
        name: 'Mock User',
        status: 'active'
      };
    }

    try {
      const response = await http.get<unknown>(API_CONFIG.ENDPOINTS.AUTH_ME);
      return parseUserInfo(response.data);
    } catch (error) {
      throw new Error(extractErrorMessage(error, 'Failed to load current user'));
    }
  },

  async logout(): Promise<void> {
    if (API_CONFIG.USE_MOCK) {
      return;
    }

    try {
      await http.post(API_CONFIG.ENDPOINTS.AUTH_LOGOUT, {});
    } catch (error) {
      throw new Error(extractErrorMessage(error, 'Logout failed'));
    }
  }
};
