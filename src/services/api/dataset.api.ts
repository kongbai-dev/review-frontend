import { API_CONFIG } from '@/config';
import { expectNumber, expectOptionalNumber, expectOptionalString, expectString, expectStringArray, isObject } from '@/lib/contract';
import { http } from '@/services/http';
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

let datasetMockApiPromise: Promise<typeof import('@/services/mock/dataset.mock').mockDatasetApi> | null = null;

const getDatasetMockApi = async (): Promise<typeof import('@/services/mock/dataset.mock').mockDatasetApi> => {
  if (!datasetMockApiPromise) {
    datasetMockApiPromise = import('@/services/mock/dataset.mock').then((module) => module.mockDatasetApi);
  }
  return datasetMockApiPromise;
};

const parseDataset = (raw: unknown, path = 'dataset'): KnowledgeDataset => {
  if (!isObject(raw)) {
    throw new Error(`Contract mismatch: ${path} must be object`);
  }

  return {
    id: expectString(raw.id, `${path}.id`),
    dataset_name: expectString(raw.dataset_name, `${path}.dataset_name`),
    source: expectString(raw.source, `${path}.source`),
    data_type: expectString(raw.data_type, `${path}.data_type`),
    sub_type: expectOptionalString(raw.sub_type, `${path}.sub_type`),
    format: expectString(raw.format, `${path}.format`),
    file_name: expectString(raw.file_name, `${path}.file_name`),
    file_size: expectOptionalNumber(raw.file_size, `${path}.file_size`),
    knowledge_base: expectString(raw.knowledge_base, `${path}.knowledge_base`),
    bucket_name: expectString(raw.bucket_name, `${path}.bucket_name`),
    object_key: expectString(raw.object_key, `${path}.object_key`),
    device_type: expectOptionalString(raw.device_type, `${path}.device_type`),
    material_system: expectOptionalString(raw.material_system, `${path}.material_system`),
    phenomenon: expectOptionalString(raw.phenomenon, `${path}.phenomenon`),
    row_count: expectOptionalNumber(raw.row_count, `${path}.row_count`),
    column_count: expectOptionalNumber(raw.column_count, `${path}.column_count`),
    parse_status: expectString(raw.parse_status, `${path}.parse_status`),
    qa_status: expectString(raw.qa_status, `${path}.qa_status`),
    vector_status: expectString(raw.vector_status, `${path}.vector_status`),
    confidence_overall: expectOptionalNumber(raw.confidence_overall, `${path}.confidence_overall`),
    is_active: typeof raw.is_active === 'boolean' ? raw.is_active : undefined,
    created_by: expectOptionalString(raw.created_by, `${path}.created_by`),
    created_at: expectOptionalString(raw.created_at, `${path}.created_at`),
    updated_at: expectOptionalString(raw.updated_at, `${path}.updated_at`),
    topics: Array.isArray(raw.topics) ? expectStringArray(raw.topics, `${path}.topics`) : [],
    scenes: Array.isArray(raw.scenes) ? expectStringArray(raw.scenes, `${path}.scenes`) : []
  };
};

const parseDatasetList = (raw: unknown, page: number, pageSize: number): PagedListResponse<KnowledgeDataset> => {
  if (!isObject(raw) || !Array.isArray(raw.items)) {
    throw new Error('Contract mismatch: dataset list response must be { items, total, page, page_size }');
  }

  return {
    items: raw.items.map((item, index) => parseDataset(item, `datasets[${index}]`)),
    total: expectNumber(raw.total, 'datasets.total'),
    page: raw.page === undefined ? page : expectNumber(raw.page, 'datasets.page'),
    page_size: raw.page_size === undefined ? pageSize : expectNumber(raw.page_size, 'datasets.page_size')
  };
};

const parseUploadResult = (raw: unknown): UploadDatasetResult => {
  if (!isObject(raw)) {
    throw new Error('Contract mismatch: dataset upload response must be object');
  }

  return {
    dataset_id: expectString(raw.dataset_id, 'datasetUpload.dataset_id'),
    dataset_name: expectString(raw.dataset_name, 'datasetUpload.dataset_name'),
    object_key: expectString(raw.object_key, 'datasetUpload.object_key'),
    parse_status: expectString(raw.parse_status, 'datasetUpload.parse_status'),
    vector_status: expectString(raw.vector_status, 'datasetUpload.vector_status'),
    row_count: expectOptionalNumber(raw.row_count, 'datasetUpload.row_count'),
    column_count: expectOptionalNumber(raw.column_count, 'datasetUpload.column_count'),
    parsed_record_count: expectOptionalNumber(raw.parsed_record_count, 'datasetUpload.parsed_record_count')
  };
};

