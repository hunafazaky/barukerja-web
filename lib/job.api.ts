import { apiFetch } from "@/lib/api";
import { PaginatedResponse } from "@/types/api";
import { Job, JobFormInput, JobQueryParams, MyJob } from "@/types/job";

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

// ==================================================
// List the signed-in employer's own posted jobs.
// Backend route: GET /api/jobs/mine (requires sign-in, role: employer)
// ==================================================
export function getMyJobs(
  params: { page?: number; limit?: number },
  accessToken: string,
): Promise<PaginatedResponse<MyJob>> {
  const searchParams = new URLSearchParams();
  if (params.page) searchParams.set("page", String(params.page));
  if (params.limit) searchParams.set("limit", String(params.limit));
  const queryString = searchParams.toString();

  return apiFetch<PaginatedResponse<MyJob>>(
    `/jobs/mine${queryString ? `?${queryString}` : ""}`,
    { accessToken },
  );
}

// ==================================================
// Post a new job.
// Backend route: POST /api/jobs (requires sign-in, role: employer)
//
// Fails with a 400 if the employer doesn't have a company profile yet
// (the backend looks it up by the signed-in user, not by an id in the
// body) — create one via lib/company.api.ts's createCompany first.
//
// Only `id` is typed on the returned job (not the full shape) — the
// backend's create/update/remove responses populate different fields
// inconsistently from each other and from GET /jobs/mine, so rather than
// rely on any of them for display, callers should just navigate using
// the id and let the destination page do its own fetch.
// ==================================================
export function createJob(
  input: JobFormInput,
  accessToken: string,
): Promise<{ message: string; job: { id: string } }> {
  return apiFetch(`/jobs`, {
    method: "POST",
    body: input,
    accessToken,
  });
}

// ==================================================
// Update one of the signed-in employer's own jobs.
// Backend route: PATCH /api/jobs/:id (requires sign-in, must own it)
// ==================================================
export function updateJob(
  id: string,
  input: Partial<JobFormInput>,
  accessToken: string,
): Promise<{ message: string; job: { id: string } }> {
  return apiFetch(`/jobs/${id}`, {
    method: "PATCH",
    body: input,
    accessToken,
  });
}

// ==================================================
// Delete one of the signed-in employer's own jobs.
// Backend route: DELETE /api/jobs/:id (requires sign-in, must own it)
//
// Not always an actual delete — if the job already has applications, the
// backend closes it instead of deleting it (so applicants don't lose
// their application history), and says so in the response message.
// ==================================================
export function deleteJob(
  id: string,
  accessToken: string,
): Promise<{ message: string; job?: { id: string; status: string } }> {
  return apiFetch(`/jobs/${id}`, {
    method: "DELETE",
    accessToken,
  });
}
