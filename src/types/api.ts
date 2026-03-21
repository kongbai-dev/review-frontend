export interface PaginationQuery {
  page?: number;
  limit?: number;
}

export interface ListResponse<T> {
  items: T[];
  total: number;
}