const parseDatasetParseResult = (raw: unknown): DatasetParseResult => {
  if (!isObject(raw)) {
    throw new Error('Contract mismatch: dataset parse response must be object');
  }

  return {
    dataset_id: expectString(raw.dataset_id, 'datasetParse.dataset_id'),
    parse_status: expectString(raw.parse_status, 'datasetParse.parse_status'),
    row_count: expectOptionalNumber(raw.row_count, 'datasetParse.row_count'),
    column_count: expectOptionalNumber(raw.column_count, 'datasetParse.column_count'),
    parsed_record_count: expectOptionalNumber(raw.parsed_record_count, 'datasetParse.parsed_record_count'),
    message: expectString(raw.message, 'datasetParse.message')
  };
};

const parseVectorSyncResult = (raw: unknown): DatasetVectorSyncResult => {
  if (!isObject(raw)) {
    throw new Error('Contract mismatch: dataset vector sync response must be object');
  }

  return {
    dataset_id: expectString(raw.dataset_id, 'datasetVectorSync.dataset_id'),
    queued: typeof raw.queued === 'boolean' ? raw.queued : false,
    job_type: expectString(raw.job_type, 'datasetVectorSync.job_type'),
    vector_status: expectString(raw.vector_status, 'datasetVectorSync.vector_status')
  };
};

const parseRecords = (raw: unknown, page: number, pageSize: number): PagedListResponse<DatasetRecord> => {
  if (!isObject(raw) || !Array.isArray(raw.items)) {
    throw new Error('Contract mismatch: dataset records response must be { items, total, page, page_size }');
  }

  return {
    items: raw.items.map((item, index) => {
      if (!isObject(item)) {
        throw new Error(`Contract mismatch: datasetRecords[${index}] must be object`);
      }
      return {
        id: expectString(item.id, `datasetRecords[${index}].id`),
        dataset_id: expectString(item.dataset_id, `datasetRecords[${index}].dataset_id`),
        record_index: expectNumber(item.record_index, `datasetRecords[${index}].record_index`),
        record_name: expectOptionalString(item.record_name, `datasetRecords[${index}].record_name`),
        record_type: expectString(item.record_type, `datasetRecords[${index}].record_type`),
        record_values: isObject(item.record_values) ? item.record_values : undefined,
        conditions_specific: isObject(item.conditions_specific) ? item.conditions_specific : undefined,
        labels: isObject(item.labels) ? item.labels : undefined,
        quality_flags: isObject(item.quality_flags) ? item.quality_flags : undefined,
        retrieval_text: expectOptionalString(item.retrieval_text, `datasetRecords[${index}].retrieval_text`),
        created_at: expectOptionalString(item.created_at, `datasetRecords[${index}].created_at`)
      };
    }),
    total: expectNumber(raw.total, 'datasetRecords.total'),
    page: raw.page === undefined ? page : expectNumber(raw.page, 'datasetRecords.page'),
    page_size: raw.page_size === undefined ? pageSize : expectNumber(raw.page_size, 'datasetRecords.page_size')
  };
};

