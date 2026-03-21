<template>
  <section v-if="detail" class="space-y-4">
    <header class="flex items-center justify-between">
      <div>
        <h2 class="text-lg font-semibold">审核详情</h2>
        <p class="text-xs text-slate-300">ID: {{ detail.id }} | Version: {{ detail.version }}</p>
      </div>
      <RouterLink to="/reviews" class="rounded-md border border-white/20 px-3 py-1.5 text-sm">返回列表</RouterLink>
    </header>

    <div class="flex flex-wrap items-center justify-between gap-2 rounded-md border border-sky-500/30 bg-sky-500/10 px-3 py-2 text-xs text-sky-100">
      <span>{{ draftStatusText }}</span>
      <button type="button" class="rounded border border-sky-300/40 px-2 py-1" @click="clearDraftNow">清空草稿</button>
    </div>

    <form class="space-y-3" @submit.prevent="submitReviewed">
      <label class="block text-sm">
        问题
        <textarea v-model="form.question" rows="3" class="mt-1 w-full rounded-md border border-white/15 bg-black/20 px-3 py-2" />
      </label>

      <label class="block text-sm">
        答案
        <textarea v-model="form.answer" rows="6" class="mt-1 w-full rounded-md border border-white/15 bg-black/20 px-3 py-2" />
      </label>

      <label class="block text-sm">
        主题（逗号分隔）
        <input v-model="topicsInput" class="mt-1 w-full rounded-md border border-white/15 bg-black/20 px-3 py-2" />
      </label>

      <label class="block text-sm">
        场景（逗号分隔）
        <input v-model="scenesInput" class="mt-1 w-full rounded-md border border-white/15 bg-black/20 px-3 py-2" />
      </label>

      <label class="block text-sm">
        置信度: {{ form.confidence.toFixed(2) }}
        <input v-model.number="form.confidence" type="range" min="0.5" max="1" step="0.01" class="mt-1 w-full" />
      </label>

      <label class="block text-sm">
        审核备注
        <textarea v-model="form.review_notes" rows="3" class="mt-1 w-full rounded-md border border-white/15 bg-black/20 px-3 py-2" />
      </label>

      <p v-if="error" class="text-sm text-rose-300">{{ error }}</p>

      <div class="flex gap-2">
        <button type="submit" class="rounded-md bg-emerald-500 px-4 py-2 text-sm font-semibold text-black">审核通过</button>
        <button type="button" class="rounded-md bg-amber-500 px-4 py-2 text-sm font-semibold text-black" @click="submitDeprecated">
          标记废弃
        </button>
      </div>
    </form>

    <section>
      <h3 class="mb-2 text-sm font-semibold text-slate-200">关联片段</h3>
      <article v-for="frag in detail.fragments" :key="frag.id" class="mb-2 rounded-md border border-white/10 bg-black/20 p-3 text-sm">
        <p class="text-xs text-slate-300">
          {{ frag.fragment_type }} | {{ frag.source || '未知来源' }} | 页码 {{ frag.page_start ?? '-' }}-{{ frag.page_end ?? '-' }}
        </p>
        <p class="mt-2 whitespace-pre-wrap text-slate-100">{{ frag.content }}</p>
      </article>
    </section>
  </section>

  <p v-else-if="qaStore.loading" class="text-sm text-slate-300">加载中...</p>
  <p v-else class="text-sm text-slate-300">未找到该审核项。</p>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, reactive, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useQAStore } from '@/stores/qa.store';
import type { ReviewPayload } from '@/types/domain';

interface DraftCache {
  qaId: string;
  version: number;
  form: ReviewPayload;
  topicsInput: string;
  scenesInput: string;
  savedAt: string;
}

const route = useRoute();
const router = useRouter();
const qaStore = useQAStore();
const error = ref('');
const draftSavedAt = ref('');
let draftTimer: number | null = null;

const form = reactive<ReviewPayload>({
  question: '',
  answer: '',
  topics: [],
  scenes: [],
  confidence: 0.8,
  review_notes: '',
  status: 'reviewed',
  version: 1
});

const detail = computed(() => qaStore.current);
const topicsInput = ref('');
const scenesInput = ref('');

const draftStatusText = computed(() => {
  if (!detail.value) {
    return '草稿不可用';
  }
  if (!draftSavedAt.value) {
    return '草稿自动保存已启用，尚未保存。';
  }
  return `草稿已自动保存：${new Date(draftSavedAt.value).toLocaleString()}`;
});

