<template>
  <section class="space-y-4">
    <header class="flex flex-wrap items-center justify-between gap-2">
      <div>
        <h2 class="text-lg font-semibold">待审核问答</h2>
        <p class="text-muted text-sm">按后端契约字段展示，并支持任务分配与人工补录。</p>
      </div>

      <div class="flex flex-wrap items-center gap-2">
        <button
          type="button"
          class="btn btn-ghost btn-sm"
          @click="openUploadDialog"
        >
          上传文档
        </button>
        <button
          v-if="canCreateManual"
          type="button"
          data-testid="open-manual-qa-form"
          class="btn btn-ghost btn-sm"
          @click="showManualForm = !showManualForm"
        >
          {{ showManualForm ? '收起人工录入' : '人工添加问答对' }}
        </button>
        <button class="btn btn-primary btn-sm" @click="refresh">刷新</button>
        <input
          ref="uploadInputRef"
          type="file"
          class="hidden"
          accept=".pdf,.doc,.docx,.txt,.md"
          @change="handleUploadSelected"
        />
      </div>
    </header>

    <ManualQaForm
      v-if="showManualForm"
      :loading="qaStore.loading"
      :default-reviewer="authStore.username"
      :create-ready="manualCreateReady"
      @submit="createManualQA"
      @cancel="showManualForm = false"
    />

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

    <p v-if="qaStore.error" class="rounded-2xl border border-[var(--color-border)] bg-[color:color-mix(in_srgb,var(--color-danger)_12%,transparent)] px-3 py-2 text-sm text-[var(--color-danger)]">
      {{ qaStore.error }}
    </p>

    <div class="flex flex-wrap items-center justify-between gap-2 text-xs">
      <label class="inline-flex items-center gap-2">
        <input type="checkbox" class="size-4" :checked="allVisibleSelected" @change="toggleAll" />
        当前已加载全选
      </label>
      <span class="text-muted">筛选结果 {{ filteredPending.length }} 条 / 总待审 {{ qaStore.pending.length }} 条，已显示 {{ visiblePending.length }} 条</span>
    </div>

    <div class="columns-1 gap-3 sm:columns-2 xl:columns-3 2xl:columns-4">
      <article v-for="item in visiblePending" :key="item.id" class="surface-card mb-3 break-inside-avoid rounded-[1.05rem] p-3">
        <div class="flex items-start justify-between gap-3">
          <label class="inline-flex items-center gap-2 text-xs">
            <input
              type="checkbox"
              class="size-4"
              :checked="qaStore.selectedIds.includes(item.id)"
              @change="(event) => toggleOne(item.id, event)"
            />
            {{ item.id }}
          </label>
          <span class="status-pill shrink-0 min-w-[4.8rem] justify-center whitespace-nowrap">{{ item.reviewer || '未分配' }}</span>
        </div>

        <h3 class="mt-2 line-clamp-2 text-sm font-semibold leading-5">{{ item.question }}</h3>
        <p class="text-muted mt-1 line-clamp-3 text-xs">{{ item.answer }}</p>
        <p class="text-muted mt-2 text-[11px]">主题: {{ item.topics.join(' / ') }}</p>
        <p class="text-muted text-xs">场景: {{ item.scenes.join(' / ') }}</p>
        <p class="text-muted text-xs">置信度: {{ item.confidence.toFixed(2) }}</p>

        <div class="mt-3">
          <RouterLink :to="`/reviews/${item.id}`" :data-testid="`open-review-${item.id}`" class="btn btn-success btn-sm ui-link-button">
            进入审核
          </RouterLink>
        </div>
      </article>
    </div>

    <div ref="loadMoreAnchor" class="h-1 w-full" />
    <p v-if="hasMore" class="text-muted text-center text-xs">向下滚动自动加载更多...</p>
    <p v-else-if="filteredPending.length > 0" class="text-muted text-center text-xs">已加载全部待审核 QA 对。</p>

    <p v-if="!qaStore.loading && filteredPending.length === 0" class="text-muted text-sm">当前筛选下暂无待审核数据。</p>
  </section>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import ManualQaForm from '@/components/business/ManualQaForm.vue';
