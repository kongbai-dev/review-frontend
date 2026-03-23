import { defineStore } from 'pinia';

type UILevel = 'info' | 'success' | 'error';
type ThemeMode = 'dark' | 'light';

const THEME_KEY = 'review_theme_mode';

const applyTheme = (theme: ThemeMode): void => {
  document.documentElement.dataset.theme = theme;
  document.documentElement.style.colorScheme = theme;
};

const getInitialTheme = (): ThemeMode => {
  const saved = localStorage.getItem(THEME_KEY);
  return saved === 'light' ? 'light' : 'dark';
};

interface UIState {
  message: string;
  level: UILevel;
  theme: ThemeMode;
}

export const useUIStore = defineStore('ui', {
  state: (): UIState => ({
    message: '',
    level: 'info',
    theme: getInitialTheme()
  }),

  actions: {
    notify(message: string, level: UILevel = 'info'): void {
      this.message = message;
      this.level = level;
    },

    clear(): void {
      this.message = '';
      this.level = 'info';
    },

    initializeTheme(): void {
      this.theme = getInitialTheme();
      applyTheme(this.theme);
    },

    setTheme(theme: ThemeMode): void {
      this.theme = theme;
      localStorage.setItem(THEME_KEY, theme);
      applyTheme(theme);
    },

    toggleTheme(): void {
      this.setTheme(this.theme === 'dark' ? 'light' : 'dark');
    }
  }
});
