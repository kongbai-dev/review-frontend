<template>
  <div class="app-shell flex h-screen flex-col overflow-hidden">
    <header class="app-header shrink-0 border-b">
      <div class="mx-auto flex w-full max-w-[1400px] flex-wrap items-center justify-between gap-3 px-3 py-3 sm:px-4 sm:py-4">
        <div>
          <p class="text-sm font-medium text-[var(--color-primary)]">半导体智能知识库</p>
          <h1 class="text-xl font-semibold">审核前端工作台</h1>
        </div>

        <div class="flex items-center gap-2">
          <button type="button" class="btn btn-ghost btn-sm !px-3" @click="sidebarCollapsed = !sidebarCollapsed">
            <svg class="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
              <path v-if="sidebarCollapsed" d="M9 6l6 6-6 6" />
              <path v-else d="M15 6l-6 6 6 6" />
            </svg>
            <span class="hidden sm:inline">{{ sidebarCollapsed ? '展开导航' : '收起导航' }}</span>
            <span class="sr-only">{{ sidebarCollapsed ? '展开导航' : '收起导航' }}</span>
          </button>
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

    <div
      class="app-content-grid mx-auto grid min-h-0 w-full max-w-[1400px] flex-1 gap-3 overflow-hidden px-3 py-3 transition-[grid-template-columns] duration-200 sm:gap-4 sm:px-4 sm:py-4"
      :style="{ '--sidebar-width': sidebarCollapsed ? '78px' : '220px' }"
    >
      <aside class="surface-panel min-h-0 rounded-[1.35rem] p-2.5 sm:p-3">
        <nav class="flex flex-col gap-2">
          <RouterLink
            v-for="item in navItems"
            :key="item.to"
            :to="item.to"
            class="nav-link !flex items-center gap-2"
            :class="sidebarCollapsed ? 'justify-center !px-2.5' : 'justify-start !px-3'"
            :title="item.label"
            active-class="nav-link-active"
          >
            <svg class="size-[17px] shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
              <path
                v-if="item.icon === 'reviews'"
                d="M4 6.5h16M4 12h16M4 17.5h10M15.5 17.5l2 2 3-4"
              />
              <path
                v-else-if="item.icon === 'dashboard'"
                d="M4.5 13.5h4v6h-4zM10 9h4v10h-4zM15.5 5h4v14h-4z"
              />
              <path
                v-else-if="item.icon === 'documents'"
                d="M7 3.5h7l3.5 3.5v13H7zM14 3.5v4h3.5M9.5 12h6M9.5 15.5h6"
              />
              <path
                v-else-if="item.icon === 'members'"
                d="M8 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm8 1a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5ZM4.5 19c0-2.5 2.3-4.5 5.5-4.5s5.5 2 5.5 4.5M14 18c.5-1.7 2-3 4.5-3 1.1 0 2.1.2 3 .7"
              />
              <path
                v-else
                d="M7 4.5h10M7 9.5h10M7 14.5h7M4.5 4.5h.01M4.5 9.5h.01M4.5 14.5h.01M7 19.5h10"
              />
            </svg>
            <span v-show="!sidebarCollapsed">{{ item.label }}</span>
          </RouterLink>
        </nav>
      </aside>

      <main class="surface-panel min-h-0 overflow-y-auto rounded-[1.5rem] p-3.5 sm:p-5">
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
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth.store';
import { useUIStore } from '@/stores/ui.store';

const router = useRouter();
const authStore = useAuthStore();
const uiStore = useUIStore();
const sidebarCollapsed = ref(false);

const navItems = [
  { label: '待审队列', to: '/reviews', icon: 'reviews' },
  { label: '统计面板', to: '/dashboard', icon: 'dashboard' },
  { label: '文档管理', to: '/documents', icon: 'documents' },
  { label: '成员排行', to: '/members', icon: 'members' },
  { label: '审核历史', to: '/history', icon: 'history' }
];

const onLogout = async (): Promise<void> => {
  await authStore.logout();
  void router.push('/login');
};
</script>
