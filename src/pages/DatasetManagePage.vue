<template>
  <section class="flex h-[calc(100vh-7.5rem)] min-h-[640px] flex-col gap-3">
    <KnowledgeSectionTabs />

    <p
      v-if="error"
      class="rounded-xl border border-[color:color-mix(in_srgb,var(--color-danger)_24%,var(--color-border))] bg-[color:color-mix(in_srgb,var(--color-danger)_8%,white)] px-3 py-2 text-sm text-[var(--color-danger)]"
    >
      {{ error }}
    </p>

    <section class="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-elevated)]">
      <div class="sticky top-0 z-10 border-b border-[var(--color-border)] bg-[var(--color-bg-elevated)]">
        <div class="px-4 py-3 sm:px-5">
          <div class="flex flex-wrap items-center justify-between gap-3">
            <div class="min-w-0">
              <div class="flex flex-wrap items-center gap-x-3 gap-y-1">
                <h2 class="text-base font-semibold text-[var(--color-text-primary)]">数据管理</h2>
                <span class="text-xs text-[var(--color-text-secondary)]">
                  {{ total }} 个数据集 · 第 {{ query.page }}/{{ totalPages }} 页
                </span>
              </div>
              <p class="mt-1 text-xs text-[var(--color-text-secondary)]">已接入 `knowledge/datasets` 的列表、上传、详情、解析、向量同步和批量 QA 生成。</p>
            </div>

            <div class="flex flex-wrap items-center gap-2">
              <button
                type="button"
                class="inline-flex items-center justify-center rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-sm font-medium text-[var(--color-text-primary)] transition-colors hover:bg-[color:color-mix(in_srgb,var(--color-primary)_4%,white)]"
                @click="showUploadPanel = true"
              >
                上传数据
              </button>
              <button
                type="button"
                class="inline-flex items-center justify-center rounded-lg bg-[var(--color-primary)] px-3 py-2 text-sm font-medium text-white transition-opacity hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
                :disabled="loading || actionSubmitting || uploadSubmitting || qaSubmitting"
                @click="refresh"
              >
                刷新
              </button>
            </div>
          </div>

          <div class="mt-3 flex flex-wrap items-end gap-2">
            <label class="min-w-[220px] flex-[1.5] text-sm">
              <span class="mb-1 block text-[11px] font-medium text-[var(--color-text-secondary)]">关键词</span>
              <input v-model="filters.keyword" class="form-control h-9 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-3 text-sm shadow-none" placeholder="数据集 / 文件名 / object_key" @keydown.enter.prevent="applyFilters" />
            </label>

            <label class="w-[128px] text-sm">
              <span class="mb-1 block text-[11px] font-medium text-[var(--color-text-secondary)]">知识库</span>
              <input v-model="filters.knowledge_base" class="form-control h-9 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-3 text-sm shadow-none" placeholder="default" @keydown.enter.prevent="applyFilters" />
            </label>

            <label class="w-[118px] text-sm">
              <span class="mb-1 block text-[11px] font-medium text-[var(--color-text-secondary)]">来源</span>
              <input v-model="filters.source" class="form-control h-9 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-3 text-sm shadow-none" placeholder="simulation" @keydown.enter.prevent="applyFilters" />
            </label>

            <label class="w-[128px] text-sm">
              <span class="mb-1 block text-[11px] font-medium text-[var(--color-text-secondary)]">数据类型</span>
              <input v-model="filters.data_type" class="form-control h-9 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-3 text-sm shadow-none" placeholder="measurement" @keydown.enter.prevent="applyFilters" />
            </label>

            <label class="w-[118px] text-sm">
              <span class="mb-1 block text-[11px] font-medium text-[var(--color-text-secondary)]">解析状态</span>
              <select v-model="filters.parse_status" class="form-control h-10 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-3 text-sm shadow-none">
                <option value="">全部</option>
                <option value="uploaded">uploaded</option>
                <option value="parsed">parsed</option>
                <option value="failed">failed</option>
              </select>
            </label>

            <label class="w-[118px] text-sm">
              <span class="mb-1 block text-[11px] font-medium text-[var(--color-text-secondary)]">向量状态</span>
              <select v-model="filters.vector_status" class="form-control h-10 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-3 text-sm shadow-none">
                <option value="">全部</option>
                <option value="not_synced">not_synced</option>
                <option value="queued">queued</option>
                <option value="synced">synced</option>
                <option value="failed">failed</option>
              </select>
            </label>

            <div class="ml-auto flex items-center gap-2">
              <button type="button" class="inline-flex h-9 items-center justify-center rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-3 text-sm font-medium text-[var(--color-text-primary)] transition-colors hover:bg-[color:color-mix(in_srgb,var(--color-primary)_4%,white)]" :disabled="loading" @click="resetFilters">重置</button>
              <button type="button" class="inline-flex h-9 items-center justify-center rounded-lg bg-[var(--color-primary)] px-3 text-sm font-medium text-white transition-opacity hover:opacity-95" :disabled="loading" @click="applyFilters">筛选</button>
            </div>
          </div>
        </div>
      </div>

      <div class="min-h-0 flex-1 overflow-auto bg-[var(--color-bg)]">
        <div class="px-4 pt-4 sm:px-5">
          <div class="flex flex-wrap items-center gap-2 rounded-lg border border-[var(--color-border)] bg-[color:color-mix(in_srgb,var(--color-surface-strong)_35%,transparent)] px-3 py-2">
            <span class="text-sm">已选 {{ selectedIds.length }} 项</span>
            <button type="button" class="btn btn-primary btn-sm" :disabled="!canOpenQaPanel" @click="showQaPanel = !showQaPanel">
              {{ showQaPanel ? '收起生成QA' : '批量生成 QA' }}
            </button>
            <button type="button" class="btn btn-ghost btn-sm" :disabled="selectedIds.length === 0" @click="clearSelection">清空选择</button>
            <span v-if="!canManage" class="text-xs text-[var(--color-warning)]">observer 角色不可上传、解析或触发生成。</span>
          </div>

          <div v-if="showQaPanel && selectedIds.length > 0" class="mt-3 rounded-xl border border-[var(--color-border)] bg-[color:color-mix(in_srgb,var(--color-bg-elevated)_92%,transparent)] p-3">
            <div class="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p class="text-sm font-medium">批量生成 QA</p>
                <p class="text-xs text-[var(--color-text-secondary)]">当前选中 {{ selectedIds.length }} 个数据集</p>
              </div>
              <button type="button" class="btn btn-ghost btn-sm" @click="showQaPanel = false">收起</button>
            </div>

            <div class="mt-3 grid gap-2 sm:grid-cols-2">
              <label class="text-sm">
                <span class="mb-1 block text-[11px] text-[var(--color-text-secondary)]">每个数据集生成数（1~50）</span>
                <input v-model.number="qaForm.qa_count_per_dataset" type="number" min="1" max="50" class="form-control h-9 px-2 text-sm" :disabled="qaSubmitting || !canManage" />
              </label>
              <label class="text-sm">
                <span class="mb-1 block text-[11px] text-[var(--color-text-secondary)]">生成模式</span>
                <select v-model="qaForm.mode" class="form-control h-9 px-2 text-sm" :disabled="qaSubmitting || !canManage">
                  <option value="append">append（追加）</option>
                  <option value="replace">replace（先清空后重建）</option>
                </select>
              </label>
            </div>

            <div class="mt-3 flex items-center gap-2">
              <button type="button" class="btn btn-success btn-sm" :disabled="qaSubmitting || !canManage" @click="handleStartQaGeneration">
                {{ qaSubmitting ? '执行中...' : '确认生成' }}
              </button>
            </div>
          </div>

          <div v-if="lastUploadResult || lastParseResult || lastVectorSyncResult || qaTask" class="mt-3 grid gap-2 xl:grid-cols-2">
            <div v-if="lastUploadResult" class="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-elevated)] px-3 py-2 text-sm">
              最近上传：{{ lastUploadResult.dataset_name }} · object_key={{ lastUploadResult.object_key }} · parse={{ lastUploadResult.parse_status }}
            </div>
            <div v-if="lastParseResult" class="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-elevated)] px-3 py-2 text-sm">
              最近解析：{{ lastParseResult.dataset_id }} · status={{ lastParseResult.parse_status }} · records={{ formatNumber(lastParseResult.parsed_record_count) }}
            </div>
            <div v-if="lastVectorSyncResult" class="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-elevated)] px-3 py-2 text-sm">
              最近向量同步：{{ lastVectorSyncResult.dataset_id }} · job={{ lastVectorSyncResult.job_type }} · status={{ lastVectorSyncResult.vector_status }}
            </div>
            <div v-if="qaTask" class="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-elevated)] px-3 py-2 text-sm">
              QA 任务：{{ qaTask.task_id }} · status={{ qaTask.status }} · processed={{ qaTask.processed_datasets }}/{{ qaTask.total_datasets }} · generated={{ qaTask.generated_total }}
            </div>
          </div>
        </div>

        <DatasetTable
          :items="items"
          :total="total"
          :page="query.page"
          :page-size="query.page_size"
          :selected-ids="selectedIds"
          :loading="loading || actionSubmitting || qaSubmitting"
          @view="openDetail"
          @parse="handleParse"
          @vector-sync="handleVectorSync"
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
          <button type="button" class="absolute inset-0 bg-[color:color-mix(in_srgb,var(--color-bg)_48%,black)] backdrop-blur-[3px]" aria-label="关闭数据上传" @click="showUploadPanel = false" />
          <section class="relative z-10 w-full max-w-4xl rounded-[1.6rem] border border-[var(--color-border)] bg-[var(--color-bg-elevated)] p-4 shadow-[0_32px_120px_-48px_var(--color-shadow)] sm:p-5" @click.stop>
            <DatasetUploadPanel :loading="uploadSubmitting" :can-manage="canManage" @submit="handleUpload" @cancel="showUploadPanel = false" />
          </section>
        </div>
      </transition>
    </Teleport>

    <Teleport to="body">
      <transition
        enter-active-class="transition duration-180 ease-out"
        enter-from-class="opacity-0"
        enter-to-class="opacity-100"
        leave-active-class="transition duration-120 ease-in"
        leave-from-class="opacity-100"
        leave-to-class="opacity-0"
      >
        <div v-if="showDetailPanel" class="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6">
          <button type="button" class="absolute inset-0 bg-[color:color-mix(in_srgb,var(--color-bg)_48%,black)] backdrop-blur-[3px]" aria-label="关闭数据详情" @click="closeDetail" />
          <section class="relative z-10 flex max-h-[calc(100vh-1.5rem)] w-full max-w-6xl flex-col overflow-hidden rounded-[1.6rem] border border-[var(--color-border)] bg-[var(--color-bg-elevated)] shadow-[0_32px_120px_-48px_var(--color-shadow)] sm:max-h-[calc(100vh-3rem)]" @click.stop>
            <div class="flex items-start justify-between gap-3 border-b border-[var(--color-border)] px-4 py-4 sm:px-5">
              <div class="min-w-0">
                <h3 class="text-base font-semibold text-[var(--color-text-primary)]">{{ currentDetail?.dataset_name || '数据详情' }}</h3>
                <p class="mt-1 text-sm text-[var(--color-text-secondary)]">{{ currentDetail?.file_name || '正在加载...' }}</p>
              </div>
              <button type="button" class="btn btn-ghost btn-sm shrink-0" @click="closeDetail">关闭</button>
            </div>

            <div class="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-5">
              <p v-if="detailLoading" class="text-sm text-[var(--color-text-secondary)]">正在加载数据详情...</p>
              <template v-else-if="currentDetail">
                <div class="grid gap-3 xl:grid-cols-[minmax(0,0.92fr),minmax(320px,1.08fr)]">
                  <div class="space-y-3">
                    <div class="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] p-3 text-sm">
                      <div class="grid gap-2 sm:grid-cols-2">
                        <p>知识库：{{ currentDetail.knowledge_base }}</p>
                        <p>来源：{{ currentDetail.source }}</p>
                        <p>数据类型：{{ currentDetail.data_type }}</p>
                        <p>子类型：{{ currentDetail.sub_type || '-' }}</p>
                        <p>文件大小：{{ formatBytes(currentDetail.file_size) }}</p>
                        <p>记录数：{{ formatNumber(currentDetail.row_count) }}</p>
                        <p>列数：{{ formatNumber(currentDetail.column_count) }}</p>
                        <p>创建时间：{{ formatDateTime(currentDetail.created_at) }}</p>
                        <p>器件类型：{{ currentDetail.device_type || '-' }}</p>
                        <p>材料体系：{{ currentDetail.material_system || '-' }}</p>
                        <p>物理现象：{{ currentDetail.phenomenon || '-' }}</p>
                        <p>bucket：{{ currentDetail.bucket_name }}</p>
                      </div>
                      <div class="mt-3 rounded-lg border border-[var(--color-border)] bg-[color:color-mix(in_srgb,var(--color-surface-strong)_24%,transparent)] px-3 py-2 text-xs text-[var(--color-text-secondary)]">
                        <p class="font-medium text-[var(--color-text-primary)]">MinIO object_key</p>
                        <p class="mt-1 break-all">{{ currentDetail.object_key }}</p>
                      </div>
                    </div>

                    <div class="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] p-3 text-sm">
                      <p class="font-medium">状态</p>
                      <div class="mt-2 flex flex-wrap gap-2 text-xs">
                        <span class="status-pill" :class="statusTone(currentDetail.parse_status)">parse: {{ currentDetail.parse_status }}</span>
                        <span class="status-pill" :class="statusTone(currentDetail.qa_status)">qa: {{ currentDetail.qa_status }}</span>
                        <span class="status-pill" :class="statusTone(currentDetail.vector_status)">vector: {{ currentDetail.vector_status }}</span>
                      </div>
                      <div class="mt-3 flex flex-wrap gap-2 text-xs text-[var(--color-text-secondary)]">
                        <span>topics: {{ formatTags(currentDetail.topics) }}</span>
                        <span>scenes: {{ formatTags(currentDetail.scenes) }}</span>
                      </div>
                    </div>

                    <div class="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] p-3 text-sm">
                      <div class="flex items-center justify-between gap-2">
                        <p class="font-medium">记录预览</p>
                        <span class="text-xs text-[var(--color-text-secondary)]">展示前 {{ currentRecords.length }} 条</span>
                      </div>
                      <div v-if="currentRecords.length > 0" class="mt-2 space-y-3">
                        <article v-for="record in currentRecords" :key="record.id" class="rounded-lg border border-[var(--color-border)] bg-[color:color-mix(in_srgb,var(--color-surface-strong)_24%,transparent)] p-3">
                          <p class="text-xs text-[var(--color-text-secondary)]">{{ record.record_type }} · index={{ record.record_index }} · {{ record.record_name || '-' }}</p>
                          <pre class="mt-2 overflow-x-auto whitespace-pre-wrap text-xs leading-5 text-[var(--color-text-primary)]">{{ previewObject(record.record_values) }}</pre>
                        </article>
                      </div>
                      <p v-else class="mt-2 text-xs text-[var(--color-text-secondary)]">暂无记录预览。</p>
                    </div>
                  </div>

                  <div class="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] p-3 text-sm">
                    <div class="flex items-center justify-between gap-2">
                      <p class="font-medium">QA 预览</p>
                      <span class="text-xs text-[var(--color-text-secondary)]">展示前 {{ currentQAs.length }} 条</span>
                    </div>
                    <div v-if="currentQAs.length > 0" class="mt-2 space-y-3">
                      <article v-for="qa in currentQAs" :key="qa.id" class="rounded-lg border border-[var(--color-border)] bg-[color:color-mix(in_srgb,var(--color-surface-strong)_24%,transparent)] p-3">
                        <div class="flex flex-wrap items-center justify-between gap-2 text-xs text-[var(--color-text-secondary)]">
                          <span>{{ qa.qa_type || 'general' }} · {{ qa.source }}</span>
                          <span class="status-pill" :class="statusTone(qa.review_status)">{{ qa.review_status }}</span>
                        </div>
                        <p class="mt-2 font-medium text-[var(--color-text-primary)]">{{ qa.question }}</p>
                        <p class="mt-2 whitespace-pre-wrap leading-6 text-[var(--color-text-secondary)]">{{ qa.answer }}</p>
                      </article>
                    </div>
                    <p v-else class="mt-2 text-xs text-[var(--color-text-secondary)]">当前数据集还没有 QA。</p>
                  </div>
                </div>
              </template>
            </div>
          </section>
        </div>
      </transition>
    </Teleport>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
