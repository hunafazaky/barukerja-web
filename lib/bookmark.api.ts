import { apiFetch } from "@/lib/api";
import { PaginatedResponse } from "@/types/api";
import { Bookmark } from "@/types/bookmark";

// ==================================================
// List the signed-in user's bookmarked jobs.
// Backend route: GET /api/bookmarks (requires sign-in)
// ==================================================
export function getMyBookmarks(
  params: { page?: number; limit?: number },
  accessToken: string,
): Promise<PaginatedResponse<Bookmark>> {
  const searchParams = new URLSearchParams();
  if (params.page) searchParams.set("page", String(params.page));
  if (params.limit) searchParams.set("limit", String(params.limit));
  const queryString = searchParams.toString();

  return apiFetch<PaginatedResponse<Bookmark>>(
    `/bookmarks${queryString ? `?${queryString}` : ""}`,
    { accessToken },
  );
}

// ==================================================
// Check whether the signed-in user has bookmarked a job.
// Backend route: GET /api/bookmarks/check/:jobId (requires sign-in)
//
// Only needed on the job detail page — GET /jobs (list) already includes
// a "bookmarked" flag per job, so list views don't need this.
// ==================================================
export function checkBookmark(
  jobId: string,
  accessToken: string,
): Promise<{ is_bookmarked: boolean; bookmarkId: string | null }> {
  return apiFetch(`/bookmarks/check/${jobId}`, { accessToken });
}

// ==================================================
// Toggle a job's bookmark on/off for the signed-in user.
// Backend route: POST /api/bookmarks/toggle/:jobId (requires sign-in)
//
// The backend itself decides add vs. remove based on current state —
// there's no separate "add"/"remove" endpoint, just this one toggle.
// ==================================================
export function toggleBookmark(
  jobId: string,
  accessToken: string,
): Promise<{ is_bookmarked: boolean; message: string }> {
  return apiFetch(`/bookmarks/toggle/${jobId}`, {
    method: "POST",
    accessToken,
  });
}
