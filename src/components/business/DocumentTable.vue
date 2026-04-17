<template>
  <section :class="wrapperClass">
    <div class="overflow-x-auto">
      <table class="min-w-full table-fixed border-separate border-spacing-y-1 text-sm">
        <thead>
          <tr class="text-left text-xs uppercase tracking-[0.06em] text-[color:color-mix(in_srgb,var(--color-text-secondary)_88%,transparent)]">
            <th v-if="selectable" class="w-[44px] px-2 py-2 font-medium whitespace-nowrap">
              <input
                type="checkbox"
                class="h-4 w-4 rounded border border-[var(--color-border)]"
                :checked="allSelected"
                :disabled="items.length === 0 || loading"
                @change="toggleAllSelection"
              />
            </th>
            <th class="w-[220px] px-2 py-2 font-medium whitespace-nowrap">文档名称</th>
            <th class="w-[240px] px-2 py-2 font-medium whitespace-nowrap">元数据</th>
            <th class="w-[150px] px-2 py-2 font-medium whitespace-nowrap">上传时间</th>
            <th class="w-[110px] px-2 py-2 font-medium whitespace-nowrap">上传用户</th>
            <th class="w-[80px] px-2 py-2 font-medium whitespace-nowrap">类型</th>
            <th class="w-[90px] px-2 py-2 font-medium whitespace-nowrap">大小</th>
            <th class="w-[80px] px-2 py-2 font-medium whitespace-nowrap">片段数</th>
            <th class="w-[80px] px-2 py-2 font-medium whitespace-nowrap">QA 数</th>
            <th class="w-[100px] px-2 py-2 font-medium whitespace-nowrap">文档状态</th>
            <th class="w-[100px] px-2 py-2 font-medium whitespace-nowrap">同步状态</th>
            <th class="w-[160px] px-2 py-2 font-medium whitespace-nowrap">配对状态</th>
            <th class="w-[90px] px-2 py-2 font-medium whitespace-nowrap">操作</th>
          </tr>
        </thead>

        <tbody v-if="items.length > 0">
          <tr
            v-for="item in items"
            :key="item.document_id"
            class="rounded-[0.9rem] border border-[var(--color-border)] bg-[color:color-mix(in_srgb,var(--color-surface-strong)_35%,transparent)]"
          >
            <td v-if="selectable" class="px-2 py-2 align-middle overflow-hidden">
              <input
                type="checkbox"
                class="h-4 w-4 rounded border border-[var(--color-border)]"
                :checked="isSelected(item.document_id)"
                :disabled="loading"
                @change="toggleSelection(item.document_id)"
              />
            </td>

            <td
              class="px-2 py-2 align-middle overflow-hidden"
              :class="selectable ? '' : 'rounded-l-[0.9rem]'"
            >
              <div class="w-full min-w-0">
                <p class="truncate font-medium text-left" :title="item.file_name">
                  {{ item.file_name }}
                </p>
              </div>
            </td>

            <td class="px-2 py-2 align-middle overflow-hidden text-xs text-[var(--color-text-secondary)]">
              <div class="w-full min-w-0">
                <p class="truncate text-left" :title="item.object_key">
                  {{ item.object_key || '-' }}
                </p>
              </div>
            </td>

            <td class="px-2 py-2 align-middle overflow-hidden text-xs text-[var(--color-text-secondary)] whitespace-nowrap text-left">
              {{ formatDate(item.uploaded_at) }}
            </td>

            <td class="px-2 py-2 align-middle overflow-hidden whitespace-nowrap">
              <div class="w-full min-w-0 truncate text-left" :title="item.uploaded_by">
                {{ item.uploaded_by }}
              </div>
            </td>

            <td class="px-2 py-2 align-middle overflow-hidden uppercase whitespace-nowrap">
              <div class="w-full min-w-0 truncate text-left" :title="item.file_type">
                {{ item.file_type }}
              </div>
            </td>

            <td class="px-2 py-2 align-middle overflow-hidden whitespace-nowrap text-left">
              {{ formatBytes(item.file_size) }}
            </td>

            <td class="px-2 py-2 align-middle overflow-hidden whitespace-nowrap text-left">
              {{ item.fragment_count }}
            </td>

            <td class="px-2 py-2 align-middle overflow-hidden whitespace-nowrap text-left">
              {{ item.qa_count }}
            </td>

            <td class="px-2 py-2 align-middle overflow-hidden whitespace-nowrap text-left">
              <span class="status-pill inline-flex" :class="statusTone(item.status)">
                {{ statusLabel(item.status) }}
              </span>
            </td>

            <td class="px-2 py-2 align-middle overflow-hidden whitespace-nowrap text-left">
              <span class="status-pill inline-flex" :class="syncTone(item.sync_status)">
                {{ syncLabel(item.sync_status) }}
              </span>
            </td>

            <td class="px-2 py-2 align-middle overflow-hidden text-left">
              <div class="w-full min-w-0">
                <span class="status-pill inline-flex" :class="pairTone(item.pair_status)">
                  {{ pairLabel(item.pair_status) }}
                </span>
                <p
                  v-if="item.pair_error"
                  class="mt-1 max-w-full truncate text-left text-xs text-[var(--color-warning)]"
                  :title="item.pair_error"
                >
                  {{ item.pair_error }}
                </p>
              </div>
            </td>

            <td class="rounded-r-[0.9rem] px-2 py-2 align-middle overflow-hidden whitespace-nowrap text-left">
              <button
                type="button"
                class="btn btn-ghost btn-sm"
                :disabled="loading || downloadingId === item.document_id"
                @click="emit('download', item)"
              >
                {{ downloadingId === item.document_id ? '下载中...' : '下载' }}
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <p v-if="loading && items.length === 0" :class="emptyClass">正在加载文档列表...</p>
    <p v-else-if="!loading && items.length === 0" :class="emptyClass">当前筛选下暂无文档数据。</p>

    <PaginationControls
      :class="paginationClass"
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
import { formatBytes, formatDateTime } from '@/lib/format';
import type { DocumentStatus, KnowledgeDocument } from '@/types/domain';

