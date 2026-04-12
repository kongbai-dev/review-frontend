import { API_CONFIG } from '@/config';
import type { PagedListResponse } from '@/types/api';
import type {
  BatchSyncStartPayload,
  BatchSyncTaskStatus,
  DocumentListQuery,
  DocumentStats,
  DocumentStatus,
  DocumentType,
  IngestionTaskStatus,
  KnowledgeDocument,
  QAGenerationPayload,
  QAGenerationStartResult,
  UploadDocumentPairPayload,
  UploadDocumentResult
} from '@/types/domain';

const wait = async (ms: number): Promise<void> =>
  new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });

const mockHttpError = (status: number, detail: string): Error & { status: number; response: { status: number; data: { detail: string } } } => {
  const error = new Error(detail) as Error & { status: number; response: { status: number; data: { detail: string } } };
  error.status = status;
  error.response = {
    status,
    data: {
      detail
    }
  };
  return error;
};

const seedDocuments: Array<{
  file_name: string;
  file_type: string;
  file_size: number;
  uploaded_at: string;
  uploaded_by: string;
  knowledge_base: string;
  status: DocumentStatus;
  fragment_count: number;
  qa_count: number;
  document_type?: DocumentType;
}> = [
  {
    file_name: 'finfet_process_guide.pdf',
    file_type: 'pdf',
    file_size: 2457600,
    uploaded_at: '2026-03-26T08:30:00Z',
    uploaded_by: 'alice',
    knowledge_base: 'default',
    status: 'indexed',
    fragment_count: 124,
    qa_count: 57,
    document_type: 'manual'
  },
  {
    file_name: 'gaa_device_notes.pdf',
    file_type: 'pdf',
    file_size: 1895420,
    uploaded_at: '2026-03-25T13:10:00Z',
    uploaded_by: 'alice',
    knowledge_base: 'default',
    status: 'indexed',
    fragment_count: 89,
    qa_count: 42,
    document_type: 'paper'
  },
  {
    file_name: 'sentaurus_calibration.docx',
    file_type: 'docx',
    file_size: 862144,
    uploaded_at: '2026-03-24T09:20:00Z',
    uploaded_by: 'bob',
    knowledge_base: 'simulation',
    status: 'processing',
    fragment_count: 36,
    qa_count: 0,
    document_type: 'manual'
  },
  {
    file_name: 'mos_capacitance_lab.md',
    file_type: 'md',
    file_size: 45120,
    uploaded_at: '2026-03-23T15:45:00Z',
    uploaded_by: 'carol',
    knowledge_base: 'training',
    status: 'indexed',
    fragment_count: 42,
    qa_count: 19,
    document_type: 'manual'
  },
  {
    file_name: 'reliability_checklist.txt',
    file_type: 'txt',
    file_size: 18422,
    uploaded_at: '2026-03-22T05:50:00Z',
    uploaded_by: 'david',
    knowledge_base: 'ops',
    status: 'indexed',
    fragment_count: 12,
    qa_count: 6,
    document_type: 'manual'
  },
  {
    file_name: 'layout_drc_cases.pdf',
    file_type: 'pdf',
    file_size: 3062784,
    uploaded_at: '2026-03-21T11:05:00Z',
    uploaded_by: 'erin',
    knowledge_base: 'layout',
    status: 'failed',
    fragment_count: 0,
    qa_count: 0,
    document_type: 'manual'
  },
  {
    file_name: 'device_modeling_handbook.pdf',
    file_type: 'pdf',
    file_size: 5120040,
    uploaded_at: '2026-03-20T07:15:00Z',
    uploaded_by: 'frank',
    knowledge_base: 'default',
    status: 'indexed',
    fragment_count: 208,
    qa_count: 92,
    document_type: 'book'
  }
];

interface InternalBatchTask extends BatchSyncTaskStatus {
  candidate_ids: string[];
  tick: number;
}

let mockDocuments: KnowledgeDocument[] = seedDocuments.map((item, index) => ({
  document_id: `doc_${(index + 1).toString().padStart(4, '0')}`,
  ...item
}));

