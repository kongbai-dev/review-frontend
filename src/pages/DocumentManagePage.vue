<template>
  <section class="flex h-[calc(100vh-7.5rem)] min-h-[640px] flex-col gap-3">
    <p
      v-if="documentStore.error"
      class="rounded-xl border border-[color:color-mix(in_srgb,var(--color-danger)_24%,var(--color-border))] bg-[color:color-mix(in_srgb,var(--color-danger)_8%,white)] px-3 py-2 text-sm text-[var(--color-danger)]"
    >
      {{ documentStore.error }}
    </p>

    <section class="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-elevated)]">
      <div class="sticky top-0 z-10 border-b border-[var(--color-border)] bg-[var(--color-bg-elevated)]">
        <div class="px-4 py-3 sm:px-5">
          <div class="flex flex-wrap items-center justify-between gap-3">
            <div class="min-w-0">
              <div class="flex flex-wrap items-center gap-x-3 gap-y-1">
                <h2 class="text-base font-semibold text-[var(--color-text-primary)]">文档管理</h2>
                <span class="text-xs text-[var(--color-text-secondary)]">
                  {{ documentStore.total }} 份文档 · 第 {{ documentStore.page }}/{{ documentStore.totalPages }} 页
                </span>
              </div>
              <div class="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[var(--color-text-secondary)]">
                <span>文档 {{ documentStore.stats.document_count }}</span>
                <span>片段 {{ documentStore.stats.fragment_count }}</span>
                <span>QA {{ documentStore.stats.qa_count }}</span>
                <span>
                  状态：
                  <span class="font-medium text-[var(--color-text-primary)]">
                    {{ statsLoading ? '加载中' : '已同步' }}
                  </span>
                </span>
              </div>
            </div>

            <div class="flex flex-wrap items-center gap-2">
              <button
                type="button"
                class="inline-flex items-center justify-center rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-sm font-medium text-[var(--color-text-primary)] transition-colors hover:bg-[color:color-mix(in_srgb,var(--color-primary)_4%,white)]"
                @click="toggleUploadPanel"
              >
                {{ showUploadPanel ? '收起上传' : '上传工作台' }}
              </button>
              <button
                type="button"
                class="inline-flex items-center justify-center rounded-lg bg-[var(--color-primary)] px-3 py-2 text-sm font-medium text-white transition-opacity hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
                :disabled="documentStore.loading || documentStore.uploading"
                @click="refresh"
              >
                刷新
              </button>
            </div>
          </div>

          <transition
            enter-active-class="transition duration-150 ease-out"
            enter-from-class="opacity-0 -translate-y-1"
            enter-to-class="opacity-100 translate-y-0"
            leave-active-class="transition duration-100 ease-in"
            leave-from-class="opacity-100 translate-y-0"
            leave-to-class="opacity-0 -translate-y-1"
          >
            <div
              v-if="showUploadPanel"
              class="mt-3 rounded-xl border border-[var(--color-border)] bg-[color:color-mix(in_srgb,var(--color-bg)_88%,transparent)] p-3"
            >
              <DocumentUploadPanel
                v-model:knowledge-base="batchForm.knowledge_base"
                :can-manage="canManage"
                :error="documentStore.error"
                @cancel="closeUploadPanel"
              />
            </div>
          </transition>

          <div class="mt-3 rounded-xl border border-[var(--color-border)] bg-[color:color-mix(in_srgb,var(--color-bg)_92%,transparent)] p-3">
            <div class="flex flex-wrap items-center justify-between gap-2">
              <p class="text-sm font-medium">批处理同步控制台</p>
              <div class="flex items-center gap-2">
                <button
                  type="button"
                  class="btn btn-ghost btn-sm"
                  :disabled="batchSubmitting || documentStore.batchSyncPolling"
                  @click="refreshBatchSession"
                >
                  刷新 Session
                </button>
                <button
                  v-if="canManage"
                  type="button"
                  class="btn btn-primary btn-sm"
                  :disabled="batchSubmitting || documentStore.batchSyncPolling"
                  @click="handleStartBatchSync"
                >
                  {{ batchSubmitting || documentStore.batchSyncPolling ? '执行中...' : '启动批处理同步' }}
                </button>
              </div>
            </div>

            <p v-if="!canManage" class="text-muted mt-1 text-xs">当前角色无法触发批处理，但可查看任务状态。</p>

            <div class="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
              <label class="text-sm">
                <span class="mb-1 block text-[11px] text-[var(--color-text-secondary)]">知识库</span>
                <input
                  v-model="batchForm.knowledge_base"
                  class="form-control h-9 px-2 text-sm"
                  :disabled="batchSubmitting || documentStore.batchSyncPolling"
                />
              </label>

              <label class="text-sm">
                <span class="mb-1 block text-[11px] text-[var(--color-text-secondary)]">最小批量 N</span>
                <input
                  v-model.number="batchForm.min_batch_size"
                  type="number"
                  min="1"
                  max="1000"
                  class="form-control h-9 px-2 text-sm"
                  :disabled="!canManage || batchSubmitting || documentStore.batchSyncPolling"
                />
              </label>

              <label class="text-sm">
                <span class="mb-1 block text-[11px] text-[var(--color-text-secondary)]">最长等待 T(秒)</span>
                <input
                  v-model.number="batchForm.max_wait_seconds"
                  type="number"
                  min="0"
                  max="86400"
                  class="form-control h-9 px-2 text-sm"
                  :disabled="!canManage || batchSubmitting || documentStore.batchSyncPolling"
                />
              </label>

              <label class="text-sm">
                <span class="mb-1 block text-[11px] text-[var(--color-text-secondary)]">最大文档数</span>
                <input
                  v-model.number="batchForm.max_docs"
                  type="number"
                  min="1"
                  max="2000"
                  class="form-control h-9 px-2 text-sm"
                  :disabled="!canManage || batchSubmitting || documentStore.batchSyncPolling"
                />
              </label>

              <label class="text-sm">
                <span class="mb-1 block text-[11px] text-[var(--color-text-secondary)]">并发 workers</span>
                <input
                  v-model.number="batchForm.max_workers"
                  type="number"
                  min="1"
                  max="64"
                  class="form-control h-9 px-2 text-sm"
                  :disabled="!canManage || batchSubmitting || documentStore.batchSyncPolling"
                />
              </label>

              <label class="flex items-end gap-2 text-sm pb-2">
                <input v-model="batchForm.include_failed" type="checkbox" class="h-4 w-4" :disabled="!canManage || batchSubmitting || documentStore.batchSyncPolling" />
                <span>包含历史失败文档</span>
              </label>

              <label class="flex items-end gap-2 text-sm pb-2">
                <input v-model="batchForm.strict_pairing" type="checkbox" class="h-4 w-4" :disabled="!canManage || batchSubmitting || documentStore.batchSyncPolling" />
                <span>strict_pairing</span>
              </label>
            </div>

            <div v-if="documentStore.currentSessionSummary" class="mt-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] p-2 text-xs">
              <p>
                Session: {{ documentStore.currentSessionSummary.session_id || '-' }} · paired={{ documentStore.currentSessionSummary.paired_count }} ·
                unpaired={{ documentStore.currentSessionSummary.unpaired_count }}
              </p>
            </div>

            <p v-if="batchError" class="mt-2 text-sm text-[var(--color-danger)]">{{ batchError }}</p>

            <div v-if="documentStore.batchSyncTask" class="mt-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] p-3 text-sm">
              <div class="flex flex-wrap items-center gap-x-4 gap-y-1">
                <span>任务: {{ documentStore.batchSyncTask.task_id }}</span>
                <span>状态: <span class="font-medium">{{ documentStore.batchSyncTask.status }}</span></span>
                <span>Session: {{ documentStore.batchSyncTask.session_id || '-' }}</span>
                <span>进度: {{ documentStore.batchSyncTask.processed_count }}/{{ documentStore.batchSyncTask.queued_count }}</span>
                <span>成功/失败/跳过: {{ documentStore.batchSyncTask.success_count }}/{{ documentStore.batchSyncTask.failed_count }}/{{ documentStore.batchSyncTask.skipped_count }}</span>
              </div>
              <p class="text-muted mt-1 text-xs">{{ documentStore.batchSyncTask.message }}</p>

              <p v-if="documentStore.batchSyncTask.failed_documents.length > 0" class="mt-1 text-xs text-[var(--color-warning)]">
                失败文档: {{ documentStore.batchSyncTask.failed_documents.join(', ') }}
              </p>

              <ul v-if="documentStore.batchSyncTask.skipped_documents.length > 0" class="mt-2 space-y-1 text-xs text-[var(--color-warning)]">
                <li v-for="(item, index) in documentStore.batchSyncTask.skipped_documents" :key="`${item.document_id || item.file_name || index}`">
                  {{ item.file_name || item.document_id || 'unknown' }} · {{ item.reason || 'skipped' }}
                </li>
              </ul>
            </div>
          </div>

          <div class="mt-3 flex flex-wrap items-end gap-2">
            <label class="min-w-[220px] flex-[1.8] text-sm">
              <span class="mb-1 block text-[11px] font-medium text-[var(--color-text-secondary)]">关键词</span>
              <input
                v-model="filters.keyword"
                class="form-control h-9 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-3 text-sm shadow-none"
                placeholder="文件名 / 上传人 / 知识库"
                @keydown.enter.prevent="applyFilters"
              />
            </label>

            <label class="w-[118px] text-sm">
              <span class="mb-1 block text-[11px] font-medium text-[var(--color-text-secondary)]">类型</span>
              <select v-model="filters.file_type" class="form-control h-10 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-3 text-sm shadow-none">
                <option value="">全部</option>
                <option v-for="option in fileTypeOptions" :key="option" :value="option">{{ option.toUpperCase() }}</option>
              </select>
            </label>

            <label class="w-[118px] text-sm">
              <span class="mb-1 block text-[11px] font-medium text-[var(--color-text-secondary)]">状态</span>
              <select v-model="filters.status" class="form-control h-10 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-3 text-sm shadow-none">
                <option value="">全部</option>
                <option value="synced">已同步</option>
                <option value="sync_pending">待同步</option>
                <option value="sync_failed">同步失败</option>
                <option value="indexed">已索引</option>
                <option value="processing">处理中</option>
                <option value="failed">失败</option>
              </select>
            </label>

            <label class="w-[132px] text-sm">
              <span class="mb-1 block text-[11px] font-medium text-[var(--color-text-secondary)]">排序字段</span>
              <select v-model="filters.sort_by" class="form-control h-10 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-3 text-sm shadow-none">
                <option value="uploaded_at">上传时间</option>
                <option value="file_name">文件名</option>
                <option value="fragment_count">片段数</option>
                <option value="qa_count">QA 数</option>
              </select>
            </label>

            <div class="w-[136px] text-sm">
              <span class="mb-1 block text-[11px] font-medium text-[var(--color-text-secondary)]">排序</span>
              <div class="grid grid-cols-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] p-0.5">
                <button
                  type="button"
                  class="rounded-md px-2 py-1.5 text-sm font-medium transition-colors"
                  :class="filters.order === 'desc' ? 'bg-[var(--color-primary)] text-white' : 'text-[var(--color-text-secondary)]'"
                  @click="filters.order = 'desc'"
                >
                  降序
                </button>
                <button
                  type="button"
                  class="rounded-md px-2 py-1.5 text-sm font-medium transition-colors"
                  :class="filters.order === 'asc' ? 'bg-[var(--color-primary)] text-white' : 'text-[var(--color-text-secondary)]'"
                  @click="filters.order = 'asc'"
                >
                  升序
                </button>
              </div>
            </div>

            <div class="ml-auto flex items-center gap-2">
              <button
                type="button"
                class="inline-flex h-9 items-center justify-center rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-3 text-sm font-medium text-[var(--color-text-primary)] transition-colors hover:bg-[color:color-mix(in_srgb,var(--color-primary)_4%,white)] disabled:cursor-not-allowed disabled:opacity-60"
                :disabled="documentStore.loading"
                @click="resetFilters"
              >
                重置
              </button>
              <button
                type="button"
                class="inline-flex h-9 items-center justify-center rounded-lg bg-[var(--color-primary)] px-3 text-sm font-medium text-white transition-opacity hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
                :disabled="documentStore.loading"
                @click="applyFilters"
              >
                筛选
              </button>
            </div>
          </div>
        </div>
      </div>

      <div class="min-h-0 flex-1 overflow-auto bg-[var(--color-bg)]">
        <div class="px-4 pt-4 sm:px-5">
          <div class="flex flex-wrap items-center gap-2 rounded-lg border border-[var(--color-border)] bg-[color:color-mix(in_srgb,var(--color-surface-strong)_35%,transparent)] px-3 py-2">
            <span class="text-sm">已选 {{ documentStore.selectedCount }} 项</span>
            <button
              type="button"
              class="btn btn-primary btn-sm"
              :disabled="!canOpenQaPanel"
              @click="showQaPanel = !showQaPanel"
            >
              {{ showQaPanel ? '收起生成QA' : '生成 QA' }}
            </button>
            <button
              type="button"
              class="btn btn-ghost btn-sm"
              :disabled="documentStore.selectedCount === 0"
              @click="documentStore.clearSelection()"
            >
              清空选择
            </button>
            <span v-if="documentStore.selectedCount > 1" class="text-xs text-[var(--color-warning)]">当前仅支持单文档触发 QA 生成</span>
            <span v-if="!canManage" class="text-xs text-[var(--color-warning)]">observer 角色不可触发生成</span>
          </div>

          <div
            v-if="showQaPanel && selectedDocument"
            class="mt-3 rounded-xl border border-[var(--color-border)] bg-[color:color-mix(in_srgb,var(--color-bg-elevated)_92%,transparent)] p-3"
          >
            <div class="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p class="text-sm font-medium">手动生成 QA</p>
                <p class="text-xs text-[var(--color-text-secondary)]">{{ selectedDocument.file_name }}（{{ selectedDocument.document_id }}）</p>
              </div>
              <button type="button" class="btn btn-ghost btn-sm" @click="showQaPanel = false">收起</button>
            </div>

            <div class="mt-3 grid gap-2 sm:grid-cols-2">
              <label class="text-sm">
                <span class="mb-1 block text-[11px] text-[var(--color-text-secondary)]">目标 QA 数（1~100）</span>
                <input v-model.number="qaForm.target_count" type="number" min="1" max="100" class="form-control h-9 px-2 text-sm" :disabled="qaSubmitting || documentStore.qaGenerationPolling || !canManage" />
              </label>
              <label class="text-sm">
                <span class="mb-1 block text-[11px] text-[var(--color-text-secondary)]">生成模式</span>
                <select v-model="qaForm.mode" class="form-control h-9 px-2 text-sm" :disabled="qaSubmitting || documentStore.qaGenerationPolling || !canManage">
                  <option value="append">append（追加）</option>
                  <option value="replace">replace（先清空后重建）</option>
                </select>
              </label>
            </div>

            <p v-if="qaError" class="mt-2 text-sm text-[var(--color-danger)]">{{ qaError }}</p>

            <div class="mt-3 flex items-center gap-2">
              <button
                type="button"
                class="btn btn-success btn-sm"
                :disabled="qaSubmitting || documentStore.qaGenerationPolling || !canManage"
                @click="handleStartQaGeneration"
              >
                {{ qaSubmitting || documentStore.qaGenerationPolling ? '执行中...' : '确认生成' }}
              </button>
            </div>
          </div>

          <div v-if="documentStore.qaGenerationStartResult || documentStore.qaGenerationTask" class="mt-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-elevated)] px-3 py-2 text-sm">
            <p class="font-medium">QA 任务状态</p>
            <p v-if="documentStore.qaGenerationStartResult" class="text-xs text-[var(--color-text-secondary)]">
              最近启动：task={{ documentStore.qaGenerationStartResult.task_id }} · status={{ documentStore.qaGenerationStartResult.status }} · generated={{ documentStore.qaGenerationStartResult.generated_qas }}
            </p>
            <p v-if="documentStore.qaGenerationTask" class="text-xs text-[var(--color-text-secondary)]">
              任务详情：status={{ documentStore.qaGenerationTask.status }} · stage={{ documentStore.qaGenerationTask.stage }} · total_generated_qas={{ documentStore.qaGenerationTask.total_generated_qas }}
            </p>
          </div>

        </div>

        <DocumentTable
          embedded
          :items="documentStore.items"
          :total="documentStore.total"
          :page="documentStore.page"
          :page-size="documentStore.pageSize"
          :loading="documentStore.loading"
          :downloading-id="documentStore.downloadingId"
          :selected-ids="documentStore.selectedDocumentIds"
          @download="handleDownload"
          @update:page="handlePageChange"
          @update:page-size="handlePageSizeChange"
          @update:selected-ids="handleSelectionChange"
        />
      </div>
    </section>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import DocumentTable from '@/components/business/DocumentTable.vue';