import DatasetTable from '@/components/business/DatasetTable.vue';
import DatasetUploadPanel from '@/components/business/DatasetUploadPanel.vue';
import KnowledgeSectionTabs from '@/components/business/KnowledgeSectionTabs.vue';
import { pollUntil } from '@/lib/async';
import { formatBytes, formatDateTime, formatNumber } from '@/lib/format';
import { datasetApi } from '@/services/api/dataset.api';
import { useAuthStore } from '@/stores/auth.store';
import type {
  DatasetListQuery,
  DatasetParseResult,
  DatasetQAItem,
  DatasetQAGenerationTask,
  DatasetRecord,
  DatasetVectorSyncResult,
  KnowledgeDataset,
  QAGenerationMode,
  UploadDatasetPayload,
  UploadDatasetResult
} from '@/types/domain';
import { normalizeError } from '@/utils/error';

const authStore = useAuthStore();
const canManage = computed(() => authStore.role === 'admin' || authStore.role === 'reviewer');

const items = ref<KnowledgeDataset[]>([]);
const total = ref(0);
const loading = ref(false);
const uploadSubmitting = ref(false);
const actionSubmitting = ref(false);
const qaSubmitting = ref(false);
const detailLoading = ref(false);
const error = ref('');
const showUploadPanel = ref(false);
const showDetailPanel = ref(false);
const selectedIds = ref<string[]>([]);
const currentDetail = ref<KnowledgeDataset | null>(null);
const currentRecords = ref<DatasetRecord[]>([]);
const currentQAs = ref<DatasetQAItem[]>([]);
const lastUploadResult = ref<UploadDatasetResult | null>(null);
const lastParseResult = ref<DatasetParseResult | null>(null);
const lastVectorSyncResult = ref<DatasetVectorSyncResult | null>(null);
const qaTask = ref<DatasetQAGenerationTask | null>(null);
const showQaPanel = ref(false);

