<template>
  <section class="surface-card rounded-[1.6rem] p-4">
    <div class="flex flex-wrap items-start justify-between gap-3">
      <div>
        <h3 class="text-base font-semibold">上传文档</h3>
        <p class="text-muted mt-1 text-sm">支持 PDF、DOC、DOCX、TXT、MD。上传后会刷新统计和第一页列表。</p>
      </div>
      <button type="button" class="btn btn-ghost btn-sm" @click="emit('cancel')">收起</button>
    </div>

    <form class="mt-4 space-y-4" @submit.prevent="handleSubmit">
      <div class="rounded-[1.2rem] border border-dashed border-[var(--color-border)] bg-[color:color-mix(in_srgb,var(--color-surface-strong)_36%,transparent)] p-4">
        <input
          ref="fileInputRef"
          type="file"
          class="hidden"
          accept=".pdf,.doc,.docx,.txt,.md"
          @change="handleFileChange"
        />

        <div class="flex flex-wrap items-center gap-3">
          <button type="button" class="btn btn-ghost btn-sm" :disabled="loading" @click="openFileDialog">
            {{ selectedFile ? '重新选择文件' : '选择文件' }}
          </button>
          <span class="text-sm">{{ selectedFile ? selectedFile.name : '尚未选择文件' }}</span>
        </div>

        <p class="text-muted mt-3 text-xs">
          交由后端校验文件大小与内容格式。前端仅限制基本类型并透传错误信息。
        </p>
        <p v-if="selectedFile" class="text-muted mt-2 text-xs">
          文件大小: {{ formatBytes(selectedFile.size) }}
        </p>
      </div>

      <p v-if="localError || error" class="text-sm text-[var(--color-danger)]">{{ localError || error }}</p>

      <div class="flex flex-wrap items-center gap-2">
        <button type="submit" class="btn btn-success" :disabled="loading">
          {{ loading ? '上传中...' : '提交上传' }}
        </button>
        <button type="button" class="btn btn-ghost" :disabled="loading" @click="emit('cancel')">取消</button>
      </div>
    </form>
  </section>
</template>

<script setup lang="ts">
import { ref } from 'vue';

withDefaults(
  defineProps<{
    loading?: boolean;
    error?: string;
  }>(),
  {
    loading: false,
    error: ''
  }
);

const emit = defineEmits<{
  (e: 'submit', file: File): void;
  (e: 'cancel'): void;
}>();

const fileInputRef = ref<HTMLInputElement | null>(null);
const selectedFile = ref<File | null>(null);
const localError = ref('');

const openFileDialog = (): void => {
  fileInputRef.value?.click();
};

const handleFileChange = (event: Event): void => {
  const target = event.target as HTMLInputElement;
  selectedFile.value = target.files?.[0] ?? null;
  localError.value = '';
};

const formatBytes = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
};

const handleSubmit = (): void => {
  localError.value = '';

  if (!selectedFile.value) {
    localError.value = '请先选择一个文档文件';
    return;
  }

  emit('submit', selectedFile.value);
};
</script>
