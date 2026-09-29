import { apiFetch } from "@/lib/api";
import { PaginatedResponse } from "@/types/api";
import { Job, JobQueryParams } from "@/types/job";

// ==================================================
// Turn a JobQueryParams object into a query string like
// "?page=2&limit=12&q=engineer&work_mode=remote&work_mode=hybrid".
//
// Kept as its own small function so it's easy to read/test on its own,
// separate from the actual fetch call below.
// ==================================================
function buildJobsQueryString(params: JobQueryParams = {}): string {
  const searchParams = new URLSearchParams();

  if (params.page) searchParams.set("page", String(params.page));
  if (params.limit) searchParams.set("limit", String(params.limit));
  if (params.q) searchParams.set("q", params.q);
  if (params.company) searchParams.set("company", params.company);
  if (params.location) searchParams.set("location", params.location);
  if (params.experience_level)
    searchParams.set("experience_level", params.experience_level);
  if (params.salary_min !== undefined)
    searchParams.set("salary_min", String(params.salary_min));
  if (params.sort) searchParams.set("sort", params.sort);

  // These can be filtered by more than one value at once, so each gets
  // its own repeated query-string entry — matches how the backend's Joi
  // schema accepts either a single string or an array for these fields.
  if (params.categories) {
    for (const category of params.categories) {
      searchParams.append("categories", category);
    }
  }
  if (params.work_mode) {
    for (const mode of params.work_mode) {
      searchParams.append("work_mode", mode);
    }
  }
  if (params.job_type) {
    for (const type of params.job_type) {
      searchParams.append("job_type", type);
    }
  }

  const queryString = searchParams.toString();
  return queryString ? `?${queryString}` : "";
}

// ==================================================
// List jobs, with optional pagination/filtering.
// Backend route: GET /api/jobs (public, optional auth)
//
// Passing an accessToken is optional. If provided, the backend includes
// a "bookmarked" field on each job showing whether the signed-in user
// has bookmarked it — otherwise every job comes back with bookmarked: false.
// ==================================================
export function getJobs(
  params?: JobQueryParams,
  accessToken?: string | null,
): Promise<PaginatedResponse<Job>> {
  const queryString = buildJobsQueryString(params);
  return apiFetch<PaginatedResponse<Job>>(`/jobs${queryString}`, {
    accessToken,
  });
}

// ==================================================
// Get a single job by id.
// Backend route: GET /api/jobs/:id (public, optional auth)
//
// Note: calling this also increments the job's view_count on the
// backend (once per signed-in viewer), and — if signed in — records it
// in that user's viewing history. Same side-effect pattern the old
// work.api.ts documented for GET /works/:id.
// ==================================================
export function getJobById(
  id: string,
  accessToken?: string | null,
): Promise<Job> {
  return apiFetch<Job>(`/jobs/${id}`, { accessToken });
}
