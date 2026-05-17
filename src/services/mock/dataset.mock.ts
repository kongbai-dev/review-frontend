import { sleep } from '@/lib/async';
import type { PagedListResponse } from '@/types/api';
import type {
  DatasetListQuery,
  DatasetParseResult,
  DatasetQAItem,
  DatasetQAGenerationPayload,
  DatasetQAGenerationTask,
  DatasetRecord,
  DatasetVectorSyncResult,
  KnowledgeDataset,
  UploadDatasetPayload,
  UploadDatasetResult
} from '@/types/domain';

const seedDatasets: KnowledgeDataset[] = [
  {
    id: 'dataset_001',
    dataset_name: 'FinFET IV Sweep',
    source: 'simulation',
    data_type: 'simulation',
    sub_type: 'iv_curve',
    format: 'csv',
    file_name: 'finfet_iv_sweep.csv',
    file_size: 223481,
    knowledge_base: 'simulation',
    bucket_name: 'knowledge-datasets',
    object_key: 'datasets/finfet_iv_sweep.csv',
    device_type: 'FinFET',
    material_system: 'Si',
    phenomenon: 'Id-Vg',
    row_count: 512,
    column_count: 9,
    parse_status: 'parsed',
    qa_status: 'generated',
    vector_status: 'synced',
    confidence_overall: 0.91,
    is_active: true,
    created_by: 'alice',
    created_at: '2026-05-05T09:15:00Z',
    updated_at: '2026-05-12T12:10:00Z',
    topics: ['iv', 'finfet'],
    scenes: ['analysis']
  },
  {
    id: 'dataset_002',
    dataset_name: 'GAA Thermal Map',
    source: 'simulation',
    data_type: 'simulation',
    sub_type: 'thermal',
    format: 'json',
    file_name: 'gaa_thermal_map.json',
    file_size: 102824,
    knowledge_base: 'default',
    bucket_name: 'knowledge-datasets',
    object_key: 'datasets/gaa_thermal_map.json',
    device_type: 'GAA',
    material_system: 'Si/SiGe',
    phenomenon: 'self_heating',
    row_count: 84,
    column_count: 16,
    parse_status: 'parsed',
    qa_status: 'pending',
    vector_status: 'queued',
    confidence_overall: 0.84,
    is_active: true,
    created_by: 'bob',
    created_at: '2026-05-06T08:40:00Z',
    updated_at: '2026-05-13T15:20:00Z',
    topics: ['thermal', 'gaa'],
    scenes: ['simulation']
  },
  {
    id: 'dataset_003',
    dataset_name: 'Reliability Aging Table',
    source: 'lab',
    data_type: 'measurement',
    sub_type: 'aging',
    format: 'xlsx',
    file_name: 'reliability_aging.xlsx',
    file_size: 562913,
    knowledge_base: 'reliability',
    bucket_name: 'knowledge-datasets',
    object_key: 'datasets/reliability_aging.xlsx',
    device_type: 'FinFET',
    material_system: 'Si',
    phenomenon: 'btI',
    parse_status: 'uploaded',
    qa_status: 'not_started',
    vector_status: 'not_synced',
    is_active: true,
    created_by: 'carol',
    created_at: '2026-05-09T10:25:00Z',
    updated_at: '2026-05-09T10:25:00Z',
    topics: ['reliability'],
    scenes: ['lab']
  }
];

const datasets: KnowledgeDataset[] = [...seedDatasets];

const datasetRecords = new Map<string, DatasetRecord[]>([
  [
    'dataset_001',
    Array.from({ length: 12 }, (_, index) => ({
      id: `record_001_${String(index + 1).padStart(2, '0')}`,
      dataset_id: 'dataset_001',
      record_index: index,
      record_name: `bias_${index + 1}`,
      record_type: 'sweep_row',
      record_values: { vg: 0.1 * index, id: 1.2e-6 * (index + 1) },
      retrieval_text: `Vg=${(0.1 * index).toFixed(2)}, Id=${(1.2e-6 * (index + 1)).toExponential(2)}`,
      created_at: '2026-05-05T09:15:00Z'
    }))
  ],
  [
    'dataset_002',
    Array.from({ length: 6 }, (_, index) => ({
      id: `record_002_${String(index + 1).padStart(2, '0')}`,
      dataset_id: 'dataset_002',
      record_index: index,
      record_name: `region_${index + 1}`,
      record_type: 'grid',
      record_values: { temperature: 300 + index * 7, hotspot: index === 3 },
      retrieval_text: `region ${index + 1} thermal profile`,
      created_at: '2026-05-06T08:40:00Z'
    }))
  ],
  ['dataset_003', []]
]);

