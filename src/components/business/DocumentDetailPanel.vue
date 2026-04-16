<template>
  <section class="mt-3 rounded-xl border border-[var(--color-border)] bg-[color:color-mix(in_srgb,var(--color-bg-elevated)_92%,transparent)] p-3">
    <div class="flex flex-wrap items-center justify-between gap-2">
      <div>
        <p class="text-sm font-medium">文档详情 / MinIO 元数据</p>
        <p class="text-xs text-[var(--color-text-secondary)]">来源：GET /api/v1/knowledge/documents/{document_id}</p>
      </div>
      <button
        type="button"
        class="btn btn-ghost btn-sm"
        :disabled="!canRefresh"
        @click="emit('refresh')"
      >
        刷新详情
      </button>
    </div>

    <p v-if="selectedCount === 0" class="mt-3 text-sm text-[var(--color-text-secondary)]">请选择 1 条文档查看详情。</p>
    <p v-else-if="selectedCount > 1" class="mt-3 text-sm text-[var(--color-warning)]">当前选中 {{ selectedCount }} 条，仅支持单文档详情展示。</p>
    <div v-else-if="loading" class="mt-3 grid gap-3 lg:grid-cols-2">
      <div v-for="index in 4" :key="index" class="animate-pulse rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] p-3">
        <div class="h-3 w-20 rounded bg-[color:color-mix(in_srgb,var(--color-text-secondary)_24%,transparent)]"></div>
        <div class="mt-2 h-3 w-4/5 rounded bg-[color:color-mix(in_srgb,var(--color-text-secondary)_20%,transparent)]"></div>
      </div>
    </div>
    <p v-else-if="error" class="mt-3 rounded-lg border border-[color:color-mix(in_srgb,var(--color-danger)_24%,var(--color-border))] bg-[color:color-mix(in_srgb,var(--color-danger)_10%,transparent)] px-3 py-2 text-sm text-[var(--color-danger)]">
      {{ error }}
    </p>
    <template v-else-if="detail">
      <div class="mt-3 grid gap-3 lg:grid-cols-2">
        <article class="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] p-3 text-xs">
          <p class="text-[11px] font-semibold tracking-[0.08em] text-[var(--color-text-secondary)] uppercase">基础信息</p>
          <dl class="mt-2 space-y-1.5">
            <div class="grid grid-cols-[88px_minmax(0,1fr)] gap-2">
              <dt class="text-[var(--color-text-secondary)]">文档ID</dt>
              <dd class="truncate" :title="detail.document_id">{{ displayText(detail.document_id) }}</dd>
            </div>
            <div class="grid grid-cols-[88px_minmax(0,1fr)] gap-2">
              <dt class="text-[var(--color-text-secondary)]">文件名</dt>
              <dd class="truncate" :title="detail.file_name">{{ displayText(detail.file_name) }}</dd>
            </div>
            <div class="grid grid-cols-[88px_minmax(0,1fr)] gap-2">
              <dt class="text-[var(--color-text-secondary)]">知识库</dt>
              <dd>{{ displayText(detail.knowledge_base) }}</dd>
            </div>
            <div class="grid grid-cols-[88px_minmax(0,1fr)] gap-2">
              <dt class="text-[var(--color-text-secondary)]">上传人</dt>
              <dd>{{ displayText(detail.uploaded_by_name || detail.uploaded_by) }}</dd>
            </div>
            <div class="grid grid-cols-[88px_minmax(0,1fr)] gap-2">
              <dt class="text-[var(--color-text-secondary)]">上传时间</dt>
              <dd>{{ formatDate(detail.uploaded_at) }}</dd>
            </div>
            <div class="grid grid-cols-[88px_minmax(0,1fr)] gap-2">
              <dt class="text-[var(--color-text-secondary)]">文件大小</dt>
              <dd>{{ formatBytes(detail.file_size) }}</dd>
            </div>
          </dl>
        </article>

        <article class="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] p-3 text-xs">
          <p class="text-[11px] font-semibold tracking-[0.08em] text-[var(--color-text-secondary)] uppercase">MinIO 元数据</p>
          <dl class="mt-2 space-y-1.5">
            <div class="grid grid-cols-[88px_minmax(0,1fr)] gap-2">
              <dt class="text-[var(--color-text-secondary)]">Object Key</dt>
              <dd class="truncate" :title="detail.object_key">{{ displayText(detail.object_key) }}</dd>
            </div>
            <div class="grid grid-cols-[88px_minmax(0,1fr)] gap-2">
              <dt class="text-[var(--color-text-secondary)]">上传时间</dt>
              <dd>{{ formatDate(detail.minio_uploaded_at) }}</dd>
            </div>
            <div class="grid grid-cols-[88px_minmax(0,1fr)] gap-2">
              <dt class="text-[var(--color-text-secondary)]">文件MD5</dt>
              <dd class="truncate" :title="detail.file_md5">{{ displayText(detail.file_md5) }}</dd>
            </div>
            <div class="grid grid-cols-[88px_minmax(0,1fr)] gap-2">
              <dt class="text-[var(--color-text-secondary)]">CSV MD5</dt>
              <dd class="truncate" :title="detail.csv_md5">{{ displayText(detail.csv_md5) }}</dd>
            </div>
          </dl>
        </article>

        <article class="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] p-3 text-xs">
          <p class="text-[11px] font-semibold tracking-[0.08em] text-[var(--color-text-secondary)] uppercase">路径与配对</p>
          <dl class="mt-2 space-y-1.5">
            <div class="grid grid-cols-[88px_minmax(0,1fr)] gap-2">
              <dt class="text-[var(--color-text-secondary)]">源路径</dt>
              <dd class="truncate" :title="detail.source_path">{{ displayText(detail.source_path) }}</dd>
            </div>
            <div class="grid grid-cols-[88px_minmax(0,1fr)] gap-2">
              <dt class="text-[var(--color-text-secondary)]">本地文件</dt>
              <dd class="truncate" :title="detail.local_file_path">{{ displayText(detail.local_file_path) }}</dd>
            </div>
            <div class="grid grid-cols-[88px_minmax(0,1fr)] gap-2">
              <dt class="text-[var(--color-text-secondary)]">本地CSV</dt>
              <dd class="truncate" :title="detail.local_csv_path">{{ displayText(detail.local_csv_path) }}</dd>
            </div>
            <div class="grid grid-cols-[88px_minmax(0,1fr)] gap-2">
              <dt class="text-[var(--color-text-secondary)]">Session</dt>
              <dd class="truncate" :title="detail.upload_session_id">{{ displayText(detail.upload_session_id) }}</dd>
            </div>
          </dl>
        </article>

        <article class="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] p-3 text-xs">
          <p class="text-[11px] font-semibold tracking-[0.08em] text-[var(--color-text-secondary)] uppercase">任务追踪</p>
          <dl class="mt-2 space-y-1.5">
            <div class="grid grid-cols-[88px_minmax(0,1fr)] gap-2">
              <dt class="text-[var(--color-text-secondary)]">Task ID</dt>
              <dd class="truncate" :title="detail.latest_task_id">{{ displayText(detail.latest_task_id) }}</dd>
            </div>
            <div class="grid grid-cols-[88px_minmax(0,1fr)] gap-2">
              <dt class="text-[var(--color-text-secondary)]">Task 状态</dt>
              <dd>{{ displayText(detail.latest_task_status) }}</dd>
            </div>
            <div class="grid grid-cols-[88px_minmax(0,1fr)] gap-2">
              <dt class="text-[var(--color-text-secondary)]">Task 阶段</dt>
              <dd>{{ displayText(detail.latest_task_stage) }}</dd>
            </div>
            <div class="grid grid-cols-[88px_minmax(0,1fr)] gap-2">
              <dt class="text-[var(--color-text-secondary)]">更新时间</dt>
              <dd>{{ formatDate(detail.latest_task_updated_at) }}</dd>
            </div>
            <div class="grid grid-cols-[88px_minmax(0,1fr)] gap-2">
              <dt class="text-[var(--color-text-secondary)]">同步重试</dt>
              <dd>{{ detail.sync_attempts }}</dd>
            </div>
            <div class="grid grid-cols-[88px_minmax(0,1fr)] gap-2">
              <dt class="text-[var(--color-text-secondary)]">最后错误</dt>
              <dd class="truncate" :title="detail.sync_last_error">{{ displayText(detail.sync_last_error) }}</dd>
            </div>
          </dl>
        </article>
      </div>
    </template>
    <p v-else class="mt-3 text-sm text-[var(--color-text-secondary)]">暂无文档详情数据。</p>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { formatBytes, formatDateTime } from '@/lib/format';
import type { DocumentDetail } from '@/types/domain';

const props = withDefaults(
  defineProps<{
    detail: DocumentDetail | null;
    selectedCount: number;
    loading?: boolean;
    error?: string;
  }>(),
  {
    loading: false,
    error: ''
  }
);

const emit = defineEmits<{
  (e: 'refresh'): void;
}>();

const canRefresh = computed(() => props.selectedCount === 1 && !props.loading);

const displayText = (value: unknown): string => {
  if (value === undefined || value === null || value === '') {
    return '-';
  }
  return String(value);
};

const formatDate = (value?: string): string => formatDateTime(value);
</script>
