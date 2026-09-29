import { apiFetch } from "@/lib/api";
import { PaginatedResponse } from "@/types/api";
import { HistoryEntry } from "@/types/history";

// ==================================================
// List the signed-in user's job-viewing history.
// Backend route: GET /api/history (requires sign-in)
//
// Note: entries are created automatically by GET /jobs/:id on the
// backend when signed in — there's no separate "record a view" call the
// frontend needs to make. See lib/job.api.ts's getJobById.
// ==================================================
export function getMyHistory(
  params: { page?: number; limit?: number },
  accessToken: string,
): Promise<PaginatedResponse<HistoryEntry>> {
  const searchParams = new URLSearchParams();
  if (params.page) searchParams.set("page", String(params.page));
  if (params.limit) searchParams.set("limit", String(params.limit));
  const queryString = searchParams.toString();

  return apiFetch<PaginatedResponse<HistoryEntry>>(
    `/history${queryString ? `?${queryString}` : ""}`,
    { accessToken },
  );
}
