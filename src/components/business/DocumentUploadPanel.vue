<template>
  <section class="surface-card rounded-[1.6rem] p-4">
    <div class="flex flex-wrap items-start justify-between gap-3">
      <div>
        <h3 class="text-base font-semibold">上传文档（文档 + CSV）</h3>
        <p class="text-muted mt-1 text-sm">每次添加一对同名文件（如 `paper.pdf` + `paper.csv`），支持加入队列后批量执行上传。</p>
      </div>
      <button type="button" class="btn btn-ghost btn-sm" @click="emit('cancel')">收起</button>
    </div>

    <p
      v-if="!canManage"
      class="mt-3 rounded-lg border border-[color:color-mix(in_srgb,var(--color-warning)_30%,var(--color-border))] bg-[color:color-mix(in_srgb,var(--color-warning)_12%,transparent)] px-3 py-2 text-xs text-[var(--color-warning)]"
    >
      当前角色仅可查看文档，无法执行上传。
    </p>

    <form class="mt-4 space-y-4" @submit.prevent="handleAddToQueue">
      <div class="grid gap-3 lg:grid-cols-2">
        <label class="text-sm">
          <span class="mb-1 block text-[11px] font-medium text-[var(--color-text-secondary)]">上传模式</span>
          <div class="grid grid-cols-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] p-0.5">
            <button
              type="button"
              class="rounded-md px-2 py-1.5 text-sm font-medium transition-colors"
              :class="form.upload_mode === 'sync' ? 'bg-[var(--color-primary)] text-white' : 'text-[var(--color-text-secondary)]'"
              :disabled="documentStore.uploading || !canManage"
              @click="form.upload_mode = 'sync'"
            >
              实时
            </button>
            <button
              type="button"
              class="rounded-md px-2 py-1.5 text-sm font-medium transition-colors"
              :class="form.upload_mode === 'batch' ? 'bg-[var(--color-primary)] text-white' : 'text-[var(--color-text-secondary)]'"
              :disabled="documentStore.uploading || !canManage"
              @click="form.upload_mode = 'batch'"
            >
              批处理
            </button>
          </div>
        </label>

        <label class="text-sm">
          <span class="mb-1 block text-[11px] font-medium text-[var(--color-text-secondary)]">知识库</span>
          <input
            v-model="form.knowledge_base"
            class="form-control h-10 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-3 text-sm shadow-none"
            :disabled="documentStore.uploading || !canManage"
            placeholder="default"
          />
        </label>

        <label class="text-sm lg:col-span-2">
          <span class="mb-1 block text-[11px] font-medium text-[var(--color-text-secondary)]">服务器子目录（subdir）</span>
          <input
            v-model="form.subdir"
            class="form-control h-10 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-3 text-sm shadow-none"
            :disabled="documentStore.uploading || !canManage"
            placeholder="papers/2026/iedm"
          />
          <span class="text-muted mt-1 block text-xs">最终路径会拼接到 `knowledge_data/{subdir}`。</span>
        </label>

        <label class="text-sm">
          <span class="mb-1 block text-[11px] font-medium text-[var(--color-text-secondary)]">文档类型（可选）</span>
          <select
            v-model="form.document_type"
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

        <label class="text-sm">
          <span class="mb-1 block text-[11px] font-medium text-[var(--color-text-secondary)]">标题覆盖（可选）</span>
          <input
            v-model="form.title"
            class="form-control h-10 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-3 text-sm shadow-none"
            :disabled="documentStore.uploading || !canManage"
            placeholder="可留空，默认使用 CSV/文件名"
          />
        </label>
      </div>

      <div class="rounded-[1.2rem] border border-dashed border-[var(--color-border)] bg-[color:color-mix(in_srgb,var(--color-surface-strong)_36%,transparent)] p-4">
        <input
          ref="documentInputRef"
          type="file"
          class="hidden"
          accept=".pdf,.doc,.docx,.txt,.md,.csv,.zip,.py,.ipynb"
          :disabled="documentStore.uploading || !canManage"
          @change="handleDocumentChange"
        />
        <input
          ref="metadataCsvInputRef"
          type="file"
          class="hidden"
          accept=".csv,text/csv"
          :disabled="documentStore.uploading || !canManage"
          @change="handleMetadataCsvChange"
        />

        <div class="flex flex-wrap items-center gap-2">
          <button type="button" class="btn btn-ghost btn-sm" :disabled="documentStore.uploading || !canManage" @click="openDocumentDialog">
            选择文档
          </button>
          <span class="text-sm">{{ selectedDocument ? selectedDocument.name : '未选择文档' }}</span>
        </div>

        <div class="mt-3 flex flex-wrap items-center gap-2">
          <button type="button" class="btn btn-ghost btn-sm" :disabled="documentStore.uploading || !canManage" @click="openMetadataCsvDialog">
            选择 CSV
          </button>
          <span class="text-sm">{{ selectedMetadataCsv ? selectedMetadataCsv.name : '未选择 CSV' }}</span>
        </div>

        <div class="mt-4 flex flex-wrap items-center gap-2">
          <button type="submit" class="btn btn-primary btn-sm" :disabled="documentStore.uploading || !canManage">加入队列</button>
          <button type="button" class="btn btn-ghost btn-sm" :disabled="documentStore.uploading || !canManage" @click="clearCurrentPair">
            清空当前
          </button>
        </div>
      </div>

      <p v-if="displayError" class="text-sm text-[var(--color-danger)]">{{ displayError }}</p>
    </form>

    <div class="mt-5 rounded-xl border border-[var(--color-border)]">
      <div class="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--color-border)] px-3 py-2">
        <p class="text-sm font-medium">上传队列（{{ documentStore.uploadQueue.length }}）</p>
        <div class="flex flex-wrap items-center gap-2">
          <button
            type="button"
            class="btn btn-ghost btn-sm"
            :disabled="documentStore.uploading || documentStore.uploadQueue.length === 0 || !canManage"
            @click="documentStore.clearUploadQueue()"
          >
            清空队列
          </button>
          <button
            type="button"
            class="btn btn-success btn-sm"
            :disabled="documentStore.uploading || documentStore.uploadQueue.length === 0 || !canManage"
            @click="startUpload"
          >
            {{ documentStore.uploading ? '上传中...' : '开始上传' }}
          </button>
        </div>
      </div>

      <div class="max-h-72 overflow-auto">
        <table class="min-w-full border-separate border-spacing-y-1 text-sm">
          <thead>
            <tr class="text-left text-xs uppercase tracking-[0.08em] text-[color:color-mix(in_srgb,var(--color-text-secondary)_88%,transparent)]">
              <th class="px-3 py-2 font-medium whitespace-nowrap">文档</th>
              <th class="px-3 py-2 font-medium whitespace-nowrap">CSV</th>
              <th class="px-3 py-2 font-medium whitespace-nowrap">模式</th>
              <th class="px-3 py-2 font-medium whitespace-nowrap">子目录</th>
              <th class="px-3 py-2 font-medium whitespace-nowrap">状态</th>
              <th class="px-3 py-2 text-right font-medium whitespace-nowrap">操作</th>
            </tr>
          </thead>
          <tbody v-if="documentStore.uploadQueue.length > 0">
            <tr
              v-for="item in documentStore.uploadQueue"
              :key="item.id"
              class="rounded-lg border border-[var(--color-border)] bg-[color:color-mix(in_srgb,var(--color-surface-strong)_35%,transparent)]"
            >
              <td class="px-3 py-2 align-top">
                <p class="font-medium">{{ item.file.name }}</p>
                <p class="text-muted mt-1 text-xs">{{ formatBytes(item.file.size) }}</p>
              </td>
              <td class="px-3 py-2 align-top">
                <p>{{ item.metadata_csv.name }}</p>
              </td>
              <td class="px-3 py-2 align-top">{{ item.upload_mode }}</td>
              <td class="px-3 py-2 align-top">{{ item.subdir }}</td>
              <td class="px-3 py-2 align-top">
                <span class="status-pill" :class="queueStatusTone(item.status)">
                  {{ queueStatusLabel(item.status) }}
                </span>
                <p v-if="item.message" class="mt-1 max-w-[260px] text-xs text-[var(--color-text-secondary)]">{{ item.message }}</p>
              </td>
              <td class="px-3 py-2 text-right align-top">
                <button
                  type="button"
                  class="btn btn-ghost btn-sm"
                  :disabled="documentStore.uploading || !canManage"
                  @click="documentStore.removeUploadQueueItem(item.id)"
                >
                  移除
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <p v-if="documentStore.uploadQueue.length === 0" class="text-muted px-3 py-4 text-sm">
        暂无待上传项。先添加“文档 + CSV”文件对。
      </p>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from 'vue';
