<template>
  <section :class="panelClass">
    <div v-if="showHeader" class="flex flex-wrap items-start justify-between gap-3">
      <div>
        <h3 class="text-base font-semibold">文档上传工作台</h3>
        <p class="text-muted mt-1 text-sm">按后端最新契约拆分为单文件上传、文档+CSV 配对链、file-only 批量直传三条链路。</p>
      </div>
      <button type="button" class="btn btn-ghost btn-sm" @click="emit('cancel')">收起</button>
    </div>

    <p v-if="!canManage" :class="warningClass">
      当前角色仅可查看文档，无法执行上传与批同步。
    </p>

    <div :class="headerOffsetClass">
      <label class="text-sm sm:col-span-2 lg:col-span-1">
        <span class="mb-1 block text-[11px] font-medium text-[var(--color-text-secondary)]">知识库</span>
        <input
          v-model="workspaceKnowledgeBase"
          class="form-control h-10 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-3 text-sm shadow-none"
          :disabled="documentStore.uploading || documentStore.batchSyncPolling || !canManage"
          placeholder="default"
        />
      </label>
    </div>

    <div class="mt-4 flex flex-wrap gap-2 rounded-xl border border-[var(--color-border)] bg-[color:color-mix(in_srgb,var(--color-surface-strong)_34%,transparent)] p-2">
      <button
        v-for="tab in tabs"
        :key="tab.id"
        type="button"
        class="inline-flex items-center justify-center rounded-lg px-3 py-2 text-sm font-medium transition-colors"
        :class="activeTab === tab.id ? 'bg-[var(--color-primary)] text-white shadow-[0_10px_30px_-18px_var(--color-shadow)]' : 'text-[var(--color-text-secondary)] hover:bg-[color:color-mix(in_srgb,var(--color-primary)_8%,transparent)] hover:text-[var(--color-text-primary)]'"
        @click="activeTab = tab.id"
      >
        {{ tab.label }}
      </button>
    </div>

    <section v-if="activeTab === 'sync'" class="mt-4 rounded-[1.2rem] border border-[var(--color-border)] bg-[color:color-mix(in_srgb,var(--color-surface-strong)_32%,transparent)] p-4">
      <div class="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p class="text-sm font-semibold">单文件同步上传</p>
          <p class="text-muted mt-1 text-xs">复用 `POST /knowledge/documents`，显式支持 `metadata_mode=auto/csv_required/file_only`。</p>
        </div>
        <button
          type="button"
          class="btn btn-primary btn-sm"
          :disabled="documentStore.uploading || documentStore.batchSyncPolling || !canManage"
          @click="handleSyncUpload"
        >
          {{ documentStore.uploading ? '执行中...' : '上传 sync' }}
        </button>
      </div>

      <input
        ref="syncDocumentInputRef"
        type="file"
        class="hidden"
        accept=".pdf,.doc,.docx,.txt,.md,.zip,.py,.ipynb"
        :disabled="documentStore.uploading || !canManage"
        @change="handleSyncDocumentChange"
      />
      <input
        ref="syncCsvInputRef"
        type="file"
        class="hidden"
        accept=".csv,text/csv"
        :disabled="documentStore.uploading || !canManage || syncForm.metadata_mode === 'file_only'"
        @change="handleSyncCsvChange"
      />

      <div class="mt-4 grid gap-3 lg:grid-cols-3">
        <label class="text-sm">
          <span class="mb-1 block text-[11px] font-medium text-[var(--color-text-secondary)]">metadata_mode</span>
          <select
            v-model="syncForm.metadata_mode"
            class="form-control h-10 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-3 text-sm shadow-none"
            :disabled="documentStore.uploading || !canManage"
          >
            <option value="auto">auto</option>
            <option value="csv_required">csv_required</option>
            <option value="file_only">file_only</option>
          </select>
        </label>

        <label class="text-sm">
          <span class="mb-1 block text-[11px] font-medium text-[var(--color-text-secondary)]">文档类型（可选）</span>
          <select
            v-model="syncForm.document_type"
            class="form-control h-10 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-3 text-sm shadow-none"
            :disabled="documentStore.uploading || !canManage"
          >
            <option value="">自动</option>
            <option value="paper">paper</option>
            <option value="conference">conference</option>
            <option value="book">book</option>
            <option value="manual">manual</option>
            <option value="code">code</option>
            <option value="data">data</option>
          </select>
        </label>

        <label class="text-sm lg:col-span-1">
          <span class="mb-1 block text-[11px] font-medium text-[var(--color-text-secondary)]">标题覆盖（可选）</span>
          <input
            v-model="syncForm.title"
            class="form-control h-10 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-3 text-sm shadow-none"
            :disabled="documentStore.uploading || !canManage"
            placeholder="可留空"
          />
        </label>
      </div>

      <div class="mt-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-xs text-[var(--color-text-secondary)]">
        <p v-if="syncForm.metadata_mode === 'auto'">当前模式：有 CSV 就按 CSV 解析；没有 CSV 时由后端自动生成最小元数据。</p>
        <p v-else-if="syncForm.metadata_mode === 'csv_required'">当前模式：必须上传 CSV，否则后端会返回 422。</p>
        <p v-else>当前模式：明确无 CSV 上传，后端会走 file-only 最小元数据链。</p>
      </div>

      <div class="mt-4 grid gap-3 lg:grid-cols-2">
        <div class="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] p-3">
          <div class="flex flex-wrap items-center gap-2">
            <button type="button" class="btn btn-ghost btn-sm" :disabled="documentStore.uploading || !canManage" @click="openSyncDocumentDialog">
              选择文档
            </button>
            <span class="text-sm">{{ syncDocument ? syncDocument.name : '未选择文档' }}</span>
          </div>
        </div>

        <div class="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] p-3">
          <div class="flex flex-wrap items-center gap-2">
            <button
              type="button"
              class="btn btn-ghost btn-sm"
              :disabled="documentStore.uploading || !canManage || syncForm.metadata_mode === 'file_only'"
              @click="openSyncCsvDialog"
            >
              选择 CSV
            </button>
            <span class="text-sm">{{ syncForm.metadata_mode === 'file_only' ? '当前模式不需要 CSV' : syncCsv ? syncCsv.name : '未选择 CSV' }}</span>
          </div>
        </div>
      </div>

      <div v-if="documentStore.syncUploadResult" class="mt-4 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] p-3 text-xs">
        <p class="text-sm font-medium">最近 sync 上传结果</p>
        <p class="mt-1 text-[var(--color-text-secondary)]">
          {{ documentStore.syncUploadResult.file_name }} · document_id={{ documentStore.syncUploadResult.document_id }} · sync_status={{ documentStore.syncUploadResult.sync_status || documentStore.syncUploadResult.status }}
        </p>
        <p v-if="documentStore.syncUploadResult.object_key" class="mt-1 break-all text-[var(--color-text-secondary)]">
          object_key={{ documentStore.syncUploadResult.object_key }}
        </p>
      </div>
    </section>

    <section v-else-if="activeTab === 'paired'" class="mt-4 rounded-[1.2rem] border border-[var(--color-border)] bg-[color:color-mix(in_srgb,var(--color-surface-strong)_32%,transparent)] p-4">
      <div class="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p class="text-sm font-semibold">批量上传（文档 + CSV 配对链）</p>
          <p class="text-muted mt-1 text-xs">先上传文档，再上传 CSV，最后基于当前 open session 启动 `/batch-sync/start`。</p>
        </div>
        <div class="flex flex-wrap gap-2">
          <button type="button" class="btn btn-ghost btn-sm" :disabled="documentStore.uploading || documentStore.batchSyncPolling" @click="refreshSessionSummary">
            刷新 Session
          </button>
          <button type="button" class="btn btn-primary btn-sm" :disabled="documentStore.uploading || documentStore.batchSyncPolling || !canManage" @click="handlePairedBatchSync">
            {{ documentStore.batchSyncPolling ? '批处理中...' : '启动批同步' }}
          </button>
        </div>
      </div>

      <input
        ref="pairedDocsInputRef"
        type="file"
        class="hidden"
        multiple
        accept=".pdf,.doc,.docx,.txt,.md,.zip,.py,.ipynb"
        :disabled="documentStore.uploading || !canManage"
        @change="handlePairedDocsChange"
      />
      <input
        ref="pairedCsvInputRef"
        type="file"
        class="hidden"
        multiple
        accept=".csv,text/csv"
        :disabled="documentStore.uploading || !canManage"
        @change="handlePairedCsvChange"
      />

      <div class="mt-4 grid gap-3 lg:grid-cols-2">
        <div class="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] p-3">
          <div class="flex flex-wrap items-center gap-2">
            <button type="button" class="btn btn-ghost btn-sm" :disabled="documentStore.uploading || !canManage" @click="openPairedDocsDialog">
              选择文档（可多选）
            </button>
            <button type="button" class="btn btn-primary btn-sm" :disabled="documentStore.uploading || !canManage" @click="handlePairedDocsUpload">
              上传文档批次
            </button>
          </div>
          <p class="text-muted mt-2 text-xs">{{ pairedDocFiles.length > 0 ? `已选择 ${pairedDocFiles.length} 个文档` : '未选择文档' }}</p>
        </div>

        <div class="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] p-3">
          <div class="flex flex-wrap items-center gap-2">
            <button type="button" class="btn btn-ghost btn-sm" :disabled="documentStore.uploading || !canManage" @click="openPairedCsvDialog">
              选择 CSV（可多选）
            </button>
            <button type="button" class="btn btn-primary btn-sm" :disabled="documentStore.uploading || !canManage" @click="handlePairedCsvUpload">
              上传 CSV 批次
            </button>
          </div>
          <p class="text-muted mt-2 text-xs">{{ pairedCsvFiles.length > 0 ? `已选择 ${pairedCsvFiles.length} 个 CSV` : '未选择 CSV' }}</p>
        </div>
      </div>

      <div v-if="documentStore.batchUploadDocResult || documentStore.batchUploadCsvResult" class="mt-4 grid gap-3 lg:grid-cols-2">
        <div v-if="documentStore.batchUploadDocResult" class="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] p-3 text-xs">
          <p class="text-sm font-medium">文档批量上传结果</p>
          <p class="mt-1 text-[var(--color-text-secondary)]">
            session={{ documentStore.batchUploadDocResult.session_id }}，accepted={{ documentStore.batchUploadDocResult.accepted_count }}，rejected={{ documentStore.batchUploadDocResult.rejected_count }}
          </p>
          <ul class="mt-2 max-h-28 overflow-auto space-y-1">
            <li v-for="item in documentStore.batchUploadDocResult.items" :key="`paired-doc-${item.file_name}-${item.status}`">
              {{ item.file_name }} · {{ item.status }}<span v-if="item.message"> · {{ item.message }}</span>
            </li>
          </ul>
        </div>

        <div v-if="documentStore.batchUploadCsvResult" class="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] p-3 text-xs">
          <p class="text-sm font-medium">CSV 批量上传结果</p>
          <p class="mt-1 text-[var(--color-text-secondary)]">
            session={{ documentStore.batchUploadCsvResult.session_id }}，accepted={{ documentStore.batchUploadCsvResult.accepted_count }}，rejected={{ documentStore.batchUploadCsvResult.rejected_count }}
          </p>
          <ul class="mt-2 max-h-28 overflow-auto space-y-1">
            <li v-for="item in documentStore.batchUploadCsvResult.items" :key="`paired-csv-${item.file_name}-${item.status}`">
              {{ item.file_name }} · {{ item.status }}<span v-if="item.message"> · {{ item.message }}</span>
            </li>
          </ul>
        </div>
      </div>

      <div class="mt-4 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] p-3 text-sm">
        <div class="flex flex-wrap items-center justify-between gap-2">
          <p class="font-medium">当前配对 Session</p>
          <span class="text-xs text-[var(--color-text-secondary)]">knowledge_base={{ normalizedKnowledgeBase }}</span>
        </div>

        <template v-if="documentStore.currentSessionSummary">
          <div class="mt-2 grid gap-2 text-xs sm:grid-cols-2 lg:grid-cols-4">
            <div class="rounded-md border border-[var(--color-border)] px-2 py-1">文档数：{{ documentStore.currentSessionSummary.doc_file_count }}</div>
            <div class="rounded-md border border-[var(--color-border)] px-2 py-1">CSV 数：{{ documentStore.currentSessionSummary.csv_file_count }}</div>
            <div class="rounded-md border border-[var(--color-border)] px-2 py-1">已配对：{{ documentStore.currentSessionSummary.paired_count }}</div>
            <div class="rounded-md border border-[var(--color-border)] px-2 py-1">未配对：{{ documentStore.currentSessionSummary.unpaired_count }}</div>
          </div>

          <div class="mt-3 grid gap-3 lg:grid-cols-2">
            <div class="rounded-md border border-[var(--color-border)] p-2 text-xs">
              <p class="font-medium">未配对文档</p>
              <ul v-if="documentStore.currentSessionSummary.unmatched_documents.length > 0" class="mt-1 max-h-28 overflow-auto space-y-1">
                <li v-for="item in documentStore.currentSessionSummary.unmatched_documents" :key="item.document_id">
                  {{ item.file_name }} · {{ item.pair_status }}<span v-if="item.pair_error"> · {{ item.pair_error }}</span>
                </li>
              </ul>
              <p v-else class="mt-1 text-[var(--color-text-secondary)]">无</p>
            </div>

            <div class="rounded-md border border-[var(--color-border)] p-2 text-xs">
              <p class="font-medium">孤立/异常 CSV</p>
              <ul v-if="documentStore.currentSessionSummary.orphan_csv_files.length > 0" class="mt-1 max-h-28 overflow-auto space-y-1">
                <li v-for="item in documentStore.currentSessionSummary.orphan_csv_files" :key="`${item.file_name}-${item.parse_status}`">
                  {{ item.file_name }} · {{ item.parse_status }}<span v-if="item.parse_error"> · {{ item.parse_error }}</span>
                </li>
              </ul>
              <p v-else class="mt-1 text-[var(--color-text-secondary)]">无</p>
            </div>
          </div>
        </template>

        <p v-else class="mt-2 text-xs text-[var(--color-text-secondary)]">暂无配对 session，请先上传批量文档或 CSV。</p>
      </div>
    </section>

    <section v-else class="mt-4 rounded-[1.2rem] border border-[var(--color-border)] bg-[color:color-mix(in_srgb,var(--color-surface-strong)_32%,transparent)] p-4">
      <div class="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p class="text-sm font-semibold">批量直传（file-only）</p>
          <p class="text-muted mt-1 text-xs">仅上传文档文件，不依赖 CSV 配对，后续通过 `/batch-sync/direct/start` 异步同步。</p>
        </div>
        <div class="flex flex-wrap gap-2">
          <button type="button" class="btn btn-ghost btn-sm" :disabled="documentStore.uploading || documentStore.batchSyncPolling" @click="refreshDirectSessionSummary">
            刷新 Direct Session
          </button>
          <button type="button" class="btn btn-primary btn-sm" :disabled="documentStore.uploading || documentStore.batchSyncPolling || !canManage" @click="handleDirectBatchSync">
            {{ documentStore.batchSyncPolling ? '批处理中...' : '启动 Direct 批同步' }}
          </button>
        </div>
      </div>

      <input
        ref="directDocsInputRef"
        type="file"
        class="hidden"
        multiple
        accept=".pdf,.doc,.docx,.txt,.md,.zip,.py,.ipynb"
        :disabled="documentStore.uploading || !canManage"
        @change="handleDirectDocsChange"
      />

      <div class="mt-4 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] p-3">
        <div class="flex flex-wrap items-center gap-2">
          <button type="button" class="btn btn-ghost btn-sm" :disabled="documentStore.uploading || !canManage" @click="openDirectDocsDialog">
            选择文档（可多选）
          </button>
          <button type="button" class="btn btn-primary btn-sm" :disabled="documentStore.uploading || !canManage" @click="handleDirectDocsUpload">
            上传直传批次
          </button>
        </div>
        <p class="text-muted mt-2 text-xs">{{ directDocFiles.length > 0 ? `已选择 ${directDocFiles.length} 个文档` : '未选择文档' }}</p>
      </div>

      <div v-if="documentStore.batchUploadDirectDocResult" class="mt-4 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] p-3 text-xs">
        <p class="text-sm font-medium">直传批量上传结果</p>
        <p class="mt-1 text-[var(--color-text-secondary)]">
          session={{ documentStore.batchUploadDirectDocResult.session_id }}，accepted={{ documentStore.batchUploadDirectDocResult.accepted_count }}，rejected={{ documentStore.batchUploadDirectDocResult.rejected_count }}
        </p>
        <ul class="mt-2 max-h-28 overflow-auto space-y-1">
          <li v-for="item in documentStore.batchUploadDirectDocResult.items" :key="`direct-doc-${item.file_name}-${item.status}`">
            {{ item.file_name }} · {{ item.status }}<span v-if="item.message"> · {{ item.message }}</span>
          </li>
        </ul>
      </div>

      <div class="mt-4 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] p-3 text-sm">
        <div class="flex flex-wrap items-center justify-between gap-2">
          <p class="font-medium">当前 Direct Session</p>
          <span class="text-xs text-[var(--color-text-secondary)]">knowledge_base={{ normalizedKnowledgeBase }}</span>
        </div>

        <template v-if="documentStore.currentDirectSessionSummary">
          <div class="mt-2 grid gap-2 text-xs sm:grid-cols-2 lg:grid-cols-4">
            <div class="rounded-md border border-[var(--color-border)] px-2 py-1">文档数：{{ documentStore.currentDirectSessionSummary.doc_file_count }}</div>
            <div class="rounded-md border border-[var(--color-border)] px-2 py-1">CSV 数：{{ documentStore.currentDirectSessionSummary.csv_file_count }}</div>
            <div class="rounded-md border border-[var(--color-border)] px-2 py-1">就绪数：{{ documentStore.currentDirectSessionSummary.paired_count }}</div>
            <div class="rounded-md border border-[var(--color-border)] px-2 py-1">未配对：{{ documentStore.currentDirectSessionSummary.unpaired_count }}</div>
          </div>

          <p class="mt-3 text-xs text-[var(--color-text-secondary)]">
            file-only 直传链中，`paired_count` 表示 ready-to-sync 数量；`unpaired_count` 固定为 0。
          </p>
        </template>

        <p v-else class="mt-2 text-xs text-[var(--color-text-secondary)]">暂无 direct session，请先上传文档批次。</p>
      </div>
    </section>

    <div v-if="documentStore.batchSyncTask" class="mt-4 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] p-3 text-xs">
      <p class="text-sm font-medium">最近批同步任务</p>
      <p class="mt-1 text-[var(--color-text-secondary)]">
        task={{ documentStore.batchSyncTask.task_id }} · status={{ documentStore.batchSyncTask.status }} · queued={{ documentStore.batchSyncTask.queued_count }} · success={{ documentStore.batchSyncTask.success_count }} · failed={{ documentStore.batchSyncTask.failed_count }}
      </p>
      <p v-if="documentStore.batchSyncTask.message" class="mt-1 text-[var(--color-text-secondary)]">{{ documentStore.batchSyncTask.message }}</p>
    </div>

    <p v-if="displayError" class="mt-3 text-sm text-[var(--color-danger)]">{{ displayError }}</p>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue';