const query = reactive<DatasetListQuery>({
  page: 1,
  page_size: 20,
  knowledge_base: '',
  source: '',
  data_type: '',
  sub_type: '',
  device_type: '',
  material_system: '',
  phenomenon: '',
  parse_status: '',
  vector_status: '',
  keyword: ''
});

const filters = reactive({
  keyword: '',
  knowledge_base: '',
  source: '',
  data_type: '',
  parse_status: '',
  vector_status: ''
});

const qaForm = reactive<{
  qa_count_per_dataset: number;
  mode: QAGenerationMode;
}>({
  qa_count_per_dataset: 5,
  mode: 'append'
});

const totalPages = computed(() => Math.max(1, Math.ceil(total.value / query.page_size)));
const canOpenQaPanel = computed(() => canManage.value && selectedIds.value.length > 0);

const fetchList = async (): Promise<void> => {
  loading.value = true;
  error.value = '';
  try {
    const response = await datasetApi.getList(query);
    items.value = response.items;
    total.value = response.total;
    query.page = response.page;
    query.page_size = response.page_size;
  } catch (err) {
    error.value = normalizeError(err);
  } finally {
    loading.value = false;
  }
};

const loadDetail = async (datasetId: string): Promise<void> => {
  const [detail, records, qas] = await Promise.all([
    datasetApi.getDetail(datasetId),
    datasetApi.getRecords(datasetId, 1, 8),
    datasetApi.getQAs(datasetId, undefined, 1, 5)
  ]);

  currentDetail.value = detail;
  currentRecords.value = records.items;
  currentQAs.value = qas.items;
};

