<template>
  <section class="surface-card rounded-[1.5rem] p-4">
    <div class="overflow-x-auto">
      <table class="min-w-full border-separate border-spacing-y-2 text-sm">
        <thead>
          <tr class="text-left text-xs uppercase tracking-[0.08em] text-[color:color-mix(in_srgb,var(--color-text-secondary)_88%,transparent)]">
            <th class="px-3 py-2 font-medium">排名</th>
            <th class="px-3 py-2 font-medium">成员</th>
            <th class="px-3 py-2 font-medium">上传文档数</th>
            <th class="px-3 py-2 font-medium">审核 QA 数</th>
            <th class="px-3 py-2 font-medium">最近活跃时间</th>
          </tr>
        </thead>

        <tbody v-if="items.length > 0">
          <tr
            v-for="item in items"
            :key="item.user_id"
            class="rounded-[1.15rem] border border-[var(--color-border)] bg-[color:color-mix(in_srgb,var(--color-surface-strong)_35%,transparent)]"
          >
            <td class="rounded-l-[1rem] px-3 py-3 align-top">
              <span class="status-pill" :class="rankTone(item.rank)">#{{ item.rank }}</span>
            </td>
            <td class="px-3 py-3 align-top">
              <p class="font-medium">{{ item.username }}</p>
              <p v-if="item.display_name" class="text-muted mt-1 text-xs">{{ item.display_name }}</p>
            </td>
            <td class="px-3 py-3 align-top text-[var(--color-success)]">{{ item.uploaded_document_count }}</td>
            <td class="px-3 py-3 align-top text-[var(--color-primary)]">{{ item.reviewed_qa_count }}</td>
            <td class="rounded-r-[1rem] px-3 py-3 align-top text-xs text-[var(--color-text-secondary)]">
              {{ formatDateTime(item.last_active_at) }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <p v-if="loading && items.length === 0" class="text-muted px-1 py-6 text-sm">正在加载成员排行...</p>
    <p v-else-if="!loading && items.length === 0" class="text-muted px-1 py-6 text-sm">暂无成员排行数据。</p>
  </section>
</template>

<script setup lang="ts">
import { formatDateTime } from '@/lib/format';
import type { MemberRankingItem } from '@/types/domain';

withDefaults(
  defineProps<{
    items: MemberRankingItem[];
    loading?: boolean;
  }>(),
  {
    loading: false
  }
);

const rankTone = (rank: number): string => {
  if (rank === 1) return 'text-[var(--color-warning)]';
  if (rank === 2) return 'text-[var(--color-primary)]';
  if (rank === 3) return 'text-[var(--color-success)]';
  return '';
};
</script>
