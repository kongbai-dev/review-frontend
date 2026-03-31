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
                {{ showUploadPanel ? '收起上传' : '上传文档' }}
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
                :loading="documentStore.uploading"
                :error="documentStore.error"
                @submit="handleUpload"
                @cancel="closeUploadPanel"
              />
            </div>
          </transition>

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
              <select
                v-model="filters.file_type"
                class="form-control h-10 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-3 text-sm shadow-none"
              >
                <option value="">全部</option>
                <option v-for="option in fileTypeOptions" :key="option" :value="option">
                  {{ option.toUpperCase() }}
                </option>
              </select>
            </label>

            <label class="w-[118px] text-sm">
              <span class="mb-1 block text-[11px] font-medium text-[var(--color-text-secondary)]">状态</span>
              <select
                v-model="filters.status"
                class="form-control h-10 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-3 text-sm shadow-none"
              >
                <option value="">全部</option>
                <option value="indexed">已索引</option>
                <option value="processing">处理中</option>
                <option value="failed">失败</option>
              </select>
            </label>

            <label class="w-[132px] text-sm">
              <span class="mb-1 block text-[11px] font-medium text-[var(--color-text-secondary)]">排序字段</span>
              <select
                v-model="filters.sort_by"
                class="form-control h-10 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-3 text-sm shadow-none"
              >
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
                  :class="filters.order === 'desc'
                    ? 'bg-[var(--color-primary)] text-white'
                    : 'text-[var(--color-text-secondary)]'"
                  @click="filters.order = 'desc'"
                >
                  降序
                </button>
                <button
                  type="button"
                  class="rounded-md px-2 py-1.5 text-sm font-medium transition-colors"
                  :class="filters.order === 'asc'
                    ? 'bg-[var(--color-primary)] text-white'
                    : 'text-[var(--color-text-secondary)]'"
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
      </div>
    </section>
  </section>
</template>
<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
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