const batchSyncTasks = new Map<string, InternalBatchTask>();
const qaGenerationTasks = new Map<string, IngestionTaskStatus>();

const buildStats = (): DocumentStats => {
  const indexed = mockDocuments.filter((item) => item.status === 'indexed').length;
  const processing = mockDocuments.filter((item) => item.status === 'processing').length;
  const failed = mockDocuments.filter((item) => item.status === 'failed').length;

  return {
    document_count: mockDocuments.length,
    fragment_count: mockDocuments.reduce((sum, item) => sum + item.fragment_count, 0),
    qa_count: mockDocuments.reduce((sum, item) => sum + item.qa_count, 0),
    indexed_count: indexed,
    processing_count: processing,
    failed_count: failed
  };
};

const compareText = (left: string, right: string): number =>
  left.localeCompare(right, 'zh-CN', { sensitivity: 'base' });

const getSortValue = (item: KnowledgeDocument, sortBy: NonNullable<DocumentListQuery['sort_by']>): string | number => {
  if (sortBy === 'file_name') return item.file_name;
  if (sortBy === 'fragment_count') return item.fragment_count;
  if (sortBy === 'qa_count') return item.qa_count;
  return item.uploaded_at;
};

const sortDocuments = (items: KnowledgeDocument[], query: DocumentListQuery): KnowledgeDocument[] => {
  const sortBy = query.sort_by ?? 'uploaded_at';
  const order = query.order ?? 'desc';

  return [...items].sort((left, right) => {
    const leftValue = getSortValue(left, sortBy);
    const rightValue = getSortValue(right, sortBy);

    let result = 0;
    if (typeof leftValue === 'number' && typeof rightValue === 'number') {
      result = leftValue - rightValue;
    } else {
      result = compareText(String(leftValue), String(rightValue));
    }

    if (result === 0) {
      result = compareText(left.file_name, right.file_name);
    }

    return order === 'asc' ? result : -result;
  });
};

const filterDocuments = (query: DocumentListQuery): KnowledgeDocument[] => {
  const keyword = query.keyword?.trim().toLowerCase() ?? '';
  const fileType = query.file_type?.trim().toLowerCase() ?? '';
  const status = query.status ?? '';

  return mockDocuments.filter((item) => {
    if (keyword) {
      const searchable = `${item.file_name} ${item.uploaded_by} ${item.knowledge_base ?? ''}`.toLowerCase();
      if (!searchable.includes(keyword)) {
        return false;
      }
    }

    if (fileType && item.file_type.toLowerCase() !== fileType) {
      return false;
    }

    if (status && item.status !== status) {
      return false;
    }

    return true;
  });
};

const paginate = (items: KnowledgeDocument[], page: number, pageSize: number): PagedListResponse<KnowledgeDocument> => {
  const start = Math.max(0, (page - 1) * pageSize);
  const paged = items.slice(start, start + pageSize);

  return {
    items: paged,
    total: items.length,
    page,
    page_size: pageSize
  };
};

const inferFileType = (fileName: string): string => {
  const segments = fileName.split('.');
  if (segments.length <= 1) {
    return 'unknown';
  }
  return segments.pop()?.toLowerCase() ?? 'unknown';
};

const nextDocumentId = (): string => `doc_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
const nextTaskId = (): string => `task_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

const getCurrentUsername = (): string => localStorage.getItem(API_CONFIG.AUTH_USERNAME_KEY) || 'current-user';

const extractBaseName = (name: string): string => {
  const dot = name.lastIndexOf('.');
  return dot > 0 ? name.slice(0, dot) : name;
};

const cloneBatchTask = (task: InternalBatchTask): BatchSyncTaskStatus => ({
  task_id: task.task_id,
  status: task.status,
  queued_count: task.queued_count,
  processed_count: task.processed_count,
  success_count: task.success_count,
  failed_count: task.failed_count,
  message: task.message,
  started_at: task.started_at,
  finished_at: task.finished_at,
  failed_documents: [...task.failed_documents]
});

const asDocumentType = (value: unknown): DocumentType | undefined => {
  if (value === 'paper' || value === 'conference' || value === 'book' || value === 'manual' || value === 'code' || value === 'data') {
    return value;
  }
  return undefined;
};

