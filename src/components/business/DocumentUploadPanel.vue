<template>
  <section class="surface-card rounded-[1.6rem] p-4">
    <div class="flex flex-wrap items-start justify-between gap-3">
      <div>
        <h3 class="text-base font-semibold">文档上传工作台</h3>
        <p class="text-muted mt-1 text-sm">支持同步上传（单对 file+csv）和批量上传（文档/CSV 分离上传 + session 配对）。</p>
      </div>
      <button type="button" class="btn btn-ghost btn-sm" @click="emit('cancel')">收起</button>
    </div>

    <p
      v-if="!canManage"
      class="mt-3 rounded-lg border border-[color:color-mix(in_srgb,var(--color-warning)_30%,var(--color-border))] bg-[color:color-mix(in_srgb,var(--color-warning)_12%,transparent)] px-3 py-2 text-xs text-[var(--color-warning)]"
    >
      当前角色仅可查看文档，无法执行上传。
    </p>

    <div class="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <label class="text-sm sm:col-span-2 lg:col-span-1">
        <span class="mb-1 block text-[11px] font-medium text-[var(--color-text-secondary)]">知识库</span>
        <input
          v-model="workspaceKnowledgeBase"
          class="form-control h-10 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-3 text-sm shadow-none"
          :disabled="documentStore.uploading || !canManage"
          placeholder="default"
        />
      </label>

      <label class="text-sm sm:col-span-2 lg:col-span-1">
        <span class="mb-1 block text-[11px] font-medium text-[var(--color-text-secondary)]">服务器子目录（sync 可选）</span>
        <input
          v-model="syncForm.subdir"
          class="form-control h-10 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-3 text-sm shadow-none"
          :disabled="documentStore.uploading || !canManage"
          placeholder="papers/2026/iedm"
        />
      </label>

      <label class="text-sm sm:col-span-2 lg:col-span-1">
        <span class="mb-1 block text-[11px] font-medium text-[var(--color-text-secondary)]">文档类型（sync 可选）</span>
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

      <label class="text-sm sm:col-span-2 lg:col-span-1">
        <span class="mb-1 block text-[11px] font-medium text-[var(--color-text-secondary)]">标题覆盖（sync 可选）</span>
        <input
          v-model="syncForm.title"
          class="form-control h-10 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-3 text-sm shadow-none"
          :disabled="documentStore.uploading || !canManage"
          placeholder="可留空"
        />
      </label>
    </div>

    <div class="mt-4 grid gap-4 lg:grid-cols-2">
      <section class="rounded-[1.2rem] border border-[var(--color-border)] bg-[color:color-mix(in_srgb,var(--color-surface-strong)_32%,transparent)] p-4">
        <div class="flex items-start justify-between gap-2">
          <div>
            <p class="text-sm font-semibold">A. 实时同步上传（sync）</p>
            <p class="text-muted mt-1 text-xs">上传单个文档与同名 CSV，立即入库。</p>
          </div>
          <button
            type="button"
            class="btn btn-primary btn-sm"
            :disabled="documentStore.uploading || !canManage"
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
          :disabled="documentStore.uploading || !canManage"
          @change="handleSyncCsvChange"
        />

        <div class="mt-3 space-y-2">
          <div class="flex flex-wrap items-center gap-2">
            <button type="button" class="btn btn-ghost btn-sm" :disabled="documentStore.uploading || !canManage" @click="openSyncDocumentDialog">
              选择文档
            </button>
            <span class="text-sm">{{ syncDocument ? syncDocument.name : '未选择文档' }}</span>
          </div>

          <div class="flex flex-wrap items-center gap-2">
            <button type="button" class="btn btn-ghost btn-sm" :disabled="documentStore.uploading || !canManage" @click="openSyncCsvDialog">
              选择 CSV
            </button>
            <span class="text-sm">{{ syncCsv ? syncCsv.name : '未选择 CSV' }}</span>
          </div>
        </div>

        <div v-if="documentStore.syncUploadResult" class="mt-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] p-2 text-xs">
          <p>
            最近 sync 上传：{{ documentStore.syncUploadResult.file_name }}（{{ documentStore.syncUploadResult.document_id }}），状态：
            {{ documentStore.syncUploadResult.sync_status || documentStore.syncUploadResult.status }}
          </p>
        </div>
      </section>

      <section class="rounded-[1.2rem] border border-[var(--color-border)] bg-[color:color-mix(in_srgb,var(--color-surface-strong)_32%,transparent)] p-4">
        <div class="flex items-start justify-between gap-2">
          <div>
            <p class="text-sm font-semibold">B/C. 批量上传 + Session 配对</p>
            <p class="text-muted mt-1 text-xs">先上传文档，再上传 CSV，最后刷新查看当前 session。</p>
          </div>
          <button
            type="button"
            class="btn btn-ghost btn-sm"
            :disabled="documentStore.uploading"
            @click="refreshSessionSummary"
          >
            刷新 Session
          </button>
        </div>

        <input
          ref="batchDocsInputRef"
          type="file"
          class="hidden"
          multiple
          accept=".pdf,.doc,.docx,.txt,.md,.zip,.py,.ipynb"
          :disabled="documentStore.uploading || !canManage"
          @change="handleBatchDocsChange"
        />
        <input
          ref="batchCsvInputRef"
          type="file"
          class="hidden"
          multiple
          accept=".csv,text/csv"
          :disabled="documentStore.uploading || !canManage"
          @change="handleBatchCsvChange"
        />

        <div class="mt-3 grid gap-2">
          <div class="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] p-2">
            <div class="flex flex-wrap items-center gap-2">
              <button type="button" class="btn btn-ghost btn-sm" :disabled="documentStore.uploading || !canManage" @click="openBatchDocsDialog">
                选择文档（可多选）
              </button>
              <button type="button" class="btn btn-primary btn-sm" :disabled="documentStore.uploading || !canManage" @click="handleBatchDocsUpload">
                上传文档批次
              </button>
            </div>
            <p class="text-muted mt-1 text-xs">{{ batchDocFiles.length > 0 ? `已选择 ${batchDocFiles.length} 个文档` : '未选择文档' }}</p>
          </div>

          <div class="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] p-2">
            <div class="flex flex-wrap items-center gap-2">
              <button type="button" class="btn btn-ghost btn-sm" :disabled="documentStore.uploading || !canManage" @click="openBatchCsvDialog">
                选择 CSV（可多选）
              </button>
              <button type="button" class="btn btn-primary btn-sm" :disabled="documentStore.uploading || !canManage" @click="handleBatchCsvUpload">
                上传 CSV 批次
              </button>
            </div>
            <p class="text-muted mt-1 text-xs">{{ batchCsvFiles.length > 0 ? `已选择 ${batchCsvFiles.length} 个 CSV` : '未选择 CSV' }}</p>
          </div>
        </div>
      </section>
    </div>

    <div v-if="documentStore.batchUploadDocResult || documentStore.batchUploadCsvResult" class="mt-4 grid gap-3 lg:grid-cols-2">
      <div v-if="documentStore.batchUploadDocResult" class="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] p-3 text-xs">
        <p class="text-sm font-medium">文档批量上传结果</p>
        <p class="mt-1 text-[var(--color-text-secondary)]">
          session={{ documentStore.batchUploadDocResult.session_id }}，accepted={{ documentStore.batchUploadDocResult.accepted_count }}，rejected={{ documentStore.batchUploadDocResult.rejected_count }}
        </p>
        <ul class="mt-2 max-h-28 overflow-auto space-y-1">
          <li v-for="item in documentStore.batchUploadDocResult.items" :key="`doc-${item.file_name}-${item.status}`">
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
          <li v-for="item in documentStore.batchUploadCsvResult.items" :key="`csv-${item.file_name}-${item.status}`">
            {{ item.file_name }} · {{ item.status }}<span v-if="item.message"> · {{ item.message }}</span>
          </li>
        </ul>
      </div>
    </div>

    <div class="mt-4 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] p-3 text-sm">
      <div class="flex flex-wrap items-center justify-between gap-2">
        <p class="font-medium">当前 Session 配对状态</p>
        <span class="text-xs text-[var(--color-text-secondary)]">knowledge_base={{ normalizedKnowledgeBase }}</span>
      </div>

      <template v-if="documentStore.currentSessionSummary">
        <div class="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-4 text-xs">
          <div class="rounded-md border border-[var(--color-border)] px-2 py-1">文档数：{{ documentStore.currentSessionSummary.doc_file_count }}</div>
          <div class="rounded-md border border-[var(--color-border)] px-2 py-1">CSV数：{{ documentStore.currentSessionSummary.csv_file_count }}</div>
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

      <p v-else class="mt-2 text-xs text-[var(--color-text-secondary)]">暂无 session，请先上传批量文档或 CSV。</p>
    </div>

    <p v-if="displayError" class="mt-3 text-sm text-[var(--color-danger)]">{{ displayError }}</p>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue';
