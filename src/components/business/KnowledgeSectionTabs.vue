<template>
  <div class="flex flex-wrap items-center gap-2 rounded-xl border border-[var(--color-border)] bg-[color:color-mix(in_srgb,var(--color-surface-strong)_34%,transparent)] p-2">
    <RouterLink
      v-for="item in items"
      :key="item.to"
      :to="item.to"
      class="inline-flex items-center justify-center rounded-lg px-3 py-2 text-sm font-medium transition-colors"
      :class="isActive(item.to) ? 'bg-[var(--color-primary)] text-white shadow-[0_10px_30px_-18px_var(--color-shadow)]' : 'text-[var(--color-text-secondary)] hover:bg-[color:color-mix(in_srgb,var(--color-primary)_8%,transparent)] hover:text-[var(--color-text-primary)]'"
    >
      {{ item.label }}
    </RouterLink>
  </div>
</template>

<script setup lang="ts">
import { useRoute } from 'vue-router';

const route = useRoute();

const items = [
  { label: '文档', to: '/documents' },
  { label: '代码', to: '/documents/code' },
  { label: '数据', to: '/documents/data' }
];

const isActive = (target: string): boolean => route.path === target;
</script>
