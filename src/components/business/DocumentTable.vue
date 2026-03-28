<template>
  <section :class="wrapperClass">
    <div class="overflow-x-auto">
      <table class="min-w-full border-separate border-spacing-y-2 text-sm">
        <thead>
          <tr class="text-left text-xs uppercase tracking-[0.08em] text-[color:color-mix(in_srgb,var(--color-text-secondary)_88%,transparent)]">
            <th class="px-3 py-2 font-medium whitespace-nowrap">文档名称</th>
            <th class="px-3 py-2 font-medium whitespace-nowrap">上传时间</th>
            <th class="px-3 py-2 font-medium whitespace-nowrap">上传用户</th>
            <th class="px-3 py-2 font-medium whitespace-nowrap">类型</th>
            <th class="px-3 py-2 font-medium whitespace-nowrap">大小</th>
            <th class="px-3 py-2 font-medium whitespace-nowrap">片段数</th>
            <th class="px-3 py-2 font-medium whitespace-nowrap">QA 数</th>
            <th class="px-3 py-2 font-medium whitespace-nowrap">状态</th>
            <th class="px-3 py-2 text-right font-medium whitespace-nowrap">操作</th>
          </tr>
        </thead>

        <tbody v-if="items.length > 0">
          <tr
            v-for="item in items"
            :key="item.document_id"
            class="rounded-[1.15rem] border border-[var(--color-border)] bg-[color:color-mix(in_srgb,var(--color-surface-strong)_35%,transparent)]"
          >
            <td class="rounded-l-[1rem] px-3 py-3 align-top">
              <div class="max-w-[260px]">
                <p class="font-medium">{{ item.file_name }}</p>
                <p class="text-muted mt-1 text-xs">{{ item.document_id }}</p>
              </div>
            </td>
            <td class="px-3 py-3 align-top text-xs text-[var(--color-text-secondary)] whitespace-nowrap">{{ formatDate(item.uploaded_at) }}</td>
            <td class="px-3 py-3 align-top whitespace-nowrap">{{ item.uploaded_by }}</td>
            <td class="px-3 py-3 align-top uppercase whitespace-nowrap">{{ item.file_type }}</td>
            <td class="px-3 py-3 align-top whitespace-nowrap">{{ formatBytes(item.file_size) }}</td>
            <td class="px-3 py-3 align-top whitespace-nowrap">{{ item.fragment_count }}</td>
            <td class="px-3 py-3 align-top whitespace-nowrap">{{ item.qa_count }}</td>
            <td class="px-3 py-3 align-top whitespace-nowrap">
              <span class="status-pill" :class="statusTone(item.status)">{{ statusLabel(item.status) }}</span>
            </td>
            <td class="rounded-r-[1rem] px-3 py-3 text-right align-top whitespace-nowrap">
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
import type { DocumentStatus, KnowledgeDocument } from '@/types/domain';

const props = withDefaults(
  defineProps<{
    items: KnowledgeDocument[];
    total: number;
    page: number;
    pageSize: number;
    loading?: boolean;
    downloadingId?: string;
    embedded?: boolean;
  }>(),
  {
    loading: false,
    downloadingId: '',
    embedded: false
  }
);

const emit = defineEmits<{
  (e: 'download', documentItem: KnowledgeDocument): void;
  (e: 'update:page', value: number): void;
  (e: 'update:pageSize', value: number): void;
}>();

const wrapperClass = computed(() =>
  props.embedded ? 'px-4 pb-4 sm:px-5 sm:pb-5' : 'surface-card rounded-[1.5rem] p-4'
);

const emptyClass = computed(() =>
  props.embedded ? 'text-muted px-1 py-6 text-sm' : 'text-muted px-1 py-6 text-sm'
);

const paginationClass = computed(() => (props.embedded ? 'mt-4' : 'mt-4'));

const formatDate = (value: string): string => new Date(value).toLocaleString();

const formatBytes = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
};

const statusLabel = (status: DocumentStatus): string => {
  if (status === 'indexed') return '已索引';
  if (status === 'processing') return '处理中';
  return '失败';
};

const statusTone = (status: DocumentStatus): string => {
  if (status === 'indexed') return 'text-[var(--color-success)]';
  if (status === 'processing') return 'text-[var(--color-warning)]';
  return 'text-[var(--color-danger)]';
};
</script>
