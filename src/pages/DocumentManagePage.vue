<template>
  <section class="space-y-4">
    <header class="flex flex-wrap items-center justify-between gap-2">
      <div>
        <h2 class="text-lg font-semibold">文档管理</h2>
        <p class="text-muted text-sm">查看知识库文档概况，集中处理上传、分页列表和原文下载。</p>
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
    </header>

    <DocumentStatsCards :stats="documentStore.stats" :loading="statsLoading" />

    <p
      v-if="documentStore.error"
      class="rounded-2xl border border-[var(--color-border)] bg-[color:color-mix(in_srgb,var(--color-danger)_12%,transparent)] px-3 py-2 text-sm text-[var(--color-danger)]"
    >
      {{ documentStore.error }}
    </p>

    <DocumentUploadPanel
      v-if="showUploadPanel"
      :loading="documentStore.uploading"
      :error="documentStore.error"
      @submit="handleUpload"
      @cancel="closeUploadPanel"
    />

    <section class="surface-card rounded-[1.45rem] p-4">
      <div class="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 class="text-sm font-semibold">列表筛选与排序</h3>
          <p class="text-muted mt-1 text-xs">文档列表使用服务端分页，默认按上传时间倒序。</p>
        </div>
        <div class="flex flex-wrap items-center gap-2">
          <button type="button" class="btn btn-ghost btn-sm" :disabled="documentStore.loading" @click="resetFilters">
            重置
          </button>
          <button type="button" class="btn btn-primary btn-sm" :disabled="documentStore.loading" @click="applyFilters">
            应用筛选
          </button>
        </div>
      </div>

      <div class="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <label class="block text-sm xl:col-span-2">
          关键词
          <input
            v-model="filters.keyword"
            class="form-control mt-1"
            placeholder="按文件名、上传人或知识库检索"
            @keydown.enter.prevent="applyFilters"
          />
        </label>

        <label class="block text-sm">
          文件类型
          <select v-model="filters.file_type" class="form-control mt-1">
            <option value="">全部</option>
            <option v-for="option in fileTypeOptions" :key="option" :value="option">{{ option.toUpperCase() }}</option>
          </select>
        </label>

        <label class="block text-sm">
          状态
          <select v-model="filters.status" class="form-control mt-1">
            <option value="">全部</option>
            <option value="indexed">已索引</option>
            <option value="processing">处理中</option>
            <option value="failed">失败</option>
          </select>
        </label>

        <label class="block text-sm">
          排序字段
          <select v-model="filters.sort_by" class="form-control mt-1">
            <option value="uploaded_at">上传时间</option>
            <option value="file_name">文件名</option>
            <option value="fragment_count">片段数</option>
            <option value="qa_count">QA 数</option>
          </select>
        </label>

        <label class="block text-sm xl:col-start-5">
          排序方向
          <select v-model="filters.order" class="form-control mt-1">
            <option value="desc">降序</option>
            <option value="asc">升序</option>
          </select>
        </label>
      </div>
    </section>

    <div class="flex flex-wrap items-center justify-between gap-2 text-xs">
      <span class="text-muted">当前共 {{ documentStore.total }} 份文档，页码 {{ documentStore.page }} / {{ documentStore.totalPages }}</span>
      <span class="text-muted">下载使用后端签名地址，点击时按最新 URL 发起。</span>
    </div>

    <DocumentTable
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
