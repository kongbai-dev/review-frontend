import { API_CONFIG } from '@/config';
import { expectNumber, expectOptionalNumber, expectOptionalString, expectString, expectStringArray, isObject } from '@/lib/contract';
import { http } from '@/services/http';
import type { ListResponse, PagedListResponse } from '@/types/api';
import type {
  CodeDependency,
  CodeFileListQuery,
  CodeFragment,
  KnowledgeCodeFile,
  UploadCodeFilePayload,
  UploadCodeFileResult
} from '@/types/domain';

let codeMockApiPromise: Promise<typeof import('@/services/mock/code.mock').mockCodeApi> | null = null;

const getCodeMockApi = async (): Promise<typeof import('@/services/mock/code.mock').mockCodeApi> => {
  if (!codeMockApiPromise) {
    codeMockApiPromise = import('@/services/mock/code.mock').then((module) => module.mockCodeApi);
  }
  return codeMockApiPromise;
};

const parseCodeFile = (raw: unknown, path = 'codeFile'): KnowledgeCodeFile => {
  if (!isObject(raw)) {
    throw new Error(`Contract mismatch: ${path} must be object`);
  }

  return {
    id: expectString(raw.id, `${path}.id`),
    file_name: expectString(raw.file_name, `${path}.file_name`),
    file_path: expectString(raw.file_path, `${path}.file_path`),
    knowledge_base: expectString(raw.knowledge_base, `${path}.knowledge_base`),
    code_type: expectString(raw.code_type, `${path}.code_type`),
    language: expectString(raw.language, `${path}.language`),
    sub_type: expectOptionalString(raw.sub_type, `${path}.sub_type`),
    simulation_tool: expectOptionalString(raw.simulation_tool, `${path}.simulation_tool`),
    tool_version: expectOptionalString(raw.tool_version, `${path}.tool_version`),
    tool_version_exact: expectOptionalString(raw.tool_version_exact, `${path}.tool_version_exact`),
    file_version: expectOptionalString(raw.file_version, `${path}.file_version`),
    source: expectOptionalString(raw.source, `${path}.source`),
    project_id: expectOptionalString(raw.project_id, `${path}.project_id`),
    project_role: expectOptionalString(raw.project_role, `${path}.project_role`),
    source_doc_id: expectOptionalString(raw.source_doc_id, `${path}.source_doc_id`),
    source_doc_page: expectOptionalNumber(raw.source_doc_page, `${path}.source_doc_page`),
    source_doc_block_index: expectOptionalNumber(raw.source_doc_block_index, `${path}.source_doc_block_index`),
    topics: Array.isArray(raw.topics) ? expectStringArray(raw.topics, `${path}.topics`) : [],
    scenes: Array.isArray(raw.scenes) ? expectStringArray(raw.scenes, `${path}.scenes`) : [],
    tags: Array.isArray(raw.tags) ? expectStringArray(raw.tags, `${path}.tags`) : [],
    authors: Array.isArray(raw.authors) ? expectStringArray(raw.authors, `${path}.authors`) : [],
    owner: expectOptionalString(raw.owner, `${path}.owner`),
    license: expectOptionalString(raw.license, `${path}.license`),
    file_hash: expectString(raw.file_hash, `${path}.file_hash`),
    file_size: expectOptionalNumber(raw.file_size, `${path}.file_size`),
    line_count: expectOptionalNumber(raw.line_count, `${path}.line_count`),
    encoding: expectOptionalString(raw.encoding, `${path}.encoding`),
    description: expectOptionalString(raw.description, `${path}.description`),
    summary_for_retrieval: expectOptionalString(raw.summary_for_retrieval, `${path}.summary_for_retrieval`),
    retrieval_boost: expectOptionalNumber(raw.retrieval_boost, `${path}.retrieval_boost`),
    is_active: typeof raw.is_active === 'boolean' ? raw.is_active : undefined,
    is_verified: typeof raw.is_verified === 'boolean' ? raw.is_verified : undefined,
    verified_by: expectOptionalString(raw.verified_by, `${path}.verified_by`),
    verified_at: expectOptionalString(raw.verified_at, `${path}.verified_at`),
    created_by_user_id: expectOptionalNumber(raw.created_by_user_id, `${path}.created_by_user_id`),
    created_at: expectOptionalString(raw.created_at, `${path}.created_at`),
    updated_at: expectOptionalString(raw.updated_at, `${path}.updated_at`),
    fragment_count: expectOptionalNumber(raw.fragment_count, `${path}.fragment_count`) ?? 0
  };
};

