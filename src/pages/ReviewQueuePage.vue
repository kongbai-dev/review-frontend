<template>
  <section class="space-y-4">
    <header class="flex flex-wrap items-center justify-between gap-2">
      <div>
        <h2 class="text-lg font-semibold">待审核问答</h2>
        <p class="text-sm text-slate-300">按后端契约字段展示并支持任务分配</p>
      </div>
      <button class="rounded-md bg-sky-500 px-3 py-1.5 text-sm font-semibold text-black" @click="refresh">刷新</button>
    </header>

    <ReviewFilters
      :model-value="qaStore.filters"
      :topic-options="qaStore.topicOptions"
      :scene-options="qaStore.sceneOptions"
      :assignees="qaStore.assigneeOptions"
      @update:model-value="updateFilters"
      @reset="resetFilters"
    />

    <TaskAssignmentPanel
      :selected-count="qaStore.selectedCount"
      :assignees="qaStore.assigneeOptions"
      :can-assign="authStore.role === 'admin'"
      :can-claim="authStore.role === 'admin' || authStore.role === 'reviewer'"
      @assign="assignSelected"
      @claim="claimSelected"
    />

    <p v-if="qaStore.error" class="rounded-md border border-rose-500/50 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">
      {{ qaStore.error }}
    </p>

    <div class="flex items-center justify-between text-xs text-slate-300">
      <label class="inline-flex items-center gap-2">
        <input type="checkbox" class="size-4" :checked="allFilteredSelected" @change="toggleAll" />
        当前筛选结果全选
      </label>
      <span>筛选结果 {{ filteredPending.length }} 条 / 总待审 {{ qaStore.pending.length }} 条</span>
    </div>

    <div class="grid gap-3 md:grid-cols-2">
      <article v-for="item in filteredPending" :key="item.id" class="rounded-lg border border-white/10 bg-black/20 p-3 hover:border-emerald-300/50">
        <div class="flex items-start justify-between gap-2">
          <label class="inline-flex items-center gap-2 text-xs text-slate-300">
            <input
              type="checkbox"
              class="size-4"
              :checked="qaStore.selectedIds.includes(item.id)"
              @change="(event) => toggleOne(item.id, event)"
            />
            {{ item.id }}
          </label>
          <span class="rounded-full border border-white/20 px-2 py-0.5 text-xs text-slate-200">
            {{ item.reviewer || '未分配' }}
          </span>
        </div>

        <h3 class="mt-2 line-clamp-2 font-medium">{{ item.question }}</h3>
        <p class="mt-2 text-xs text-slate-300">主题: {{ item.topics.join(' / ') }}</p>
        <p class="text-xs text-slate-300">场景: {{ item.scenes.join(' / ') }}</p>
        <p class="text-xs text-slate-300">置信度: {{ item.confidence.toFixed(2) }}</p>

        <div class="mt-3">
          <RouterLink :to="`/reviews/${item.id}`" class="rounded-md bg-emerald-500 px-3 py-1.5 text-xs font-semibold text-black">
            进入审核
          </RouterLink>
        </div>
      </article>
    </div>

    <p v-if="!qaStore.loading && filteredPending.length === 0" class="text-sm text-slate-400">当前筛选下暂无待审核数据。</p>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue';
import ReviewFilters from '@/components/business/ReviewFilters.vue';
import TaskAssignmentPanel from '@/components/business/TaskAssignmentPanel.vue';
import { useAuthStore } from '@/stores/auth.store';
import { useQAStore } from '@/stores/qa.store';
import type { QAFilters } from '@/types/domain';

const authStore = useAuthStore();
const qaStore = useQAStore();

const filteredPending = computed(() => qaStore.filteredPending);

const allFilteredSelected = computed(() => {
  if (filteredPending.value.length === 0) {
    return false;
  }
  return filteredPending.value.every((item) => qaStore.selectedIds.includes(item.id));
});

const refresh = async (): Promise<void> => {
  await qaStore.fetchPending();
};

const updateFilters = (value: QAFilters): void => {
  qaStore.setFilters(value);
};

const resetFilters = (): void => {
  qaStore.resetFilters();
};

const toggleOne = (id: string, event: Event): void => {
  const target = event.target as HTMLInputElement;
  qaStore.toggleSelection(id, target.checked);
};

const toggleAll = (event: Event): void => {
  const target = event.target as HTMLInputElement;
  if (target.checked) {
    qaStore.setSelection(filteredPending.value.map((item) => item.id));
    return;
  }
  qaStore.clearSelection();
};

const assignSelected = async (assignee: string): Promise<void> => {
  await qaStore.assignSelected(assignee);
};

const claimSelected = async (): Promise<void> => {
  if (!authStore.username) {
    return;
  }
  await qaStore.assignSelected(authStore.username);
};

onMounted(async () => {
  qaStore.setMineUser(authStore.username);
  await qaStore.fetchPending();
});
</script>