import DocumentUploadPanel from '@/components/business/DocumentUploadPanel.vue';
import { documentFileTypeOptions, useDocumentFilters } from '@/composables/useDocumentFilters';
import { useAuthStore } from '@/stores/auth.store';
import { useDocumentStore } from '@/stores/document.store';
import type { KnowledgeDocument, QAGenerationMode } from '@/types/domain';

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();
const documentStore = useDocumentStore();

const showUploadPanel = ref(false);
const showQaPanel = ref(false);
const batchSubmitting = ref(false);
const qaSubmitting = ref(false);
const batchError = ref('');
const qaError = ref('');

const fileTypeOptions = documentFileTypeOptions;
const { filters, syncFromQuery: syncFiltersFromStore, reset: resetFilterState, toQuery: filtersToQuery } = useDocumentFilters();

const batchForm = reactive({
  knowledge_base: 'default',
  min_batch_size: 10,
  max_wait_seconds: 300,
  max_docs: 200,
  max_workers: 8,
  include_failed: true,
  strict_pairing: false
});

const qaForm = reactive<{
  target_count: number;
  mode: QAGenerationMode;
}>({
  target_count: 10,
  mode: 'append'
});

const statsLoading = computed(() => documentStore.loading && documentStore.stats.document_count === 0);
const canManage = computed(() => authStore.role === 'admin' || authStore.role === 'reviewer');

