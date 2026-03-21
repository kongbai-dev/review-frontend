<template>
  <section class="space-y-4">
    <header class="flex items-center justify-between">
      <h2 class="text-lg font-semibold">审核统计</h2>
      <button class="rounded-md bg-sky-500 px-3 py-1.5 text-sm font-semibold text-black" @click="refresh">刷新</button>
    </header>

    <div class="grid gap-3 md:grid-cols-3">
      <article class="rounded-lg border border-white/10 bg-black/20 p-4">
        <p class="text-xs text-slate-300">待审核</p>
        <p class="mt-2 text-2xl font-semibold text-amber-300">{{ qaStore.stats.pending }}</p>
      </article>
      <article class="rounded-lg border border-white/10 bg-black/20 p-4">
        <p class="text-xs text-slate-300">已审核</p>
        <p class="mt-2 text-2xl font-semibold text-emerald-300">{{ qaStore.stats.reviewed }}</p>
      </article>
      <article class="rounded-lg border border-white/10 bg-black/20 p-4">
        <p class="text-xs text-slate-300">已废弃</p>
        <p class="mt-2 text-2xl font-semibold text-rose-300">{{ qaStore.stats.deprecated }}</p>
      </article>
    </div>
  </section>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import { useQAStore } from '@/stores/qa.store';

const qaStore = useQAStore();

const refresh = async (): Promise<void> => {
  await qaStore.fetchStats();
};

onMounted(async () => {
  await qaStore.fetchStats();
});
</script>
