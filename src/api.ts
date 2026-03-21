import { qaApi } from '@/services/api/qa.api';
import type { QADetail, QAPair, ReviewPayload } from '@/types/domain';

export type QAData = QAPair;

export interface ContextData {
  fragment_id: string;
  content: string;
  source_path: string;
  page: number;
}

export interface PendingResponse {
  qa_data: QAData;
  context: ContextData;
}

const detailToPending = (detail: QADetail): PendingResponse => {
  const fragment = detail.fragments[0];
  return {
    qa_data: detail,
    context: {
      fragment_id: fragment?.id || '',
      content: fragment?.content || '',
      source_path: fragment?.source || '',
      page: fragment?.page_start || 0
    }
  };
};

export const fetchNextPendingQA = async (): Promise<PendingResponse | null> => {
  const list = await qaApi.getPending(1);
  if (list.length === 0) {
    return null;
  }
  const detail = await qaApi.getDetail(list[0].id);
  return detailToPending(detail);
};

export const approveQA = async (id: string, updatedData: Partial<QAData> & { review_notes?: string; version?: number }) => {
  const current = await qaApi.getDetail(id);
  const payload: ReviewPayload = {
    question: updatedData.question || current.question,
    answer: updatedData.answer || current.answer,
    topics: updatedData.topics || current.topics,
    scenes: updatedData.scenes || current.scenes,
    confidence: updatedData.confidence || current.confidence,
    review_notes: updatedData.review_notes || '审核通过',
    status: 'reviewed',
    version: updatedData.version || current.version
  };
  return qaApi.review(id, payload);
};

export const rejectQA = async (id: string) => {
  const current = await qaApi.getDetail(id);
  return qaApi.review(id, {
    question: current.question,
    answer: current.answer,
    topics: current.topics,
    scenes: current.scenes,
    confidence: current.confidence,
    review_notes: '标记为废弃',
    status: 'deprecated',
    version: current.version
  });
};
