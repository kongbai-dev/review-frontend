<template>
  <section class="surface-card flex flex-wrap items-center gap-3 rounded-[1.35rem] p-4 text-sm">
    <label class="block min-w-[220px] flex-1">
      排序字段
      <select :value="sortBy" class="form-control mt-1" :disabled="loading" @change="onSortChange">
        <option value="default">成员默认排序</option>
        <option value="uploaded_docs">按上传文档数</option>
        <option value="reviewed_qa">按审核 QA 数</option>
      </select>
    </label>

    <label class="block min-w-[180px]">
      排序方向
      <select :value="order" class="form-control mt-1" :disabled="loading" @change="onOrderChange">
        <option value="asc">升序</option>
        <option value="desc">降序</option>
      </select>
    </label>

    <div class="min-w-[180px] flex-1 self-end pb-1 text-xs text-[var(--color-text-secondary)]">
      默认规则为 `username asc`，切换排序时页面会优先本地重排，刷新时再与后端结果对齐。
    </div>
  </section>
</template>

<script setup lang="ts">
import type { MemberRankingSortField, SortOrder } from '@/types/domain';

withDefaults(
  defineProps<{
    sortBy: MemberRankingSortField;
    order: SortOrder;
    loading?: boolean;
  }>(),
  {
    loading: false
  }
);

const emit = defineEmits<{
  (e: 'update:sortBy', value: MemberRankingSortField): void;
  (e: 'update:order', value: SortOrder): void;
}>();

const onSortChange = (event: Event): void => {
  const target = event.target as HTMLSelectElement;
  emit('update:sortBy', target.value as MemberRankingSortField);
};

const onOrderChange = (event: Event): void => {
  const target = event.target as HTMLSelectElement;
  emit('update:order', target.value as SortOrder);
};
</script>