import { DOCUMENT_BATCH_SYNC_CONFIG } from '@/config';
import { useDocumentStore } from '@/stores/document.store';
import type { DocumentType, MetadataMode } from '@/types/domain';

const props = withDefaults(
  defineProps<{
    canManage?: boolean;
    error?: string;
    knowledgeBase?: string;
    showHeader?: boolean;
    framed?: boolean;
  }>(),
  {
    canManage: true,
    error: '',
    knowledgeBase: 'default',
    showHeader: true,
    framed: true
  }
);

const emit = defineEmits<{
  (e: 'cancel'): void;
  (e: 'update:knowledgeBase', value: string): void;
}>();

const documentStore = useDocumentStore();

const tabs = [
  { id: 'sync', label: '单文件上传' },
  { id: 'paired', label: '批量配对链' },
  { id: 'direct', label: '批量直传链' }
] as const;

type UploadTab = (typeof tabs)[number]['id'];

const activeTab = ref<UploadTab>('sync');
const syncDocumentInputRef = ref<HTMLInputElement | null>(null);
const syncCsvInputRef = ref<HTMLInputElement | null>(null);
const pairedDocsInputRef = ref<HTMLInputElement | null>(null);
const pairedCsvInputRef = ref<HTMLInputElement | null>(null);
const directDocsInputRef = ref<HTMLInputElement | null>(null);

