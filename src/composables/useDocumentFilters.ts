import { reactive } from 'vue';
import type { DocumentListQuery, DocumentSortField, DocumentStatus, SortOrder } from '@/types/domain';

export interface DocumentFilterState {
  keyword: string;
  file_type: string;
  status: DocumentStatus | '';
  sort_by: DocumentSortField;
  order: SortOrder;
}

const defaultFilterState = (): DocumentFilterState => ({
  keyword: '',
  file_type: '',
  status: '',
  sort_by: 'uploaded_at',
  order: 'desc'
});

export const documentFileTypeOptions = ['pdf', 'doc', 'docx', 'txt', 'md', 'csv'] as const;

export const useDocumentFilters = () => {
  const filters = reactive<DocumentFilterState>(defaultFilterState());

  const syncFromQuery = (query: Partial<DocumentListQuery>): void => {
    filters.keyword = query.keyword ?? '';
    filters.file_type = query.file_type ?? '';
    filters.status = query.status ?? '';
    filters.sort_by = query.sort_by ?? 'uploaded_at';
    filters.order = query.order ?? 'desc';
  };

  const reset = (): void => {
    Object.assign(filters, defaultFilterState());
  };

  const toQuery = (): Pick<DocumentListQuery, 'keyword' | 'file_type' | 'status' | 'sort_by' | 'order'> => ({
    keyword: filters.keyword,
    file_type: filters.file_type,
    status: filters.status,
    sort_by: filters.sort_by,
    order: filters.order
  });

  return {
    filters,
    syncFromQuery,
    reset,
    toQuery
  };
};
