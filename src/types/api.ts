// API request and response types

export interface ApiError {
  error: string
  details?: string
  statusCode: number
}

export interface PaginationParams {
  page?: number
  limit?: number
  offset?: number
}

export interface SortParams {
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'

export interface FetchOptions extends RequestInit {
  method?: HttpMethod
  headers?: HeadersInit
  body?: string
}