const selectedDocument = computed(() => {
  if (documentStore.selectedDocumentIds.length !== 1) {
    return null;
  }
  const targetId = documentStore.selectedDocumentIds[0];
  return documentStore.items.find((item) => item.document_id === targetId) ?? null;
});

const canOpenQaPanel = computed(() => canManage.value && documentStore.selectedCount === 1);

const clearUploadFlag = async (): Promise<void> => {
  if (route.query.openUpload === undefined) {
    return;
  }

  const nextQuery = { ...route.query };
  delete nextQuery.openUpload;
  await router.replace({ query: nextQuery });
};

const closeUploadPanel = async (): Promise<void> => {
  showUploadPanel.value = false;
  await clearUploadFlag();
};

const toggleUploadPanel = async (): Promise<void> => {
  showUploadPanel.value = !showUploadPanel.value;
  if (!showUploadPanel.value) {
    await clearUploadFlag();
  }
};

const applyFilters = async (): Promise<void> => {
  await documentStore.fetchList({
    page: 1,
    page_size: documentStore.pageSize,
    ...filtersToQuery()
  });
};

const resetFilters = async (): Promise<void> => {
  resetFilterState();

  await documentStore.fetchList({
    page: 1,
    page_size: documentStore.pageSize,
    ...filtersToQuery()
  });
};