const syncDocument = ref<File | null>(null);
const syncCsv = ref<File | null>(null);
const pairedDocFiles = ref<File[]>([]);
const pairedCsvFiles = ref<File[]>([]);
const directDocFiles = ref<File[]>([]);
const localError = ref('');
const workspaceKnowledgeBase = ref(props.knowledgeBase || 'default');

const syncForm = reactive<{
  metadata_mode: MetadataMode;
  document_type: DocumentType | '';
  title: string;
}>({
  metadata_mode: 'auto',
  document_type: '',
  title: ''
});

const normalizedKnowledgeBase = computed(() => workspaceKnowledgeBase.value.trim() || 'default');
const displayError = computed(() => localError.value || props.error);
const panelClass = computed(() => (props.framed ? 'surface-card rounded-[1.6rem] p-4' : ''));
const warningClass = computed(() =>
  `${props.showHeader ? 'mt-3 ' : ''}rounded-lg border border-[color:color-mix(in_srgb,var(--color-warning)_30%,var(--color-border))] bg-[color:color-mix(in_srgb,var(--color-warning)_12%,transparent)] px-3 py-2 text-xs text-[var(--color-warning)]`
);
const headerOffsetClass = computed(() => `${props.showHeader ? 'mt-4 ' : ''}grid gap-3 sm:grid-cols-2 lg:grid-cols-4`);

