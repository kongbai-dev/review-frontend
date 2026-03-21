<template>
  <div class="min-h-screen bg-[var(--color-bg)] text-slate-100">
    <header class="border-b border-white/10 bg-[var(--color-surface)]/80 backdrop-blur">
      <div class="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <div>
          <p class="text-sm text-amber-300">半导体智能知识库</p>
          <h1 class="text-lg font-semibold">审核前端工作台</h1>
        </div>
        <button
          type="button"
          class="rounded-md bg-red-500 px-3 py-1 text-sm font-medium text-white hover:bg-red-400"
          @click="onLogout"
        >
          退出
        </button>
      </div>
    </header>

    <div class="mx-auto grid max-w-6xl gap-4 px-4 py-4 md:grid-cols-[220px,1fr]">
      <aside class="rounded-xl border border-white/10 bg-[var(--color-surface)] p-3">
        <nav class="space-y-2">
          <RouterLink
            v-for="item in navItems"
            :key="item.to"
            :to="item.to"
            class="block rounded-md px-3 py-2 text-sm text-slate-200 hover:bg-white/10"
            active-class="bg-white/15 text-white"
          >
            {{ item.label }}
          </RouterLink>
        </nav>
      </aside>

      <main class="min-h-[70vh] rounded-xl border border-white/10 bg-[var(--color-surface)] p-4">
        <RouterView />
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth.store';

const router = useRouter();
const authStore = useAuthStore();

const navItems = [
  { label: '待审队列', to: '/reviews' },
  { label: '统计面板', to: '/dashboard' },
  { label: '审核历史', to: '/history' }
];

const onLogout = (): void => {
  authStore.logout();
  void router.push('/login');
};
</script>