export const getMockDocumentsSnapshot = (): KnowledgeDocument[] => mockDocuments.map((item) => ({ ...item }));

export const mockDocumentApi = {
  async getStats(): Promise<DocumentStats> {
    await wait(120);
    return buildStats();
  },

  async getList(query: DocumentListQuery): Promise<PagedListResponse<KnowledgeDocument>> {
    await wait(160);
    const page = query.page ?? 1;
    const pageSize = query.page_size ?? 20;
    const filtered = filterDocuments(query);
    const sorted = sortDocuments(filtered, query);
    return paginate(sorted, page, pageSize);
  },

  async uploadPair(payload: UploadDocumentPairPayload): Promise<UploadDocumentResult> {
    await wait(220);

    const fileBase = extractBaseName(payload.file.name);
    const csvBase = extractBaseName(payload.metadata_csv.name);
    if (fileBase !== csvBase) {
      throw mockHttpError(422, 'file and metadata_csv must share same basename');
    }

    if (!payload.metadata_csv.name.toLowerCase().endsWith('.csv')) {
      throw mockHttpError(422, 'metadata_csv must be a csv file');
    }

    const knowledgeBase = payload.knowledge_base?.trim() || 'default';
    const exists = mockDocuments.some((item) => item.file_name === payload.file.name && (item.knowledge_base ?? 'default') === knowledgeBase);
    if (exists) {
      throw mockHttpError(409, 'document already exists');
    }

    const syncMode = payload.upload_mode ?? 'sync';
    const syncStatus = syncMode === 'sync' ? 'synced' : 'sync_pending';
    const documentStatus: DocumentStatus = syncMode === 'sync' ? 'indexed' : 'processing';
    const documentType = asDocumentType(payload.document_type);

    const nextDocument: KnowledgeDocument = {
      document_id: nextDocumentId(),
      title: payload.title?.trim() || fileBase,
      file_name: payload.file.name,
      file_type: inferFileType(payload.file.name),
      file_size: payload.file.size,
      uploaded_at: new Date().toISOString(),
      uploaded_by: getCurrentUsername(),
      knowledge_base: knowledgeBase,
      status: documentStatus,
      fragment_count: 0,
      qa_count: 0,
      document_type: documentType
    };

    mockDocuments = [nextDocument, ...mockDocuments];

    return {
      document_id: nextDocument.document_id,
      title: nextDocument.title,
      file_name: nextDocument.file_name,
      document_type: documentType,
      knowledge_base: nextDocument.knowledge_base,
      status: syncStatus,
      fragment_count: 0,
      generated_pending_qas: 0,
      ingestion_task_id: nextTaskId(),
      sync_mode: syncMode,
      sync_status: syncStatus
    };
  },

  async startBatchSync(payload: BatchSyncStartPayload): Promise<BatchSyncTaskStatus> {
    await wait(150);

    const minBatchSize = payload.min_batch_size ?? 10;
    const maxDocs = payload.max_docs ?? 200;
    const includeFailed = payload.include_failed ?? true;

    const candidates = mockDocuments
      .filter((item) => item.status === 'processing' || (includeFailed && item.status === 'failed'))
      .slice(0, maxDocs)
      .map((item) => item.document_id);

    const taskId = nextTaskId();
    const now = new Date().toISOString();

    const task: InternalBatchTask = {
      task_id: taskId,
      status: candidates.length < minBatchSize ? 'skipped' : 'queued',
      queued_count: candidates.length,
      processed_count: 0,
      success_count: 0,
      failed_count: 0,
      message: candidates.length < minBatchSize ? 'skipped: queued count is below min_batch_size' : 'task queued',
      started_at: candidates.length < minBatchSize ? now : undefined,
      finished_at: candidates.length < minBatchSize ? now : undefined,
      failed_documents: [],
      candidate_ids: candidates,
      tick: 0
    };

    batchSyncTasks.set(taskId, task);
    return cloneBatchTask(task);
  },

  async getBatchSyncTask(taskId: string): Promise<BatchSyncTaskStatus> {
    await wait(110);
    const task = batchSyncTasks.get(taskId);
    if (!task) {
      throw mockHttpError(404, 'batch sync task not found');
    }

    if (task.status === 'queued') {
      task.status = 'running';
      task.started_at = new Date().toISOString();
      task.message = 'batch sync running';
      task.tick += 1;
      return cloneBatchTask(task);
    }

    if (task.status === 'running') {
      const failedDocuments: string[] = [];
      let successCount = 0;
      let failedCount = 0;

      for (const documentId of task.candidate_ids) {
        const documentItem = mockDocuments.find((item) => item.document_id === documentId);
        if (!documentItem) {
          failedDocuments.push(documentId);
          failedCount += 1;
          continue;
        }

        if (documentItem.file_name.toLowerCase().includes('fail')) {
          documentItem.status = 'failed';
          failedDocuments.push(documentId);
          failedCount += 1;
          continue;
        }

        documentItem.status = 'indexed';
        successCount += 1;
      }

      task.status = 'completed';
      task.processed_count = task.candidate_ids.length;
      task.success_count = successCount;
      task.failed_count = failedCount;
      task.failed_documents = failedDocuments;
      task.finished_at = new Date().toISOString();
      task.message = failedCount > 0 ? 'completed with partial failures' : 'completed';
      task.tick += 1;
    }

    return cloneBatchTask(task);
  },

  async startQaGeneration(payload: QAGenerationPayload): Promise<QAGenerationStartResult> {
    await wait(180);
    const targetCount = payload.target_count ?? 10;
    if (targetCount < 1 || targetCount > 100) {
      throw mockHttpError(422, 'target_count must be between 1 and 100');
    }

    const documentItem = mockDocuments.find((item) => item.document_id === payload.document_id);
    if (!documentItem) {
      throw mockHttpError(404, 'document not found');
    }

    const mode = payload.mode ?? 'append';
    if (mode === 'replace') {
      documentItem.qa_count = 0;
    }

    documentItem.qa_count += targetCount;
    if (documentItem.fragment_count === 0) {
      documentItem.fragment_count = Math.max(12, targetCount * 2);
    }
    documentItem.status = 'indexed';

    const now = new Date().toISOString();
    const taskId = nextTaskId();

    const task: IngestionTaskStatus = {
      id: taskId,
      document_id: payload.document_id,
      task_type: 'qa_generation',
      status: 'completed',
      stage: 'finished',
      created_by_user_id: 1,
      total_fragments: documentItem.fragment_count,
      total_generated_qas: targetCount,
      retry_count: 0,
      error_message: undefined,
      started_at: now,
      finished_at: now,
      created_at: now,
      updated_at: now
    };

    qaGenerationTasks.set(taskId, task);

    return {
      task_id: taskId,
      document_id: payload.document_id,
      status: 'completed',
      generated_qas: targetCount,
      message: 'qa generation completed'
    };
  },

  async getQaGenerationTask(taskId: string): Promise<IngestionTaskStatus> {
    await wait(100);
    const task = qaGenerationTasks.get(taskId);
    if (!task) {
      throw mockHttpError(404, 'qa generation task not found');
    }
    return { ...task };
  },

  async getDownloadUrl(documentId: string): Promise<string> {
    await wait(100);
    const target = mockDocuments.find((item) => item.document_id === documentId);
    if (!target) {
      throw mockHttpError(404, 'document not found');
    }

    const content = [
      `Mock download for ${target.file_name}`,
      `document_id=${target.document_id}`,
      `uploaded_by=${target.uploaded_by}`,
      `status=${target.status}`
    ].join('\n');

    return `data:text/plain;charset=utf-8,${encodeURIComponent(content)}`;
  },

  async getDetail(documentId: string): Promise<KnowledgeDocument> {
    await wait(100);
    const target = mockDocuments.find((item) => item.document_id === documentId);
    if (!target) {
      throw mockHttpError(404, 'document not found');
    }
    return { ...target };
  },

  async remove(documentId: string): Promise<void> {
    await wait(100);
    mockDocuments = mockDocuments.filter((item) => item.document_id !== documentId);
  }
};