watch(
  () => props.knowledgeBase,
  (value) => {
    workspaceKnowledgeBase.value = value || 'default';
  }
);

watch(
  () => normalizedKnowledgeBase.value,
  (value) => {
    emit('update:knowledgeBase', value);
  }
);

watch(
  () => syncForm.metadata_mode,
  (mode) => {
    localError.value = '';
    if (mode === 'file_only') {
      syncCsv.value = null;
      if (syncCsvInputRef.value) {
        syncCsvInputRef.value.value = '';
      }
    }
  }
);

const CSV_NAME_SUFFIX_PATTERN = /_csv$/i;

const normalizeCsvFileForUpload = (csvFile: File): File => {
  const fileName = csvFile.name;
  const dot = fileName.lastIndexOf('.');
  const ext = dot > -1 ? fileName.slice(dot) : '';
  const baseName = dot > -1 ? fileName.slice(0, dot) : fileName;
  const normalizedBaseName = baseName.replace(CSV_NAME_SUFFIX_PATTERN, '');

  if (!normalizedBaseName || normalizedBaseName === baseName) {
    return csvFile;
  }

  return new File([csvFile], `${normalizedBaseName}${ext}`, {
    type: csvFile.type,
    lastModified: csvFile.lastModified
  });
};

const openSyncDocumentDialog = (): void => {
  syncDocumentInputRef.value?.click();
};