const parseQAs = (raw: unknown, page: number, pageSize: number): PagedListResponse<DatasetQAItem> => {
  if (!isObject(raw) || !Array.isArray(raw.items)) {
    throw new Error('Contract mismatch: dataset qa response must be { items, total, page, page_size }');
  }

  return {
    items: raw.items.map((item, index) => {
      if (!isObject(item)) {
        throw new Error(`Contract mismatch: datasetQAs[${index}] must be object`);
      }
      return {
        id: expectString(item.id, `datasetQAs[${index}].id`),
        dataset_id: expectString(item.dataset_id, `datasetQAs[${index}].dataset_id`),
        record_id: expectOptionalString(item.record_id, `datasetQAs[${index}].record_id`),
        question: expectString(item.question, `datasetQAs[${index}].question`),
        answer: expectString(item.answer, `datasetQAs[${index}].answer`),
        qa_type: expectOptionalString(item.qa_type, `datasetQAs[${index}].qa_type`),
        source: expectString(item.source, `datasetQAs[${index}].source`),
        review_status: expectString(item.review_status, `datasetQAs[${index}].review_status`),
        reviewer_id: expectOptionalString(item.reviewer_id, `datasetQAs[${index}].reviewer_id`),
        reviewed_at: expectOptionalString(item.reviewed_at, `datasetQAs[${index}].reviewed_at`),
        confidence_score: expectOptionalNumber(item.confidence_score, `datasetQAs[${index}].confidence_score`),
        retrieval_text: expectOptionalString(item.retrieval_text, `datasetQAs[${index}].retrieval_text`)
      };
    }),
    total: expectNumber(raw.total, 'datasetQAs.total'),
    page: raw.page === undefined ? page : expectNumber(raw.page, 'datasetQAs.page'),
    page_size: raw.page_size === undefined ? pageSize : expectNumber(raw.page_size, 'datasetQAs.page_size')
  };
};

const parseQAGenerationTask = (raw: unknown): DatasetQAGenerationTask => {
  if (!isObject(raw)) {
    throw new Error('Contract mismatch: dataset qa generation response must be object');
  }

  return {
    task_id: expectString(raw.task_id, 'datasetQaTask.task_id'),
    status: expectString(raw.status, 'datasetQaTask.status'),
    total_datasets: expectNumber(raw.total_datasets, 'datasetQaTask.total_datasets'),
    processed_datasets: expectNumber(raw.processed_datasets, 'datasetQaTask.processed_datasets'),
    success_datasets: expectOptionalNumber(raw.success_datasets, 'datasetQaTask.success_datasets'),
    failed_datasets: expectOptionalNumber(raw.failed_datasets, 'datasetQaTask.failed_datasets'),
    generated_total: expectNumber(raw.generated_total, 'datasetQaTask.generated_total'),
    qa_count_per_dataset: expectNumber(raw.qa_count_per_dataset, 'datasetQaTask.qa_count_per_dataset'),
    mode: expectString(raw.mode, 'datasetQaTask.mode') as DatasetQAGenerationTask['mode'],
    started_at: expectOptionalString(raw.started_at, 'datasetQaTask.started_at'),
    finished_at: expectOptionalString(raw.finished_at, 'datasetQaTask.finished_at')
  };
};

const buildListParams = (query: DatasetListQuery): Record<string, string | number> => {
  const params: Record<string, string | number> = {
    page: query.page,
    page_size: query.page_size
  };

  if (query.knowledge_base?.trim()) params.knowledge_base = query.knowledge_base.trim();
  if (query.source?.trim()) params.source = query.source.trim();
  if (query.data_type?.trim()) params.data_type = query.data_type.trim();
  if (query.sub_type?.trim()) params.sub_type = query.sub_type.trim();
  if (query.device_type?.trim()) params.device_type = query.device_type.trim();
  if (query.material_system?.trim()) params.material_system = query.material_system.trim();
  if (query.phenomenon?.trim()) params.phenomenon = query.phenomenon.trim();
  if (query.parse_status?.trim()) params.parse_status = query.parse_status.trim();
  if (query.vector_status?.trim()) params.vector_status = query.vector_status.trim();
  if (query.keyword?.trim()) params.keyword = query.keyword.trim();

  return params;
};

