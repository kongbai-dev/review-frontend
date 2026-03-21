import type { LoginPayload, SessionInfo } from '@/types/domain';

export const authApi = {
  async login(payload: LoginPayload): Promise<SessionInfo> {
    if (!payload.username || !payload.password) {
      throw new Error('用户名和密码不能为空');
    }

    return {
      token: `mock-token-${payload.username}`,
      username: payload.username,
      role: payload.role
    };
  }
};
