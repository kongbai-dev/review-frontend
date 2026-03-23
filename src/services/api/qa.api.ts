import { API_CONFIG } from '@/config';
import { http } from '@/services/http';
import { mockQaApi } from '@/services/mock/review.mock';
import type { ListResponse } from '@/types/api';
import type { AssignPayload, CreateQAPayload, Fragment, QADetail, QAPair, QAStats, QAStatus, ReviewPayload } from '@/types/domain';

const DEFAULT_LIMIT = 20;

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const expectString = (value: unknown, path: string): string => {
  if (typeof value !== 'string') {
    throw new Error(`接口契约不匹配: ${path} 应为 string`);
  }
  return value;
};

const expectOptionalString = (value: unknown): string | undefined => {
  if (value === undefined || value === null) {
    return undefined;
  }
  if (typeof value !== 'string') {
    throw new Error('接口契约不匹配: 可选字符串字段类型错误');
  }
  return value;
};

const expectNumber = (value: unknown, path: string): number => {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    throw new Error(`接口契约不匹配: ${path} 应为 number`);
  }
  return value;
};

const expectStringArray = (value: unknown, path: string): string[] => {
  if (!Array.isArray(value) || value.some((item) => typeof item !== 'string')) {
    throw new Error(`接口契约不匹配: ${path} 应为 string[]`);
  }
  return value;
};

const expectStatus = (value: unknown, path: string): QAStatus => {
  const text = expectString(value, path);
  if (text === 'pending' || text === 'reviewed' || text === 'deprecated') {
    return text;
  }
  throw new Error(`接口契约不匹配: ${path} 状态值非法`);
};

const parseFragment = (raw: unknown, index: number): Fragment => {
  if (!isObject(raw)) {
    throw new Error(`接口契约不匹配: fragments[${index}] 应为对象`);
  }

  return {
    id: expectString(raw.id, `fragments[${index}].id`),
    fragment_type: expectString(raw.fragment_type, `fragments[${index}].fragment_type`) as Fragment['fragment_type'],
    content: expectString(raw.content, `fragments[${index}].content`),
    page_start: raw.page_start === undefined || raw.page_start === null ? undefined : expectNumber(raw.page_start, `fragments[${index}].page_start`),
    page_end: raw.page_end === undefined || raw.page_end === null ? undefined : expectNumber(raw.page_end, `fragments[${index}].page_end`),
    source: expectOptionalString(raw.source)
  };
};

const parseQAPair = (raw: unknown, path = 'item'): QAPair => {
  if (!isObject(raw)) {
    throw new Error(`接口契约不匹配: ${path} 应为对象`);
  }

  return {
    id: expectString(raw.id, `${path}.id`),
    question: expectString(raw.question, `${path}.question`),
    answer: expectString(raw.answer, `${path}.answer`),
    topics: expectStringArray(raw.topics, `${path}.topics`),
    scenes: expectStringArray(raw.scenes, `${path}.scenes`),
    confidence: expectNumber(raw.confidence, `${path}.confidence`),
    status: expectStatus(raw.status, `${path}.status`),
    reviewer: expectOptionalString(raw.reviewer),
    reviewed_at: expectOptionalString(raw.reviewed_at),
    review_notes: expectOptionalString(raw.review_notes),
    version: expectNumber(raw.version, `${path}.version`)
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
    throw new Error(`接口契约不匹配: ${endpoint} 响应应为数组或 { items, total }`);
  }

  return {
    items: raw.items.map((item, index) => parseQAPair(item, `${itemPath}[${index}]`)),
    total: raw.total === undefined ? raw.items.length : expectNumber(raw.total, `${itemPath}.total`)
  };
};

const parsePendingResponse = (raw: unknown): QAPair[] => {
  return parseListResponse(raw, 'GET /qa/pending', 'pending').items;
};

