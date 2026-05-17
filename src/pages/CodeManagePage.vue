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
                <h2 class="text-base font-semibold text-[var(--color-text-primary)]">代码管理</h2>
                <span class="text-xs text-[var(--color-text-secondary)]">
                  {{ total }} 个代码文件 · 第 {{ query.page }}/{{ totalPages }} 页
                </span>
              </div>
              <p class="mt-1 text-xs text-[var(--color-text-secondary)]">已接入 `knowledge/code-files` 的列表、上传、详情、依赖和片段浏览。</p>
            </div>

            <div class="flex flex-wrap items-center gap-2">
              <button
                type="button"
                class="inline-flex items-center justify-center rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-sm font-medium text-[var(--color-text-primary)] transition-colors hover:bg-[color:color-mix(in_srgb,var(--color-primary)_4%,white)]"
                @click="showUploadPanel = true"
              >
                上传代码
              </button>
              <button
                type="button"
                class="inline-flex items-center justify-center rounded-lg bg-[var(--color-primary)] px-3 py-2 text-sm font-medium text-white transition-opacity hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
                :disabled="loading || uploadSubmitting"
                @click="refresh"
              >
                刷新
              </button>
            </div>
          </div>

          <div class="mt-3 flex flex-wrap items-end gap-2">
            <label class="min-w-[220px] flex-[1.6] text-sm">
              <span class="mb-1 block text-[11px] font-medium text-[var(--color-text-secondary)]">关键词</span>
              <input v-model="filters.keyword" class="form-control h-9 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-3 text-sm shadow-none" placeholder="文件名 / 路径 / 项目" @keydown.enter.prevent="applyFilters" />
            </label>

            <label class="w-[128px] text-sm">
              <span class="mb-1 block text-[11px] font-medium text-[var(--color-text-secondary)]">知识库</span>
              <input v-model="filters.knowledge_base" class="form-control h-9 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-3 text-sm shadow-none" placeholder="default" @keydown.enter.prevent="applyFilters" />
            </label>

            <label class="w-[128px] text-sm">
              <span class="mb-1 block text-[11px] font-medium text-[var(--color-text-secondary)]">代码类型</span>
              <input v-model="filters.code_type" class="form-control h-9 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-3 text-sm shadow-none" placeholder="script" @keydown.enter.prevent="applyFilters" />
            </label>

            <label class="w-[128px] text-sm">
              <span class="mb-1 block text-[11px] font-medium text-[var(--color-text-secondary)]">语言</span>
              <input v-model="filters.language" class="form-control h-9 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-3 text-sm shadow-none" placeholder="python" @keydown.enter.prevent="applyFilters" />
            </label>

            <label class="w-[140px] text-sm">
              <span class="mb-1 block text-[11px] font-medium text-[var(--color-text-secondary)]">项目 ID</span>
              <input v-model="filters.project_id" class="form-control h-9 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-3 text-sm shadow-none" placeholder="proj-gaa" @keydown.enter.prevent="applyFilters" />
            </label>

            <div class="ml-auto flex items-center gap-2">
              <button type="button" class="inline-flex h-9 items-center justify-center rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-3 text-sm font-medium text-[var(--color-text-primary)] transition-colors hover:bg-[color:color-mix(in_srgb,var(--color-primary)_4%,white)]" :disabled="loading" @click="resetFilters">重置</button>
              <button type="button" class="inline-flex h-9 items-center justify-center rounded-lg bg-[var(--color-primary)] px-3 text-sm font-medium text-white transition-opacity hover:opacity-95" :disabled="loading" @click="applyFilters">筛选</button>
            </div>
          </div>
        </div>
      </div>

      <div class="min-h-0 flex-1 overflow-auto bg-[var(--color-bg)]">
        <div v-if="lastUploadResult" class="px-4 pt-4 sm:px-5">
          <div class="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-elevated)] px-3 py-2 text-sm">
            最近上传：{{ lastUploadResult.file_name }} · fragments={{ lastUploadResult.fragment_count }} · deps={{ lastUploadResult.dependency_count }}
          </div>
        </div>

        <CodeTable
          :items="items"
          :total="total"
          :page="query.page"
          :page-size="query.page_size"
          :loading="loading"
          @view="openDetail"
          @update:page="handlePageChange"
          @update:page-size="handlePageSizeChange"
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
          <button type="button" class="absolute inset-0 bg-[color:color-mix(in_srgb,var(--color-bg)_48%,black)] backdrop-blur-[3px]" aria-label="关闭代码上传" @click="showUploadPanel = false" />
          <section class="relative z-10 w-full max-w-3xl rounded-[1.6rem] border border-[var(--color-border)] bg-[var(--color-bg-elevated)] p-4 shadow-[0_32px_120px_-48px_var(--color-shadow)] sm:p-5" @click.stop>
            <CodeUploadPanel :loading="uploadSubmitting" :can-manage="canManage" @submit="handleUpload" @cancel="showUploadPanel = false" />
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
          <button type="button" class="absolute inset-0 bg-[color:color-mix(in_srgb,var(--color-bg)_48%,black)] backdrop-blur-[3px]" aria-label="关闭代码详情" @click="closeDetail" />
          <section class="relative z-10 flex max-h-[calc(100vh-1.5rem)] w-full max-w-6xl flex-col overflow-hidden rounded-[1.6rem] border border-[var(--color-border)] bg-[var(--color-bg-elevated)] shadow-[0_32px_120px_-48px_var(--color-shadow)] sm:max-h-[calc(100vh-3rem)]" @click.stop>
            <div class="flex items-start justify-between gap-3 border-b border-[var(--color-border)] px-4 py-4 sm:px-5">
              <div class="min-w-0">
                <h3 class="text-base font-semibold text-[var(--color-text-primary)]">{{ currentDetail?.file_name || '代码详情' }}</h3>
                <p class="mt-1 text-sm text-[var(--color-text-secondary)]">{{ currentDetail?.file_path || '正在加载...' }}</p>
              </div>
              <button type="button" class="btn btn-ghost btn-sm shrink-0" @click="closeDetail">关闭</button>
            </div>

            <div class="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-5">
              <p v-if="detailLoading" class="text-sm text-[var(--color-text-secondary)]">正在加载代码详情...</p>
              <template v-else-if="currentDetail">
                <div class="grid gap-3 lg:grid-cols-[minmax(0,0.92fr),minmax(320px,1.08fr)]">
                  <div class="space-y-3">
                    <div class="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] p-3 text-sm">
                      <div class="grid gap-2 sm:grid-cols-2">
                        <p>知识库：{{ currentDetail.knowledge_base }}</p>
                        <p>代码类型：{{ currentDetail.code_type }}</p>
                        <p>语言：{{ currentDetail.language }}</p>
                        <p>项目：{{ currentDetail.project_id || '-' }}</p>
                        <p>大小：{{ formatBytes(currentDetail.file_size) }}</p>
                        <p>片段数：{{ currentDetail.fragment_count }}</p>
                      </div>
                      <p v-if="currentDetail.description" class="mt-3 text-[var(--color-text-secondary)]">{{ currentDetail.description }}</p>
                    </div>

                    <div class="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] p-3 text-sm">
                      <p class="font-medium">依赖关系</p>
                      <ul v-if="detailDependencies.length > 0" class="mt-2 space-y-2 text-xs text-[var(--color-text-secondary)]">
                        <li v-for="item in detailDependencies" :key="item.id" class="rounded-lg border border-[var(--color-border)] px-2 py-2">
                          <p>{{ item.relation_type }} · {{ item.target_external || item.target_fragment_id || '-' }}</p>
                          <p v-if="item.strength !== undefined" class="mt-1">strength={{ item.strength }}</p>
                        </li>
                      </ul>
                      <p v-else class="mt-2 text-xs text-[var(--color-text-secondary)]">暂无依赖关系。</p>
                    </div>
                  </div>

                  <div class="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] p-3 text-sm">
                    <p class="font-medium">片段预览</p>
                    <div v-if="detailFragments.length > 0" class="mt-2 space-y-3">
                      <article v-for="fragment in detailFragments" :key="fragment.id" class="rounded-lg border border-[var(--color-border)] bg-[color:color-mix(in_srgb,var(--color-surface-strong)_24%,transparent)] p-3">
                        <p class="text-xs text-[var(--color-text-secondary)]">{{ fragment.fragment_type }} · {{ fragment.language || '-' }} · {{ fragment.line_start ?? '-' }}-{{ fragment.line_end ?? '-' }}</p>
                        <pre class="mt-2 overflow-x-auto whitespace-pre-wrap text-xs leading-5 text-[var(--color-text-primary)]">{{ fragment.content }}</pre>
                      </article>
                    </div>
                    <p v-else class="mt-2 text-xs text-[var(--color-text-secondary)]">暂无片段。</p>
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
import CodeTable from '@/components/business/CodeTable.vue';
import CodeUploadPanel from '@/components/business/CodeUploadPanel.vue';
import KnowledgeSectionTabs from '@/components/business/KnowledgeSectionTabs.vue';
import { formatBytes } from '@/lib/format';
import { codeApi } from '@/services/api/code.api';
import { useAuthStore } from '@/stores/auth.store';
import type { CodeDependency, CodeFileListQuery, CodeFragment, KnowledgeCodeFile, UploadCodeFileResult } from '@/types/domain';
import { normalizeError } from '@/utils/error';