const refresh = async (): Promise<void> => {
  await documentStore.refresh();
  syncFiltersFromStore(documentStore.query);

  try {
    await documentStore.refreshCurrentSessionSummary(batchForm.knowledge_base);
  } catch {
    // ignore session refresh error during global refresh
  }
};

const handlePageChange = async (page: number): Promise<void> => {
  await documentStore.fetchList({ page });
};

const handlePageSizeChange = async (pageSize: number): Promise<void> => {
  await documentStore.fetchList({ page: 1, page_size: pageSize });
};

const handleDownload = async (documentItem: KnowledgeDocument): Promise<void> => {
  await documentStore.download(documentItem);
};

const handleSelectionChange = (ids: string[]): void => {
  documentStore.setSelectedDocumentIds(ids);
  if (ids.length !== 1) {
    showQaPanel.value = false;
  }
};

const refreshBatchSession = async (): Promise<void> => {
  batchError.value = '';

  try {
    await documentStore.refreshCurrentSessionSummary(batchForm.knowledge_base.trim() || 'default');
  } catch {
    batchError.value = documentStore.error || '刷新 session 失败';
  }
};

const handleStartBatchSync = async (): Promise<void> => {
  if (!canManage.value) {
    return;
  }

  batchError.value = '';

  if (batchForm.min_batch_size < 1 || batchForm.min_batch_size > 1000) {
    batchError.value = 'min_batch_size 必须在 1~1000 之间';
    return;
  }
  if (batchForm.max_wait_seconds < 0 || batchForm.max_wait_seconds > 86400) {
    batchError.value = 'max_wait_seconds 必须在 0~86400 之间';
    return;
  }
  if (batchForm.max_docs < 1 || batchForm.max_docs > 2000) {
    batchError.value = 'max_docs 必须在 1~2000 之间';
    return;
  }
  if (batchForm.max_workers < 1 || batchForm.max_workers > 64) {
    batchError.value = 'max_workers 必须在 1~64 之间';
    return;
  }

  batchSubmitting.value = true;
  try {
    const knowledgeBase = batchForm.knowledge_base.trim() || 'default';
    const summary = await documentStore.refreshCurrentSessionSummary(knowledgeBase);

    if (batchForm.strict_pairing && summary.unpaired_count > 0) {
      const confirmed = window.confirm(`strict_pairing=true 且当前有 ${summary.unpaired_count} 个未配对文档，继续将直接失败。是否继续启动？`);
      if (!confirmed) {
        return;
      }
    }

    const task = await documentStore.triggerBatchSync({
      knowledge_base: knowledgeBase,
      min_batch_size: batchForm.min_batch_size,
      max_wait_seconds: batchForm.max_wait_seconds,
      max_docs: batchForm.max_docs,
      max_workers: batchForm.max_workers,
      include_failed: batchForm.include_failed,
      strict_pairing: batchForm.strict_pairing
    });

    await documentStore.pollBatchSyncTask(task.task_id);
    await documentStore.refreshCurrentSessionSummary(knowledgeBase);
  } catch {
    batchError.value = documentStore.error || '启动批处理失败';
  } finally {
    batchSubmitting.value = false;
  }
};

