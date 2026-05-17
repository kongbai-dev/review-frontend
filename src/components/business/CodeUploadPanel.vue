<template>
  <section class="space-y-4">
    <div>
      <h3 class="text-base font-semibold text-[var(--color-text-primary)]">代码上传工作台</h3>
      <p class="mt-1 text-sm text-[var(--color-text-secondary)]">用于接入 `knowledge/code-files`，支持基础元数据和知识库归档。</p>
    </div>

    <div class="grid gap-3 sm:grid-cols-2">
      <label class="text-sm sm:col-span-2">
        <span class="mb-1 block text-[11px] font-medium text-[var(--color-text-secondary)]">代码文件</span>
        <input type="file" class="form-control h-10 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-3 text-sm shadow-none" :disabled="loading || !canManage" @change="handleFileChange" />
      </label>

      <label class="text-sm">
        <span class="mb-1 block text-[11px] font-medium text-[var(--color-text-secondary)]">知识库</span>
        <input v-model="form.knowledge_base" class="form-control h-10 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-3 text-sm shadow-none" :disabled="loading || !canManage" placeholder="default" />
      </label>

      <label class="text-sm">
        <span class="mb-1 block text-[11px] font-medium text-[var(--color-text-secondary)]">来源</span>
        <input v-model="form.source" class="form-control h-10 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-3 text-sm shadow-none" :disabled="loading || !canManage" placeholder="manual_upload" />
      </label>

      <label class="text-sm">
        <span class="mb-1 block text-[11px] font-medium text-[var(--color-text-secondary)]">代码类型</span>
        <input v-model="form.code_type" class="form-control h-10 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-3 text-sm shadow-none" :disabled="loading || !canManage" placeholder="script / deck / sql" />
      </label>

      <label class="text-sm">
        <span class="mb-1 block text-[11px] font-medium text-[var(--color-text-secondary)]">语言</span>
        <input v-model="form.language" class="form-control h-10 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-3 text-sm shadow-none" :disabled="loading || !canManage" placeholder="python / tcl / sql" />
      </label>

      <label class="text-sm">
        <span class="mb-1 block text-[11px] font-medium text-[var(--color-text-secondary)]">项目 ID</span>
        <input v-model="form.project_id" class="form-control h-10 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-3 text-sm shadow-none" :disabled="loading || !canManage" placeholder="proj-gaa" />
      </label>

      <label class="text-sm">
        <span class="mb-1 block text-[11px] font-medium text-[var(--color-text-secondary)]">项目角色</span>
        <input v-model="form.project_role" class="form-control h-10 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-3 text-sm shadow-none" :disabled="loading || !canManage" placeholder="device / analysis" />
      </label>

      <label class="text-sm sm:col-span-2">
        <span class="mb-1 block text-[11px] font-medium text-[var(--color-text-secondary)]">子类型</span>
        <input v-model="form.sub_type" class="form-control h-10 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-3 text-sm shadow-none" :disabled="loading || !canManage" placeholder="sdevice / mesh / report" />
      </label>
    </div>

    <p v-if="error" class="text-sm text-[var(--color-danger)]">{{ error }}</p>
    <p v-if="selectedFile" class="text-xs text-[var(--color-text-secondary)]">当前文件：{{ selectedFile.name }}</p>

    <div class="flex items-center gap-2">
      <button type="button" class="btn btn-success btn-sm" :disabled="loading || !canManage" @click="submit">确认上传</button>
      <button type="button" class="btn btn-ghost btn-sm" :disabled="loading" @click="emit('cancel')">取消</button>
    </div>
  </section>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue';
import type { UploadCodeFilePayload } from '@/types/domain';

const props = withDefaults(
  defineProps<{
    loading?: boolean;
    canManage?: boolean;
  }>(),
  {
    loading: false,
    canManage: true
  }
);

const emit = defineEmits<{
  (e: 'submit', payload: UploadCodeFilePayload): void;
  (e: 'cancel'): void;
}>();

const selectedFile = ref<File | null>(null);
const error = ref('');

const form = reactive({
  knowledge_base: 'default',
  source: 'manual_upload',
  code_type: '',
  language: '',
  project_id: '',
  project_role: '',
  sub_type: ''
});

const handleFileChange = (event: Event): void => {
  const target = event.target as HTMLInputElement;
  selectedFile.value = target.files?.[0] ?? null;
  error.value = '';
};

const submit = (): void => {
  error.value = '';

  if (!selectedFile.value) {
    error.value = '请先选择代码文件';
    return;
  }

  emit('submit', {
    code_file: selectedFile.value,
    knowledge_base: form.knowledge_base.trim() || 'default',
    source: form.source.trim() || 'manual_upload',
    code_type: form.code_type.trim() || undefined,
    language: form.language.trim() || undefined,
    project_id: form.project_id.trim() || undefined,
    project_role: form.project_role.trim() || undefined,
    sub_type: form.sub_type.trim() || undefined
  });
};
</script>
