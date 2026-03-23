<template>
  <div class="app-shell flex min-h-screen items-center justify-center px-4 py-8">
    <div class="w-full max-w-5xl">
      <div class="mb-4 flex justify-end">
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
      </div>

      <div class="grid gap-5 lg:grid-cols-[1.15fr,0.85fr]">
        <section class="surface-panel rounded-[2rem] p-7 lg:p-10">
          <div class="max-w-xl">
            <p class="text-sm font-medium text-[var(--color-primary)]">Review Workspace</p>
            <h1 class="mt-3 text-3xl font-semibold leading-tight">让审核流程更清晰，也更顺手一点。</h1>
            <p class="text-muted mt-4 max-w-lg text-sm leading-6">
              当前界面默认支持 Mock 审核流。现在也提供日间/夜间切换、页面切换动画和更柔和的交互反馈，方便长时间使用。
            </p>
          </div>
        </section>

        <section class="surface-panel rounded-[2rem] p-6 lg:p-8">
          <RouterView v-slot="{ Component, route }">
            <Transition name="page" mode="out-in">
              <component :is="Component" :key="route.fullPath" />
            </Transition>
          </RouterView>
        </section>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useUIStore } from '@/stores/ui.store';

const uiStore = useUIStore();
</script>