import { useDocumentStore } from '@/stores/document.store';
import type { DocumentType, UploadMode } from '@/types/domain';

const props = withDefaults(
  defineProps<{
    canManage?: boolean;
    error?: string;
  }>(),
  {
    canManage: true,
    error: ''
  }
);

const emit = defineEmits<{
  (e: 'cancel'): void;
  (e: 'uploaded', summary: { successCount: number; conflictCount: number; failedCount: number }): void;
}>();

const documentStore = useDocumentStore();

const documentInputRef = ref<HTMLInputElement | null>(null);
const metadataCsvInputRef = ref<HTMLInputElement | null>(null);
const selectedDocument = ref<File | null>(null);
const selectedMetadataCsv = ref<File | null>(null);
const localError = ref('');

const form = reactive<{
  upload_mode: UploadMode;
  knowledge_base: string;
  subdir: string;
  document_type: DocumentType | '';
  title: string;
}>({
  upload_mode: 'sync',
  knowledge_base: 'default',
  subdir: '',
  document_type: '',
  title: ''
});

const displayError = computed(() => localError.value || props.error);

const openDocumentDialog = (): void => {
  documentInputRef.value?.click();
};

const openMetadataCsvDialog = (): void => {
  metadataCsvInputRef.value?.click();
};

const handleDocumentChange = (event: Event): void => {
  const target = event.target as HTMLInputElement;
  selectedDocument.value = target.files?.[0] ?? null;
  localError.value = '';
};

