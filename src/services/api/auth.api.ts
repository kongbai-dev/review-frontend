import { API_CONFIG } from '@/config';
import { http } from '@/services/http';
import type { LoginPayload, MeInfo, SessionInfo, UserRole } from '@/types/domain';

const normalizeRole = (role: string): UserRole => {
  if (role === 'admin' || role === 'reviewer' || role === 'viewer') {
    return role;
  }

  if (role === 'observer') {
    return 'viewer';
  }

  throw new Error(`未知角色: ${role}`);
};

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

export const authApi = {
  async login(payload: LoginPayload): Promise<SessionInfo> {
    if (!payload.username?.trim() || !payload.password?.trim()) {
      throw new Error('用户名和密码不能为空');
    }

    if (API_CONFIG.USE_MOCK) {
      return {
        token: `mock-token-${payload.username}`,
        username: payload.username,
        role: 'reviewer'
      };
    }

    const response = await http.post<unknown>(API_CONFIG.ENDPOINTS.AUTH_LOGIN, {
      username: payload.username,
      password: payload.password
    });

    const data = response.data;
    if (!isObject(data)) {
      throw new Error('登录响应格式错误');
    }

    const token = data.token;
    const username = data.username;
    const role = data.role;

    if (typeof token !== 'string' || typeof username !== 'string' || typeof role !== 'string') {
      throw new Error('登录响应字段缺失');
    }

    return {
      token,
      username,
      role: normalizeRole(role)
    };
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

    const response = await http.get<unknown>(API_CONFIG.ENDPOINTS.AUTH_ME);
    const data = response.data;

    if (!isObject(data)) {
      throw new Error('用户信息响应格式错误');
    }

    if (typeof data.id !== 'number' || typeof data.username !== 'string' || typeof data.role !== 'string') {
      throw new Error('用户信息字段缺失');
    }

    return {
      id: data.id,
      username: data.username,
      role: normalizeRole(data.role),
      name: typeof data.name === 'string' ? data.name : undefined,
      status: typeof data.status === 'string' ? data.status : undefined,
      created_at: typeof data.created_at === 'string' ? data.created_at : undefined
    };
  },

  async logout(): Promise<void> {
    if (API_CONFIG.USE_MOCK) {
      return;
    }

    await http.post(API_CONFIG.ENDPOINTS.AUTH_LOGOUT, {});
  }
};
