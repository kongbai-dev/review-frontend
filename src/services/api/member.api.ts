import { API_CONFIG } from '@/config';
import { expectNumber, expectOptionalNumber, expectOptionalString, expectString, isObject } from '@/lib/contract';
import { http } from '@/services/http';
import type { PagedListResponse } from '@/types/api';
import type { MemberRankingItem, MemberRankingQuery } from '@/types/domain';

const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 20;

let memberMockApiPromise: Promise<typeof import('@/services/mock/member.mock').mockMemberApi> | null = null;

const getMemberMockApi = async (): Promise<typeof import('@/services/mock/member.mock').mockMemberApi> => {
  if (!memberMockApiPromise) {
    memberMockApiPromise = import('@/services/mock/member.mock').then((module) => module.mockMemberApi);
  }
  return memberMockApiPromise;
};

const parseRankingItem = (raw: unknown, path = 'member', index = 0): MemberRankingItem => {
  if (!isObject(raw)) {
    throw new Error(`Contract mismatch: ${path} must be object`);
  }

  return {
    rank: expectOptionalNumber(raw.rank, `${path}.rank`) ?? index + 1,
    user_id: expectString(raw.user_id, `${path}.user_id`),
    username: expectString(raw.username, `${path}.username`),
    display_name: expectOptionalString(raw.display_name, `${path}.display_name`),
    uploaded_document_count: expectNumber(raw.uploaded_document_count, `${path}.uploaded_document_count`),
    reviewed_qa_count: expectNumber(raw.reviewed_qa_count, `${path}.reviewed_qa_count`),
    deprecated_qa_count: expectOptionalNumber(raw.deprecated_qa_count, `${path}.deprecated_qa_count`) ?? 0,
    processed_qa_count: expectOptionalNumber(raw.processed_qa_count, `${path}.processed_qa_count`) ?? 0,
    last_active_at: expectOptionalString(raw.last_active_at, `${path}.last_active_at`)
  };
};

const parseRankingList = (raw: unknown, fallbackPage: number, fallbackPageSize: number): PagedListResponse<MemberRankingItem> => {
  if (Array.isArray(raw)) {
    return {
      items: raw.map((item, index) => parseRankingItem(item, `members[${index}]`, index)),
      total: raw.length,
      page: fallbackPage,
      page_size: fallbackPageSize
    };
  }

  if (!isObject(raw) || !Array.isArray(raw.items)) {
    throw new Error('Contract mismatch: member ranking response must be { items, total, page, page_size }');
  }

  return {
    items: raw.items.map((item, index) => parseRankingItem(item, `members[${index}]`, index)),
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
      const mockMemberApi = await getMemberMockApi();
      return mockMemberApi.getRankings(query);
    }

    const response = await http.get<unknown>(API_CONFIG.ENDPOINTS.MEMBER_RANKINGS, {
      params: buildParams(query)
    });

    return parseRankingList(response.data, query.page ?? DEFAULT_PAGE, query.page_size ?? DEFAULT_PAGE_SIZE);
  }
};