import { useDocumentStore } from '@/stores/document.store';
import type { DocumentType } from '@/types/domain';

const props = withDefaults(
  defineProps<{
    canManage?: boolean;
    error?: string;
    knowledgeBase?: string;
  }>(),
  {
    canManage: true,
    error: '',
    knowledgeBase: 'default'
  }
);

const emit = defineEmits<{
  (e: 'cancel'): void;
  (e: 'update:knowledgeBase', value: string): void;
}>();

const documentStore = useDocumentStore();

const syncDocumentInputRef = ref<HTMLInputElement | null>(null);
const syncCsvInputRef = ref<HTMLInputElement | null>(null);
const batchDocsInputRef = ref<HTMLInputElement | null>(null);
const batchCsvInputRef = ref<HTMLInputElement | null>(null);

const syncDocument = ref<File | null>(null);
const syncCsv = ref<File | null>(null);
const batchDocFiles = ref<File[]>([]);
const batchCsvFiles = ref<File[]>([]);

const localError = ref('');

const workspaceKnowledgeBase = ref(props.knowledgeBase || 'default');

const syncForm = reactive<{
  subdir: string;
  document_type: DocumentType | '';
  title: string;
}>({
  subdir: '',
  document_type: '',
  title: ''
});

const normalizedKnowledgeBase = computed(() => workspaceKnowledgeBase.value.trim() || 'default');
const displayError = computed(() => localError.value || props.error);

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

