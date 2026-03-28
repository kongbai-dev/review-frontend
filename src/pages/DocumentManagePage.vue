<template>
  <section class="space-y-3">
    <div class="px-1">
      <p class="text-[11px] font-medium uppercase tracking-[0.16em] text-[var(--color-primary)]">Document Workspace</p>
    </div>

    <p
      v-if="documentStore.error"
      class="rounded-2xl border border-[var(--color-border)] bg-[color:color-mix(in_srgb,var(--color-danger)_12%,transparent)] px-3 py-2 text-sm text-[var(--color-danger)]"
    >
      {{ documentStore.error }}
    </p>

    <section class="surface-panel overflow-hidden rounded-[1.7rem]">
      <div class="border-b border-[var(--color-border)] px-4 py-4 sm:px-5 sm:py-5">
        <div class="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h3 class="text-base font-semibold">文档列表</h3>
            <p class="text-muted mt-1 text-sm">
              当前共 {{ documentStore.total }} 份文档，页码 {{ documentStore.page }} / {{ documentStore.totalPages }}。
            </p>
          </div>

          <div class="flex flex-wrap items-center gap-2">
            <button type="button" class="btn btn-ghost btn-sm" @click="toggleUploadPanel">
              {{ showUploadPanel ? '收起上传面板' : '上传文档' }}
            </button>
            <button
              type="button"
              class="btn btn-primary btn-sm"
              :disabled="documentStore.loading || documentStore.uploading"
              @click="refresh"
            >
              刷新
            </button>
          </div>
        </div>

        <DocumentStatsCards class="mt-4" :stats="documentStore.stats" :loading="statsLoading" variant="compact" />

        <DocumentUploadPanel
          v-if="showUploadPanel"
          class="mt-4"
          :loading="documentStore.uploading"
          :error="documentStore.error"
          @submit="handleUpload"
          @cancel="closeUploadPanel"
        />

        <div class="mt-4 flex flex-wrap items-end gap-3 xl:flex-nowrap">
          <label class="block min-w-[260px] flex-[1.8] text-sm">
            <span class="mb-1.5 block text-[12px] font-medium text-[var(--color-text-secondary)]">关键词</span>
            <input
              v-model="filters.keyword"
              class="form-control"
              placeholder="按文件名、上传人或知识库检索"
              @keydown.enter.prevent="applyFilters"
            />
          </label>

          <label class="block min-w-[130px] flex-1 text-sm xl:max-w-[150px]">
            <span class="mb-1.5 block text-[12px] font-medium text-[var(--color-text-secondary)]">文件类型</span>
            <select v-model="filters.file_type" class="form-control">
              <option value="">全部</option>
              <option v-for="option in fileTypeOptions" :key="option" :value="option">{{ option.toUpperCase() }}</option>
            </select>
          </label>

          <label class="block min-w-[130px] flex-1 text-sm xl:max-w-[150px]">
            <span class="mb-1.5 block text-[12px] font-medium text-[var(--color-text-secondary)]">状态</span>
            <select v-model="filters.status" class="form-control">
              <option value="">全部</option>
              <option value="indexed">已索引</option>
              <option value="processing">处理中</option>
              <option value="failed">失败</option>
            </select>
          </label>

          <label class="block min-w-[150px] flex-1 text-sm xl:max-w-[180px]">
            <span class="mb-1.5 block text-[12px] font-medium text-[var(--color-text-secondary)]">排序字段</span>
            <select v-model="filters.sort_by" class="form-control">
              <option value="uploaded_at">上传时间</option>
              <option value="file_name">文件名</option>
              <option value="fragment_count">片段数</option>
              <option value="qa_count">QA 数</option>
            </select>
          </label>

          <div class="min-w-[164px] text-sm xl:w-[176px] xl:flex-none">
            <span class="mb-1.5 block text-[12px] font-medium text-[var(--color-text-secondary)]">排序方向</span>
            <div class="grid grid-cols-2 rounded-[0.95rem] border border-[var(--color-border)] bg-[color:color-mix(in_srgb,var(--color-bg-elevated)_50%,transparent)] p-1">
              <button
                type="button"
                class="rounded-[0.72rem] px-3 py-2 text-sm font-medium transition-colors"
                :class="filters.order === 'desc'
                  ? 'bg-[color:color-mix(in_srgb,var(--color-primary)_18%,transparent)] text-[var(--color-text-primary)]'
                  : 'text-[var(--color-text-secondary)]'"
                @click="filters.order = 'desc'"
              >
                降序
              </button>
              <button
                type="button"
                class="rounded-[0.72rem] px-3 py-2 text-sm font-medium transition-colors"
                :class="filters.order === 'asc'
                  ? 'bg-[color:color-mix(in_srgb,var(--color-primary)_18%,transparent)] text-[var(--color-text-primary)]'
                  : 'text-[var(--color-text-secondary)]'"
                @click="filters.order = 'asc'"
              >
                升序
              </button>
            </div>
          </div>

          <div class="flex items-center gap-2 xl:ml-auto xl:flex-none">
            <button type="button" class="btn btn-ghost btn-sm" :disabled="documentStore.loading" @click="resetFilters">
              重置
            </button>
            <button type="button" class="btn btn-primary btn-sm" :disabled="documentStore.loading" @click="applyFilters">
              应用筛选
            </button>
          </div>
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
        @download="handleDownload"
        @update:page="handlePageChange"
        @update:page-size="handlePageSizeChange"
      />
    </section>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import DocumentStatsCards from '@/components/business/DocumentStatsCards.vue';
