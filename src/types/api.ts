export interface PaginationQuery {
  page?: number;
  pageSize?: number;
  limit?: number;
}

export interface ListResponse<T> {
  items: T[];
  total: number;
}
