import type { App } from 'vue';
import { router } from '@/app/router';
import { pinia } from '@/app/pinia';

export const registerProviders = (app: App<Element>): void => {
  app.use(pinia);
  app.use(router);
};
