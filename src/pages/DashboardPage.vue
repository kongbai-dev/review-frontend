<template>
  <section class="space-y-4">
    <header class="flex flex-wrap items-center justify-between gap-2">
      <div>
        <h2 class="text-lg font-semibold">审核统计</h2>
        <p class="text-muted text-sm">点击下方卡片，可以查看对应状态的问答对列表。</p>
      </div>
      <button class="btn btn-primary btn-sm" @click="refresh">刷新</button>
    </header>

    <div class="grid gap-3 md:grid-cols-3">
      <button
        data-testid="stats-pending"
        type="button"
        class="stat-card surface-card rounded-[1.45rem] p-4 text-left"
        :class="{
          'border-[color:color-mix(in_srgb,var(--color-primary)_36%,var(--color-border))] bg-[color:color-mix(in_srgb,var(--color-primary)_10%,transparent)]': selectedStatus === 'pending'
        }"
        @click="selectStatus('pending')"
      >
        <p class="text-muted text-xs">待审核</p>
        <p class="mt-2 text-2xl font-semibold text-[var(--color-warning)]">{{ qaStore.stats.pending }}</p>
      </button>

      <button
        data-testid="stats-reviewed"
        type="button"
        class="stat-card surface-card rounded-[1.45rem] p-4 text-left"
        :class="{
          'border-[color:color-mix(in_srgb,var(--color-primary)_36%,var(--color-border))] bg-[color:color-mix(in_srgb,var(--color-primary)_10%,transparent)]': selectedStatus === 'reviewed'
        }"
        @click="selectStatus('reviewed')"
      >
        <p class="text-muted text-xs">已审核</p>
        <p class="mt-2 text-2xl font-semibold text-[var(--color-success)]">{{ qaStore.stats.reviewed }}</p>
      </button>

      <button
        data-testid="stats-deprecated"
        type="button"
        class="stat-card surface-card rounded-[1.45rem] p-4 text-left"
        :class="{
          'border-[color:color-mix(in_srgb,var(--color-primary)_36%,var(--color-border))] bg-[color:color-mix(in_srgb,var(--color-primary)_10%,transparent)]': selectedStatus === 'deprecated'
        }"
        @click="selectStatus('deprecated')"
      >
        <p class="text-muted text-xs">已废弃</p>
        <p class="mt-2 text-2xl font-semibold text-[var(--color-danger)]">{{ qaStore.stats.deprecated }}</p>
      </button>
    </div>

    <section class="surface-card rounded-[1.5rem] p-4">
      <div class="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 class="font-medium">{{ statusTitle }}</h3>
          <p class="text-muted text-xs">共 {{ statusItems.length }} 条</p>
        </div>
        <span class="status-pill">{{ statusBadge }}</span>
      </div>

      <div v-if="statusItems.length > 0" class="space-y-3">
        <article v-for="item in statusItems" :key="item.id" class="rounded-[1.15rem] border border-[var(--color-border)] bg-[color:color-mix(in_srgb,var(--color-surface-strong)_38%,transparent)] p-3">
          <div class="flex flex-wrap items-center justify-between gap-2">
            <p class="text-muted text-xs">{{ item.id }} | v{{ item.version }}</p>
            <span class="status-pill">{{ item.reviewer || '未分配' }}</span>
          </div>

          <h4 class="mt-2 font-medium">{{ item.question }}</h4>
          <p class="text-muted mt-1 line-clamp-2 text-sm">{{ item.answer }}</p>

          <div class="mt-3">
            <RouterLink :to="`/reviews/${item.id}`" class="btn btn-ghost btn-sm ui-link-button">查看详情</RouterLink>
          </div>
        </article>
      </div>

      <p v-else class="text-muted text-sm">当前状态下暂无数据。</p>
    </section>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useQAStore } from '@/stores/qa.store';
import type { QAPair, QAStatus } from '@/types/domain';

const qaStore = useQAStore();
const selectedStatus = ref<QAStatus>('pending');

const statusItems = computed<QAPair[]>(() => {
  if (selectedStatus.value === 'pending') {
    return qaStore.pending;
  }
  return qaStore.history.filter((item) => item.status === selectedStatus.value);
});

const statusTitle = computed(() => {
  if (selectedStatus.value === 'pending') return '待审核问答对';
  if (selectedStatus.value === 'reviewed') return '已审核问答对';
  return '已废弃问答对';
});

const statusBadge = computed(() => {
  if (selectedStatus.value === 'pending') return 'Pending';
  if (selectedStatus.value === 'reviewed') return 'Reviewed';
  return 'Deprecated';
});

const refresh = async (): Promise<void> => {
  await Promise.all([qaStore.fetchStats(), qaStore.fetchPending(), qaStore.fetchHistory()]);
};

const selectStatus = async (status: QAStatus): Promise<void> => {
  selectedStatus.value = status;

  if (status === 'pending' && qaStore.pending.length === 0) {
    await qaStore.fetchPending();
  }

  if (status !== 'pending' && qaStore.history.length === 0) {
    await qaStore.fetchHistory();
  }
};

onMounted(async () => {
  await refresh();
});
</script>
