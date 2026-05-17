<template>
  <section class="space-y-4">
    <div>
      <h3 class="text-base font-semibold text-[var(--color-text-primary)]">数据上传工作台</h3>
      <p class="mt-1 text-sm text-[var(--color-text-secondary)]">用于接入 `knowledge/datasets`，支持上传、解析和向量同步前置元数据。</p>
    </div>

    <div class="grid gap-3 sm:grid-cols-2">
      <label class="text-sm sm:col-span-2">
        <span class="mb-1 block text-[11px] font-medium text-[var(--color-text-secondary)]">数据文件</span>
        <input type="file" class="form-control h-10 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-3 text-sm shadow-none" :disabled="loading || !canManage" @change="handleFileChange" />
      </label>

      <label class="text-sm">
        <span class="mb-1 block text-[11px] font-medium text-[var(--color-text-secondary)]">知识库</span>
        <input v-model="form.knowledge_base" class="form-control h-10 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-3 text-sm shadow-none" :disabled="loading || !canManage" placeholder="default" />
      </label>

      <label class="text-sm">
        <span class="mb-1 block text-[11px] font-medium text-[var(--color-text-secondary)]">来源</span>
        <input v-model="form.source" class="form-control h-10 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-3 text-sm shadow-none" :disabled="loading || !canManage" placeholder="simulation / lab" />
      </label>

      <label class="text-sm">
        <span class="mb-1 block text-[11px] font-medium text-[var(--color-text-secondary)]">数据类型</span>
        <input v-model="form.data_type" class="form-control h-10 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-3 text-sm shadow-none" :disabled="loading || !canManage" placeholder="simulation / measurement" />
      </label>

      <label class="text-sm">
        <span class="mb-1 block text-[11px] font-medium text-[var(--color-text-secondary)]">子类型</span>
        <input v-model="form.sub_type" class="form-control h-10 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-3 text-sm shadow-none" :disabled="loading || !canManage" placeholder="iv_curve / thermal" />
      </label>

      <label class="text-sm">
        <span class="mb-1 block text-[11px] font-medium text-[var(--color-text-secondary)]">数据集名称</span>
        <input v-model="form.dataset_name" class="form-control h-10 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-3 text-sm shadow-none" :disabled="loading || !canManage" placeholder="可留空，默认取文件名" />
      </label>

      <label class="text-sm">
        <span class="mb-1 block text-[11px] font-medium text-[var(--color-text-secondary)]">版本</span>
        <input v-model="form.version" class="form-control h-10 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-3 text-sm shadow-none" :disabled="loading || !canManage" placeholder="v1" />
      </label>

      <label class="text-sm">
        <span class="mb-1 block text-[11px] font-medium text-[var(--color-text-secondary)]">器件类型</span>
        <input v-model="form.device_type" class="form-control h-10 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-3 text-sm shadow-none" :disabled="loading || !canManage" placeholder="FinFET / GAA" />
      </label>

      <label class="text-sm">
        <span class="mb-1 block text-[11px] font-medium text-[var(--color-text-secondary)]">材料体系</span>
        <input v-model="form.material_system" class="form-control h-10 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-3 text-sm shadow-none" :disabled="loading || !canManage" placeholder="Si / SiGe" />
      </label>

      <label class="text-sm sm:col-span-2">
        <span class="mb-1 block text-[11px] font-medium text-[var(--color-text-secondary)]">物理现象</span>
        <input v-model="form.phenomenon" class="form-control h-10 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-3 text-sm shadow-none" :disabled="loading || !canManage" placeholder="Id-Vg / self_heating / btI" />
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
import type { UploadDatasetPayload } from '@/types/domain';

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
  (e: 'submit', payload: UploadDatasetPayload): void;
  (e: 'cancel'): void;
}>();

const selectedFile = ref<File | null>(null);
const error = ref('');

const form = reactive({
  knowledge_base: 'default',
  source: 'simulation',
  data_type: 'simulation',
  sub_type: '',
  version: 'v1',
  dataset_name: '',
  device_type: '',
  material_system: '',
  phenomenon: ''
});

const handleFileChange = (event: Event): void => {
  const target = event.target as HTMLInputElement;
  selectedFile.value = target.files?.[0] ?? null;
  error.value = '';
};

const submit = (): void => {
  error.value = '';

  if (!selectedFile.value) {
    error.value = '请先选择数据文件';
    return;
  }

  emit('submit', {
    data_file: selectedFile.value,
    knowledge_base: form.knowledge_base.trim() || 'default',
    source: form.source.trim() || 'simulation',
    data_type: form.data_type.trim() || 'simulation',
    sub_type: form.sub_type.trim() || undefined,
    version: form.version.trim() || undefined,
    dataset_name: form.dataset_name.trim() || undefined,
    device_type: form.device_type.trim() || undefined,
    material_system: form.material_system.trim() || undefined,
    phenomenon: form.phenomenon.trim() || undefined
  });
};
</script>
