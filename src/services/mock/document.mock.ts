import { API_CONFIG } from '@/config';
import { sleep } from '@/lib/async';
import type { PagedListResponse } from '@/types/api';
import type {
  BatchSyncSkippedDocument,
  BatchSyncStartPayload,
  BatchSyncTaskStatus,
  BatchUploadRequestPayload,
  BatchUploadResponse,
  DocumentListQuery,
  DocumentStats,
  DocumentStatus,
  DocumentType,
  IngestionTaskStatus,
  KnowledgeDocument,
  QAGenerationPayload,
  QAGenerationStartResult,
  UploadDocumentResult,
  UploadSessionSummary,
  UploadSyncDocumentPayload
} from '@/types/domain';

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
    file_name: 'layout_drc_cases_fail.pdf',
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

interface MockCsvEntry {
  file_name: string;
  base_name: string;
  parse_status: string;
  parse_error?: string;
}

interface MockUploadSession {
  session_id: string;
  status: 'open' | 'closed';
  knowledge_base: string;
  document_ids: string[];
  csv_entries: MockCsvEntry[];
  created_at: string;
  updated_at: string;
}

interface InternalBatchTask extends BatchSyncTaskStatus {
  candidate_ids: string[];
  tick: number;
}

let mockDocuments: KnowledgeDocument[] = seedDocuments.map((item, index) => ({
  document_id: `doc_${(index + 1).toString().padStart(4, '0')}`,
  ...item,
  sync_mode: 'sync',
  sync_status: item.status === 'failed' ? 'sync_failed' : 'synced',
  pair_status: 'paired',
  object_key: `raw-docs/${item.knowledge_base}/${item.file_name}`
}));

