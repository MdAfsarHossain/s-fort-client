export interface ApiEnvelope<T> {
  success: boolean;
  statusCode: number;
  message: string;
  meta?: PaginationMeta;
  data: T;
}

export interface ErrorResponse {
  success: false;
  message: string;
  errorMessages: Array<{ path: string; message: string }>;
  err?: { statusCode: number };
  stack?: string;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPage: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface PaginationParams {
  page: number;
  limit: number;
}

export interface PaginatedResult<T> {
  items: T[];
  meta: PaginationMeta;
}
