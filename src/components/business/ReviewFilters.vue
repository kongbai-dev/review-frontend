<template>
  <section class="surface-card rounded-[1.4rem] p-4">
    <div class="grid gap-3 md:grid-cols-2 lg:grid-cols-6">
      <label class="text-xs lg:col-span-2">
        <span class="text-muted">关键词</span>
        <input
          :value="modelValue.keyword"
          class="form-control mt-1 text-sm"
          placeholder="问题/答案关键词"
          @input="onKeyword"
        />
      </label>

      <label class="text-xs">
        <span class="text-muted">主题</span>
        <select :value="modelValue.topic" class="form-control mt-1 text-sm" @change="onTopic">
          <option value="">全部</option>
          <option v-for="item in topicOptions" :key="item" :value="item">{{ item }}</option>
        </select>
      </label>

      <label class="text-xs">
        <span class="text-muted">场景</span>
        <select :value="modelValue.scene" class="form-control mt-1 text-sm" @change="onScene">
          <option value="">全部</option>
          <option v-for="item in sceneOptions" :key="item" :value="item">{{ item }}</option>
        </select>
      </label>

      <label class="text-xs">
        <span class="text-muted">最低置信度</span>
        <input
          :value="confidenceValue"
          type="number"
          min="0.5"
          max="1"
          step="0.01"
          class="form-control mt-1 text-sm"
          @input="onConfidence"
        />
      </label>

      <label class="text-xs">
        <span class="text-muted">分配人</span>
        <select :disabled="modelValue.onlyMine" :value="modelValue.assignee" class="form-control mt-1 text-sm disabled:opacity-60" @change="onAssignee">
          <option value="__all__">全部</option>
          <option value="__unassigned__">未分配</option>
          <option v-for="item in assignees" :key="item" :value="item">{{ item }}</option>
        </select>
      </label>
    </div>

    <div class="mt-3 flex flex-wrap items-center justify-between gap-2">
      <label class="inline-flex items-center gap-2 text-sm">
        <input type="checkbox" :checked="modelValue.onlyMine" class="size-4" @change="onOnlyMine" />
        仅看我的任务
      </label>

      <button type="button" class="btn btn-ghost btn-sm" @click="$emit('reset')">重置筛选</button>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { QAFilters } from '@/types/domain';

interface Props {
  modelValue: QAFilters;
  topicOptions: string[];
  sceneOptions: string[];
  assignees: string[];
}

const props = defineProps<Props>();

const emit = defineEmits<{
  'update:modelValue': [value: QAFilters];
  reset: [];
}>();

const confidenceValue = computed(() => (props.modelValue.minConfidence === null ? '' : String(props.modelValue.minConfidence)));

const patch = (next: Partial<QAFilters>): void => {
  emit('update:modelValue', {
    ...props.modelValue,
    ...next
  });
};

const onKeyword = (event: Event): void => {
  const target = event.target as HTMLInputElement;
  patch({ keyword: target.value });
};

const onTopic = (event: Event): void => {
  const target = event.target as HTMLSelectElement;
  patch({ topic: target.value });
};

const onScene = (event: Event): void => {
  const target = event.target as HTMLSelectElement;
  patch({ scene: target.value });
};

const onConfidence = (event: Event): void => {
  const target = event.target as HTMLInputElement;
  patch({ minConfidence: target.value ? Number(target.value) : null });
};

const onAssignee = (event: Event): void => {
  const target = event.target as HTMLSelectElement;
  patch({ assignee: target.value });
};

const onOnlyMine = (event: Event): void => {
  const target = event.target as HTMLInputElement;
  patch({ onlyMine: target.checked });
};
</script>