const openSyncCsvDialog = (): void => {
  if (syncForm.metadata_mode === 'file_only') {
    return;
  }
  syncCsvInputRef.value?.click();
};

const openPairedDocsDialog = (): void => {
  pairedDocsInputRef.value?.click();
};

const openPairedCsvDialog = (): void => {
  pairedCsvInputRef.value?.click();
};

const openDirectDocsDialog = (): void => {
  directDocsInputRef.value?.click();
};

const handleSyncDocumentChange = (event: Event): void => {
  const target = event.target as HTMLInputElement;
  syncDocument.value = target.files?.[0] ?? null;
  localError.value = '';
};

const handleSyncCsvChange = (event: Event): void => {
  const target = event.target as HTMLInputElement;
  syncCsv.value = target.files?.[0] ?? null;
  localError.value = '';
};

const handlePairedDocsChange = (event: Event): void => {
  const target = event.target as HTMLInputElement;
  pairedDocFiles.value = Array.from(target.files ?? []);
  localError.value = '';
};

const handlePairedCsvChange = (event: Event): void => {
  const target = event.target as HTMLInputElement;
  pairedCsvFiles.value = Array.from(target.files ?? []);
  localError.value = '';
};

const handleDirectDocsChange = (event: Event): void => {
  const target = event.target as HTMLInputElement;
  directDocFiles.value = Array.from(target.files ?? []);
  localError.value = '';
};

