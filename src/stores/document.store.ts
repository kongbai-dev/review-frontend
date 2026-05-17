import { defineStore } from 'pinia';
import { pollUntil } from '@/lib/async';
import { documentApi } from '@/services/api/document.api';
import { normalizeError } from '@/utils/error';
import type { PagedListResponse } from '@/types/api';
import type {
  BatchSyncStartPayload,
  BatchSyncTaskStatus,
  BatchUploadRequestPayload,
  BatchUploadResponse,
  DocumentListQuery,
  DocumentStats,
  IngestionTaskStatus,
  KnowledgeDocument,
  QAGenerationPayload,
  QAGenerationStartResult,
  UploadDocumentResult,
  UploadSessionSummary,
  UploadSyncDocumentPayload
} from '@/types/domain';

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

interface PollingOptions {
  intervalMs?: number;
  maxPolls?: number;
}

interface DocumentState {
  stats: DocumentStats;
  items: KnowledgeDocument[];
  total: number;
  query: DocumentListQuery;
  loading: boolean;
  uploading: boolean;
  downloadingId: string;
  selectedDocumentIds: string[];
  syncUploadResult: UploadDocumentResult | null;
  batchUploadDocResult: BatchUploadResponse | null;
  batchUploadDirectDocResult: BatchUploadResponse | null;
  batchUploadCsvResult: BatchUploadResponse | null;
  currentSessionSummary: UploadSessionSummary | null;
  currentDirectSessionSummary: UploadSessionSummary | null;
  batchSyncTask: BatchSyncTaskStatus | null;
  batchSyncPolling: boolean;
  qaGenerationStartResult: QAGenerationStartResult | null;
  qaGenerationTask: IngestionTaskStatus | null;
  qaGenerationPolling: boolean;
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

const terminalBatchStatus = new Set(['skipped', 'completed', 'failed']);
const terminalTaskStatus = new Set(['completed', 'failed', 'canceled', 'cancelled']);

export const useDocumentStore = defineStore('documents', {
  state: (): DocumentState => ({
    stats: defaultStats(),
    items: [],
    total: 0,
    query: defaultQuery(),
    loading: false,
    uploading: false,
    downloadingId: '',
    selectedDocumentIds: [],
    syncUploadResult: null,
    batchUploadDocResult: null,
    batchUploadDirectDocResult: null,
    batchUploadCsvResult: null,
    currentSessionSummary: null,
    currentDirectSessionSummary: null,
    batchSyncTask: null,
    batchSyncPolling: false,
    qaGenerationStartResult: null,
    qaGenerationTask: null,
    qaGenerationPolling: false,
    error: ''
  }),

  getters: {
    page: (state): number => state.query.page,
    pageSize: (state): number => state.query.page_size,
    totalPages: (state): number => Math.max(1, Math.ceil(state.total / state.query.page_size)),
    selectedCount: (state): number => state.selectedDocumentIds.length
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

    syncSelectionWithList(): void {
      const currentIds = new Set(this.items.map((item) => item.document_id));
      this.selectedDocumentIds = this.selectedDocumentIds.filter((id) => currentIds.has(id));
    },

    setSelectedDocumentIds(ids: string[]): void {
      this.selectedDocumentIds = [...new Set(ids)];
      this.syncSelectionWithList();
    },

    clearSelection(): void {
      this.selectedDocumentIds = [];
    },

    clearUploadState(): void {
      this.syncUploadResult = null;
      this.batchUploadDocResult = null;
      this.batchUploadDirectDocResult = null;
      this.batchUploadCsvResult = null;
    },

    applyListResponse(list: PagedListResponse<KnowledgeDocument>, queryBase: DocumentListQuery): void {
      this.items = list.items;
      this.total = list.total;
      this.query = {
        ...queryBase,
        page: list.page,
        page_size: list.page_size
      };
      this.syncSelectionWithList();
    },

    async refreshStatsAndList(queryBase: DocumentListQuery): Promise<void> {
      const [stats, list] = await Promise.all([
        documentApi.getStats(),
        documentApi.getList(queryBase)
      ]);

      this.stats = stats;
      this.applyListResponse(list, queryBase);
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
        this.applyListResponse(response, this.query);
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
        await this.refreshStatsAndList(this.query);
      } catch (error) {
        this.error = normalizeError(error);
        throw error;
      } finally {
        this.loading = false;
      }
    },

    async uploadSyncPair(payload: UploadSyncDocumentPayload): Promise<UploadDocumentResult> {
      this.uploading = true;
      this.error = '';

      try {
        const result = await documentApi.uploadSyncDocument(payload);
        this.syncUploadResult = result;

        const refreshQuery: DocumentListQuery = {
          ...this.query,
          page: 1
        };

        await this.refreshStatsAndList(refreshQuery);

        try {
          this.currentSessionSummary = await documentApi.getCurrentBatchSession(payload.knowledge_base?.trim() || 'default');
        } catch {
          // Session may be absent when only sync upload is used.
        }

        return result;
      } catch (error) {
        this.error = normalizeError(error);
        throw error;
      } finally {
        this.uploading = false;
      }
    },

    async batchUploadDocs(payload: BatchUploadRequestPayload): Promise<BatchUploadResponse> {
      this.uploading = true;
      this.error = '';

      try {
        const knowledgeBase = payload.knowledge_base?.trim() || 'default';
        const result = await documentApi.batchUploadDocFiles({
          files: payload.files,
          knowledge_base: knowledgeBase
        });
        this.batchUploadDocResult = result;
        this.currentSessionSummary = await documentApi.getCurrentBatchSession(knowledgeBase);

        const refreshQuery: DocumentListQuery = {
          ...this.query,
          page: 1
        };

        await this.refreshStatsAndList(refreshQuery);

        return result;
      } catch (error) {
        this.error = normalizeError(error);
        throw error;
      } finally {
        this.uploading = false;
      }
    },

    async batchUploadDirectDocs(payload: BatchUploadRequestPayload): Promise<BatchUploadResponse> {
      this.uploading = true;
      this.error = '';

      try {
        const knowledgeBase = payload.knowledge_base?.trim() || 'default';
        const result = await documentApi.batchUploadDirectDocFiles({
          files: payload.files,
          knowledge_base: knowledgeBase
        });
        this.batchUploadDirectDocResult = result;
        this.currentDirectSessionSummary = await documentApi.getCurrentDirectBatchSession(knowledgeBase);

        const refreshQuery: DocumentListQuery = {
          ...this.query,
          page: 1
        };

        await this.refreshStatsAndList(refreshQuery);

        return result;
      } catch (error) {
        this.error = normalizeError(error);
        throw error;
      } finally {
        this.uploading = false;
      }
    },

    async batchUploadCsvs(payload: BatchUploadRequestPayload): Promise<BatchUploadResponse> {
      this.uploading = true;
      this.error = '';

      try {
        const knowledgeBase = payload.knowledge_base?.trim() || 'default';
        const result = await documentApi.batchUploadCsvFiles({
          files: payload.files,
          knowledge_base: knowledgeBase
        });
        this.batchUploadCsvResult = result;
        this.currentSessionSummary = await documentApi.getCurrentBatchSession(knowledgeBase);

        const refreshQuery: DocumentListQuery = {
          ...this.query,
          page: 1
        };

        await this.refreshStatsAndList(refreshQuery);

        return result;
      } catch (error) {
        this.error = normalizeError(error);
        throw error;
      } finally {
        this.uploading = false;
      }
    },

    async refreshCurrentSessionSummary(knowledgeBase = 'default'): Promise<UploadSessionSummary> {
      this.error = '';

      try {
        const summary = await documentApi.getCurrentBatchSession(knowledgeBase.trim() || 'default');
        this.currentSessionSummary = summary;
        return summary;
      } catch (error) {
        this.error = normalizeError(error);
        throw error;
      }
    },

    async refreshCurrentDirectSessionSummary(knowledgeBase = 'default'): Promise<UploadSessionSummary> {
      this.error = '';

      try {
        const summary = await documentApi.getCurrentDirectBatchSession(knowledgeBase.trim() || 'default');
        this.currentDirectSessionSummary = summary;
        return summary;
      } catch (error) {
        this.error = normalizeError(error);
        throw error;
      }
    },

    async triggerBatchSync(payload: BatchSyncStartPayload): Promise<BatchSyncTaskStatus> {
      this.error = '';

      try {
        const task = await documentApi.startBatchSync(payload);
        this.batchSyncTask = task;
        return task;
      } catch (error) {
        this.error = normalizeError(error);
        throw error;
      }
    },

    async triggerDirectBatchSync(payload: BatchSyncStartPayload): Promise<BatchSyncTaskStatus> {
      this.error = '';

      try {
        const task = await documentApi.startDirectBatchSync(payload);
        this.batchSyncTask = task;
        return task;
      } catch (error) {
        this.error = normalizeError(error);
        throw error;
      }
    },

    async refreshBatchSyncTask(taskId: string): Promise<BatchSyncTaskStatus> {
      this.error = '';

      try {
        const task = await documentApi.getBatchSyncTask(taskId);
        this.batchSyncTask = task;
        return task;
      } catch (error) {
        this.error = normalizeError(error);
        throw error;
      }
    },

    async pollBatchSyncTask(taskId: string, options: PollingOptions = {}): Promise<BatchSyncTaskStatus> {
      const intervalMs = options.intervalMs ?? 3000;
      const maxPolls = options.maxPolls ?? 120;

      this.batchSyncPolling = true;

      try {
        const latest = await pollUntil(
          () => this.refreshBatchSyncTask(taskId),
          (task) => terminalBatchStatus.has(task.status),
          { intervalMs, maxPolls }
        );

        if (latest.status === 'completed') {
          await this.refresh();
          if (this.currentSessionSummary?.knowledge_base) {
            try {
              await this.refreshCurrentSessionSummary(this.currentSessionSummary.knowledge_base);
            } catch {
              // ignore session refresh errors after task completion
            }
          }
          if (this.currentDirectSessionSummary?.knowledge_base) {
            try {
              await this.refreshCurrentDirectSessionSummary(this.currentDirectSessionSummary.knowledge_base);
            } catch {
              // ignore direct session refresh errors after task completion
            }
          }
        }

        return latest;
      } finally {
        this.batchSyncPolling = false;
      }
    },

    async triggerQaGeneration(payload: QAGenerationPayload): Promise<QAGenerationStartResult> {
      this.error = '';

      try {
        const result = await documentApi.startQaGeneration(payload);
        this.qaGenerationStartResult = result;

        try {
          this.qaGenerationTask = await documentApi.getQaGenerationTask(result.task_id);
        } catch {
          // keep start result even if task status endpoint is temporarily unavailable
        }

        if (result.status.toLowerCase() === 'completed') {
          await this.refresh();
        }

        return result;
      } catch (error) {
        this.error = normalizeError(error);
        throw error;
      }
    },

    async refreshQaGenerationTask(taskId: string): Promise<IngestionTaskStatus> {
      this.error = '';

      try {
        const task = await documentApi.getQaGenerationTask(taskId);
        this.qaGenerationTask = task;
        return task;
      } catch (error) {
        this.error = normalizeError(error);
        throw error;
      }
    },

    async pollQaGenerationTask(taskId: string, options: PollingOptions = {}): Promise<IngestionTaskStatus> {
      const intervalMs = options.intervalMs ?? 3000;
      const maxPolls = options.maxPolls ?? 120;

      this.qaGenerationPolling = true;

      try {
        const latest = await pollUntil(
          () => this.refreshQaGenerationTask(taskId),
          (task) => terminalTaskStatus.has(task.status.toLowerCase()),
          { intervalMs, maxPolls }
        );

        if (latest.status.toLowerCase() === 'completed') {
          await this.refresh();
        }

        return latest;
      } finally {
        this.qaGenerationPolling = false;
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

