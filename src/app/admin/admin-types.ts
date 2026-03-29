/** Shared pagination fields for all admin paginated API responses */
export interface PaginatedApiResponse {
  total: number
  page: number
  totalPages: number
}