const draftKey = (qaId: string): string => `review_draft_${qaId}`;

const syncForm = (): void => {
  if (!detail.value) return;
  form.question = detail.value.question;
  form.answer = detail.value.answer;
  form.topics = [...detail.value.topics];
  form.scenes = [...detail.value.scenes];
  form.confidence = detail.value.confidence;
  form.review_notes = detail.value.review_notes || '';
  form.status = 'reviewed';
  form.version = detail.value.version;
  topicsInput.value = form.topics.join(',');
  scenesInput.value = form.scenes.join(',');
};

const loadDraft = (): void => {
  if (!detail.value) {
    return;
  }

  const raw = localStorage.getItem(draftKey(detail.value.id));
  if (!raw) {
    draftSavedAt.value = '';
    return;
  }

  try {
    const cache = JSON.parse(raw) as DraftCache;
    if (cache.version !== detail.value.version) {
      localStorage.removeItem(draftKey(detail.value.id));
      draftSavedAt.value = '';
      return;
    }

    Object.assign(form, cache.form);
    topicsInput.value = cache.topicsInput;
    scenesInput.value = cache.scenesInput;
    draftSavedAt.value = cache.savedAt;
  } catch {
    localStorage.removeItem(draftKey(detail.value.id));
    draftSavedAt.value = '';
  }
};

const saveDraft = (): void => {
  if (!detail.value) {
    return;
  }

  const cache: DraftCache = {
    qaId: detail.value.id,
    version: detail.value.version,
    form: { ...form },
    topicsInput: topicsInput.value,
    scenesInput: scenesInput.value,
    savedAt: new Date().toISOString()
  };

  localStorage.setItem(draftKey(detail.value.id), JSON.stringify(cache));
  draftSavedAt.value = cache.savedAt;
};

const clearDraftNow = (): void => {
  if (!detail.value) {
    return;
  }
  localStorage.removeItem(draftKey(detail.value.id));
  draftSavedAt.value = '';
};

const buildPayload = (status: 'reviewed' | 'deprecated'): ReviewPayload => ({
  ...form,
  topics: topicsInput.value.split(',').map((item) => item.trim()).filter(Boolean),
  scenes: scenesInput.value.split(',').map((item) => item.trim()).filter(Boolean),
  status
});

const validatePayload = (payload: ReviewPayload): string => {
  if (!payload.question.trim()) return '问题不能为空';
  if (!payload.answer.trim()) return '答案不能为空';
  if (payload.topics.length === 0) return '至少填写一个主题';
  if (payload.scenes.length === 0) return '至少填写一个场景';
  if (!payload.review_notes.trim()) return '请填写审核备注';
  if (payload.confidence < 0.5 || payload.confidence > 1) return '置信度超出范围';
  return '';
};

const submit = async (status: 'reviewed' | 'deprecated'): Promise<void> => {
  if (!detail.value) return;
  error.value = '';
  const payload = buildPayload(status);
  const message = validatePayload(payload);
  if (message) {
    error.value = message;
    return;
  }

  try {
    await qaStore.submitReview(detail.value.id, payload);
    localStorage.removeItem(draftKey(detail.value.id));
    draftSavedAt.value = '';
    await router.push('/reviews');
  } catch (err) {
    error.value = (err as Error).message;
  }
};

const submitReviewed = async (): Promise<void> => {
  await submit('reviewed');
};

const submitDeprecated = async (): Promise<void> => {
  await submit('deprecated');
};

watch(
  () => detail.value,
  () => {
    syncForm();
    loadDraft();
  },
  { immediate: true }
);

watch(
  () => route.params.id,
  async (id) => {
    if (typeof id === 'string') {
      await qaStore.fetchDetail(id);
    }
  },
  { immediate: true }
);

watch(
  () => [form.question, form.answer, form.confidence, form.review_notes, form.version, topicsInput.value, scenesInput.value],
  () => {
    if (!detail.value) {
      return;
    }

    if (draftTimer !== null) {
      window.clearTimeout(draftTimer);
    }

    draftTimer = window.setTimeout(() => {
      saveDraft();
    }, 400);
  }
);

onBeforeUnmount(() => {
  if (draftTimer !== null) {
    window.clearTimeout(draftTimer);
    draftTimer = null;
  }
});
</script>
