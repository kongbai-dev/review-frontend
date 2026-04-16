import { isAxiosError } from 'axios';
import { API_CONFIG } from '@/config';
import { expectNumber, expectOptionalString, expectString, expectStringArray, isObject } from '@/lib/contract';
import { http } from '@/services/http';
import type { ListResponse } from '@/types/api';
import type { AssignPayload, CreateQAPayload, Fragment, QADetail, QAPair, QAStats, QAStatus, ReviewPayload } from '@/types/domain';

const DEFAULT_LIMIT = 20;

let qaMockApiPromise: Promise<typeof import('@/services/mock/review.mock').mockQaApi> | null = null;

const getQaMockApi = async (): Promise<typeof import('@/services/mock/review.mock').mockQaApi> => {
  if (!qaMockApiPromise) {
    qaMockApiPromise = import('@/services/mock/review.mock').then((module) => module.mockQaApi);
  }
  return qaMockApiPromise;
};

const expectStatus = (value: unknown, path: string): QAStatus => {
  const text = expectString(value, path);
  if (text === 'pending' || text === 'reviewed' || text === 'deprecated') {
    return text;
  }
  throw new Error(`Contract mismatch: ${path} has invalid status`);
};

const extractId = (raw: Record<string, unknown>, path: string): string => {
  const fromId = raw.id;
  if (typeof fromId === 'string' && fromId.trim()) {
    return fromId;
  }

  const fromPairId = raw.qa_pair_id;
  if (typeof fromPairId === 'string' && fromPairId.trim()) {
    return fromPairId;
  }

  throw new Error(`Contract mismatch: ${path}.id or ${path}.qa_pair_id is required`);
};

const parseFragment = (raw: unknown, index: number): Fragment => {
  if (!isObject(raw)) {
    throw new Error(`Contract mismatch: fragments[${index}] must be object`);
  }

  return {
    id: extractId(raw, `fragments[${index}]`),
    fragment_type: expectString(raw.fragment_type, `fragments[${index}].fragment_type`) as Fragment['fragment_type'],
    content: expectString(raw.content, `fragments[${index}].content`),
    page_start: raw.page_start === undefined || raw.page_start === null ? undefined : expectNumber(raw.page_start, `fragments[${index}].page_start`),
    page_end: raw.page_end === undefined || raw.page_end === null ? undefined : expectNumber(raw.page_end, `fragments[${index}].page_end`),
    source: expectOptionalString(raw.source, `fragments[${index}].source`)
  };
};

const parseQAPair = (raw: unknown, path = 'item'): QAPair => {
  if (!isObject(raw)) {
    throw new Error(`Contract mismatch: ${path} must be object`);
  }

  const assignee = expectOptionalString(raw.assignee, `${path}.assignee`);
  const reviewer = expectOptionalString(raw.reviewer, `${path}.reviewer`);

  return {
    id: extractId(raw, path),
    question: expectString(raw.question, `${path}.question`),
    answer: expectString(raw.answer, `${path}.answer`),
    topics: expectStringArray(raw.topics, `${path}.topics`),
    scenes: expectStringArray(raw.scenes, `${path}.scenes`),
    confidence: expectNumber(raw.confidence, `${path}.confidence`),
    status: expectStatus(raw.status, `${path}.status`),
    assignee,
    reviewer: assignee ?? reviewer,
    reviewed_at: expectOptionalString(raw.reviewed_at, `${path}.reviewed_at`),
    review_notes: expectOptionalString(raw.review_notes, `${path}.review_notes`),
    version: raw.version === undefined || raw.version === null ? 1 : expectNumber(raw.version, `${path}.version`)
  };
};

const parseListResponse = (raw: unknown, endpoint: string, itemPath: string): ListResponse<QAPair> => {
  if (Array.isArray(raw)) {
    return {
      items: raw.map((item, index) => parseQAPair(item, `${itemPath}[${index}]`)),
      total: raw.length
    };
  }

  if (!isObject(raw) || !Array.isArray(raw.items)) {
    throw new Error(`Contract mismatch: ${endpoint} must return array or { items, total }`);
  }

  return {
    items: raw.items.map((item, index) => parseQAPair(item, `${itemPath}[${index}]`)),
    total: raw.total === undefined ? raw.items.length : expectNumber(raw.total, `${itemPath}.total`)
  };
};

const parseDetailResponse = (raw: unknown): QADetail => {
  const qa = parseQAPair(raw, 'detail');
  if (!isObject(raw) || !Array.isArray(raw.fragments)) {
    throw new Error('Contract mismatch: detail.fragments must be array');
  }

  return {
    ...qa,
    fragments: raw.fragments.map((item, index) => parseFragment(item, index))
  };
};

const parseStatsResponse = (raw: unknown): QAStats => {
  if (!isObject(raw)) {
    throw new Error('Contract mismatch: GET /qa-pairs/stats must return object');
  }

  return {
    pending: expectNumber(raw.pending, 'stats.pending'),
    reviewed: expectNumber(raw.reviewed, 'stats.reviewed'),
    deprecated: raw.deprecated === undefined ? 0 : expectNumber(raw.deprecated, 'stats.deprecated')
  };
};

