import { defineStore } from 'pinia';
import { qaApi } from '@/services/api/qa.api';
import type { AssignPayload, QADetail, QAFilters, QAPair, QAStats, ReviewPayload } from '@/types/domain';

const defaultFilters = (): QAFilters => ({
  keyword: '',
  topic: '',
  scene: '',
  minConfidence: null,
  assignee: '__all__',
  onlyMine: false
});

interface QAState {
  pending: QAPair[];
  current: QADetail | null;
  history: QAPair[];
  stats: QAStats;
  filters: QAFilters;
  selectedIds: string[];
  mineUser: string;
  loading: boolean;
  error: string;
}

export const useQAStore = defineStore('qa', {
  state: (): QAState => ({
    pending: [],
    current: null,
    history: [],
    stats: {
      pending: 0,
      reviewed: 0,
      deprecated: 0
    },
    filters: defaultFilters(),
    selectedIds: [],
    mineUser: '',
    loading: false,
    error: ''
  }),

  getters: {
    filteredPending(state): QAPair[] {
      const keyword = state.filters.keyword.trim().toLowerCase();
      const topic = state.filters.topic;
      const scene = state.filters.scene;
      const minConfidence = state.filters.minConfidence;
      const assigneeFilter = state.filters.onlyMine ? state.mineUser : state.filters.assignee;

      return state.pending.filter((item) => {
        if (keyword) {
          const question = item.question.toLowerCase();
          const answer = item.answer.toLowerCase();
          if (!question.includes(keyword) && !answer.includes(keyword)) {
            return false;
          }
        }

        if (topic && !item.topics.includes(topic)) {
          return false;
        }

        if (scene && !item.scenes.includes(scene)) {
          return false;
        }

        if (minConfidence !== null && item.confidence < minConfidence) {
          return false;
        }

        if (assigneeFilter === '__unassigned__' && item.reviewer) {
          return false;
        }

        if (assigneeFilter && assigneeFilter !== '__all__' && assigneeFilter !== '__unassigned__') {
          if (item.reviewer !== assigneeFilter) {
            return false;
          }
        }

        return true;
      });
    },

    topicOptions(state): string[] {
      return Array.from(new Set(state.pending.flatMap((item) => item.topics))).sort();
    },

    sceneOptions(state): string[] {
      return Array.from(new Set(state.pending.flatMap((item) => item.scenes))).sort();
    },

    assigneeOptions(state): string[] {
      const set = new Set<string>();
      state.pending.forEach((item) => {
        if (item.reviewer && item.reviewer.trim()) {
          set.add(item.reviewer.trim());
        }
      });
      state.history.forEach((item) => {
        if (item.reviewer && item.reviewer.trim()) {
          set.add(item.reviewer.trim());
        }
      });
      if (state.mineUser.trim()) {
        set.add(state.mineUser.trim());
      }
      return Array.from(set).sort();
    },

    selectedCount(state): number {
      return state.selectedIds.length;
    }
  },

  actions: {
    setMineUser(username: string): void {
      this.mineUser = username;
    },

    setFilters(next: Partial<QAFilters>): void {
      this.filters = {
        ...this.filters,
        ...next
      };
    },

    resetFilters(): void {
      this.filters = defaultFilters();
    },

    toggleSelection(id: string, checked: boolean): void {
      if (checked) {
        if (!this.selectedIds.includes(id)) {
          this.selectedIds.push(id);
        }
        return;
      }
      this.selectedIds = this.selectedIds.filter((item) => item !== id);
    },

    setSelection(ids: string[]): void {
      this.selectedIds = [...ids];
    },

    clearSelection(): void {
      this.selectedIds = [];
    },

    async fetchPending(limit = 100): Promise<void> {
      this.loading = true;
      this.error = '';
      try {
        this.pending = await qaApi.getPending(limit);
        const validIds = new Set(this.pending.map((item) => item.id));
        this.selectedIds = this.selectedIds.filter((id) => validIds.has(id));
      } catch (error) {
        this.error = (error as Error).message;
      } finally {
        this.loading = false;
      }
    },

    async fetchDetail(id: string): Promise<void> {
      this.loading = true;
      this.error = '';
      try {
        this.current = await qaApi.getDetail(id);
      } catch (error) {
        this.error = (error as Error).message;
      } finally {
        this.loading = false;
      }
    },

    async submitReview(id: string, payload: ReviewPayload): Promise<void> {
      this.loading = true;
      this.error = '';
      try {
        await qaApi.review(id, payload);
        this.current = null;
        await Promise.all([this.fetchPending(), this.fetchStats(), this.fetchHistory()]);
      } catch (error) {
        this.error = (error as Error).message;
        throw error;
      } finally {
        this.loading = false;
      }
    },

    async assignSelected(assignee: string): Promise<void> {
      if (this.selectedIds.length === 0) {
        return;
      }

      this.loading = true;
      this.error = '';
      try {
        const payload: AssignPayload = {
          qa_ids: this.selectedIds,
          assignee: assignee.trim()
        };
        await qaApi.assign(payload);
        await Promise.all([this.fetchPending(), this.fetchStats()]);
        this.clearSelection();
      } catch (error) {
        this.error = (error as Error).message;
        throw error;
      } finally {
        this.loading = false;
      }
    },

    async fetchStats(): Promise<void> {
      try {
        this.stats = await qaApi.stats();
      } catch (error) {
        this.error = (error as Error).message;
      }
    },

    async fetchHistory(limit = 20): Promise<void> {
      try {
        this.history = await qaApi.history(limit);
      } catch (error) {
        this.error = (error as Error).message;
      }
    }
  }
});
