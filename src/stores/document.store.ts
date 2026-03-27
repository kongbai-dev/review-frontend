import { defineStore } from 'pinia';
import { documentApi } from '@/services/api/document.api';
import { normalizeError } from '@/utils/error';
import type { DocumentListQuery, DocumentStats, KnowledgeDocument } from '@/types/domain';

const defaultStats = (): DocumentStats => ({
  document_count: 0,
  fragment_count: 0,
  qa_count: 0,
  indexed_count: 0,
  processing_count: 0,
  failed_count: 0
});

const defaultQuery = (): DocumentListQuery => ({
  page: 1,
  page_size: 20,
  keyword: '',
  file_type: '',
  status: '',
  sort_by: 'uploaded_at',
  order: 'desc'
});

interface DocumentState {
  stats: DocumentStats;
  items: KnowledgeDocument[];
  total: number;
  query: DocumentListQuery;
  loading: boolean;
  uploading: boolean;
  downloadingId: string;
  error: string;
}

const triggerBrowserDownload = (url: string): void => {
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.target = '_blank';
  anchor.rel = 'noopener noreferrer';
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
};

export const useDocumentStore = defineStore('documents', {
  state: (): DocumentState => ({
    stats: defaultStats(),
    items: [],
    total: 0,
    query: defaultQuery(),
    loading: false,
    uploading: false,
    downloadingId: '',
    error: ''
  }),

  getters: {
    page: (state): number => state.query.page,
    pageSize: (state): number => state.query.page_size,
    totalPages: (state): number => Math.max(1, Math.ceil(state.total / state.query.page_size))
  },

  actions: {
    setQuery(next: Partial<DocumentListQuery>): void {
      const shouldResetPage = Object.keys(next).some((key) => key !== 'page' && key !== 'page_size');
      this.query = {
        ...this.query,
        ...next,
        page: shouldResetPage ? 1 : next.page ?? this.query.page
      };
    },

    async fetchStats(): Promise<void> {
      try {
        this.stats = await documentApi.getStats();
      } catch (error) {
        this.error = normalizeError(error);
        throw error;
      }
    },

    async fetchList(overrides: Partial<DocumentListQuery> = {}): Promise<void> {
      this.loading = true;
      this.error = '';
      this.setQuery(overrides);

      try {
        const response = await documentApi.getList(this.query);
        this.items = response.items;
        this.total = response.total;
        this.query.page = response.page;
        this.query.page_size = response.page_size;
      } catch (error) {
        this.error = normalizeError(error);
        throw error;
      } finally {
        this.loading = false;
      }
    },

    async refresh(): Promise<void> {
      this.loading = true;
      this.error = '';

      try {
        const [stats, list] = await Promise.all([
          documentApi.getStats(),
          documentApi.getList(this.query)
        ]);

        this.stats = stats;
        this.items = list.items;
        this.total = list.total;
        this.query.page = list.page;
        this.query.page_size = list.page_size;
      } catch (error) {
        this.error = normalizeError(error);
        throw error;
      } finally {
        this.loading = false;
      }
    },

    async upload(file: File): Promise<void> {
      this.uploading = true;
      this.error = '';

      try {
        await documentApi.upload(file);
        const refreshQuery: DocumentListQuery = {
          ...this.query,
          page: 1
        };
        const [stats, list] = await Promise.all([
          documentApi.getStats(),
          documentApi.getList(refreshQuery)
        ]);

        this.stats = stats;
        this.items = list.items;
        this.total = list.total;
        this.query = {
          ...refreshQuery,
          page: list.page,
          page_size: list.page_size
        };
      } catch (error) {
        this.error = normalizeError(error);
        throw error;
      } finally {
        this.uploading = false;
      }
    },

    async download(documentItem: KnowledgeDocument): Promise<void> {
      this.downloadingId = documentItem.document_id;
      this.error = '';

      try {
        const url = await documentApi.getDownloadUrl(documentItem.document_id);
        triggerBrowserDownload(url);
      } catch (error) {
        this.error = normalizeError(error);
        throw error;
      } finally {
        this.downloadingId = '';
      }
    }
  }
});
