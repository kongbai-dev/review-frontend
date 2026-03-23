<template>
  <section class="surface-card rounded-[1.4rem] p-3">
    <div class="flex flex-wrap items-center gap-2">
      <p class="text-muted mr-2 text-xs">已选中 {{ selectedCount }} 条任务</p>

      <input
        v-model="assignee"
        list="assignee-options"
        placeholder="输入或选择审核员"
        class="form-control !w-[220px] !rounded-xl !py-2 text-sm"
      />
      <datalist id="assignee-options">
        <option v-for="item in assignees" :key="item" :value="item" />
      </datalist>

      <button
        type="button"
        class="btn btn-primary btn-sm disabled:opacity-50"
        :disabled="!canAssign || selectedCount === 0 || !assignee.trim()"
        @click="emitAssign(assignee)"
      >
        批量分配
      </button>

      <button
        type="button"
        class="btn btn-success btn-sm disabled:opacity-50"
        :disabled="!canClaim || selectedCount === 0"
        @click="$emit('claim')"
      >
        领取到我
      </button>

      <button
        type="button"
        class="btn btn-warning btn-sm disabled:opacity-50"
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
