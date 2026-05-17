<template>
  <section class="flex h-[calc(100vh-7.5rem)] min-h-[640px] flex-col gap-3">
    <KnowledgeSectionTabs />
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
                @click="openUploadPanel"
              >
                上传工作台
              </button>
              <button
                v-if="canManage"
                type="button"
                class="inline-flex items-center justify-center rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-sm font-medium text-[var(--color-text-primary)] transition-colors hover:bg-[color:color-mix(in_srgb,var(--color-primary)_4%,white)] disabled:cursor-not-allowed disabled:opacity-60"
                :disabled="batchSubmitting || documentStore.batchSyncPolling"
                @click="handleStartBatchSync"
              >
                {{ batchSubmitting || documentStore.batchSyncPolling ? '批处理中...' : '批处理同步' }}
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

    <Teleport to="body">
      <transition
        enter-active-class="transition duration-180 ease-out"
        enter-from-class="opacity-0"
        enter-to-class="opacity-100"
        leave-active-class="transition duration-120 ease-in"
        leave-from-class="opacity-100"
        leave-to-class="opacity-0"
      >
        <div v-if="showUploadPanel" class="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6">
          <button
            type="button"
            class="absolute inset-0 bg-[color:color-mix(in_srgb,var(--color-bg)_48%,black)] backdrop-blur-[3px]"
            aria-label="关闭上传工作台"
            @click="closeUploadPanel"
          />

          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="document-upload-dialog-title"
            class="relative z-10 flex max-h-[calc(100vh-1.5rem)] w-full max-w-6xl flex-col overflow-hidden rounded-[1.6rem] border border-[var(--color-border)] bg-[var(--color-bg-elevated)] shadow-[0_32px_120px_-48px_var(--color-shadow)] sm:max-h-[calc(100vh-3rem)]"
            @click.stop
          >
            <div class="flex items-start justify-between gap-3 border-b border-[var(--color-border)] px-4 py-4 sm:px-5">
              <div class="min-w-0">
                <h3 id="document-upload-dialog-title" class="text-base font-semibold text-[var(--color-text-primary)]">文档上传工作台</h3>
                <p class="mt-1 text-sm text-[var(--color-text-secondary)]">上传流程已切换为弹窗模式，上传时不会再把文档表格区域挤出可视范围。</p>
              </div>
              <button type="button" class="btn btn-ghost btn-sm shrink-0" @click="closeUploadPanel">关闭</button>
            </div>

            <div class="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-5">
              <DocumentUploadPanel
                v-model:knowledge-base="workspaceKnowledgeBase"
                :can-manage="canManage"
                :error="documentStore.error"
                :show-header="false"
                :framed="false"
                @cancel="closeUploadPanel"
              />
            </div>
          </section>
        </div>
      </transition>
    </Teleport>
  </section>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import DocumentTable from '@/components/business/DocumentTable.vue';
import DocumentUploadPanel from '@/components/business/DocumentUploadPanel.vue';
import KnowledgeSectionTabs from '@/components/business/KnowledgeSectionTabs.vue';
import { DOCUMENT_BATCH_SYNC_CONFIG } from '@/config';
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
const qaError = ref('');
const workspaceKnowledgeBase = ref('default');

const fileTypeOptions = documentFileTypeOptions;
const { filters, syncFromQuery: syncFiltersFromStore, reset: resetFilterState, toQuery: filtersToQuery } = useDocumentFilters();

const qaForm = reactive<{
  target_count: number;
  mode: QAGenerationMode;
}>({
  target_count: 10,
  mode: 'append'
});

const statsLoading = computed(() => documentStore.loading && documentStore.stats.document_count === 0);
const canManage = computed(() => authStore.role === 'admin' || authStore.role === 'reviewer');
const normalizedKnowledgeBase = computed(() => workspaceKnowledgeBase.value.trim() || 'default');

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

const openUploadPanel = (): void => {
  showUploadPanel.value = true;
};

const handleWindowKeydown = (event: KeyboardEvent): void => {
  if (event.key === 'Escape' && showUploadPanel.value) {
    void closeUploadPanel();
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

const handleStartBatchSync = async (): Promise<void> => {
  if (!canManage.value) {
    return;
  }

  batchSubmitting.value = true;
  try {
    const knowledgeBase = normalizedKnowledgeBase.value;
    if (DOCUMENT_BATCH_SYNC_CONFIG.strict_pairing) {
      const summary = await documentStore.refreshCurrentSessionSummary(knowledgeBase);
      const confirmed = window.confirm(`strict_pairing=true 且当前有 ${summary.unpaired_count} 个未配对文档，继续将直接失败。是否继续启动？`);
      if (!confirmed) {
        return;
      }
    }

    const task = await documentStore.triggerBatchSync({
      knowledge_base: knowledgeBase,
      min_batch_size: DOCUMENT_BATCH_SYNC_CONFIG.min_batch_size,
      max_wait_seconds: DOCUMENT_BATCH_SYNC_CONFIG.max_wait_seconds,
      max_docs: DOCUMENT_BATCH_SYNC_CONFIG.max_docs,
      max_workers: DOCUMENT_BATCH_SYNC_CONFIG.max_workers,
      include_failed: DOCUMENT_BATCH_SYNC_CONFIG.include_failed,
      strict_pairing: DOCUMENT_BATCH_SYNC_CONFIG.strict_pairing
    });

    await documentStore.pollBatchSyncTask(task.task_id);
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
  window.addEventListener('keydown', handleWindowKeydown);
  syncFiltersFromStore(documentStore.query);
  await documentStore.refresh();
  syncFiltersFromStore(documentStore.query);
});

onBeforeUnmount(() => {
  window.removeEventListener('keydown', handleWindowKeydown);
});
</script>