const extractVersionConflictMessage = (error: unknown): string | null => {
  if (!isAxiosError(error) || error.response?.status !== 409) {
    return null;
  }

  const payload = error.response.data;
  if (!isObject(payload)) {
    return 'Version conflict: data has been updated by someone else';
  }

  const detail = payload.detail;
  if (!isObject(detail)) {
    return 'Version conflict: data has been updated by someone else';
  }

  const currentVersion = detail.current_version;
  if (typeof currentVersion === 'number') {
    return `Version conflict: current version is ${currentVersion}. Please refresh and retry.`;
  }

  return 'Version conflict: data has been updated by someone else';
};

const buildReviewPayload = (payload: ReviewPayload): ReviewPayload & { assignee?: string } => ({
  question: payload.question,
  answer: payload.answer,
  topics: payload.topics,
  scenes: payload.scenes,
  confidence: payload.confidence,
  review_notes: payload.review_notes,
  status: payload.status,
  version: payload.version,
  assignee: payload.assignee ?? payload.reviewer
});

const fetchQaList = async (params: Record<string, string | number>): Promise<ListResponse<QAPair>> => {
  const response = await http.get<unknown>(API_CONFIG.ENDPOINTS.QA_PAIRS, { params });
  return parseListResponse(response.data, 'GET /qa-pairs', 'qa_pairs');
};

const parseHistory = (reviewed: QAPair[], deprecated: QAPair[], limit: number): QAPair[] => {
  return [...reviewed, ...deprecated]
    .sort((left, right) => {
      const leftTime = left.reviewed_at ?? '';
      const rightTime = right.reviewed_at ?? '';
      return rightTime.localeCompare(leftTime);
    })
    .slice(0, limit);
};

export const qaApi = {
  async getPending(limit = DEFAULT_LIMIT): Promise<QAPair[]> {
    if (API_CONFIG.USE_MOCK) {
      const mockQaApi = await getQaMockApi();
      return mockQaApi.getPending(limit);
    }

    const list = await fetchQaList({
      status: 'pending',
      page: 1,
      page_size: limit,
      sort_by: 'updated_at',
      order: 'desc'
    });

    return list.items;
  },

  async getDetail(id: string): Promise<QADetail> {
    if (API_CONFIG.USE_MOCK) {
      const mockQaApi = await getQaMockApi();
      return mockQaApi.getDetail(id);
    }

    const response = await http.get<unknown>(API_CONFIG.ENDPOINTS.QA_RESOURCE(id));
    return parseDetailResponse(response.data);
  },

  async review(id: string, payload: ReviewPayload): Promise<QADetail> {
    if (API_CONFIG.USE_MOCK) {
      const mockQaApi = await getQaMockApi();
      return mockQaApi.review(id, payload);
    }

    try {
      const response = await http.put<unknown>(API_CONFIG.ENDPOINTS.QA_RESOURCE(id), buildReviewPayload(payload));
      return parseDetailResponse(response.data);
    } catch (error) {
      const conflictMessage = extractVersionConflictMessage(error);
      if (conflictMessage) {
        throw new Error(conflictMessage);
      }
      throw error;
    }
  },

  async assign(payload: AssignPayload): Promise<void> {
    if (API_CONFIG.USE_MOCK) {
      const mockQaApi = await getQaMockApi();
      await mockQaApi.assign(payload);
      return;
    }

    await http.post(API_CONFIG.ENDPOINTS.QA_ASSIGNMENTS, payload);
  },

  async stats(): Promise<QAStats> {
    if (API_CONFIG.USE_MOCK) {
      const mockQaApi = await getQaMockApi();
      return mockQaApi.stats();
    }

    const response = await http.get<unknown>(API_CONFIG.ENDPOINTS.QA_STATS);
    return parseStatsResponse(response.data);
  },

  async history(limit = DEFAULT_LIMIT): Promise<QAPair[]> {
    if (API_CONFIG.USE_MOCK) {
      const mockQaApi = await getQaMockApi();
      return mockQaApi.history(limit);
    }

    const [reviewed, deprecated] = await Promise.all([
      fetchQaList({ status: 'reviewed', page: 1, page_size: limit, sort_by: 'reviewed_at', order: 'desc' }),
      fetchQaList({ status: 'deprecated', page: 1, page_size: limit, sort_by: 'reviewed_at', order: 'desc' })
    ]);

    return parseHistory(reviewed.items, deprecated.items, limit);
  },

  async create(payload: CreateQAPayload): Promise<QADetail> {
    if (API_CONFIG.USE_MOCK) {
      const mockQaApi = await getQaMockApi();
      return mockQaApi.create(payload);
    }

    if (!API_CONFIG.ENDPOINTS.QA_CREATE) {
      throw new Error('Backend has not enabled manual create QA endpoint. Set VITE_QA_CREATE_ENDPOINT to enable it.');
    }

    const response = await http.post<unknown>(API_CONFIG.ENDPOINTS.QA_CREATE, payload);
    return parseDetailResponse(response.data);
  }
};
