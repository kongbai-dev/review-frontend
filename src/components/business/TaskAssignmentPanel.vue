<template>
  <section class="rounded-lg border border-white/10 bg-black/20 p-3">
    <div class="flex flex-wrap items-center gap-2">
      <p class="text-xs text-slate-300">已选中 {{ selectedCount }} 条任务</p>

      <input
        v-model="assignee"
        list="assignee-options"
        placeholder="输入或选择审核员"
        class="rounded-md border border-white/15 bg-black/30 px-2 py-1.5 text-sm"
      />
      <datalist id="assignee-options">
        <option v-for="item in assignees" :key="item" :value="item" />
      </datalist>

      <button
        type="button"
        class="rounded-md bg-indigo-400 px-3 py-1.5 text-sm font-semibold text-black disabled:cursor-not-allowed disabled:opacity-50"
        :disabled="!canAssign || selectedCount === 0 || !assignee.trim()"
        @click="emitAssign(assignee)"
      >
        批量分配
      </button>

      <button
        type="button"
        class="rounded-md bg-emerald-400 px-3 py-1.5 text-sm font-semibold text-black disabled:cursor-not-allowed disabled:opacity-50"
        :disabled="!canClaim || selectedCount === 0"
        @click="$emit('claim')"
      >
        领取到我
      </button>

      <button
        type="button"
        class="rounded-md bg-amber-400 px-3 py-1.5 text-sm font-semibold text-black disabled:cursor-not-allowed disabled:opacity-50"
        :disabled="!canAssign || selectedCount === 0"
        @click="emitAssign('')"
      >
        取消分配
      </button>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';

interface Props {
  selectedCount: number;
  assignees: string[];
  canAssign: boolean;
  canClaim: boolean;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  assign: [assignee: string];
  claim: [];
}>();

const assignee = ref('');

const emitAssign = (value: string): void => {
  emit('assign', value.trim());
};

watch(
  () => props.assignees,
  (list) => {
    if (!assignee.value && list.length > 0) {
      assignee.value = list[0];
    }
  },
  { immediate: true }
);
</script>
