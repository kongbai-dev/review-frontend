import { API_CONFIG } from '@/config';
import type { PagedListResponse } from '@/types/api';
import type { DocumentListQuery, DocumentStats, DocumentStatus, KnowledgeDocument, UploadDocumentResult } from '@/types/domain';

const wait = async (ms: number): Promise<void> =>
  new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });

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
    qa_count: 57
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
    qa_count: 42
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
    qa_count: 0
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
    qa_count: 19
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
    qa_count: 6
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
    qa_count: 0
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
    qa_count: 92
  },
  {
    file_name: 'etch_recipe_summary.doc',
    file_type: 'doc',
    file_size: 532480,
    uploaded_at: '2026-03-18T14:40:00Z',
    uploaded_by: 'alice',
    knowledge_base: 'process',
    status: 'indexed',
    fragment_count: 28,
    qa_count: 14
  },
  {
    file_name: 'wafer_defect_catalog.pdf',
    file_type: 'pdf',
    file_size: 2258432,
    uploaded_at: '2026-03-17T10:22:00Z',
    uploaded_by: 'bob',
    knowledge_base: 'qa',
    status: 'indexed',
    fragment_count: 95,
    qa_count: 41
  },
  {
    file_name: 'sic_material_compare.md',
    file_type: 'md',
    file_size: 56321,
    uploaded_at: '2026-03-16T18:35:00Z',
    uploaded_by: 'carol',
    knowledge_base: 'research',
    status: 'indexed',
    fragment_count: 31,
    qa_count: 16
  },
  {
    file_name: 'yield_improvement_notes.txt',
    file_type: 'txt',
    file_size: 23841,
    uploaded_at: '2026-03-15T09:05:00Z',
    uploaded_by: 'david',
    knowledge_base: 'ops',
    status: 'processing',
    fragment_count: 18,
    qa_count: 0
  },
  {
    file_name: 'standard_cell_library.pdf',
    file_type: 'pdf',
    file_size: 1788928,
    uploaded_at: '2026-03-14T20:15:00Z',
    uploaded_by: 'erin',
    knowledge_base: 'design',
    status: 'indexed',
    fragment_count: 76,
    qa_count: 29
  },
  {
    file_name: 'esd_design_rules.docx',
    file_type: 'docx',
    file_size: 712704,
    uploaded_at: '2026-03-13T12:12:00Z',
    uploaded_by: 'frank',
    knowledge_base: 'design',
    status: 'indexed',
    fragment_count: 44,
    qa_count: 18
  },
  {
    file_name: 'advanced_packaging_intro.pdf',
    file_type: 'pdf',
    file_size: 2945024,
    uploaded_at: '2026-03-11T17:48:00Z',
    uploaded_by: 'alice',
    knowledge_base: 'default',
    status: 'indexed',
    fragment_count: 132,
    qa_count: 63
  }
];

let mockDocuments: KnowledgeDocument[] = seedDocuments.map((item, index) => ({
  document_id: `doc_${(index + 1).toString().padStart(4, '0')}`,
  ...item
}));

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

const nextDocumentId = (): string => `doc_${Date.now().toString(36)}`;

const getCurrentUsername = (): string => localStorage.getItem(API_CONFIG.AUTH_USERNAME_KEY) || 'current-user';

export const getMockDocumentsSnapshot = (): KnowledgeDocument[] => mockDocuments.map((item) => ({ ...item }));

export const mockDocumentApi = {
  async getStats(): Promise<DocumentStats> {
    await wait(140);
    return buildStats();
  },

  async getList(query: DocumentListQuery): Promise<PagedListResponse<KnowledgeDocument>> {
    await wait(180);
    const page = query.page ?? 1;
    const pageSize = query.page_size ?? 20;
    const filtered = filterDocuments(query);
    const sorted = sortDocuments(filtered, query);
    return paginate(sorted, page, pageSize);
  },

  async upload(file: File, knowledgeBase = 'default'): Promise<UploadDocumentResult> {
    await wait(240);

    if (file.name.toLowerCase().includes('fail')) {
      throw new Error('模拟上传失败: 文件名包含 fail');
    }

    const nextDocument: KnowledgeDocument = {
      document_id: nextDocumentId(),
      file_name: file.name,
      file_type: inferFileType(file.name),
      file_size: file.size,
      uploaded_at: new Date().toISOString(),
      uploaded_by: getCurrentUsername(),
      knowledge_base: knowledgeBase,
      status: 'processing',
      fragment_count: 0,
      qa_count: 0
    };

    mockDocuments = [nextDocument, ...mockDocuments];

    return {
      document_id: nextDocument.document_id,
      file_name: nextDocument.file_name,
      status: nextDocument.status
    };
  },

  async getDownloadUrl(documentId: string): Promise<string> {
    await wait(120);
    const target = mockDocuments.find((item) => item.document_id === documentId);
    if (!target) {
      throw new Error('文档不存在');
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
    await wait(120);
    const target = mockDocuments.find((item) => item.document_id === documentId);
    if (!target) {
      throw new Error('文档不存在');
    }
    return { ...target };
  },

  async remove(documentId: string): Promise<void> {
    await wait(120);
    mockDocuments = mockDocuments.filter((item) => item.document_id !== documentId);
  }
};
