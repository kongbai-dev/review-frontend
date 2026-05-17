<template>
  <div class="rounded-[1rem] border border-[var(--color-border)] bg-[color:color-mix(in_srgb,var(--color-surface-strong)_44%,transparent)] px-3 py-2">
    <p v-if="!hasContent" class="text-muted text-xs">{{ emptyText }}</p>
    <div v-else class="markdown-preview text-sm leading-6" v-html="renderedHtml" />
  </div>
</template>

<script setup lang="ts">
import MarkdownIt from 'markdown-it';
import markdownItKatex from 'markdown-it-katex';
import { computed } from 'vue';

interface Props {
  content: string;
  emptyText?: string;
}

const props = withDefaults(defineProps<Props>(), {
  emptyText: '暂无内容'
});

const markdownRenderer = new MarkdownIt({
  html: false,
  linkify: true,
  breaks: true
});

markdownRenderer.use(markdownItKatex as unknown as (md: MarkdownIt) => void);

const normalizedContent = computed(() => props.content ?? '');
const hasContent = computed(() => normalizedContent.value.trim().length > 0);
const renderedHtml = computed(() => markdownRenderer.render(normalizedContent.value));
</script>

<style scoped>
.markdown-preview :deep(h1),
.markdown-preview :deep(h2),
.markdown-preview :deep(h3),
.markdown-preview :deep(h4),
.markdown-preview :deep(h5),
.markdown-preview :deep(h6) {
  margin: 0.55rem 0 0.4rem;
  font-weight: 600;
}

.markdown-preview :deep(p),
.markdown-preview :deep(ul),
.markdown-preview :deep(ol),
.markdown-preview :deep(blockquote) {
  margin: 0.45rem 0;
}

.markdown-preview :deep(ul),
.markdown-preview :deep(ol) {
  padding-inline-start: 1.2rem;
}

.markdown-preview :deep(code) {
  border: 1px solid var(--color-border);
  border-radius: 0.4rem;
  background: color-mix(in srgb, var(--color-surface-soft) 80%, transparent);
  padding: 0.1rem 0.35rem;
  font-family: Consolas, "Courier New", monospace;
  font-size: 0.84em;
}

.markdown-preview :deep(pre) {
  overflow-x: auto;
  border: 1px solid var(--color-border);
  border-radius: 0.7rem;
  background: color-mix(in srgb, var(--color-bg-elevated) 78%, transparent);
  padding: 0.55rem 0.7rem;
}

.markdown-preview :deep(pre code) {
  border: none;
  background: transparent;
  padding: 0;
}

.markdown-preview :deep(a) {
  color: var(--color-primary);
  text-decoration: underline;
}

.markdown-preview :deep(blockquote) {
  border-left: 3px solid color-mix(in srgb, var(--color-primary) 44%, var(--color-border));
  padding-left: 0.7rem;
  color: var(--color-text-secondary);
}

.markdown-preview :deep(.katex-display) {
  overflow-x: auto;
  overflow-y: hidden;
  padding: 0.3rem 0;
}
</style>
