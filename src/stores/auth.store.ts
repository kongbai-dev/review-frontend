import { defineStore } from 'pinia';
import { API_CONFIG } from '@/config';
import { authApi } from '@/services/api/auth.api';
import type { LoginPayload, SessionInfo, UserRole } from '@/types/domain';

interface AuthState {
  token: string;
  username: string;
  role: UserRole;
}

const defaultRole = (localStorage.getItem(API_CONFIG.AUTH_ROLE_KEY) as UserRole | null) || 'reviewer';

export const useAuthStore = defineStore('auth', {
  state: (): AuthState => ({
    token: localStorage.getItem(API_CONFIG.AUTH_TOKEN_KEY) || '',
    username: localStorage.getItem(API_CONFIG.AUTH_USERNAME_KEY) || '',
    role: defaultRole
  }),

  getters: {
    isAuthenticated: (state): boolean => Boolean(state.token)
  },

  actions: {
    async login(payload: LoginPayload): Promise<void> {
      const session: SessionInfo = await authApi.login(payload);
      this.token = session.token;
      this.username = session.username;
      this.role = session.role;
      localStorage.setItem(API_CONFIG.AUTH_TOKEN_KEY, session.token);
      localStorage.setItem(API_CONFIG.AUTH_ROLE_KEY, session.role);
      localStorage.setItem(API_CONFIG.AUTH_USERNAME_KEY, session.username);
    },

    logout(): void {
      this.token = '';
      this.username = '';
      this.role = 'reviewer';
      localStorage.removeItem(API_CONFIG.AUTH_TOKEN_KEY);
      localStorage.removeItem(API_CONFIG.AUTH_ROLE_KEY);
      localStorage.removeItem(API_CONFIG.AUTH_USERNAME_KEY);
    }
  }
});
