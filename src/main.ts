import { createApp } from 'vue';
import App from '@/App.vue';
import '@/style.css';
import 'katex/dist/katex.min.css';
import { registerProviders } from '@/app/providers';
import { useUIStore } from '@/stores/ui.store';

const app = createApp(App);
registerProviders(app);
useUIStore().initializeTheme();
app.mount('#app');
