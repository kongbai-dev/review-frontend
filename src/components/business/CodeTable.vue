<template>
  <section class="px-4 pb-4 sm:px-5 sm:pb-5">
    <div class="overflow-x-auto">
      <table class="min-w-full table-fixed border-separate border-spacing-y-1 text-sm">
        <thead>
          <tr class="text-left text-xs uppercase tracking-[0.06em] text-[color:color-mix(in_srgb,var(--color-text-secondary)_88%,transparent)]">
            <th class="w-[180px] px-2 py-2 font-medium whitespace-nowrap">文件名</th>
            <th class="w-[240px] px-2 py-2 font-medium whitespace-nowrap">路径</th>
            <th class="w-[110px] px-2 py-2 font-medium whitespace-nowrap">知识库</th>
            <th class="w-[100px] px-2 py-2 font-medium whitespace-nowrap">代码类型</th>
            <th class="w-[90px] px-2 py-2 font-medium whitespace-nowrap">语言</th>
            <th class="w-[110px] px-2 py-2 font-medium whitespace-nowrap">项目</th>
            <th class="w-[90px] px-2 py-2 font-medium whitespace-nowrap">片段数</th>
            <th class="w-[90px] px-2 py-2 font-medium whitespace-nowrap">大小</th>
            <th class="w-[150px] px-2 py-2 font-medium whitespace-nowrap">创建时间</th>
            <th class="w-[100px] px-2 py-2 font-medium whitespace-nowrap">操作</th>
          </tr>
        </thead>
        <tbody v-if="items.length > 0">
          <tr
            v-for="item in items"
            :key="item.id"
            class="rounded-[0.9rem] border border-[var(--color-border)] bg-[color:color-mix(in_srgb,var(--color-surface-strong)_35%,transparent)]"
          >
            <td class="rounded-l-[0.9rem] px-2 py-2 align-middle">
              <p class="truncate font-medium" :title="item.file_name">{{ item.file_name }}</p>
            </td>
            <td class="px-2 py-2 align-middle text-xs text-[var(--color-text-secondary)]">
              <p class="truncate" :title="item.file_path">{{ item.file_path }}</p>
            </td>
            <td class="px-2 py-2 align-middle whitespace-nowrap">{{ item.knowledge_base }}</td>
            <td class="px-2 py-2 align-middle whitespace-nowrap">{{ item.code_type }}</td>
            <td class="px-2 py-2 align-middle whitespace-nowrap">{{ item.language }}</td>
            <td class="px-2 py-2 align-middle whitespace-nowrap">
              <span :title="item.project_id || '-'">{{ item.project_id || '-' }}</span>
            </td>
            <td class="px-2 py-2 align-middle whitespace-nowrap">{{ item.fragment_count }}</td>
            <td class="px-2 py-2 align-middle whitespace-nowrap">{{ formatBytes(item.file_size) }}</td>
            <td class="px-2 py-2 align-middle whitespace-nowrap text-xs text-[var(--color-text-secondary)]">{{ formatDateTime(item.created_at) }}</td>
            <td class="rounded-r-[0.9rem] px-2 py-2 align-middle whitespace-nowrap">
              <button type="button" class="btn btn-ghost btn-sm" :disabled="loading" @click="emit('view', item.id)">详情</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <p v-if="loading && items.length === 0" class="text-muted px-1 py-5 text-sm text-left">正在加载代码文件...</p>
    <p v-else-if="!loading && items.length === 0" class="text-muted px-1 py-5 text-sm text-left">当前筛选下暂无代码文件。</p>

    <PaginationControls
      class="mt-3"
      :page="page"
      :page-size="pageSize"
      :total="total"
      :page-size-options="[10, 20, 50]"
      @update:page="(value) => emit('update:page', value)"
      @update:page-size="(value) => emit('update:pageSize', value)"
    />
  </section>
</template>

<script setup lang="ts">
import PaginationControls from '@/components/business/PaginationControls.vue';
import { formatBytes, formatDateTime } from '@/lib/format';
import type { KnowledgeCodeFile } from '@/types/domain';

defineProps<{
  items: KnowledgeCodeFile[];
  total: number;
  page: number;
  pageSize: number;
  loading?: boolean;
}>();

const emit = defineEmits<{
  (e: 'view', id: string): void;
  (e: 'update:page', value: number): void;
  (e: 'update:pageSize', value: number): void;
}>();
</script>
