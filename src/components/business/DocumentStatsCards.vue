<template>
  <div class="grid gap-3 md:grid-cols-3 xl:grid-cols-[repeat(3,minmax(0,1fr))]">
    <article class="stat-card surface-card rounded-[1.35rem] p-4 text-left">
      <p class="text-muted text-xs">总文档数</p>
      <p class="mt-2 text-2xl font-semibold text-[var(--color-primary)]">{{ displayValue(stats.document_count) }}</p>
      <p class="text-muted mt-2 text-xs">已纳入知识库的文档总量</p>
    </article>

    <article class="stat-card surface-card rounded-[1.35rem] p-4 text-left">
      <p class="text-muted text-xs">总片段数</p>
      <p class="mt-2 text-2xl font-semibold text-[var(--color-success)]">{{ displayValue(stats.fragment_count) }}</p>
      <p class="text-muted mt-2 text-xs">文档切分后可用于检索的片段数</p>
    </article>

    <article class="stat-card surface-card rounded-[1.35rem] p-4 text-left">
      <p class="text-muted text-xs">总 QA 数</p>
      <p class="mt-2 text-2xl font-semibold text-[var(--color-warning)]">{{ displayValue(stats.qa_count) }}</p>
      <div class="mt-2 flex flex-wrap gap-2 text-[11px]">
        <span class="status-pill">Indexed {{ stats.indexed_count ?? 0 }}</span>
        <span class="status-pill">Processing {{ stats.processing_count ?? 0 }}</span>
        <span class="status-pill">Failed {{ stats.failed_count ?? 0 }}</span>
      </div>
    </article>
  </div>
</template>

<script setup lang="ts">
import type { DocumentStats } from '@/types/domain';

const props = withDefaults(
  defineProps<{
    stats: DocumentStats;
    loading?: boolean;
  }>(),
  {
    loading: false
  }
);

const displayValue = (value: number): string => (props.loading ? '--' : value.toLocaleString());
</script>
