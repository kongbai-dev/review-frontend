import type { PagedListResponse } from '@/types/api';
import type { MemberRankingItem, MemberRankingQuery } from '@/types/domain';
import { getMockDocumentsSnapshot } from '@/services/mock/document.mock';

const wait = async (ms: number): Promise<void> =>
  new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });

const memberSeeds = [
  { user_id: 'u_001', username: 'alice', display_name: 'Alice', reviewed_qa_count: 220, deprecated_qa_count: 8, last_active_at: '2026-03-27T09:15:00Z' },
  { user_id: 'u_002', username: 'bob', display_name: 'Bob', reviewed_qa_count: 176, deprecated_qa_count: 5, last_active_at: '2026-03-27T08:40:00Z' },
  { user_id: 'u_003', username: 'carol', display_name: 'Carol', reviewed_qa_count: 152, deprecated_qa_count: 7, last_active_at: '2026-03-26T17:25:00Z' },
  { user_id: 'u_004', username: 'david', display_name: 'David', reviewed_qa_count: 118, deprecated_qa_count: 4, last_active_at: '2026-03-26T11:03:00Z' },
  { user_id: 'u_005', username: 'erin', display_name: 'Erin', reviewed_qa_count: 164, deprecated_qa_count: 6, last_active_at: '2026-03-25T15:40:00Z' },
  { user_id: 'u_006', username: 'frank', display_name: 'Frank', reviewed_qa_count: 139, deprecated_qa_count: 3, last_active_at: '2026-03-25T09:18:00Z' },
  { user_id: 'u_007', username: 'grace', display_name: 'Grace', reviewed_qa_count: 96, deprecated_qa_count: 2, last_active_at: '2026-03-24T20:45:00Z' }
] as const;

const compareText = (left: string, right: string): number =>
  left.localeCompare(right, 'zh-CN', { sensitivity: 'base' });

const sortItems = (items: MemberRankingItem[], query: MemberRankingQuery): MemberRankingItem[] => {
  const orderFactor = query.order === 'desc' ? -1 : 1;

  const sorted = [...items].sort((left, right) => {
    let result = 0;

    if (query.sort_by === 'uploaded_docs') {
      result = left.uploaded_document_count - right.uploaded_document_count;
    } else if (query.sort_by === 'reviewed_qa') {
      result = left.reviewed_qa_count - right.reviewed_qa_count;
    } else if (query.sort_by === 'processed_qa') {
      result = left.processed_qa_count - right.processed_qa_count;
    } else {
      result = compareText(left.username, right.username);
    }

    if (result === 0) {
      result = compareText(left.username, right.username);
    }

    return result * orderFactor;
  });

  return sorted.map((item, index) => ({
    ...item,
    rank: index + 1
  }));
};

const buildItems = (): MemberRankingItem[] => {
  const documentCounts = getMockDocumentsSnapshot().reduce<Record<string, number>>((accumulator, item) => {
    accumulator[item.uploaded_by] = (accumulator[item.uploaded_by] ?? 0) + 1;
    return accumulator;
  }, {});

  return memberSeeds.map((item) => {
    const uploadedCount = documentCounts[item.username] ?? 0;
    const processedCount = item.reviewed_qa_count + item.deprecated_qa_count;

    return {
      rank: 0,
      user_id: item.user_id,
      username: item.username,
      display_name: item.display_name,
      uploaded_document_count: uploadedCount,
      reviewed_qa_count: item.reviewed_qa_count,
      deprecated_qa_count: item.deprecated_qa_count,
      processed_qa_count: processedCount,
      last_active_at: item.last_active_at
    };
  });
};

export const mockMemberApi = {
  async getRankings(query: MemberRankingQuery): Promise<PagedListResponse<MemberRankingItem>> {
    await wait(140);

    const page = query.page ?? 1;
    const pageSize = query.page_size ?? 20;
    const sorted = sortItems(buildItems(), query);
    const start = Math.max(0, (page - 1) * pageSize);

    return {
      items: sorted.slice(start, start + pageSize),
      total: sorted.length,
      page,
      page_size: pageSize
    };
  }
};
