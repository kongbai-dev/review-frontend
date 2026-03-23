<template>
  <div class="app-shell flex h-screen flex-col overflow-hidden">
    <header class="app-header shrink-0 border-b">
      <div class="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-4">
        <div>
          <p class="text-sm font-medium text-[var(--color-primary)]">半导体智能知识库</p>
          <h1 class="text-xl font-semibold">审核前端工作台</h1>
        </div>

        <div class="flex items-center gap-2">
          <button
            type="button"
            class="btn btn-ghost btn-sm !px-3"
            :title="uiStore.theme === 'dark' ? '切换到日间模式' : '切换到夜间模式'"
            @click="uiStore.toggleTheme()"
          >
            <svg v-if="uiStore.theme === 'dark'" class="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
              <circle cx="12" cy="12" r="4" />
              <path d="M12 2v2.5M12 19.5V22M4.93 4.93l1.77 1.77M17.3 17.3l1.77 1.77M2 12h2.5M19.5 12H22M4.93 19.07l1.77-1.77M17.3 6.7l1.77-1.77" />
            </svg>
            <svg v-else class="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
              <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z" />
            </svg>
            <span class="sr-only">{{ uiStore.theme === 'dark' ? '切换到日间模式' : '切换到夜间模式' }}</span>
          </button>
          <button type="button" class="btn btn-danger btn-sm" @click="onLogout">退出</button>
        </div>
      </div>
    </header>

    <div class="mx-auto grid min-h-0 w-full max-w-7xl flex-1 gap-4 overflow-hidden px-4 py-4 lg:grid-cols-[220px,minmax(0,1fr)]">
      <aside class="surface-panel min-h-0 rounded-[1.5rem] p-3">
        <nav class="flex flex-col gap-2">
          <RouterLink
            v-for="item in navItems"
            :key="item.to"
            :to="item.to"
            class="nav-link"
            active-class="nav-link-active"
          >
            {{ item.label }}
          </RouterLink>
        </nav>
      </aside>

      <main class="surface-panel min-h-0 overflow-y-auto rounded-[1.7rem] p-4 sm:p-5">
        <RouterView v-slot="{ Component, route }">
          <Transition name="page" mode="out-in">
            <component :is="Component" :key="route.fullPath" />
          </Transition>
        </RouterView>
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth.store';
import { useUIStore } from '@/stores/ui.store';

const router = useRouter();
const authStore = useAuthStore();
const uiStore = useUIStore();

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