const handleSyncUpload = async (): Promise<void> => {
  localError.value = '';

  if (!syncDocument.value) {
    localError.value = '请先选择文档文件';
    return;
  }

  const normalizedSyncCsv = syncCsv.value ? normalizeCsvFileForUpload(syncCsv.value) : undefined;

  if (syncForm.metadata_mode === 'csv_required' && !normalizedSyncCsv) {
    localError.value = 'metadata_mode=csv_required 时必须选择 CSV';
    return;
  }

  if (normalizedSyncCsv && !normalizedSyncCsv.name.toLowerCase().endsWith('.csv')) {
    localError.value = 'metadata_csv 必须是 CSV 文件';
    return;
  }

  await documentStore.uploadSyncPair({
    file: syncDocument.value,
    metadata_csv: normalizedSyncCsv,
    metadata_mode: syncForm.metadata_mode,
    knowledge_base: normalizedKnowledgeBase.value,
    document_type: syncForm.document_type || undefined,
    title: syncForm.title.trim() || undefined
  });

  syncDocument.value = null;
  syncCsv.value = null;
  if (syncDocumentInputRef.value) syncDocumentInputRef.value.value = '';
  if (syncCsvInputRef.value) syncCsvInputRef.value.value = '';
};

const handlePairedDocsUpload = async (): Promise<void> => {
  localError.value = '';

  if (pairedDocFiles.value.length === 0) {
    localError.value = '请先选择至少一个文档';
    return;
  }

  await documentStore.batchUploadDocs({
    files: pairedDocFiles.value,
    knowledge_base: normalizedKnowledgeBase.value
  });

  pairedDocFiles.value = [];
  if (pairedDocsInputRef.value) pairedDocsInputRef.value.value = '';
};