import ReviewFilters from '@/components/business/ReviewFilters.vue';
import TaskAssignmentPanel from '@/components/business/TaskAssignmentPanel.vue';
import { API_CONFIG } from '@/config';
import { useAuthStore } from '@/stores/auth.store';
import { useQAStore } from '@/stores/qa.store';
import type { CreateQAPayload, QAFilters, QAPair } from '@/types/domain';

const authStore = useAuthStore();
const qaStore = useQAStore();
const router = useRouter();

const LOAD_BATCH = 12;
const visibleCount = ref(LOAD_BATCH);
const loadMoreAnchor = ref<HTMLElement | null>(null);
const uploadInputRef = ref<HTMLInputElement | null>(null);
const showManualForm = ref(false);
let observer: IntersectionObserver | null = null;

const filteredPending = computed(() => qaStore.filteredPending);
const canCreateManual = computed(() => authStore.role !== 'viewer');
const manualCreateReady = API_CONFIG.USE_MOCK || Boolean(API_CONFIG.ENDPOINTS.QA_CREATE);

const visiblePending = computed<QAPair[]>(() => {
  return filteredPending.value.slice(0, visibleCount.value);
});

const hasMore = computed(() => visiblePending.value.length < filteredPending.value.length);

const allVisibleSelected = computed(() => {
  if (visiblePending.value.length === 0) {
    return false;
  }
  return visiblePending.value.every((item) => qaStore.selectedIds.includes(item.id));
});

const resetVisible = (): void => {
  visibleCount.value = LOAD_BATCH;
};

const loadMore = (): void => {
  if (!hasMore.value) {
    return;
  }
  visibleCount.value = Math.min(filteredPending.value.length, visibleCount.value + LOAD_BATCH);
};

const setupObserver = (): void => {
  observer?.disconnect();
  observer = null;

  if (!loadMoreAnchor.value || !hasMore.value) {
    return;
  }

  observer = new IntersectionObserver(
    (entries) => {
      if (entries.some((entry) => entry.isIntersecting)) {
        loadMore();
      }
    },
    {
      root: null,
      rootMargin: '220px 0px',
      threshold: 0.01
    }
  );

  observer.observe(loadMoreAnchor.value);
};

const refresh = async (): Promise<void> => {
  await qaStore.fetchPending();
};

const openUploadDialog = (): void => {
  uploadInputRef.value?.click();
};

const handleUploadSelected = (event: Event): void => {
  const target = event.target as HTMLInputElement;
  if (!target.files || target.files.length === 0) {
    return;
  }
  // 预留上传入口：当前版本仅触发文档选择，不调用后端上传接口。
  target.value = '';
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
    qaStore.setSelection(Array.from(new Set([...qaStore.selectedIds, ...visiblePending.value.map((item) => item.id)])));
    return;
  }
  const currentPageIds = new Set(visiblePending.value.map((item) => item.id));
  qaStore.setSelection(qaStore.selectedIds.filter((id) => !currentPageIds.has(id)));
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

const createManualQA = async (payload: CreateQAPayload): Promise<void> => {
  const created = await qaStore.createManualQA(payload);
  showManualForm.value = false;
  resetVisible();
  await router.push(`/reviews/${created.id}`);
};

watch(
  () => qaStore.filters,
  () => {
    resetVisible();
  },
  { deep: true }
);

watch(
  () => filteredPending.value.length,
  async () => {
    if (visibleCount.value > filteredPending.value.length) {
      visibleCount.value = Math.max(LOAD_BATCH, filteredPending.value.length);
    }
    await nextTick();
    setupObserver();
  }
);

watch(
  () => hasMore.value,
  async () => {
    await nextTick();
    setupObserver();
  }
);

watch(
  () => loadMoreAnchor.value,
  async () => {
    await nextTick();
    setupObserver();
  }
);

onMounted(async () => {
  qaStore.setMineUser(authStore.username);
  await qaStore.fetchPending();
  await nextTick();
  setupObserver();
});

onBeforeUnmount(() => {
  observer?.disconnect();
});
</script>