const props = withDefaults(
  defineProps<{
    items: KnowledgeDocument[];
    total: number;
    page: number;
    pageSize: number;
    selectedIds?: string[];
    loading?: boolean;
    downloadingId?: string;
    embedded?: boolean;
    selectable?: boolean;
  }>(),
  {
    selectedIds: () => [],
    loading: false,
    downloadingId: '',
    embedded: false,
    selectable: true
  }
);

const emit = defineEmits<{
  (e: 'download', documentItem: KnowledgeDocument): void;
  (e: 'update:page', value: number): void;
  (e: 'update:pageSize', value: number): void;
  (e: 'update:selectedIds', value: string[]): void;
}>();

const wrapperClass = computed(() =>
  props.embedded ? 'px-4 pb-4 sm:px-5 sm:pb-5' : 'surface-card rounded-[1.25rem] p-3'
);

const emptyClass = computed(() =>
  props.embedded ? 'text-muted px-1 py-5 text-sm text-left' : 'text-muted px-1 py-5 text-sm text-left'
);

const paginationClass = computed(() => (props.embedded ? 'mt-3' : 'mt-3'));

const selectedSet = computed(() => new Set(props.selectedIds));

const allSelected = computed(() =>
  props.items.length > 0 && props.items.every((item) => selectedSet.value.has(item.document_id))
);

const isSelected = (documentId: string): boolean => selectedSet.value.has(documentId);

const toggleSelection = (documentId: string): void => {
  const next = new Set(props.selectedIds);
  if (next.has(documentId)) {
    next.delete(documentId);
  } else {
    next.add(documentId);
  }
  emit('update:selectedIds', Array.from(next));
};

const toggleAllSelection = (): void => {
  if (allSelected.value) {
    const keep = props.selectedIds.filter((id) => !props.items.some((item) => item.document_id === id));
    emit('update:selectedIds', keep);
    return;
  }

  const next = new Set(props.selectedIds);
  props.items.forEach((item) => {
    next.add(item.document_id);
  });
  emit('update:selectedIds', Array.from(next));
};

const formatDate = (value: string): string => formatDateTime(value);

const statusLabel = (status: DocumentStatus): string => {
  if (status === 'indexed') return '已索引';
  if (status === 'synced') return '已同步';
  if (status === 'processing') return '处理中';
  if (status === 'sync_pending') return '待同步';
  if (status === 'queued') return '已排队';
  if (status === 'running') return '执行中';
  if (status === 'completed') return '已完成';
  return '失败';
};

const statusTone = (status: DocumentStatus): string => {
  if (status === 'indexed' || status === 'synced' || status === 'completed') return 'text-[var(--color-success)]';
  if (status === 'processing' || status === 'sync_pending' || status === 'queued' || status === 'running') return 'text-[var(--color-warning)]';
  if (status === 'failed' || status === 'sync_failed') return 'text-[var(--color-danger)]';
  return 'text-[var(--color-text-secondary)]';
};

const syncLabel = (status?: string): string => {
  if (!status) return '-';
  if (status === 'synced') return '已同步';
  if (status === 'sync_pending') return '待同步';
  if (status === 'sync_failed') return '同步失败';
  return status;
};

const syncTone = (status?: string): string => {
  if (!status) return 'text-[var(--color-text-secondary)]';
  if (status === 'synced') return 'text-[var(--color-success)]';
  if (status === 'sync_pending') return 'text-[var(--color-warning)]';
  if (status === 'sync_failed') return 'text-[var(--color-danger)]';
  return 'text-[var(--color-text-secondary)]';
};

const pairLabel = (status?: string): string => {
  if (!status) return '-';
  if (status === 'paired') return '已配对';
  if (status === 'missing_csv') return '缺少CSV';
  if (status === 'invalid_csv') return 'CSV无效';
  if (status === 'ambiguous_pair') return '配对冲突';
  if (status === 'pending_pair') return '待配对';
  return status;
};

const pairTone = (status?: string): string => {
  if (!status) return 'text-[var(--color-text-secondary)]';
  if (status === 'paired') return 'text-[var(--color-success)]';
  if (status === 'pending_pair') return 'text-[var(--color-primary)]';
  if (status === 'missing_csv' || status === 'invalid_csv' || status === 'ambiguous_pair') return 'text-[var(--color-warning)]';
  return 'text-[var(--color-text-secondary)]';
};
</script>