const datasetQas = new Map<string, DatasetQAItem[]>([
  [
    'dataset_001',
    [
      {
        id: 'dqa_001',
        dataset_id: 'dataset_001',
        question: '这个数据集的阈值电压拐点出现在什么区间？',
        answer: '从记录分布看，主要拐点集中在 Vg 约 0.35V 到 0.45V 区间。',
        qa_type: 'trend',
        source: 'llm_generated',
        review_status: 'approved',
        reviewer_id: 'alice',
        reviewed_at: '2026-05-12T12:18:00Z',
        confidence_score: 0.93
      }
    ]
  ],
  [
    'dataset_002',
    [
      {
        id: 'dqa_002',
        dataset_id: 'dataset_002',
        question: '热热点主要分布在哪个区域？',
        answer: '当前记录显示热点集中在 region_4 周边。',
        qa_type: 'location',
        source: 'llm_generated',
        review_status: 'pending',
        confidence_score: 0.81
      }
    ]
  ],
  ['dataset_003', []]
]);

const qaTasks = new Map<string, DatasetQAGenerationTask>();
const taskDatasetIds = new Map<string, string[]>();
let nextDatasetIndex = 4;
let nextTaskIndex = 1;
let nextDatasetQaIndex = 100;

const paginate = <T>(items: T[], page: number, pageSize: number): PagedListResponse<T> => {
  const start = Math.max(0, (page - 1) * pageSize);
  return {
    items: items.slice(start, start + pageSize),
    total: items.length,
    page,
    page_size: pageSize
  };
};

const normalize = (value: string | undefined): string => value?.trim().toLowerCase() ?? '';

const getDatasetOrThrow = (datasetId: string): KnowledgeDataset => {
  const item = datasets.find((dataset) => dataset.id === datasetId);
  if (!item) {
    throw new Error('Dataset not found');
  }
  return item;
};