import DocumentTable from '@/components/business/DocumentTable.vue';
import DocumentUploadPanel from '@/components/business/DocumentUploadPanel.vue';
import { useDocumentStore } from '@/stores/document.store';
import type { DocumentSortField, DocumentStatus, KnowledgeDocument, SortOrder } from '@/types/domain';

const route = useRoute();
const router = useRouter();
const documentStore = useDocumentStore();
const showUploadPanel = ref(false);

const fileTypeOptions = ['pdf', 'doc', 'docx', 'txt', 'md'];

const filters = reactive<{
  keyword: string;
  file_type: string;
  status: DocumentStatus | '';
  sort_by: DocumentSortField;
  order: SortOrder;
}>({
  keyword: '',
  file_type: '',
  status: '',
  sort_by: 'uploaded_at',
  order: 'desc'
});

const statsLoading = computed(() => documentStore.loading && documentStore.stats.document_count === 0);

const syncFiltersFromStore = (): void => {
  filters.keyword = documentStore.query.keyword ?? '';
  filters.file_type = documentStore.query.file_type ?? '';
  filters.status = documentStore.query.status ?? '';
  filters.sort_by = documentStore.query.sort_by ?? 'uploaded_at';
  filters.order = documentStore.query.order ?? 'desc';
};

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
    keyword: filters.keyword,
    file_type: filters.file_type,
    status: filters.status,
    sort_by: filters.sort_by,
    order: filters.order
  });
};

const resetFilters = async (): Promise<void> => {
  filters.keyword = '';
  filters.file_type = '';
  filters.status = '';
  filters.sort_by = 'uploaded_at';
  filters.order = 'desc';

  await documentStore.fetchList({
    page: 1,
    page_size: documentStore.pageSize,
    keyword: '',
    file_type: '',
    status: '',
    sort_by: 'uploaded_at',
    order: 'desc'
  });
};

const refresh = async (): Promise<void> => {
  await documentStore.refresh();
  syncFiltersFromStore();
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

const handleUpload = async (file: File): Promise<void> => {
  await documentStore.upload(file);
  await closeUploadPanel();
};

watch(
  () => route.query.openUpload,
  (value) => {
    showUploadPanel.value = value === '1';
  },
  { immediate: true }
);

onMounted(async () => {
  syncFiltersFromStore();
  await documentStore.refresh();
  syncFiltersFromStore();
});
</script>