const refreshOpenDetail = async (): Promise<void> => {
  if (!showDetailPanel.value || !currentDetail.value) {
    return;
  }

  detailLoading.value = true;
  try {
    await loadDetail(currentDetail.value.id);
  } catch (err) {
    error.value = normalizeError(err);
  } finally {
    detailLoading.value = false;
  }
};

const applyFilters = async (): Promise<void> => {
  query.page = 1;
  query.keyword = filters.keyword.trim();
  query.knowledge_base = filters.knowledge_base.trim();
  query.source = filters.source.trim();
  query.data_type = filters.data_type.trim();
  query.parse_status = filters.parse_status;
  query.vector_status = filters.vector_status;
  await fetchList();
};

const resetFilters = async (): Promise<void> => {
  filters.keyword = '';
  filters.knowledge_base = '';
  filters.source = '';
  filters.data_type = '';
  filters.parse_status = '';
  filters.vector_status = '';
  await applyFilters();
};

const refresh = async (): Promise<void> => {
  await fetchList();
  await refreshOpenDetail();
};

const handlePageChange = async (page: number): Promise<void> => {
  query.page = page;
  await fetchList();
};

const handlePageSizeChange = async (pageSize: number): Promise<void> => {
  query.page = 1;
  query.page_size = pageSize;
  await fetchList();
};