const handleStartQaGeneration = async (): Promise<void> => {
  qaError.value = '';

  if (!canManage.value) {
    return;
  }

  if (!selectedDocument.value) {
    qaError.value = '请先选择一个文档';
    return;
  }

  if (!Number.isFinite(qaForm.target_count) || qaForm.target_count < 1 || qaForm.target_count > 100) {
    qaError.value = 'target_count 必须在 1~100 之间';
    return;
  }

  if (qaForm.mode === 'replace') {
    const confirmed = window.confirm('replace 模式会先删除该文档已有 QA，再重新生成。是否继续？');
    if (!confirmed) {
      return;
    }
  }

  qaSubmitting.value = true;
  try {
    const result = await documentStore.triggerQaGeneration({
      document_id: selectedDocument.value.document_id,
      target_count: qaForm.target_count,
      mode: qaForm.mode
    });
    await documentStore.pollQaGenerationTask(result.task_id);
    showQaPanel.value = false;
  } catch {
    qaError.value = documentStore.error || '触发 QA 生成失败';
  } finally {
    qaSubmitting.value = false;
  }
};

watch(
  () => route.query.openUpload,
  (value) => {
    showUploadPanel.value = value === '1';
  },
  { immediate: true }
);

onMounted(async () => {
  syncFiltersFromStore(documentStore.query);
  await documentStore.refresh();
  syncFiltersFromStore(documentStore.query);

  try {
    await documentStore.refreshCurrentSessionSummary(batchForm.knowledge_base);
  } catch {
    // ignore when there is no open session
  }
});
</script>