export const datasetApi = {
  async getList(query: DatasetListQuery): Promise<PagedListResponse<KnowledgeDataset>> {
    if (API_CONFIG.USE_MOCK) {
      const mockDatasetApi = await getDatasetMockApi();
      return mockDatasetApi.getList(query);
    }

    const response = await http.get<unknown>(API_CONFIG.ENDPOINTS.DATASET_LIST, {
      params: buildListParams(query)
    });
    return parseDatasetList(response.data, query.page, query.page_size);
  },

  async upload(payload: UploadDatasetPayload): Promise<UploadDatasetResult> {
    if (API_CONFIG.USE_MOCK) {
      const mockDatasetApi = await getDatasetMockApi();
      return mockDatasetApi.upload(payload);
    }

    const formData = new FormData();
    formData.append('data_file', payload.data_file);
    formData.append('knowledge_base', payload.knowledge_base?.trim() || 'default');
    formData.append('source', payload.source?.trim() || 'simulation');
    formData.append('data_type', payload.data_type?.trim() || 'simulation');

    if (payload.sub_type?.trim()) formData.append('sub_type', payload.sub_type.trim());
    if (payload.version?.trim()) formData.append('version', payload.version.trim());
    if (payload.dataset_name?.trim()) formData.append('dataset_name', payload.dataset_name.trim());
    if (payload.device_type?.trim()) formData.append('device_type', payload.device_type.trim());
    if (payload.material_system?.trim()) formData.append('material_system', payload.material_system.trim());
    if (payload.phenomenon?.trim()) formData.append('phenomenon', payload.phenomenon.trim());

    const response = await http.post<unknown>(API_CONFIG.ENDPOINTS.DATASET_UPLOAD, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return parseUploadResult(response.data);
  },

  async getDetail(datasetId: string): Promise<KnowledgeDataset> {
    if (API_CONFIG.USE_MOCK) {
      const mockDatasetApi = await getDatasetMockApi();
      return mockDatasetApi.getDetail(datasetId);
    }

    const response = await http.get<unknown>(API_CONFIG.ENDPOINTS.DATASET_DETAIL(datasetId));
    return parseDataset(response.data, 'datasetDetail');
  },

  async getRecords(datasetId: string, page = 1, pageSize = 20): Promise<PagedListResponse<DatasetRecord>> {
    if (API_CONFIG.USE_MOCK) {
      const mockDatasetApi = await getDatasetMockApi();
      return mockDatasetApi.getRecords(datasetId, page, pageSize);
    }

    const response = await http.get<unknown>(API_CONFIG.ENDPOINTS.DATASET_RECORDS(datasetId), {
      params: {
        page,
        page_size: pageSize
      }
    });
    return parseRecords(response.data, page, pageSize);
  },

  async getQAs(datasetId: string, reviewStatus?: string, page = 1, pageSize = 20): Promise<PagedListResponse<DatasetQAItem>> {
    if (API_CONFIG.USE_MOCK) {
      const mockDatasetApi = await getDatasetMockApi();
      return mockDatasetApi.getQAs(datasetId, reviewStatus, page, pageSize);
    }

    const response = await http.get<unknown>(API_CONFIG.ENDPOINTS.DATASET_QAS(datasetId), {
      params: {
        review_status: reviewStatus?.trim() || undefined,
        page,
        page_size: pageSize
      }
    });
    return parseQAs(response.data, page, pageSize);
  },

  async parse(datasetId: string): Promise<DatasetParseResult> {
    if (API_CONFIG.USE_MOCK) {
      const mockDatasetApi = await getDatasetMockApi();
      return mockDatasetApi.parse(datasetId);
    }

    const response = await http.post<unknown>(API_CONFIG.ENDPOINTS.DATASET_PARSE(datasetId), {});
    return parseDatasetParseResult(response.data);
  },

  async triggerVectorSync(datasetId: string): Promise<DatasetVectorSyncResult> {
    if (API_CONFIG.USE_MOCK) {
      const mockDatasetApi = await getDatasetMockApi();
      return mockDatasetApi.triggerVectorSync(datasetId);
    }

    const response = await http.post<unknown>(API_CONFIG.ENDPOINTS.DATASET_VECTOR_SYNC(datasetId), {});
    return parseVectorSyncResult(response.data);
  },

  async startQaGeneration(payload: DatasetQAGenerationPayload): Promise<DatasetQAGenerationTask> {
    if (API_CONFIG.USE_MOCK) {
      const mockDatasetApi = await getDatasetMockApi();
      return mockDatasetApi.startQaGeneration(payload);
    }

    const response = await http.post<unknown>(API_CONFIG.ENDPOINTS.DATASET_QA_GENERATION_START, payload);
    return parseQAGenerationTask(response.data);
  },

  async getQaGenerationTask(taskId: string): Promise<DatasetQAGenerationTask> {
    if (API_CONFIG.USE_MOCK) {
      const mockDatasetApi = await getDatasetMockApi();
      return mockDatasetApi.getQaGenerationTask(taskId);
    }

    const response = await http.get<unknown>(API_CONFIG.ENDPOINTS.DATASET_QA_GENERATION_TASK(taskId));
    return parseQAGenerationTask(response.data);
  }
};
