import type { PaginatedResponse } from "@/types/api";

export interface PaginationInfo {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Strips the items off a paginated response, leaving just the paging info
// the list pages need for <PaginationControls>.
export function toPagination(
  result: PaginatedResponse<unknown> | undefined,
): PaginationInfo | null {
  if (!result) return null;
  return {
    total: result.total,
    page: result.page,
    limit: result.limit,
    totalPages: result.totalPages,
  };
}