const handlePairedCsvUpload = async (): Promise<void> => {
  localError.value = '';

  if (pairedCsvFiles.value.length === 0) {
    localError.value = '请先选择至少一个 CSV';
    return;
  }

  if (pairedCsvFiles.value.some((file) => !file.name.toLowerCase().endsWith('.csv'))) {
    localError.value = '批量 CSV 上传中包含非 csv 文件';
    return;
  }

  const normalizedCsvFiles = pairedCsvFiles.value.map((file) => normalizeCsvFileForUpload(file));

  await documentStore.batchUploadCsvs({
    files: normalizedCsvFiles,
    knowledge_base: normalizedKnowledgeBase.value
  });

  pairedCsvFiles.value = [];
  if (pairedCsvInputRef.value) pairedCsvInputRef.value.value = '';
};

const handleDirectDocsUpload = async (): Promise<void> => {
  localError.value = '';

  if (directDocFiles.value.length === 0) {
    localError.value = '请先选择至少一个文档';
    return;
  }

  await documentStore.batchUploadDirectDocs({
    files: directDocFiles.value,
    knowledge_base: normalizedKnowledgeBase.value
  });

  directDocFiles.value = [];
  if (directDocsInputRef.value) directDocsInputRef.value.value = '';
};

const refreshSessionSummary = async (): Promise<void> => {
  localError.value = '';
  await documentStore.refreshCurrentSessionSummary(normalizedKnowledgeBase.value);
};

