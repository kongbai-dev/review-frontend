<template>
  <div class="surface-card flex flex-wrap items-center justify-between gap-4 rounded-[1.25rem] px-4 py-3 text-sm">
    <div class="flex flex-wrap items-center gap-3">
      <span class="text-muted text-xs">显示 {{ rangeStart }}-{{ rangeEnd }} / 共 {{ total }} 条</span>

      <label class="inline-flex items-center gap-2 text-xs">
        每页
        <select :value="pageSize" class="form-control !w-auto !rounded-xl !px-3 !py-2 text-sm" @change="onPageSizeChange">
          <option v-for="option in pageSizeOptions" :key="option" :value="option">{{ option }}</option>
        </select>
        条
      </label>
    </div>

    <div class="flex items-center gap-2">
      <button
        type="button"
        class="btn btn-ghost btn-sm"
        :disabled="page <= 1"
        @click="emit('update:page', page - 1)"
      >
        上一页
      </button>
      <span class="text-muted min-w-24 text-center text-xs">第 {{ page }} / {{ totalPages }} 页</span>
      <button
        type="button"
        class="btn btn-ghost btn-sm"
        :disabled="page >= totalPages"
        @click="emit('update:page', page + 1)"
      >
        下一页
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = withDefaults(
  defineProps<{
    page: number;
    pageSize: number;
    total: number;
    pageSizeOptions?: number[];
  }>(),
  {
    pageSizeOptions: () => [6, 12, 24]
  }
);

const emit = defineEmits<{
  (e: 'update:page', value: number): void;
  (e: 'update:pageSize', value: number): void;
}>();

const totalPages = computed(() => Math.max(1, Math.ceil(props.total / props.pageSize)));

const rangeStart = computed(() => {
  if (props.total === 0) {
    return 0;
  }
  return (props.page - 1) * props.pageSize + 1;
});

const rangeEnd = computed(() => {
  if (props.total === 0) {
    return 0;
  }
  return Math.min(props.page * props.pageSize, props.total);
});

const onPageSizeChange = (event: Event): void => {
  const target = event.target as HTMLSelectElement;
  emit('update:pageSize', Number(target.value));
};
</script>