const handleSelectionChange = (ids: string[]): void => {
  selectedIds.value = ids;
  if (ids.length === 0) {
    showQaPanel.value = false;
  }
};

const clearSelection = (): void => {
  selectedIds.value = [];
  showQaPanel.value = false;
};

const handleUpload = async (payload: UploadDatasetPayload): Promise<void> => {
  uploadSubmitting.value = true;
  error.value = '';
  try {
    lastUploadResult.value = await datasetApi.upload(payload);
    showUploadPanel.value = false;
    await fetchList();
  } catch (err) {
    error.value = normalizeError(err);
  } finally {
    uploadSubmitting.value = false;
  }
};

const handleParse = async (datasetId: string): Promise<void> => {
  if (!canManage.value) {
    return;
  }

  actionSubmitting.value = true;
  error.value = '';
  try {
    lastParseResult.value = await datasetApi.parse(datasetId);
    await fetchList();
    if (currentDetail.value?.id === datasetId) {
      await refreshOpenDetail();
    }
  } catch (err) {
    error.value = normalizeError(err);
  } finally {
    actionSubmitting.value = false;
  }
};

const handleVectorSync = async (datasetId: string): Promise<void> => {
  if (!canManage.value) {
    return;
  }

  actionSubmitting.value = true;
  error.value = '';
  try {
    lastVectorSyncResult.value = await datasetApi.triggerVectorSync(datasetId);
    await fetchList();
    if (currentDetail.value?.id === datasetId) {
      await refreshOpenDetail();
    }
  } catch (err) {
    error.value = normalizeError(err);
  } finally {
    actionSubmitting.value = false;
  }
};

