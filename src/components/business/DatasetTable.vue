<template>
  <section class="px-4 pb-4 sm:px-5 sm:pb-5">
    <div class="overflow-x-auto">
      <table class="min-w-full table-fixed border-separate border-spacing-y-1 text-sm">
        <thead>
          <tr class="text-left text-xs uppercase tracking-[0.06em] text-[color:color-mix(in_srgb,var(--color-text-secondary)_88%,transparent)]">
            <th class="w-[44px] px-2 py-2 font-medium whitespace-nowrap">
              <input
                type="checkbox"
                class="h-4 w-4 rounded border border-[var(--color-border)]"
                :checked="allSelected"
                :disabled="items.length === 0 || loading"
                @change="toggleAllSelection"
              />
            </th>
            <th class="w-[180px] px-2 py-2 font-medium whitespace-nowrap">数据集</th>
            <th class="w-[200px] px-2 py-2 font-medium whitespace-nowrap">文件名</th>
            <th class="w-[200px] px-2 py-2 font-medium whitespace-nowrap">元数据</th>
            <th class="w-[90px] px-2 py-2 font-medium whitespace-nowrap">来源</th>
            <th class="w-[100px] px-2 py-2 font-medium whitespace-nowrap">类型</th>
            <th class="w-[90px] px-2 py-2 font-medium whitespace-nowrap">解析</th>
            <th class="w-[90px] px-2 py-2 font-medium whitespace-nowrap">QA</th>
            <th class="w-[90px] px-2 py-2 font-medium whitespace-nowrap">向量</th>
            <th class="w-[90px] px-2 py-2 font-medium whitespace-nowrap">记录数</th>
            <th class="w-[150px] px-2 py-2 font-medium whitespace-nowrap">创建时间</th>
            <th class="w-[180px] px-2 py-2 font-medium whitespace-nowrap">操作</th>
          </tr>
        </thead>
        <tbody v-if="items.length > 0">
          <tr
            v-for="item in items"
            :key="item.id"
            class="rounded-[0.9rem] border border-[var(--color-border)] bg-[color:color-mix(in_srgb,var(--color-surface-strong)_35%,transparent)]"
          >
            <td class="px-2 py-2 align-middle">
              <input
                type="checkbox"
                class="h-4 w-4 rounded border border-[var(--color-border)]"
                :checked="isSelected(item.id)"
                :disabled="loading"
                @change="toggleSelection(item.id)"
              />
            </td>
            <td class="px-2 py-2 align-middle">
              <p class="truncate font-medium" :title="item.dataset_name">{{ item.dataset_name }}</p>
            </td>
            <td class="px-2 py-2 align-middle text-xs text-[var(--color-text-secondary)]">
              <p class="truncate" :title="item.file_name">{{ item.file_name }}</p>
            </td>
            <td class="px-2 py-2 align-middle text-xs text-[var(--color-text-secondary)]">
              <p class="truncate" :title="item.object_key">{{ item.object_key }}</p>
            </td>
            <td class="px-2 py-2 align-middle whitespace-nowrap">{{ item.source }}</td>
            <td class="px-2 py-2 align-middle whitespace-nowrap">{{ item.data_type }}</td>
            <td class="px-2 py-2 align-middle whitespace-nowrap">
              <span class="status-pill inline-flex" :class="statusTone(item.parse_status)">{{ item.parse_status }}</span>
            </td>
            <td class="px-2 py-2 align-middle whitespace-nowrap">
              <span class="status-pill inline-flex" :class="statusTone(item.qa_status)">{{ item.qa_status }}</span>
            </td>
            <td class="px-2 py-2 align-middle whitespace-nowrap">
              <span class="status-pill inline-flex" :class="statusTone(item.vector_status)">{{ item.vector_status }}</span>
            </td>
            <td class="px-2 py-2 align-middle whitespace-nowrap">{{ item.row_count ?? '-' }}</td>
            <td class="px-2 py-2 align-middle whitespace-nowrap text-xs text-[var(--color-text-secondary)]">{{ formatDateTime(item.created_at) }}</td>
            <td class="rounded-r-[0.9rem] px-2 py-2 align-middle whitespace-nowrap">
              <div class="flex flex-wrap gap-2">
                <button type="button" class="btn btn-ghost btn-sm" :disabled="loading" @click="emit('view', item.id)">详情</button>
                <button type="button" class="btn btn-ghost btn-sm" :disabled="loading" @click="emit('parse', item.id)">解析</button>
                <button type="button" class="btn btn-ghost btn-sm" :disabled="loading" @click="emit('vector-sync', item.id)">向量同步</button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <p v-if="loading && items.length === 0" class="text-muted px-1 py-5 text-sm text-left">正在加载数据集...</p>
    <p v-else-if="!loading && items.length === 0" class="text-muted px-1 py-5 text-sm text-left">当前筛选下暂无数据集。</p>

    <PaginationControls
      class="mt-3"
      :page="page"
      :page-size="pageSize"
      :total="total"
      :page-size-options="[10, 20, 50]"
      @update:page="(value) => emit('update:page', value)"
      @update:page-size="(value) => emit('update:pageSize', value)"
    />
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import PaginationControls from '@/components/business/PaginationControls.vue';
import { formatDateTime } from '@/lib/format';
import type { KnowledgeDataset } from '@/types/domain';

const props = withDefaults(
  defineProps<{
    items: KnowledgeDataset[];
    total: number;
    page: number;
    pageSize: number;
    selectedIds?: string[];
    loading?: boolean;
  }>(),
  {
    selectedIds: () => [],
    loading: false
  }
);

const emit = defineEmits<{
  (e: 'view', id: string): void;
  (e: 'parse', id: string): void;
  (e: 'vector-sync', id: string): void;
  (e: 'update:page', value: number): void;
  (e: 'update:pageSize', value: number): void;
  (e: 'update:selectedIds', value: string[]): void;
}>();

const selectedSet = computed(() => new Set(props.selectedIds));
const allSelected = computed(() => props.items.length > 0 && props.items.every((item) => selectedSet.value.has(item.id)));

const isSelected = (datasetId: string): boolean => selectedSet.value.has(datasetId);

const toggleSelection = (datasetId: string): void => {
  const next = new Set(props.selectedIds);
  if (next.has(datasetId)) {
    next.delete(datasetId);
  } else {
    next.add(datasetId);
  }
  emit('update:selectedIds', Array.from(next));
};

const toggleAllSelection = (): void => {
  if (allSelected.value) {
    const keep = props.selectedIds.filter((id) => !props.items.some((item) => item.id === id));
    emit('update:selectedIds', keep);
    return;
  }

  const next = new Set(props.selectedIds);
  props.items.forEach((item) => next.add(item.id));
  emit('update:selectedIds', Array.from(next));
};

const statusTone = (status: string): string => {
  if (['parsed', 'generated', 'synced', 'approved', 'completed'].includes(status)) return 'text-[var(--color-success)]';
  if (['pending', 'queued', 'uploaded', 'not_started', 'running'].includes(status)) return 'text-[var(--color-warning)]';
  if (['failed', 'rejected'].includes(status)) return 'text-[var(--color-danger)]';
  return 'text-[var(--color-text-secondary)]';
};
</script>
