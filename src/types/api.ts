export interface PaginationQuery {
  page?: number;
  pageSize?: number;
  page_size?: number;
  limit?: number;
}

export interface ListResponse<T> {
  items: T[];
  total: number;
}

export interface PagedListResponse<T> extends ListResponse<T> {
  page: number;
  page_size: number;
}
