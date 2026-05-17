import { sleep } from '@/lib/async';
import type { ListResponse, PagedListResponse } from '@/types/api';
import type {
  CodeDependency,
  CodeFileListQuery,
  CodeFragment,
  KnowledgeCodeFile,
  UploadCodeFilePayload,
  UploadCodeFileResult
} from '@/types/domain';

const seedCodeFiles: KnowledgeCodeFile[] = [
  {
    id: 'code_001',
    file_name: 'sentaurus_nmosp.cmd',
    file_path: '/projects/device/sentaurus_nmosp.cmd',
    knowledge_base: 'simulation',
    code_type: 'deck',
    language: 'tcl',
    sub_type: 'sdevice',
    simulation_tool: 'Sentaurus',
    tool_version: 'O-2024.09',
    source: 'manual_upload',
    project_id: 'proj-finfet',
    project_role: 'device',
    topics: ['mosfet', 'calibration'],
    scenes: ['device_simulation'],
    tags: ['sentaurus', 'nmos'],
    authors: ['alice'],
    owner: 'alice',
    license: 'internal',
    file_hash: 'hash-code-001',
    file_size: 24820,
    line_count: 382,
    encoding: 'utf-8',
    description: 'NMOS 器件仿真 deck',
    is_active: true,
    is_verified: true,
    verified_by: 'alice',
    verified_at: '2026-05-10T09:30:00Z',
    created_at: '2026-05-08T08:12:00Z',
    updated_at: '2026-05-10T09:30:00Z',
    fragment_count: 12
  },
  {
    id: 'code_002',
    file_name: 'gaa_mesh_builder.py',
    file_path: '/projects/device/gaa_mesh_builder.py',
    knowledge_base: 'default',
    code_type: 'script',
    language: 'python',
    sub_type: 'mesh',
    source: 'manual_upload',
    project_id: 'proj-gaa',
    project_role: 'preprocess',
    topics: ['mesh', 'gaa'],
    scenes: ['preprocess'],
    tags: ['python'],
    authors: ['bob'],
    owner: 'bob',
    file_hash: 'hash-code-002',
    file_size: 18126,
    line_count: 227,
    encoding: 'utf-8',
    description: 'GAA 网格生成脚本',
    is_active: true,
    is_verified: false,
    created_at: '2026-05-06T11:20:00Z',
    updated_at: '2026-05-12T16:05:00Z',
    fragment_count: 9
  },
  {
    id: 'code_003',
    file_name: 'iv_extract.sql',
    file_path: '/projects/data/iv_extract.sql',
    knowledge_base: 'analytics',
    code_type: 'sql',
    language: 'sql',
    source: 'manual_upload',
    project_id: 'proj-analytics',
    project_role: 'analysis',
    topics: ['iv', 'extraction'],
    scenes: ['reporting'],
    tags: ['sql', 'db'],
    authors: ['carol'],
    owner: 'carol',
    file_hash: 'hash-code-003',
    file_size: 6088,
    line_count: 96,
    encoding: 'utf-8',
    description: 'IV 结果抽取 SQL',
    is_active: true,
    is_verified: true,
    verified_by: 'david',
    verified_at: '2026-05-09T14:02:00Z',
    created_at: '2026-05-03T10:10:00Z',
    updated_at: '2026-05-09T14:02:00Z',
    fragment_count: 5
  }
];

const codeFiles: KnowledgeCodeFile[] = [...seedCodeFiles];

const codeDependencies = new Map<string, CodeDependency[]>([
  [
    'code_001',
    [
      {
        id: 'dep_001',
        source_fragment_id: 'frag_001_01',
        target_external: 'models/qm.tcl',
        relation_type: 'include',
        relation_meta: { statement: 'source' },
        strength: 0.92,
        created_at: '2026-05-10T09:31:00Z'
      }
    ]
  ],
  [
    'code_002',
    [
      {
        id: 'dep_002',
        source_fragment_id: 'frag_002_01',
        target_external: 'numpy',
        relation_type: 'import',
        relation_meta: { module: 'numpy' },
        strength: 0.88,
        created_at: '2026-05-12T16:06:00Z'
      }
    ]
  ],
  ['code_003', []]
]);

const codeFragments = new Map<string, CodeFragment[]>([
  [
    'code_001',
    Array.from({ length: 12 }, (_, index) => ({
      id: `frag_001_${String(index + 1).padStart(2, '0')}`,
      file_id: 'code_001',
      project_id: 'proj-finfet',
      fragment_type: index === 0 ? 'header' : 'code_block',
      symbol_name: index === 0 ? 'main' : `block_${index + 1}`,
      language: 'tcl',
      content: `# fragment ${index + 1}\nsolve init\nmodels srh fldmob`,
      line_start: index * 20 + 1,
      line_end: index * 20 + 18,
      source: 'manual_upload',
      created_at: '2026-05-08T08:12:00Z'
    }))
  ],
  [
    'code_002',
    Array.from({ length: 9 }, (_, index) => ({
      id: `frag_002_${String(index + 1).padStart(2, '0')}`,
      file_id: 'code_002',
      project_id: 'proj-gaa',
      fragment_type: 'function',
      symbol_name: `mesh_step_${index + 1}`,
      language: 'python',
      content: `def mesh_step_${index + 1}():\n    return ${index + 1}`,
      line_start: index * 18 + 1,
      line_end: index * 18 + 12,
      source: 'manual_upload',
      created_at: '2026-05-06T11:20:00Z'
    }))
  ],
  [
    'code_003',
    Array.from({ length: 5 }, (_, index) => ({
      id: `frag_003_${String(index + 1).padStart(2, '0')}`,
      file_id: 'code_003',
      project_id: 'proj-analytics',
      fragment_type: 'query',
      symbol_name: `query_${index + 1}`,
      language: 'sql',
      content: `select * from iv_table where batch_id = ${index + 1};`,
      line_start: index * 12 + 1,
      line_end: index * 12 + 6,
      source: 'manual_upload',
      created_at: '2026-05-03T10:10:00Z'
    }))
  ]
]);