const handleStartQaGeneration = async (): Promise<void> => {
  if (!canManage.value || selectedIds.value.length === 0) {
    return;
  }

  if (!Number.isFinite(qaForm.qa_count_per_dataset) || qaForm.qa_count_per_dataset < 1 || qaForm.qa_count_per_dataset > 50) {
    error.value = 'qa_count_per_dataset 必须在 1~50 之间';
    return;
  }

  if (qaForm.mode === 'replace') {
    const confirmed = window.confirm(`replace 模式会重建所选 ${selectedIds.value.length} 个数据集的 QA，是否继续？`);
    if (!confirmed) {
      return;
    }
  }

  qaSubmitting.value = true;
  error.value = '';
  try {
    const startedTask = await datasetApi.startQaGeneration({
      dataset_ids: [...selectedIds.value],
      qa_count_per_dataset: qaForm.qa_count_per_dataset,
      mode: qaForm.mode
    });

    qaTask.value = startedTask;
    qaTask.value = await pollUntil(
      () => datasetApi.getQaGenerationTask(startedTask.task_id),
      (task) => ['completed', 'failed', 'success'].includes(task.status),
      {
        intervalMs: 2500,
        maxPolls: 24
      }
    );

    showQaPanel.value = false;
    await fetchList();
    await refreshOpenDetail();
  } catch (err) {
    error.value = normalizeError(err);
  } finally {
    qaSubmitting.value = false;
  }
};

const openDetail = async (datasetId: string): Promise<void> => {
  showDetailPanel.value = true;
  detailLoading.value = true;
  error.value = '';

  try {
    await loadDetail(datasetId);
  } catch (err) {
    error.value = normalizeError(err);
    closeDetail();
  } finally {
    detailLoading.value = false;
  }
};

const closeDetail = (): void => {
  showDetailPanel.value = false;
  currentDetail.value = null;
  currentRecords.value = [];
  currentQAs.value = [];
};

const previewObject = (value?: Record<string, unknown>): string => {
  if (!value || Object.keys(value).length === 0) {
    return '-';
  }

  return JSON.stringify(value, null, 2);
};

const formatTags = (itemsToFormat: string[]): string => (itemsToFormat.length > 0 ? itemsToFormat.join(', ') : '-');

const statusTone = (status: string): string => {
  if (['parsed', 'generated', 'synced', 'approved', 'completed'].includes(status)) return 'text-[var(--color-success)]';
  if (['pending', 'queued', 'uploaded', 'not_started', 'running'].includes(status)) return 'text-[var(--color-warning)]';
  if (['failed', 'rejected'].includes(status)) return 'text-[var(--color-danger)]';
  return 'text-[var(--color-text-secondary)]';
};

onMounted(async () => {
  await fetchList();
});
</script>