const openSessionsByKnowledgeBase = new Map<string, MockUploadSession>();
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
  const knowledgeBase = query.knowledge_base?.trim().toLowerCase() ?? '';

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

    if (knowledgeBase && (item.knowledge_base ?? '').toLowerCase() !== knowledgeBase) {
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

const extractBaseName = (name: string): string => {
  const dot = name.lastIndexOf('.');
  return dot > 0 ? name.slice(0, dot).toLowerCase() : name.toLowerCase();
};

const buildObjectKey = (knowledgeBase: string, fileName: string): string =>
  `raw-docs/${knowledgeBase.trim() || 'default'}/${fileName}`;

const nextDocumentId = (): string => `doc_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
const nextTaskId = (): string => `task_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
const nextSessionId = (): string => `sess_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

const getCurrentUsername = (): string => localStorage.getItem(API_CONFIG.AUTH_USERNAME_KEY) || 'current-user';

const asDocumentType = (value: unknown): DocumentType | undefined => {
  if (value === 'paper' || value === 'conference' || value === 'book' || value === 'manual' || value === 'code' || value === 'data') {
    return value;
  }
  return undefined;
};

const getOrCreateOpenSession = (knowledgeBase: string): MockUploadSession => {
  const normalized = knowledgeBase.trim() || 'default';
  const existing = openSessionsByKnowledgeBase.get(normalized);
  if (existing) {
    return existing;
  }

  const now = new Date().toISOString();
  const session: MockUploadSession = {
    session_id: nextSessionId(),
    status: 'open',
    knowledge_base: normalized,
    document_ids: [],
    csv_entries: [],
    created_at: now,
    updated_at: now
  };

  openSessionsByKnowledgeBase.set(normalized, session);
  return session;
};

const findOpenSession = (knowledgeBase: string): MockUploadSession | undefined => {
  const normalized = knowledgeBase.trim() || 'default';
  return openSessionsByKnowledgeBase.get(normalized);
};

const recomputePairing = (session: MockUploadSession): void => {
  const validCsvByBase = new Map<string, MockCsvEntry[]>();
  const invalidCsvByBase = new Map<string, MockCsvEntry[]>();

  for (const csv of session.csv_entries) {
    const targetMap = csv.parse_status === 'stored' ? validCsvByBase : invalidCsvByBase;
    const bucket = targetMap.get(csv.base_name) ?? [];
    bucket.push(csv);
    targetMap.set(csv.base_name, bucket);
  }

  session.document_ids = session.document_ids.filter((documentId) =>
    mockDocuments.some((item) => item.document_id === documentId)
  );

  for (const documentId of session.document_ids) {
    const documentItem = mockDocuments.find((item) => item.document_id === documentId);
    if (!documentItem) {
      continue;
    }

    const baseName = extractBaseName(documentItem.file_name);
    const validMatches = validCsvByBase.get(baseName) ?? [];
    const invalidMatches = invalidCsvByBase.get(baseName) ?? [];

    if (validMatches.length === 1) {
      documentItem.pair_status = 'paired';
      documentItem.pair_error = undefined;
      documentItem.csv_file_name = validMatches[0].file_name;
      continue;
    }

    if (validMatches.length > 1) {
      documentItem.pair_status = 'ambiguous_pair';
      documentItem.pair_error = 'multiple csv files matched this document';
      documentItem.csv_file_name = undefined;
      continue;
    }

    if (invalidMatches.length > 0) {
      documentItem.pair_status = 'invalid_csv';
      documentItem.pair_error = invalidMatches[0].parse_error || 'matched csv is invalid';
      documentItem.csv_file_name = invalidMatches[0].file_name;
      continue;
    }

    documentItem.pair_status = 'missing_csv';
    documentItem.pair_error = 'metadata csv not found';
    documentItem.csv_file_name = undefined;
  }

  session.updated_at = new Date().toISOString();
};

const buildSessionSummary = (session: MockUploadSession | undefined, knowledgeBase: string): UploadSessionSummary => {
  if (!session) {
    return {
      knowledge_base: knowledgeBase,
      doc_file_count: 0,
      csv_file_count: 0,
      paired_count: 0,
      unpaired_count: 0,
      unmatched_documents: [],
      orphan_csv_files: []
    };
  }

  recomputePairing(session);

  const docsInSession = session.document_ids
    .map((documentId) => mockDocuments.find((item) => item.document_id === documentId))
    .filter((item): item is KnowledgeDocument => Boolean(item));

  const unmatchedDocuments = docsInSession
    .filter((item) => item.pair_status !== 'paired')
    .map((item) => ({
      document_id: item.document_id,
      file_name: item.file_name,
      pair_status: item.pair_status ?? 'pending_pair',
      pair_error: item.pair_error
    }));

  const docBaseNames = new Set(docsInSession.map((item) => extractBaseName(item.file_name)));

  const orphanCsvFiles = session.csv_entries
    .filter((csvItem) => csvItem.parse_status !== 'stored' || !docBaseNames.has(csvItem.base_name))
    .map((csvItem) => ({
      file_name: csvItem.file_name,
      parse_status: csvItem.parse_status,
      parse_error: csvItem.parse_error
    }));

  const pairedCount = docsInSession.filter((item) => item.pair_status === 'paired').length;

  return {
    session_id: session.session_id,
    status: session.status,
    knowledge_base: session.knowledge_base,
    doc_file_count: docsInSession.length,
    csv_file_count: session.csv_entries.length,
    paired_count: pairedCount,
    unpaired_count: docsInSession.length - pairedCount,
    unmatched_documents: unmatchedDocuments,
    orphan_csv_files: orphanCsvFiles
  };
};

const cloneBatchTask = (task: InternalBatchTask): BatchSyncTaskStatus => ({
  task_id: task.task_id,
  status: task.status,
  session_id: task.session_id,
  queued_count: task.queued_count,
  processed_count: task.processed_count,
  success_count: task.success_count,
  failed_count: task.failed_count,
  skipped_count: task.skipped_count,
  message: task.message,
  started_at: task.started_at,
  finished_at: task.finished_at,
  failed_documents: [...task.failed_documents],
  skipped_documents: task.skipped_documents.map((item) => ({ ...item }))
});

const refreshPairingForKnowledgeBase = (knowledgeBase: string): void => {
  const session = findOpenSession(knowledgeBase);
  if (!session) {
    return;
  }
  recomputePairing(session);
};

export const getMockDocumentsSnapshot = (): KnowledgeDocument[] => mockDocuments.map((item) => ({ ...item }));

export const mockDocumentApi = {
  async getStats(): Promise<DocumentStats> {
    await sleep(120);
    return buildStats();
  },

  async getList(query: DocumentListQuery): Promise<PagedListResponse<KnowledgeDocument>> {
    await sleep(160);
    const page = query.page ?? 1;
    const pageSize = query.page_size ?? 20;
    const filtered = filterDocuments(query);
    const sorted = sortDocuments(filtered, query);
    return paginate(sorted, page, pageSize);
  },

  async uploadSyncDocument(payload: UploadSyncDocumentPayload): Promise<UploadDocumentResult> {
    await sleep(220);

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
      status: 'indexed',
      fragment_count: 0,
      qa_count: 0,
      document_type: documentType,
      sync_mode: 'sync',
      sync_status: 'synced',
      pair_status: 'paired',
      csv_file_name: payload.metadata_csv.name,
      object_key: buildObjectKey(knowledgeBase, payload.file.name),
      local_file_path: `knowledge_data/${payload.subdir?.trim() ? `${payload.subdir.trim()}/` : ''}${payload.file.name}`,
      local_csv_path: `knowledge_data/${payload.subdir?.trim() ? `${payload.subdir.trim()}/` : ''}${payload.metadata_csv.name}`
    };

    mockDocuments = [nextDocument, ...mockDocuments];

      return {
        document_id: nextDocument.document_id,
        title: nextDocument.title,
        file_name: nextDocument.file_name,
        document_type: documentType,
        knowledge_base: nextDocument.knowledge_base,
        object_key: nextDocument.object_key,
        status: 'synced',
        fragment_count: 0,
        generated_pending_qas: 0,
        ingestion_task_id: nextTaskId(),
      sync_mode: 'sync',
      sync_status: 'synced'
    };
  },

  async batchUploadDocFiles(payload: BatchUploadRequestPayload): Promise<BatchUploadResponse> {
    await sleep(220);

    const knowledgeBase = payload.knowledge_base?.trim() || 'default';
    const session = getOrCreateOpenSession(knowledgeBase);

    const items: BatchUploadResponse['items'] = [];
    let acceptedCount = 0;
    let rejectedCount = 0;

    for (const file of payload.files) {
      const fileType = inferFileType(file.name);
      if (fileType === 'csv') {
        items.push({
          file_name: file.name,
          status: 'rejected',
          message: 'doc-files endpoint does not accept csv files'
        });
        rejectedCount += 1;
        continue;
      }

      const exists = mockDocuments.some((item) => item.file_name === file.name && (item.knowledge_base ?? 'default') === knowledgeBase);
      if (exists) {
        items.push({
          file_name: file.name,
          status: 'duplicate',
          message: 'document already exists in this knowledge base'
        });
        rejectedCount += 1;
        continue;
      }

      const nextDocument: KnowledgeDocument = {
        document_id: nextDocumentId(),
        title: extractBaseName(file.name),
        file_name: file.name,
        file_type: fileType,
        file_size: file.size,
        uploaded_at: new Date().toISOString(),
        uploaded_by: getCurrentUsername(),
        knowledge_base: knowledgeBase,
        status: 'processing',
        fragment_count: 0,
        qa_count: 0,
        sync_mode: 'batch',
        sync_status: 'sync_pending',
        upload_session_id: session.session_id,
        pair_status: 'missing_csv',
        pair_error: 'metadata csv not found',
        object_key: buildObjectKey(knowledgeBase, file.name),
        local_file_path: `knowledge_data/docs/${session.session_id}/${file.name}`
      };

      mockDocuments = [nextDocument, ...mockDocuments];
      session.document_ids.push(nextDocument.document_id);

      items.push({
        file_name: file.name,
        status: 'stored',
        document_id: nextDocument.document_id
      });
      acceptedCount += 1;
    }

    const summary = buildSessionSummary(session, knowledgeBase);

    return {
      session_id: session.session_id,
      knowledge_base: knowledgeBase,
      total_files: payload.files.length,
      accepted_count: acceptedCount,
      rejected_count: rejectedCount,
      items,
      paired_count: summary.paired_count,
      unpaired_count: summary.unpaired_count
    };
  },

  async batchUploadCsvFiles(payload: BatchUploadRequestPayload): Promise<BatchUploadResponse> {
    await sleep(220);

    const knowledgeBase = payload.knowledge_base?.trim() || 'default';
    const session = getOrCreateOpenSession(knowledgeBase);

    const items: BatchUploadResponse['items'] = [];
    let acceptedCount = 0;
    let rejectedCount = 0;

    for (const file of payload.files) {
      if (!file.name.toLowerCase().endsWith('.csv')) {
        items.push({
          file_name: file.name,
          status: 'rejected',
          message: 'csv-files endpoint only accepts .csv files'
        });
        rejectedCount += 1;
        continue;
      }

      if (session.csv_entries.some((entry) => entry.file_name === file.name)) {
        items.push({
          file_name: file.name,
          status: 'duplicate',
          message: 'csv already uploaded in current session'
        });
        rejectedCount += 1;
        continue;
      }

      const baseName = extractBaseName(file.name);
      const parseStatus = file.name.toLowerCase().includes('invalid') ? 'invalid' : 'stored';
      const parseError = parseStatus === 'invalid' ? 'csv validation failed: missing required columns' : undefined;

      session.csv_entries.push({
        file_name: file.name,
        base_name: baseName,
        parse_status: parseStatus,
        parse_error: parseError
      });

      if (parseStatus === 'stored') {
        items.push({
          file_name: file.name,
          status: 'stored'
        });
        acceptedCount += 1;
      } else {
        items.push({
          file_name: file.name,
          status: 'invalid',
          message: parseError
        });
        rejectedCount += 1;
      }
    }

    const summary = buildSessionSummary(session, knowledgeBase);

    return {
      session_id: session.session_id,
      knowledge_base: knowledgeBase,
      total_files: payload.files.length,
      accepted_count: acceptedCount,
      rejected_count: rejectedCount,
      items,
      paired_count: summary.paired_count,
      unpaired_count: summary.unpaired_count
    };
  },

  async getCurrentBatchSession(knowledgeBase: string): Promise<UploadSessionSummary> {
    await sleep(120);
    const normalized = knowledgeBase.trim() || 'default';
    const session = findOpenSession(normalized);
    return buildSessionSummary(session, normalized);
  },

  async startBatchSync(payload: BatchSyncStartPayload): Promise<BatchSyncTaskStatus> {
    await sleep(150);

    const knowledgeBase = payload.knowledge_base?.trim() || 'default';
    const session = findOpenSession(knowledgeBase);
    const summary = buildSessionSummary(session, knowledgeBase);

    if (payload.strict_pairing && summary.unpaired_count > 0) {
      throw mockHttpError(422, 'strict_pairing is enabled and unpaired documents exist in current session');
    }

    const minBatchSize = payload.min_batch_size ?? 10;
    const maxDocs = payload.max_docs ?? 200;
    const includeFailed = payload.include_failed ?? true;

    const docsInSession = session
      ? session.document_ids
          .map((documentId) => mockDocuments.find((item) => item.document_id === documentId))
          .filter((item): item is KnowledgeDocument => Boolean(item))
      : [];

    const pairedDocs = docsInSession.filter((item) => item.pair_status === 'paired');

    const candidates = pairedDocs
      .filter((item) => includeFailed || item.status !== 'failed')
      .slice(0, maxDocs)
      .map((item) => item.document_id);

    const skippedDocuments: BatchSyncSkippedDocument[] = [];

    if (!payload.strict_pairing) {
      for (const doc of docsInSession.filter((item) => item.pair_status !== 'paired')) {
        skippedDocuments.push({
          document_id: doc.document_id,
          file_name: doc.file_name,
          reason: doc.pair_error || `pair_status=${doc.pair_status ?? 'unknown'}`
        });
      }
    }

    if (!includeFailed) {
      for (const doc of pairedDocs.filter((item) => item.status === 'failed')) {
        skippedDocuments.push({
          document_id: doc.document_id,
          file_name: doc.file_name,
          reason: 'failed documents are excluded when include_failed=false'
        });
      }
    }

    const taskId = nextTaskId();
    const now = new Date().toISOString();

    const task: InternalBatchTask = {
      task_id: taskId,
      status: candidates.length < minBatchSize ? 'skipped' : 'queued',
      session_id: session?.session_id,
      queued_count: candidates.length,
      processed_count: 0,
      success_count: 0,
      failed_count: 0,
      skipped_count: skippedDocuments.length,
      message: candidates.length < minBatchSize ? 'skipped: queued count is below min_batch_size' : 'task queued',
      started_at: candidates.length < minBatchSize ? now : undefined,
      finished_at: candidates.length < minBatchSize ? now : undefined,
      failed_documents: [],
      skipped_documents: skippedDocuments,
      candidate_ids: candidates,
      tick: 0
    };

    batchSyncTasks.set(taskId, task);
    return cloneBatchTask(task);
  },

  async getBatchSyncTask(taskId: string): Promise<BatchSyncTaskStatus> {
    await sleep(110);
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
          documentItem.sync_status = 'sync_failed';
          documentItem.latest_task_status = 'failed';
          failedDocuments.push(documentId);
          failedCount += 1;
          continue;
        }

        documentItem.status = 'indexed';
        documentItem.sync_status = 'synced';
        documentItem.latest_task_status = 'completed';
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

      const targetSession = Array.from(openSessionsByKnowledgeBase.values()).find((item) => item.session_id === task.session_id);
      if (targetSession) {
        refreshPairingForKnowledgeBase(targetSession.knowledge_base);
      }
    }

    return cloneBatchTask(task);
  },

  async startQaGeneration(payload: QAGenerationPayload): Promise<QAGenerationStartResult> {
    await sleep(180);
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
    await sleep(100);
    const task = qaGenerationTasks.get(taskId);
    if (!task) {
      throw mockHttpError(404, 'qa generation task not found');
    }
    return { ...task };
  },

  async getDownloadUrl(documentId: string): Promise<string> {
    await sleep(100);
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
  }
};

