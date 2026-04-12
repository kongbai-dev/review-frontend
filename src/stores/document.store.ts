import { isAxiosError } from 'axios';
import { defineStore } from 'pinia';
import { documentApi } from '@/services/api/document.api';
import { normalizeError } from '@/utils/error';
import type {
  BatchSyncStartPayload,
  BatchSyncTaskStatus,
  DocumentListQuery,
  DocumentStats,
  DocumentUploadQueueItem,
  IngestionTaskStatus,
  KnowledgeDocument,
  QAGenerationPayload,
  QAGenerationStartResult,
  UploadDocumentPairPayload
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

interface UploadQueueSummary {
  successCount: number;
  conflictCount: number;
  failedCount: number;
}

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
  uploadQueue: DocumentUploadQueueItem[];
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

const wait = async (ms: number): Promise<void> =>
  new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });

const extractHttpStatus = (error: unknown): number | undefined => {
  if (isAxiosError(error)) {
    return error.response?.status;
  }

  if (typeof error !== 'object' || error === null) {
    return undefined;
  }

  const maybe = error as {
    status?: unknown;
    response?: {
      status?: unknown;
    };
  };

  if (typeof maybe.response?.status === 'number') {
    return maybe.response.status;
  }

  if (typeof maybe.status === 'number') {
    return maybe.status;
  }

  return undefined;
};

const terminalBatchStatus = new Set(['skipped', 'completed', 'failed']);
const terminalTaskStatus = new Set(['completed', 'failed', 'canceled', 'cancelled']);

const getUploadSuccessMessage = (item: DocumentUploadQueueItem): string => {
  const syncMode = item.response?.sync_mode;
  const syncStatus = item.response?.sync_status;

  if (syncMode === 'batch' || syncStatus === 'sync_pending') {
    return '已上传并加入批处理队列';
  }

  return '上传并同步完成';
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
    selectedDocumentIds: [],
    uploadQueue: [],
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

    addUploadQueueItem(payload: UploadDocumentPairPayload): void {
      const queueItem: DocumentUploadQueueItem = {
        ...payload,
        id: `uq_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`,
        status: 'ready',
        message: ''
      };

      this.uploadQueue = [...this.uploadQueue, queueItem];
    },

    removeUploadQueueItem(id: string): void {
      this.uploadQueue = this.uploadQueue.filter((item) => item.id !== id);
    },

    clearUploadQueue(): void {
      this.uploadQueue = [];
    },

    resetUploadQueueForRetry(): void {
      this.uploadQueue = this.uploadQueue.map((item) => ({
        ...item,
        status: item.status === 'success' ? 'success' : 'ready',
        message: item.status === 'success' ? item.message : ''
      }));
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
        this.syncSelectionWithList();
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
        this.syncSelectionWithList();
      } catch (error) {
        this.error = normalizeError(error);
        throw error;
      } finally {
        this.loading = false;
      }
    },

    async uploadQueuedDocuments(): Promise<UploadQueueSummary> {
      const summary: UploadQueueSummary = {
        successCount: 0,
        conflictCount: 0,
        failedCount: 0
      };

      if (this.uploadQueue.length === 0) {
        return summary;
      }

      this.uploading = true;
      this.error = '';

      try {
        for (const item of this.uploadQueue) {
          if (item.status === 'success') {
            continue;
          }

          item.status = 'uploading';
          item.message = '上传中...';

          try {
            const response = await documentApi.uploadPair(item);
            item.response = response;
            item.status = 'success';
            item.message = getUploadSuccessMessage(item);
            summary.successCount += 1;
          } catch (error) {
            const status = extractHttpStatus(error);
            item.message = normalizeError(error);

            if (status === 409) {
              item.status = 'conflict';
              summary.conflictCount += 1;
            } else {
              item.status = 'error';
              summary.failedCount += 1;
            }
          }
        }

        if (summary.successCount > 0) {
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
          this.syncSelectionWithList();
        }
      } finally {
        this.uploading = false;
      }

      return summary;
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
        let latest = await this.refreshBatchSyncTask(taskId);

        for (let i = 0; i < maxPolls; i += 1) {
          if (terminalBatchStatus.has(latest.status)) {
            break;
          }
          await wait(intervalMs);
          latest = await this.refreshBatchSyncTask(taskId);
        }

        if (latest.status === 'completed') {
          await this.refresh();
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
        let latest = await this.refreshQaGenerationTask(taskId);

        for (let i = 0; i < maxPolls; i += 1) {
          if (terminalTaskStatus.has(latest.status.toLowerCase())) {
            break;
          }
          await wait(intervalMs);
          latest = await this.refreshQaGenerationTask(taskId);
        }

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