let nextCodeIndex = 4;

const paginate = <T>(items: T[], page: number, pageSize: number): PagedListResponse<T> => {
  const start = Math.max(0, (page - 1) * pageSize);
  return {
    items: items.slice(start, start + pageSize),
    total: items.length,
    page,
    page_size: pageSize
  };
};

const inferLanguage = (fileName: string): string => {
  const lower = fileName.toLowerCase();
  if (lower.endsWith('.py')) return 'python';
  if (lower.endsWith('.sql')) return 'sql';
  if (lower.endsWith('.js')) return 'javascript';
  if (lower.endsWith('.ts')) return 'typescript';
  if (lower.endsWith('.cmd') || lower.endsWith('.tcl')) return 'tcl';
  return 'text';
};

const normalize = (value: string | undefined): string => value?.trim().toLowerCase() ?? '';

const getCodeFileOrThrow = (fileId: string): KnowledgeCodeFile => {
  const item = codeFiles.find((codeFile) => codeFile.id === fileId);
  if (!item) {
    throw new Error('Code file not found');
  }
  return item;
};

export const mockCodeApi = {
  async getList(query: CodeFileListQuery): Promise<PagedListResponse<KnowledgeCodeFile>> {
    await sleep(120);

    const filtered = codeFiles.filter((item) => {
      if (query.knowledge_base?.trim() && item.knowledge_base !== query.knowledge_base.trim()) return false;
      if (query.code_type?.trim() && item.code_type !== query.code_type.trim()) return false;
      if (query.language?.trim() && item.language !== query.language.trim()) return false;
      if (query.project_id?.trim() && item.project_id !== query.project_id.trim()) return false;
      if (query.project_role?.trim() && item.project_role !== query.project_role.trim()) return false;

      const keyword = normalize(query.keyword);
      if (!keyword) return true;

      return [
        item.file_name,
        item.file_path,
        item.project_id,
        item.project_role,
        item.language,
        item.code_type
      ].some((value) => normalize(value).includes(keyword));
    });

    const sorted = [...filtered].sort((left, right) => (right.created_at ?? '').localeCompare(left.created_at ?? ''));
    return paginate(sorted, query.page, query.page_size);
  },

  async upload(payload: UploadCodeFilePayload): Promise<UploadCodeFileResult> {
    await sleep(180);

    const id = `code_${String(nextCodeIndex).padStart(3, '0')}`;
    nextCodeIndex += 1;

    const language = payload.language?.trim() || inferLanguage(payload.code_file.name);
    const codeType = payload.code_type?.trim() || 'script';
    const createdAt = new Date().toISOString();
    const nextItem: KnowledgeCodeFile = {
      id,
      file_name: payload.code_file.name,
      file_path: `/uploads/code/${payload.code_file.name}`,
      knowledge_base: payload.knowledge_base?.trim() || 'default',
      code_type: codeType,
      language,
      sub_type: payload.sub_type?.trim() || undefined,
      source: payload.source?.trim() || 'manual_upload',
      project_id: payload.project_id?.trim() || undefined,
      project_role: payload.project_role?.trim() || undefined,
      topics: [],
      scenes: [],
      tags: [],
      authors: [],
      file_hash: `hash-${id}`,
      file_size: payload.code_file.size,
      encoding: 'utf-8',
      is_active: true,
      is_verified: false,
      created_at: createdAt,
      updated_at: createdAt,
      fragment_count: 1
    };

    codeFiles.unshift(nextItem);
    codeDependencies.set(id, []);
    codeFragments.set(id, [
      {
        id: `frag_${id}_01`,
        file_id: id,
        fragment_type: 'code_block',
        language,
        content: `Uploaded file: ${payload.code_file.name}`,
        line_start: 1,
        line_end: 1,
        source: 'manual_upload',
        created_at: createdAt
      }
    ]);

    return {
      file_id: id,
      file_name: nextItem.file_name,
      knowledge_base: nextItem.knowledge_base,
      code_type: nextItem.code_type,
      language: nextItem.language,
      sub_type: nextItem.sub_type,
      fragment_count: nextItem.fragment_count,
      dependency_count: 0,
      queued_vector_jobs: 1
    };
  },

  async getDetail(fileId: string): Promise<KnowledgeCodeFile> {
    await sleep(100);
    return { ...getCodeFileOrThrow(fileId) };
  },

  async getDependencies(fileId: string): Promise<ListResponse<CodeDependency>> {
    await sleep(100);
    getCodeFileOrThrow(fileId);
    const items = [...(codeDependencies.get(fileId) ?? [])];
    return {
      items,
      total: items.length
    };
  },

  async getFragments(fileId: string, page = 1, pageSize = 20): Promise<PagedListResponse<CodeFragment>> {
    await sleep(100);
    getCodeFileOrThrow(fileId);
    const items = [...(codeFragments.get(fileId) ?? [])];
    return paginate(items, page, pageSize);
  }
};
