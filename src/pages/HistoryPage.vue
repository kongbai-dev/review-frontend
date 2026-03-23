<template>
  <section class="space-y-4">
    <header class="flex items-center justify-between">
      <h2 class="text-lg font-semibold">审核历史</h2>
      <button class="btn btn-primary btn-sm" @click="refresh">刷新</button>
    </header>

    <div class="columns-1 gap-3 sm:columns-2 xl:columns-3 2xl:columns-4">
      <article v-for="item in visibleHistory" :key="item.id" class="surface-card mb-3 break-inside-avoid rounded-[1.05rem] p-3">
        <p class="text-muted text-[11px]">{{ item.id }} | {{ item.status }} | v{{ item.version }}</p>
        <h3 class="mt-1 line-clamp-2 text-sm font-semibold leading-5">{{ item.question }}</h3>
        <p class="text-muted mt-1 line-clamp-3 text-xs">{{ item.answer }}</p>
        <p class="text-muted mt-2 text-xs">{{ item.topics.join(' / ') }}</p>
      </article>
    </div>

    <div ref="loadMoreAnchor" class="h-1 w-full" />
    <p v-if="hasMore" class="text-muted text-center text-xs">向下滚动自动加载更多...</p>
    <p v-else-if="visibleHistory.length > 0" class="text-muted text-center text-xs">已加载全部历史 QA 对。</p>

    <p v-if="qaStore.history.length === 0" class="text-muted text-sm">暂无历史记录。</p>
  </section>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { useQAStore } from '@/stores/qa.store';

const qaStore = useQAStore();
const LOAD_BATCH = 16;
const visibleCount = ref(LOAD_BATCH);
const loadMoreAnchor = ref<HTMLElement | null>(null);
let observer: IntersectionObserver | null = null;

const visibleHistory = computed(() => {
  return qaStore.history.slice(0, visibleCount.value);
});

const hasMore = computed(() => visibleHistory.value.length < qaStore.history.length);

const resetVisible = (): void => {
  visibleCount.value = LOAD_BATCH;
};

const loadMore = (): void => {
  if (!hasMore.value) {
    return;
  }
  visibleCount.value = Math.min(qaStore.history.length, visibleCount.value + LOAD_BATCH);
};

const setupObserver = (): void => {
  observer?.disconnect();
  observer = null;

  if (!loadMoreAnchor.value || !hasMore.value) {
    return;
  }

  observer = new IntersectionObserver(
    (entries) => {
      if (entries.some((entry) => entry.isIntersecting)) {
        loadMore();
      }
    },
    {
      root: null,
      rootMargin: '220px 0px',
      threshold: 0.01
    }
  );

  observer.observe(loadMoreAnchor.value);
};

const refresh = async (): Promise<void> => {
  await qaStore.fetchHistory();
};

watch(
  () => qaStore.history.length,
  async () => {
    if (visibleCount.value > qaStore.history.length) {
      visibleCount.value = Math.max(LOAD_BATCH, qaStore.history.length);
    }
    await nextTick();
    setupObserver();
  }
);

watch(
  () => hasMore.value,
  async () => {
    await nextTick();
    setupObserver();
  }
);

watch(
  () => loadMoreAnchor.value,
  async () => {
    await nextTick();
    setupObserver();
  }
);

onMounted(async () => {
  await qaStore.fetchHistory();
  resetVisible();
  await nextTick();
  setupObserver();
});

onBeforeUnmount(() => {
  observer?.disconnect();
});
</script>