const extractBaseName = (name: string): string => {
  const dot = name.lastIndexOf('.');
  return dot > 0 ? name.slice(0, dot) : name;
};

const isValidSubdir = (value: string): boolean => {
  if (!value.trim()) return true;
  if (value.startsWith('/')) return false;
  if (value.includes('..')) return false;
  if (value.includes('\\')) return false;
  return /^[A-Za-z0-9_/-]+$/.test(value);
};

const openSyncDocumentDialog = (): void => {
  syncDocumentInputRef.value?.click();
};

const openSyncCsvDialog = (): void => {
  syncCsvInputRef.value?.click();
};

const openBatchDocsDialog = (): void => {
  batchDocsInputRef.value?.click();
};

const openBatchCsvDialog = (): void => {
  batchCsvInputRef.value?.click();
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

const handleBatchDocsChange = (event: Event): void => {
  const target = event.target as HTMLInputElement;
  batchDocFiles.value = Array.from(target.files ?? []);
  localError.value = '';
};

const handleBatchCsvChange = (event: Event): void => {
  const target = event.target as HTMLInputElement;
  batchCsvFiles.value = Array.from(target.files ?? []);
  localError.value = '';
};

const handleSyncUpload = async (): Promise<void> => {
  localError.value = '';

  if (!syncDocument.value) {
    localError.value = '请先选择文档文件';
    return;
  }

  if (!syncCsv.value) {
    localError.value = '请先选择对应的 CSV 文件';
    return;
  }

  if (!syncCsv.value.name.toLowerCase().endsWith('.csv')) {
    localError.value = 'metadata_csv 必须是 CSV 文件';
    return;
  }

  if (extractBaseName(syncDocument.value.name) !== extractBaseName(syncCsv.value.name)) {
    localError.value = '文档与 CSV 必须同名（示例：a.pdf + a.csv）';
    return;
  }

  if (!isValidSubdir(syncForm.subdir)) {
    localError.value = 'subdir 不合法，仅允许字母/数字/_/-/ 且不可包含 .. 或以 / 开头';
    return;
  }

  await documentStore.uploadSyncPair({
    file: syncDocument.value,
    metadata_csv: syncCsv.value,
    knowledge_base: normalizedKnowledgeBase.value,
    document_type: syncForm.document_type || undefined,
    title: syncForm.title.trim() || undefined,
    subdir: syncForm.subdir.trim() || undefined
  });

  syncDocument.value = null;
  syncCsv.value = null;
  if (syncDocumentInputRef.value) syncDocumentInputRef.value.value = '';
  if (syncCsvInputRef.value) syncCsvInputRef.value.value = '';
};

const handleBatchDocsUpload = async (): Promise<void> => {
  localError.value = '';

  if (batchDocFiles.value.length === 0) {
    localError.value = '请先选择至少一个文档';
    return;
  }

  await documentStore.batchUploadDocs({
    files: batchDocFiles.value,
    knowledge_base: normalizedKnowledgeBase.value
  });

  batchDocFiles.value = [];
  if (batchDocsInputRef.value) batchDocsInputRef.value.value = '';
};

const handleBatchCsvUpload = async (): Promise<void> => {
  localError.value = '';

  if (batchCsvFiles.value.length === 0) {
    localError.value = '请先选择至少一个 CSV';
    return;
  }

  if (batchCsvFiles.value.some((file) => !file.name.toLowerCase().endsWith('.csv'))) {
    localError.value = '批量 CSV 上传中包含非 csv 文件';
    return;
  }

  await documentStore.batchUploadCsvs({
    files: batchCsvFiles.value,
    knowledge_base: normalizedKnowledgeBase.value
  });

  batchCsvFiles.value = [];
  if (batchCsvInputRef.value) batchCsvInputRef.value.value = '';
};

const refreshSessionSummary = async (): Promise<void> => {
  localError.value = '';
  await documentStore.refreshCurrentSessionSummary(normalizedKnowledgeBase.value);
};

onMounted(async () => {
  try {
    await documentStore.refreshCurrentSessionSummary(normalizedKnowledgeBase.value);
  } catch {
    // no-op: keep page usable when session is empty
  }
});
</script>