const parseDetailResponse = (raw: unknown): QADetail => {
  const qa = parseQAPair(raw, 'detail');
  if (!isObject(raw) || !Array.isArray(raw.fragments)) {
    throw new Error('接口契约不匹配: detail.fragments 应为数组');
  }

  return {
    ...qa,
    fragments: raw.fragments.map((item, index) => parseFragment(item, index))
  };
};

const parseStatsResponse = (raw: unknown): QAStats => {
  if (!isObject(raw)) {
    throw new Error('接口契约不匹配: GET /qa/stats 响应应为对象');
  }

  return {
    pending: expectNumber(raw.pending, 'stats.pending'),
    reviewed: expectNumber(raw.reviewed, 'stats.reviewed'),
    deprecated: raw.deprecated === undefined ? 0 : expectNumber(raw.deprecated, 'stats.deprecated')
  };
};

const parseHistoryResponse = (raw: unknown): QAPair[] => {
  return parseListResponse(raw, 'GET /qa-pairs', 'history').items;
};

export const qaApi = {
  async getPending(limit = DEFAULT_LIMIT): Promise<QAPair[]> {
    if (API_CONFIG.USE_MOCK) {
      return mockQaApi.getPending(limit);
    }

    const response = await http.get<unknown>(API_CONFIG.ENDPOINTS.QA_PENDING, {
      params: { limit }
    });
    return parsePendingResponse(response.data);
  },

  async getDetail(id: string): Promise<QADetail> {
    if (API_CONFIG.USE_MOCK) {
      return mockQaApi.getDetail(id);
    }
    const response = await http.get<unknown>(API_CONFIG.ENDPOINTS.QA_RESOURCE(id));
    return parseDetailResponse(response.data);
  },

  async review(id: string, payload: ReviewPayload): Promise<QADetail> {
    if (API_CONFIG.USE_MOCK) {
      return mockQaApi.review(id, payload);
    }
    const response = await http.put<unknown>(API_CONFIG.ENDPOINTS.QA_RESOURCE(id), payload);
    return parseDetailResponse(response.data);
  },

  async assign(payload: AssignPayload): Promise<void> {
    if (API_CONFIG.USE_MOCK) {
      await mockQaApi.assign(payload);
      return;
    }

    for (const qaId of payload.qa_ids) {
      const current = await this.getDetail(qaId);
      const updatePayload: ReviewPayload = {
        question: current.question,
        answer: current.answer,
        topics: current.topics,
        scenes: current.scenes,
        confidence: current.confidence,
        review_notes: current.review_notes || '任务分配更新',
        status: 'pending',
        version: current.version,
        reviewer: payload.assignee
      };
      await this.review(qaId, updatePayload);
    }
  },

  async stats(): Promise<QAStats> {
    if (API_CONFIG.USE_MOCK) {
      return mockQaApi.stats();
    }
    const response = await http.get<unknown>(API_CONFIG.ENDPOINTS.QA_STATS);
    return parseStatsResponse(response.data);
  },

  async history(limit = DEFAULT_LIMIT): Promise<QAPair[]> {
    if (API_CONFIG.USE_MOCK) {
      return mockQaApi.history(limit);
    }
    const response = await http.get<unknown>(API_CONFIG.ENDPOINTS.QA_PAIRS, {
      params: { page: 1, page_size: limit }
    });
    return parseHistoryResponse(response.data);
  },

  async create(payload: CreateQAPayload): Promise<QADetail> {
    if (API_CONFIG.USE_MOCK) {
      return mockQaApi.create(payload);
    }

    if (!API_CONFIG.ENDPOINTS.QA_CREATE) {
      throw new Error('当前后端未配置人工新增问答对接口，请在 .env 中设置 VITE_QA_CREATE_ENDPOINT');
    }

    const response = await http.post<unknown>(API_CONFIG.ENDPOINTS.QA_CREATE, payload);
    return parseDetailResponse(response.data);
  }
};
