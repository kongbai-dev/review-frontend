<template>
  <section class="space-y-4">
    <header class="flex items-center justify-between">
      <h2 class="text-lg font-semibold">审核历史</h2>
      <button class="rounded-md bg-sky-500 px-3 py-1.5 text-sm font-semibold text-black" @click="refresh">刷新</button>
    </header>

    <article v-for="item in qaStore.history" :key="item.id" class="rounded-lg border border-white/10 bg-black/20 p-3">
      <p class="text-xs text-slate-300">{{ item.id }} | {{ item.status }} | v{{ item.version }}</p>
      <h3 class="mt-1 font-medium">{{ item.question }}</h3>
      <p class="mt-1 line-clamp-2 text-sm text-slate-300">{{ item.answer }}</p>
      <p class="mt-2 text-xs text-slate-400">{{ item.topics.join(' / ') }}</p>
    </article>

    <p v-if="qaStore.history.length === 0" class="text-sm text-slate-400">暂无历史记录。</p>
  </section>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import { useQAStore } from '@/stores/qa.store';

const qaStore = useQAStore();

const refresh = async (): Promise<void> => {
  await qaStore.fetchHistory();
};

onMounted(async () => {
  await qaStore.fetchHistory();
});
</script>
