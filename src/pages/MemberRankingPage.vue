<template>
  <section class="space-y-4">
    <header class="flex flex-wrap items-center justify-between gap-2">
      <div>
        <h2 class="text-lg font-semibold">成员排行</h2>
        <p class="text-muted text-sm">展示成员上传文档与审核 QA 的贡献情况，支持本地排序切换。</p>
      </div>
      <button type="button" class="btn btn-primary btn-sm" :disabled="memberStore.loading" @click="refresh">刷新</button>
    </header>

    <p
      v-if="memberStore.error"
      class="rounded-2xl border border-[var(--color-border)] bg-[color:color-mix(in_srgb,var(--color-danger)_12%,transparent)] px-3 py-2 text-sm text-[var(--color-danger)]"
    >
      {{ memberStore.error }}
    </p>

    <MemberRankingSortBar
      :sort-by="memberStore.sortBy"
      :order="memberStore.order"
      :loading="memberStore.loading"
      @update:sort-by="handleSortChange"
      @update:order="handleOrderChange"
    />

    <div class="flex flex-wrap items-center justify-between gap-2 text-xs">
      <span class="text-muted">当前展示 {{ memberStore.total || memberStore.items.length }} 位成员</span>
      <span class="text-muted">默认排序为成员用户名升序，数值相同会回退到用户名稳定排序。</span>
    </div>

    <MemberRankingTable :items="memberStore.items" :loading="memberStore.loading" />
  </section>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import MemberRankingSortBar from '@/components/business/MemberRankingSortBar.vue';
import MemberRankingTable from '@/components/business/MemberRankingTable.vue';
import { useMemberStore } from '@/stores/member.store';
import type { MemberRankingSortField, SortOrder } from '@/types/domain';

const memberStore = useMemberStore();

const refresh = async (): Promise<void> => {
  await memberStore.refresh();
};

const handleSortChange = (sortBy: MemberRankingSortField): void => {
  memberStore.setSort(sortBy, memberStore.order);
};

const handleOrderChange = (order: SortOrder): void => {
  memberStore.setOrder(order);
};

onMounted(async () => {
  if (memberStore.items.length === 0) {
    await memberStore.fetchRankings();
    return;
  }

  memberStore.applyLocalSort();
});
</script>