const authStore = useAuthStore();
const canManage = computed(() => authStore.role === 'admin' || authStore.role === 'reviewer');

const items = ref<KnowledgeCodeFile[]>([]);
const total = ref(0);
const loading = ref(false);
const uploadSubmitting = ref(false);
const detailLoading = ref(false);
const error = ref('');
const showUploadPanel = ref(false);
const showDetailPanel = ref(false);
const currentDetail = ref<KnowledgeCodeFile | null>(null);
const detailDependencies = ref<CodeDependency[]>([]);
const detailFragments = ref<CodeFragment[]>([]);
const lastUploadResult = ref<UploadCodeFileResult | null>(null);

const query = reactive<CodeFileListQuery>({
  page: 1,
  page_size: 20,
  keyword: '',
  knowledge_base: '',
  code_type: '',
  language: '',
  project_id: '',
  project_role: ''
});

const filters = reactive({
  keyword: '',
  knowledge_base: '',
  code_type: '',
  language: '',
  project_id: ''
});

const totalPages = computed(() => Math.max(1, Math.ceil(total.value / query.page_size)));

const fetchList = async (): Promise<void> => {
  loading.value = true;
  error.value = '';
  try {
    const response = await codeApi.getList(query);
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

const applyFilters = async (): Promise<void> => {
  query.page = 1;
  query.keyword = filters.keyword.trim();
  query.knowledge_base = filters.knowledge_base.trim();
  query.code_type = filters.code_type.trim();
  query.language = filters.language.trim();
  query.project_id = filters.project_id.trim();
  await fetchList();
};

const resetFilters = async (): Promise<void> => {
  filters.keyword = '';
  filters.knowledge_base = '';
  filters.code_type = '';
  filters.language = '';
  filters.project_id = '';
  await applyFilters();
};

const refresh = async (): Promise<void> => {
  await fetchList();
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

const handleUpload = async (payload: Parameters<typeof codeApi.upload>[0]): Promise<void> => {
  uploadSubmitting.value = true;
  error.value = '';
  try {
    lastUploadResult.value = await codeApi.upload(payload);
    showUploadPanel.value = false;
    await fetchList();
  } catch (err) {
    error.value = normalizeError(err);
  } finally {
    uploadSubmitting.value = false;
  }
};

const openDetail = async (fileId: string): Promise<void> => {
  showDetailPanel.value = true;
  detailLoading.value = true;
  error.value = '';

  try {
    const [detail, dependencies, fragments] = await Promise.all([
      codeApi.getDetail(fileId),
      codeApi.getDependencies(fileId),
      codeApi.getFragments(fileId, 1, 10)
    ]);

    currentDetail.value = detail;
    detailDependencies.value = dependencies.items;
    detailFragments.value = fragments.items;
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
  detailDependencies.value = [];
  detailFragments.value = [];
};

onMounted(async () => {
  await fetchList();
});
</script>