const handleMetadataCsvChange = (event: Event): void => {
  const target = event.target as HTMLInputElement;
  selectedMetadataCsv.value = target.files?.[0] ?? null;
  localError.value = '';
};

const clearCurrentPair = (): void => {
  selectedDocument.value = null;
  selectedMetadataCsv.value = null;
  localError.value = '';
  if (documentInputRef.value) {
    documentInputRef.value.value = '';
  }
  if (metadataCsvInputRef.value) {
    metadataCsvInputRef.value.value = '';
  }
};

const formatBytes = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
};

const extractBaseName = (name: string): string => {
  const dot = name.lastIndexOf('.');
  return dot > 0 ? name.slice(0, dot) : name;
};

const isValidSubdir = (value: string): boolean => {
  if (!value.trim()) return false;
  if (value.startsWith('/')) return false;
  if (value.includes('..')) return false;
  if (value.includes('\\')) return false;
  return /^[A-Za-z0-9_/-]+$/.test(value);
};

const handleAddToQueue = (): void => {
  localError.value = '';

  if (!selectedDocument.value) {
    localError.value = '请先选择文档文件';
    return;
  }

  if (!selectedMetadataCsv.value) {
    localError.value = '请先选择对应的 metadata CSV 文件';
    return;
  }

  if (!selectedMetadataCsv.value.name.toLowerCase().endsWith('.csv')) {
    localError.value = 'metadata_csv 必须是 CSV 文件';
    return;
  }

  if (extractBaseName(selectedDocument.value.name) !== extractBaseName(selectedMetadataCsv.value.name)) {
    localError.value = '文档与 CSV 主文件名必须一致（例如 a.pdf + a.csv）';
    return;
  }

  if (!isValidSubdir(form.subdir)) {
    localError.value = 'subdir 不合法，请仅使用字母/数字/_/-/，且不能包含 .. 或以 / 开头';
    return;
  }

  documentStore.addUploadQueueItem({
    file: selectedDocument.value,
    metadata_csv: selectedMetadataCsv.value,
    upload_mode: form.upload_mode,
    knowledge_base: form.knowledge_base.trim() || 'default',
    document_type: form.document_type || undefined,
    title: form.title.trim() || undefined,
    subdir: form.subdir.trim()
  });

  clearCurrentPair();
};

const startUpload = async (): Promise<void> => {
  localError.value = '';

  if (documentStore.uploadQueue.length === 0) {
    localError.value = '请先添加至少一个上传项';
    return;
  }

  const summary = await documentStore.uploadQueuedDocuments();
  emit('uploaded', summary);
};

const queueStatusLabel = (status: string): string => {
  if (status === 'ready') return '待上传';
  if (status === 'uploading') return '上传中';
  if (status === 'success') return '成功';
  if (status === 'conflict') return '重复';
  return '失败';
};

const queueStatusTone = (status: string): string => {
  if (status === 'success') return 'text-[var(--color-success)]';
  if (status === 'uploading') return 'text-[var(--color-primary)]';
  if (status === 'conflict') return 'text-[var(--color-warning)]';
  if (status === 'ready') return 'text-[var(--color-text-secondary)]';
  return 'text-[var(--color-danger)]';
};
</script>
