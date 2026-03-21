<template>
  <section class="rounded-lg border border-white/10 bg-black/20 p-3">
    <div class="grid gap-3 md:grid-cols-2 lg:grid-cols-6">
      <label class="text-xs text-slate-300 lg:col-span-2">
        关键词
        <input
          :value="modelValue.keyword"
          class="mt-1 w-full rounded-md border border-white/15 bg-black/30 px-2 py-1.5 text-sm"
          placeholder="问题/答案关键词"
          @input="onKeyword"
        />
      </label>

      <label class="text-xs text-slate-300">
        主题
        <select :value="modelValue.topic" class="mt-1 w-full rounded-md border border-white/15 bg-black/30 px-2 py-1.5 text-sm" @change="onTopic">
          <option value="">全部</option>
          <option v-for="item in topicOptions" :key="item" :value="item">{{ item }}</option>
        </select>
      </label>

      <label class="text-xs text-slate-300">
        场景
        <select :value="modelValue.scene" class="mt-1 w-full rounded-md border border-white/15 bg-black/30 px-2 py-1.5 text-sm" @change="onScene">
          <option value="">全部</option>
          <option v-for="item in sceneOptions" :key="item" :value="item">{{ item }}</option>
        </select>
      </label>

      <label class="text-xs text-slate-300">
        最低置信度
        <input
          :value="confidenceValue"
          type="number"
          min="0.5"
          max="1"
          step="0.01"
          class="mt-1 w-full rounded-md border border-white/15 bg-black/30 px-2 py-1.5 text-sm"
          @input="onConfidence"
        />
      </label>

      <label class="text-xs text-slate-300">
        分配人
        <select
          :disabled="modelValue.onlyMine"
          :value="modelValue.assignee"
          class="mt-1 w-full rounded-md border border-white/15 bg-black/30 px-2 py-1.5 text-sm disabled:opacity-60"
          @change="onAssignee"
        >
          <option value="__all__">全部</option>
          <option value="__unassigned__">未分配</option>
          <option v-for="item in assignees" :key="item" :value="item">{{ item }}</option>
        </select>
      </label>
    </div>

    <div class="mt-3 flex flex-wrap items-center justify-between gap-2">
      <label class="inline-flex items-center gap-2 text-sm text-slate-200">
        <input type="checkbox" :checked="modelValue.onlyMine" class="size-4" @change="onOnlyMine" />
        仅看我的任务
      </label>

      <button type="button" class="rounded-md border border-white/20 px-3 py-1.5 text-xs" @click="$emit('reset')">重置筛选</button>
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