export const mockDatasetApi = {
  async getList(query: DatasetListQuery): Promise<PagedListResponse<KnowledgeDataset>> {
    await sleep(120);

    const filtered = datasets.filter((item) => {
      if (query.knowledge_base?.trim() && item.knowledge_base !== query.knowledge_base.trim()) return false;
      if (query.source?.trim() && item.source !== query.source.trim()) return false;
      if (query.data_type?.trim() && item.data_type !== query.data_type.trim()) return false;
      if (query.sub_type?.trim() && item.sub_type !== query.sub_type.trim()) return false;
      if (query.device_type?.trim() && item.device_type !== query.device_type.trim()) return false;
      if (query.material_system?.trim() && item.material_system !== query.material_system.trim()) return false;
      if (query.phenomenon?.trim() && item.phenomenon !== query.phenomenon.trim()) return false;
      if (query.parse_status?.trim() && item.parse_status !== query.parse_status.trim()) return false;
      if (query.vector_status?.trim() && item.vector_status !== query.vector_status.trim()) return false;

      const keyword = normalize(query.keyword);
      if (!keyword) return true;

      return [
        item.dataset_name,
        item.file_name,
        item.source,
        item.data_type,
        item.object_key,
        item.device_type,
        item.phenomenon
      ].some((value) => normalize(value).includes(keyword));
    });

    const sorted = [...filtered].sort((left, right) => (right.created_at ?? '').localeCompare(left.created_at ?? ''));
    return paginate(sorted, query.page, query.page_size);
  },

  async upload(payload: UploadDatasetPayload): Promise<UploadDatasetResult> {
    await sleep(180);

    const id = `dataset_${String(nextDatasetIndex).padStart(3, '0')}`;
    nextDatasetIndex += 1;

    const createdAt = new Date().toISOString();
    const nextItem: KnowledgeDataset = {
      id,
      dataset_name: payload.dataset_name?.trim() || payload.data_file.name.replace(/\.[^.]+$/, ''),
      source: payload.source?.trim() || 'simulation',
      data_type: payload.data_type?.trim() || 'simulation',
      sub_type: payload.sub_type?.trim() || undefined,
      format: payload.data_file.name.split('.').pop()?.toLowerCase() || 'file',
      file_name: payload.data_file.name,
      file_size: payload.data_file.size,
      knowledge_base: payload.knowledge_base?.trim() || 'default',
      bucket_name: 'knowledge-datasets',
      object_key: `datasets/${payload.data_file.name}`,
      device_type: payload.device_type?.trim() || undefined,
      material_system: payload.material_system?.trim() || undefined,
      phenomenon: payload.phenomenon?.trim() || undefined,
      parse_status: 'uploaded',
      qa_status: 'not_started',
      vector_status: 'not_synced',
      is_active: true,
      created_by: 'mock-user',
      created_at: createdAt,
      updated_at: createdAt,
      topics: [],
      scenes: []
    };

    datasets.unshift(nextItem);
    datasetRecords.set(id, []);
    datasetQas.set(id, []);

    return {
      dataset_id: id,
      dataset_name: nextItem.dataset_name,
      object_key: nextItem.object_key,
      parse_status: nextItem.parse_status,
      vector_status: nextItem.vector_status
    };
  },

  async getDetail(datasetId: string): Promise<KnowledgeDataset> {
    await sleep(90);
    return { ...getDatasetOrThrow(datasetId) };
  },

  async getRecords(datasetId: string, page = 1, pageSize = 20): Promise<PagedListResponse<DatasetRecord>> {
    await sleep(90);
    getDatasetOrThrow(datasetId);
    return paginate([...(datasetRecords.get(datasetId) ?? [])], page, pageSize);
  },

  async getQAs(datasetId: string, reviewStatus: string | undefined, page = 1, pageSize = 20): Promise<PagedListResponse<DatasetQAItem>> {
    await sleep(90);
    getDatasetOrThrow(datasetId);
    let items = [...(datasetQas.get(datasetId) ?? [])];
    if (reviewStatus?.trim()) {
      items = items.filter((item) => item.review_status === reviewStatus.trim());
    }
    return paginate(items, page, pageSize);
  },

  async parse(datasetId: string): Promise<DatasetParseResult> {
    await sleep(150);
    const item = getDatasetOrThrow(datasetId);
    item.parse_status = 'parsed';
    item.row_count = item.row_count ?? 128;
    item.column_count = item.column_count ?? 8;
    item.updated_at = new Date().toISOString();
    if ((datasetRecords.get(datasetId) ?? []).length === 0) {
      datasetRecords.set(
        datasetId,
        Array.from({ length: 8 }, (_, index) => ({
          id: `record_${datasetId}_${index + 1}`,
          dataset_id: datasetId,
          record_index: index,
          record_name: `row_${index + 1}`,
          record_type: 'table_row',
          record_values: { index, value: index * 10 },
          created_at: item.updated_at
        }))
      );
    }
    return {
      dataset_id: datasetId,
      parse_status: item.parse_status,
      row_count: item.row_count,
      column_count: item.column_count,
      parsed_record_count: datasetRecords.get(datasetId)?.length ?? 0,
      message: '数据集已完成解析'
    };
  },

  async triggerVectorSync(datasetId: string): Promise<DatasetVectorSyncResult> {
    await sleep(120);
    const item = getDatasetOrThrow(datasetId);
    item.vector_status = 'queued';
    item.updated_at = new Date().toISOString();
    return {
      dataset_id: datasetId,
      queued: true,
      job_type: 'dataset_vector_sync',
      vector_status: item.vector_status
    };
  },

  async startQaGeneration(payload: DatasetQAGenerationPayload): Promise<DatasetQAGenerationTask> {
    await sleep(140);

    const taskId = `dataset_task_${String(nextTaskIndex).padStart(3, '0')}`;
    nextTaskIndex += 1;

    const task: DatasetQAGenerationTask = {
      task_id: taskId,
      status: 'running',
      total_datasets: payload.dataset_ids.length,
      processed_datasets: 0,
      success_datasets: 0,
      failed_datasets: 0,
      generated_total: 0,
      qa_count_per_dataset: payload.qa_count_per_dataset ?? 5,
      mode: payload.mode ?? 'append',
      started_at: new Date().toISOString()
    };

    qaTasks.set(taskId, task);
    taskDatasetIds.set(taskId, [...payload.dataset_ids]);
    return { ...task };
  },

  async getQaGenerationTask(taskId: string): Promise<DatasetQAGenerationTask> {
    await sleep(120);

    const current = qaTasks.get(taskId);
    if (!current) {
      throw new Error('Dataset QA task not found');
    }

    if (current.status !== 'completed') {
      const targetDatasetIds = taskDatasetIds.get(taskId) ?? [];
      current.processed_datasets = current.total_datasets;
      current.success_datasets = current.total_datasets;
      current.generated_total = current.total_datasets * current.qa_count_per_dataset;
      current.status = 'completed';
      current.finished_at = new Date().toISOString();

      targetDatasetIds.forEach((datasetId) => {
        const item = getDatasetOrThrow(datasetId);
        item.qa_status = 'generated';
        item.updated_at = current.finished_at;

        const qaItems = datasetQas.get(datasetId) ?? [];
        for (let index = 0; index < current.qa_count_per_dataset; index += 1) {
          qaItems.unshift({
            id: `dqa_${nextDatasetQaIndex}`,
            dataset_id: datasetId,
            question: `${item.dataset_name} 的关键特征问题 ${index + 1} 是什么？`,
            answer: `${item.dataset_name} 已在 mock QA 任务中生成第 ${index + 1} 条回答，可用于联调数据集工作台。`,
            qa_type: 'generated',
            source: 'llm_generated',
            review_status: 'pending',
            confidence_score: 0.8,
            retrieval_text: item.object_key
          });
          nextDatasetQaIndex += 1;
        }

        datasetQas.set(datasetId, qaItems);
      });
    }

    return { ...current };
  }
};