const parseCodeList = (raw: unknown, page: number, pageSize: number): PagedListResponse<KnowledgeCodeFile> => {
  if (!isObject(raw) || !Array.isArray(raw.items)) {
    throw new Error('Contract mismatch: code file list response must be { items, total, page, page_size }');
  }

  return {
    items: raw.items.map((item, index) => parseCodeFile(item, `codeFiles[${index}]`)),
    total: expectNumber(raw.total, 'codeFiles.total'),
    page: raw.page === undefined ? page : expectNumber(raw.page, 'codeFiles.page'),
    page_size: raw.page_size === undefined ? pageSize : expectNumber(raw.page_size, 'codeFiles.page_size')
  };
};

const parseUploadResult = (raw: unknown): UploadCodeFileResult => {
  if (!isObject(raw)) {
    throw new Error('Contract mismatch: code upload response must be object');
  }

  return {
    file_id: expectString(raw.file_id, 'codeUpload.file_id'),
    file_name: expectString(raw.file_name, 'codeUpload.file_name'),
    knowledge_base: expectString(raw.knowledge_base, 'codeUpload.knowledge_base'),
    code_type: expectString(raw.code_type, 'codeUpload.code_type'),
    language: expectString(raw.language, 'codeUpload.language'),
    sub_type: expectOptionalString(raw.sub_type, 'codeUpload.sub_type'),
    fragment_count: expectNumber(raw.fragment_count, 'codeUpload.fragment_count'),
    dependency_count: expectNumber(raw.dependency_count, 'codeUpload.dependency_count'),
    queued_vector_jobs: expectNumber(raw.queued_vector_jobs, 'codeUpload.queued_vector_jobs')
  };
};

const parseDependencies = (raw: unknown): ListResponse<CodeDependency> => {
  if (!isObject(raw) || !Array.isArray(raw.items)) {
    throw new Error('Contract mismatch: code dependency response must be { items, total }');
  }

  return {
    items: raw.items.map((item, index) => {
      if (!isObject(item)) {
        throw new Error(`Contract mismatch: codeDependencies[${index}] must be object`);
      }
      return {
        id: expectString(item.id, `codeDependencies[${index}].id`),
        source_fragment_id: expectString(item.source_fragment_id, `codeDependencies[${index}].source_fragment_id`),
        target_fragment_id: expectOptionalString(item.target_fragment_id, `codeDependencies[${index}].target_fragment_id`),
        target_external: expectOptionalString(item.target_external, `codeDependencies[${index}].target_external`),
        relation_type: expectString(item.relation_type, `codeDependencies[${index}].relation_type`),
        relation_meta: isObject(item.relation_meta) ? item.relation_meta : undefined,
        strength: expectOptionalNumber(item.strength, `codeDependencies[${index}].strength`),
        created_at: expectOptionalString(item.created_at, `codeDependencies[${index}].created_at`)
      };
    }),
    total: expectNumber(raw.total, 'codeDependencies.total')
  };
};

const parseFragments = (raw: unknown, page: number, pageSize: number): PagedListResponse<CodeFragment> => {
  if (!isObject(raw) || !Array.isArray(raw.items)) {
    throw new Error('Contract mismatch: code fragments response must be { items, total, page, page_size }');
  }

  return {
    items: raw.items.map((item, index) => {
      if (!isObject(item)) {
        throw new Error(`Contract mismatch: codeFragments[${index}] must be object`);
      }
      return {
        id: expectString(item.id, `codeFragments[${index}].id`),
        file_id: expectString(item.file_id, `codeFragments[${index}].file_id`),
        project_id: expectOptionalString(item.project_id, `codeFragments[${index}].project_id`),
        fragment_type: expectString(item.fragment_type, `codeFragments[${index}].fragment_type`),
        symbol_name: expectOptionalString(item.symbol_name, `codeFragments[${index}].symbol_name`),
        language: expectOptionalString(item.language, `codeFragments[${index}].language`),
        content: expectString(item.content, `codeFragments[${index}].content`),
        summary_for_retrieval: expectOptionalString(item.summary_for_retrieval, `codeFragments[${index}].summary_for_retrieval`),
        line_start: expectOptionalNumber(item.line_start, `codeFragments[${index}].line_start`),
        line_end: expectOptionalNumber(item.line_end, `codeFragments[${index}].line_end`),
        retrieval_weight: expectOptionalNumber(item.retrieval_weight, `codeFragments[${index}].retrieval_weight`),
        source: expectOptionalString(item.source, `codeFragments[${index}].source`),
        created_at: expectOptionalString(item.created_at, `codeFragments[${index}].created_at`)
      };
    }),
    total: expectNumber(raw.total, 'codeFragments.total'),
    page: raw.page === undefined ? page : expectNumber(raw.page, 'codeFragments.page'),
    page_size: raw.page_size === undefined ? pageSize : expectNumber(raw.page_size, 'codeFragments.page_size')
  };
};

