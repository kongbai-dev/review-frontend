import type { AssignPayload, QADetail, QAPair, QAStats, ReviewPayload } from '@/types/domain';

const queue: QADetail[] = [
  {
    id: 'qa-1',
    question: 'GAA器件的量子限制效应在Sentaurus中如何设置？',
    answer: '在 models 语句中添加 qm 参数，示例：models { qm }。',
    topics: ['半导体器件', 'TCAD仿真'],
    scenes: ['engineer'],
    confidence: 0.95,
    status: 'pending',
    reviewer: 'reviewer-01',
    version: 1,
    fragments: [
      {
        id: 'frag-1',
        fragment_type: 'text',
        content: 'Sentaurus Device User Guide: quantum correction can be activated by qm model switch.',
        page_start: 120,
        page_end: 121,
        source: 'Sentaurus Device User Guide 2022'
      }
    ]
  },
  {
    id: 'qa-2',
    question: '费米能级在本征半导体中如何定义？',
    answer: '本征半导体中费米能级位于禁带中央附近，随温度和有效态密度略偏移。',
    topics: ['半导体物理'],
    scenes: ['student', 'researcher'],
    confidence: 0.9,
    status: 'pending',
    reviewer: '',
    version: 1,
    fragments: [
      {
        id: 'frag-2',
        fragment_type: 'text',
        content: 'Intrinsic semiconductor Fermi level is near the middle of the band gap.',
        page_start: 42,
        page_end: 42,
        source: '半导体物理导论'
      }
    ]
  },
  {
    id: 'qa-3',
    question: '为什么亚阈值摆幅会影响低功耗器件设计？',
    answer: '亚阈值摆幅越小，器件在低电压下可以保持更高开关比，从而降低静态功耗。',
    topics: ['器件物理', '低功耗设计'],
    scenes: ['researcher', 'engineer'],
    confidence: 0.87,
    status: 'pending',
    reviewer: 'reviewer-02',
    version: 1,
    fragments: [
      {
        id: 'frag-3',
        fragment_type: 'text',
        content: 'Subthreshold slope determines how fast the transistor turns off with gate bias.',
        page_start: 17,
        page_end: 18,
        source: 'CMOS Device Fundamentals'
      }
    ]
  }
];

const reviewed: QADetail[] = [];

const wait = async (ms: number): Promise<void> =>
  new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });

export const mockQaApi = {
  async getPending(limit: number): Promise<QAPair[]> {
    await wait(200);
    return queue.filter((item) => item.status === 'pending').slice(0, limit);
  },

  async getDetail(id: string): Promise<QADetail> {
    await wait(150);
    const target = [...queue, ...reviewed].find((item) => item.id === id);
    if (!target) {
      throw new Error('QA not found');
    }
    return target;
  },

  async review(id: string, payload: ReviewPayload): Promise<QADetail> {
    await wait(200);
    const index = queue.findIndex((item) => item.id === id);
    if (index < 0) {
      throw new Error('QA not found');
    }
    const current = queue[index];
    if (current.version !== payload.version) {
      throw new Error('版本冲突，请刷新后重试');
    }

    const next: QADetail = {
      ...current,
      ...payload,
      reviewer: payload.reviewer ?? current.reviewer,
      reviewed_at: payload.status === 'pending' ? current.reviewed_at : new Date().toISOString(),
      version: current.version + 1
    };

    if (payload.status === 'pending') {
      queue[index] = next;
      return next;
    }

    queue.splice(index, 1);
    reviewed.unshift(next);
    return next;
  },

  async assign(payload: AssignPayload): Promise<void> {
    await wait(120);
    payload.qa_ids.forEach((id) => {
      const target = queue.find((item) => item.id === id);
      if (!target) return;
      target.reviewer = payload.assignee;
      target.version += 1;
    });
  },

  async stats(): Promise<QAStats> {
    await wait(120);
    return {
      pending: queue.filter((item) => item.status === 'pending').length,
      reviewed: reviewed.filter((item) => item.status === 'reviewed').length,
      deprecated: reviewed.filter((item) => item.status === 'deprecated').length
    };
  },

  async history(limit: number): Promise<QAPair[]> {
    await wait(120);
    return reviewed.slice(0, limit);
  }
};
