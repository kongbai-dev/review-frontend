<template>
  <section class="surface-card rounded-[1.6rem] p-4">
    <div class="flex flex-wrap items-start justify-between gap-3">
      <div>
        <h3 class="text-base font-semibold">人工添加问答对</h3>
        <p class="text-muted mt-1 text-sm">补录人工确认的问答内容，并直接进入待审核队列。</p>
      </div>
      <button type="button" class="btn btn-ghost btn-sm" @click="emit('cancel')">收起</button>
    </div>

    <p v-if="!createReady" class="mt-4 rounded-2xl border border-[var(--color-border)] bg-[color:color-mix(in_srgb,var(--color-warning)_14%,transparent)] px-3 py-2 text-sm">
      当前是真实后端模式。若要启用人工新增，请在 `.env` 中配置 `VITE_QA_CREATE_ENDPOINT`。
    </p>

    <form class="mt-4 space-y-4" @submit.prevent="handleSubmit">
      <div class="grid gap-4 lg:grid-cols-2">
        <label class="block text-sm">
          问题
          <textarea v-model="form.question" data-testid="manual-qa-question" rows="3" class="form-control mt-1" />
        </label>

        <label class="block text-sm">
          答案
          <textarea v-model="form.answer" data-testid="manual-qa-answer" rows="3" class="form-control mt-1" />
        </label>
      </div>

      <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <label class="block text-sm">
          主题
          <input v-model="topicsInput" data-testid="manual-qa-topics" class="form-control mt-1" placeholder="器件物理, 工艺集成" />
        </label>

        <label class="block text-sm">
          场景
          <input v-model="scenesInput" data-testid="manual-qa-scenes" class="form-control mt-1" placeholder="engineer, researcher" />
        </label>

        <label class="block text-sm">
          指派给
          <input
            v-model="form.reviewer"
            data-testid="manual-qa-reviewer"
            class="form-control mt-1"
            :placeholder="defaultReviewer || '留空表示未分配'"
          />
        </label>

        <label class="block text-sm">
          置信度: {{ form.confidence.toFixed(2) }}
          <input v-model.number="form.confidence" data-testid="manual-qa-confidence" type="range" min="0.5" max="1" step="0.01" class="mt-3 w-full" />
        </label>
      </div>

      <label class="block text-sm">
        录入备注
        <textarea
          v-model="form.review_notes"
          data-testid="manual-qa-notes"
          rows="2"
          class="form-control mt-1"
          placeholder="例如：来自线下评审会议，待二次复核。"
        />
      </label>

      <div class="grid gap-4 lg:grid-cols-[2fr,1fr,120px,120px]">
        <label class="block text-sm lg:col-span-1">
          参考片段
          <textarea
            v-model="form.fragmentContent"
            data-testid="manual-qa-fragment"
            rows="4"
            class="form-control mt-1"
            placeholder="可选，补充来源摘录或证据片段。"
          />
        </label>

        <label class="block text-sm">
          来源
          <input v-model="form.fragmentSource" data-testid="manual-qa-source" class="form-control mt-1" placeholder="论文 / 文档名" />
        </label>

        <label class="block text-sm">
          起始页
          <input v-model.number="form.pageStart" data-testid="manual-qa-page-start" type="number" min="1" class="form-control mt-1" />
        </label>

        <label class="block text-sm">
          结束页
          <input v-model.number="form.pageEnd" data-testid="manual-qa-page-end" type="number" min="1" class="form-control mt-1" />
        </label>
      </div>

      <p v-if="error" class="text-sm text-[var(--color-danger)]">{{ error }}</p>

      <div class="flex flex-wrap items-center gap-2">
        <button
          type="submit"
          data-testid="manual-qa-submit"
          class="btn btn-success"
          :disabled="loading || !createReady"
        >
          {{ loading ? '提交中...' : '创建并进入审核' }}
        </button>
        <span class="text-muted text-xs">创建后会作为 `pending` 问答对进入当前队列。</span>
      </div>
    </form>
  </section>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue';
import type { CreateQAPayload, FragmentDraft } from '@/types/domain';

const props = withDefaults(
  defineProps<{
    loading?: boolean;
    defaultReviewer?: string;
    createReady: boolean;
  }>(),
  {
    loading: false,
    defaultReviewer: ''
  }
);

const emit = defineEmits<{
  (e: 'submit', payload: CreateQAPayload): void;
  (e: 'cancel'): void;
}>();

const error = ref('');
const topicsInput = ref('');
const scenesInput = ref('');

const form = reactive({
  question: '',
  answer: '',
  reviewer: props.defaultReviewer,
  confidence: 0.8,
  review_notes: '人工录入，待审核确认',
  fragmentContent: '',
  fragmentSource: '',
  pageStart: undefined as number | undefined,
  pageEnd: undefined as number | undefined
});

const toList = (value: string): string[] =>
  value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);

const buildFragments = (): FragmentDraft[] => {
  if (!form.fragmentContent.trim()) {
    return [];
  }

  return [
    {
      fragment_type: 'text',
      content: form.fragmentContent.trim(),
      source: form.fragmentSource.trim() || undefined,
      page_start: form.pageStart,
      page_end: form.pageEnd
    }
  ];
};

const validate = (payload: CreateQAPayload): string => {
  if (!payload.question.trim()) return '问题不能为空';
  if (!payload.answer.trim()) return '答案不能为空';
  if (payload.topics.length === 0) return '至少填写一个主题';
  if (payload.scenes.length === 0) return '至少填写一个场景';
  if (!payload.review_notes.trim()) return '请填写录入备注';
  if (payload.confidence < 0.5 || payload.confidence > 1) return '置信度超出范围';
  if (form.pageStart && form.pageEnd && form.pageStart > form.pageEnd) return '页码范围不合法';
  return '';
};

const handleSubmit = (): void => {
  error.value = '';

  const payload: CreateQAPayload = {
    question: form.question.trim(),
    answer: form.answer.trim(),
    topics: toList(topicsInput.value),
    scenes: toList(scenesInput.value),
    confidence: form.confidence,
    review_notes: form.review_notes.trim(),
    reviewer: form.reviewer.trim() || undefined,
    fragments: buildFragments()
  };

  const message = validate(payload);
  if (message) {
    error.value = message;
    return;
  }

  if (!props.createReady) {
    error.value = '当前环境尚未配置人工新增接口';
    return;
  }

  emit('submit', payload);
};
</script>