const buildListParams = (query: CodeFileListQuery): Record<string, string | number> => {
  const params: Record<string, string | number> = {
    page: query.page,
    page_size: query.page_size
  };

  if (query.knowledge_base?.trim()) params.knowledge_base = query.knowledge_base.trim();
  if (query.code_type?.trim()) params.code_type = query.code_type.trim();
  if (query.language?.trim()) params.language = query.language.trim();
  if (query.project_id?.trim()) params.project_id = query.project_id.trim();
  if (query.project_role?.trim()) params.project_role = query.project_role.trim();
  if (query.keyword?.trim()) params.keyword = query.keyword.trim();

  return params;
};

export const codeApi = {
  async getList(query: CodeFileListQuery): Promise<PagedListResponse<KnowledgeCodeFile>> {
    if (API_CONFIG.USE_MOCK) {
      const mockCodeApi = await getCodeMockApi();
      return mockCodeApi.getList(query);
    }

    const response = await http.get<unknown>(API_CONFIG.ENDPOINTS.CODE_FILE_LIST, {
      params: buildListParams(query)
    });
    return parseCodeList(response.data, query.page, query.page_size);
  },

  async upload(payload: UploadCodeFilePayload): Promise<UploadCodeFileResult> {
    if (API_CONFIG.USE_MOCK) {
      const mockCodeApi = await getCodeMockApi();
      return mockCodeApi.upload(payload);
    }

    const formData = new FormData();
    formData.append('code_file', payload.code_file);
    formData.append('knowledge_base', payload.knowledge_base?.trim() || 'default');
    formData.append('source', payload.source?.trim() || 'manual_upload');

    if (payload.project_id?.trim()) formData.append('project_id', payload.project_id.trim());
    if (payload.project_role?.trim()) formData.append('project_role', payload.project_role.trim());
    if (payload.code_type?.trim()) formData.append('code_type', payload.code_type.trim());
    if (payload.language?.trim()) formData.append('language', payload.language.trim());
    if (payload.sub_type?.trim()) formData.append('sub_type', payload.sub_type.trim());

    const response = await http.post<unknown>(API_CONFIG.ENDPOINTS.CODE_FILE_UPLOAD, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });

    return parseUploadResult(response.data);
  },

  async getDetail(fileId: string): Promise<KnowledgeCodeFile> {
    if (API_CONFIG.USE_MOCK) {
      const mockCodeApi = await getCodeMockApi();
      return mockCodeApi.getDetail(fileId);
    }

    const response = await http.get<unknown>(API_CONFIG.ENDPOINTS.CODE_FILE_DETAIL(fileId));
    return parseCodeFile(response.data, 'codeFileDetail');
  },

  async getDependencies(fileId: string): Promise<ListResponse<CodeDependency>> {
    if (API_CONFIG.USE_MOCK) {
      const mockCodeApi = await getCodeMockApi();
      return mockCodeApi.getDependencies(fileId);
    }

    const response = await http.get<unknown>(API_CONFIG.ENDPOINTS.CODE_FILE_DEPENDENCIES(fileId));
    return parseDependencies(response.data);
  },

  async getFragments(fileId: string, page = 1, pageSize = 20): Promise<PagedListResponse<CodeFragment>> {
    if (API_CONFIG.USE_MOCK) {
      const mockCodeApi = await getCodeMockApi();
      return mockCodeApi.getFragments(fileId, page, pageSize);
    }

    const response = await http.get<unknown>(API_CONFIG.ENDPOINTS.CODE_FILE_FRAGMENTS(fileId), {
      params: {
        page,
        page_size: pageSize
      }
    });
    return parseFragments(response.data, page, pageSize);
  }
};
