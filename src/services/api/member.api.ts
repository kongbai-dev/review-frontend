import { API_CONFIG } from '@/config';
import { http } from '@/services/http';
import { mockMemberApi } from '@/services/mock/member.mock';
import type { PagedListResponse } from '@/types/api';
import type { MemberRankingItem, MemberRankingQuery } from '@/types/domain';

const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 20;

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const expectString = (value: unknown, path: string): string => {
  if (typeof value !== 'string') {
    throw new Error(`接口契约不匹配: ${path} 应为 string`);
  }
  return value;
};

const expectOptionalString = (value: unknown, path: string): string | undefined => {
  if (value === undefined || value === null) {
    return undefined;
  }
  return expectString(value, path);
};

const expectNumber = (value: unknown, path: string): number => {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    throw new Error(`接口契约不匹配: ${path} 应为 number`);
  }
  return value;
};

const parseRankingItem = (raw: unknown, path = 'member'): MemberRankingItem => {
  if (!isObject(raw)) {
    throw new Error(`接口契约不匹配: ${path} 应为对象`);
  }

  return {
    rank: expectNumber(raw.rank, `${path}.rank`),
    user_id: expectString(raw.user_id, `${path}.user_id`),
    username: expectString(raw.username, `${path}.username`),
    display_name: expectOptionalString(raw.display_name, `${path}.display_name`),
    uploaded_document_count: expectNumber(raw.uploaded_document_count, `${path}.uploaded_document_count`),
    reviewed_qa_count: expectNumber(raw.reviewed_qa_count, `${path}.reviewed_qa_count`),
    last_active_at: expectOptionalString(raw.last_active_at, `${path}.last_active_at`)
  };
};

const parseRankingList = (raw: unknown, fallbackPage: number, fallbackPageSize: number): PagedListResponse<MemberRankingItem> => {
  if (Array.isArray(raw)) {
    return {
      items: raw.map((item, index) => parseRankingItem(item, `members[${index}]`)),
      total: raw.length,
      page: fallbackPage,
      page_size: fallbackPageSize
    };
  }

  if (!isObject(raw) || !Array.isArray(raw.items)) {
    throw new Error('接口契约不匹配: 成员排行响应应为 { items, total, page, page_size }');
  }

  return {
    items: raw.items.map((item, index) => parseRankingItem(item, `members[${index}]`)),
    total: raw.total === undefined ? raw.items.length : expectNumber(raw.total, 'members.total'),
    page: raw.page === undefined ? fallbackPage : expectNumber(raw.page, 'members.page'),
    page_size: raw.page_size === undefined ? fallbackPageSize : expectNumber(raw.page_size, 'members.page_size')
  };
};

const buildParams = (query: MemberRankingQuery): Record<string, string | number> => ({
  sort_by: query.sort_by,
  order: query.order,
  page: query.page ?? DEFAULT_PAGE,
  page_size: query.page_size ?? DEFAULT_PAGE_SIZE
});

export const memberApi = {
  async getRankings(query: MemberRankingQuery): Promise<PagedListResponse<MemberRankingItem>> {
    if (API_CONFIG.USE_MOCK) {
      return mockMemberApi.getRankings(query);
    }

    const response = await http.get<unknown>(API_CONFIG.ENDPOINTS.MEMBER_RANKINGS, {
      params: buildParams(query)
    });

    return parseRankingList(response.data, query.page ?? DEFAULT_PAGE, query.page_size ?? DEFAULT_PAGE_SIZE);
  }
};