const refreshDirectSessionSummary = async (): Promise<void> => {
  localError.value = '';
  await documentStore.refreshCurrentDirectSessionSummary(normalizedKnowledgeBase.value);
};

const handlePairedBatchSync = async (): Promise<void> => {
  localError.value = '';

  if (!props.canManage) {
    return;
  }

  if (DOCUMENT_BATCH_SYNC_CONFIG.strict_pairing) {
    const summary = await documentStore.refreshCurrentSessionSummary(normalizedKnowledgeBase.value);
    const confirmed = window.confirm(`strict_pairing=true 且当前有 ${summary.unpaired_count} 个未配对文档，继续将直接失败。是否继续启动？`);
    if (!confirmed) {
      return;
    }
  }

  const task = await documentStore.triggerBatchSync({
    knowledge_base: normalizedKnowledgeBase.value,
    min_batch_size: DOCUMENT_BATCH_SYNC_CONFIG.min_batch_size,
    max_wait_seconds: DOCUMENT_BATCH_SYNC_CONFIG.max_wait_seconds,
    max_docs: DOCUMENT_BATCH_SYNC_CONFIG.max_docs,
    max_workers: DOCUMENT_BATCH_SYNC_CONFIG.max_workers,
    include_failed: DOCUMENT_BATCH_SYNC_CONFIG.include_failed,
    strict_pairing: DOCUMENT_BATCH_SYNC_CONFIG.strict_pairing
  });

  await documentStore.pollBatchSyncTask(task.task_id);
};

const handleDirectBatchSync = async (): Promise<void> => {
  localError.value = '';

  if (!props.canManage) {
    return;
  }

  const task = await documentStore.triggerDirectBatchSync({
    knowledge_base: normalizedKnowledgeBase.value,
    min_batch_size: DOCUMENT_BATCH_SYNC_CONFIG.min_batch_size,
    max_wait_seconds: DOCUMENT_BATCH_SYNC_CONFIG.max_wait_seconds,
    max_docs: DOCUMENT_BATCH_SYNC_CONFIG.max_docs,
    max_workers: DOCUMENT_BATCH_SYNC_CONFIG.max_workers,
    include_failed: DOCUMENT_BATCH_SYNC_CONFIG.include_failed,
    strict_pairing: DOCUMENT_BATCH_SYNC_CONFIG.strict_pairing
  });

  await documentStore.pollBatchSyncTask(task.task_id);
};

onMounted(async () => {
  const tasks = [
    documentStore.refreshCurrentSessionSummary(normalizedKnowledgeBase.value),
    documentStore.refreshCurrentDirectSessionSummary(normalizedKnowledgeBase.value)
  ];

  await Promise.allSettled(tasks);
});
</script>
