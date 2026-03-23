<template>
  <section class="space-y-4">
    <header class="flex items-center justify-between">
      <h2 class="text-lg font-semibold">审核历史</h2>
      <button class="btn btn-primary btn-sm" @click="refresh">刷新</button>
    </header>

    <article v-for="item in visibleHistory" :key="item.id" class="surface-card rounded-[1.35rem] p-4">
      <p class="text-muted text-xs">{{ item.id }} | {{ item.status }} | v{{ item.version }}</p>
      <h3 class="mt-1 font-medium">{{ item.question }}</h3>
      <p class="text-muted mt-1 line-clamp-2 text-sm">{{ item.answer }}</p>
      <p class="text-muted mt-2 text-xs">{{ item.topics.join(' / ') }}</p>
    </article>

    <PaginationControls
      :page="page"
      :page-size="pageSize"
      :total="qaStore.history.length"
      :page-size-options="[5, 10, 20]"
      @update:page="page = $event"
      @update:page-size="updatePageSize"
    />

    <p v-if="qaStore.history.length === 0" class="text-muted text-sm">暂无历史记录。</p>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import PaginationControls from '@/components/business/PaginationControls.vue';
import { useQAStore } from '@/stores/qa.store';

const qaStore = useQAStore();
const page = ref(1);
const pageSize = ref(5);

const totalPages = computed(() => Math.max(1, Math.ceil(qaStore.history.length / pageSize.value)));

const visibleHistory = computed(() => {
  const start = (page.value - 1) * pageSize.value;
  return qaStore.history.slice(start, start + pageSize.value);
});

const updatePageSize = (value: number): void => {
  pageSize.value = value;
  page.value = 1;
};

const refresh = async (): Promise<void> => {
  await qaStore.fetchHistory();
};

watch(
  () => qaStore.history.length,
  () => {
    if (page.value > totalPages.value) {
      page.value = totalPages.value;
    }
  }
);

onMounted(async () => {
  await qaStore.fetchHistory();
});
</script>
