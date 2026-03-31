import { defineStore } from 'pinia';
import { memberApi } from '@/services/api/member.api';
import { normalizeError } from '@/utils/error';
import type { MemberRankingItem, MemberRankingQuery, MemberRankingSortField, SortOrder } from '@/types/domain';

interface MemberState {
  items: MemberRankingItem[];
  total: number;
  sortBy: MemberRankingSortField;
  order: SortOrder;
  loading: boolean;
  error: string;
}

const compareText = (left: string, right: string): number =>
  left.localeCompare(right, 'zh-CN', { sensitivity: 'base' });

const sortItems = (items: MemberRankingItem[], sortBy: MemberRankingSortField, order: SortOrder): MemberRankingItem[] => {
  const sorted = [...items].sort((left, right) => {
    let result = 0;

    if (sortBy === 'uploaded_docs') {
      result = left.uploaded_document_count - right.uploaded_document_count;
    } else if (sortBy === 'reviewed_qa') {
      result = left.reviewed_qa_count - right.reviewed_qa_count;
    } else if (sortBy === 'processed_qa') {
      result = left.processed_qa_count - right.processed_qa_count;
    } else {
      result = compareText(left.username, right.username);
    }

    if (result === 0) {
      result = compareText(left.username, right.username);
    }

    return order === 'asc' ? result : -result;
  });

  return sorted.map((item, index) => ({
    ...item,
    rank: index + 1
  }));
};

export const useMemberStore = defineStore('members', {
  state: (): MemberState => ({
    items: [],
    total: 0,
    sortBy: 'default',
    order: 'asc',
    loading: false,
    error: ''
  }),

  actions: {
    applyLocalSort(): void {
      this.items = sortItems(this.items, this.sortBy, this.order);
    },

    setSort(sortBy: MemberRankingSortField, order?: SortOrder): void {
      this.sortBy = sortBy;
      this.order = order ?? this.order;
      this.applyLocalSort();
    },

    setOrder(order: SortOrder): void {
      this.order = order;
      this.applyLocalSort();
    },

    async fetchRankings(): Promise<void> {
      this.loading = true;
      this.error = '';

      try {
        const query: MemberRankingQuery = {
          sort_by: this.sortBy,
          order: this.order,
          page: 1,
          page_size: 100
        };
        const response = await memberApi.getRankings(query);
        this.items = response.items;
        this.total = response.total;
        this.applyLocalSort();
      } catch (error) {
        this.error = normalizeError(error);
        throw error;
      } finally {
        this.loading = false;
      }
    },

    async refresh(): Promise<void> {
      await this.fetchRankings();
    }
  }
});
