import { defineStore } from 'pinia';

interface UIState {
  message: string;
  level: 'info' | 'success' | 'error';
}

export const useUIStore = defineStore('ui', {
  state: (): UIState => ({
    message: '',
    level: 'info'
  }),
  actions: {
    notify(message: string, level: UIState['level'] = 'info'): void {
      this.message = message;
      this.level = level;
    },
    clear(): void {
      this.message = '';
      this.level = 'info';
    }
  }
});
