import { defineStore } from 'pinia';
import { API_CONFIG } from '@/config';
import { authApi } from '@/services/api/auth.api';
import type { LoginPayload, SessionInfo, UserRole } from '@/types/domain';

interface AuthState {
  token: string;
  username: string;
  role: UserRole;
  sessionChecked: boolean;
}

const defaultRole = (localStorage.getItem(API_CONFIG.AUTH_ROLE_KEY) as UserRole | null) || 'reviewer';

export const useAuthStore = defineStore('auth', {
  state: (): AuthState => ({
    token: localStorage.getItem(API_CONFIG.AUTH_TOKEN_KEY) || '',
    username: localStorage.getItem(API_CONFIG.AUTH_USERNAME_KEY) || '',
    role: defaultRole,
    sessionChecked: false
  }),

  getters: {
    isAuthenticated: (state): boolean => Boolean(state.token)
  },

  actions: {
    persistSession(session: SessionInfo): void {
      this.token = session.token;
      this.username = session.username;
      this.role = session.role;
      localStorage.setItem(API_CONFIG.AUTH_TOKEN_KEY, session.token);
      localStorage.setItem(API_CONFIG.AUTH_ROLE_KEY, session.role);
      localStorage.setItem(API_CONFIG.AUTH_USERNAME_KEY, session.username);
    },

    async login(payload: LoginPayload): Promise<void> {
      const session = await authApi.login(payload);
      this.persistSession(session);
      this.sessionChecked = true;
    },

    async ensureSession(): Promise<void> {
      if (this.sessionChecked) {
        return;
      }

      if (!this.token) {
        this.sessionChecked = true;
        return;
      }

      try {
        const me = await authApi.me();
        this.username = me.username;
        this.role = me.role;
        localStorage.setItem(API_CONFIG.AUTH_ROLE_KEY, me.role);
        localStorage.setItem(API_CONFIG.AUTH_USERNAME_KEY, me.username);
      } catch {
        this.clearSession();
      } finally {
        this.sessionChecked = true;
      }
    },

    clearSession(): void {
      this.token = '';
      this.username = '';
      this.role = 'reviewer';
      localStorage.removeItem(API_CONFIG.AUTH_TOKEN_KEY);
      localStorage.removeItem(API_CONFIG.AUTH_ROLE_KEY);
      localStorage.removeItem(API_CONFIG.AUTH_USERNAME_KEY);
    },

    async logout(): Promise<void> {
      if (this.token) {
        try {
          await authApi.logout();
        } catch {
          // ignore logout network errors
        }
      }
      this.clearSession();
      this.sessionChecked = true;
    }
  }
});
