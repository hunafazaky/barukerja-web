import { JobCompany } from "@/types/company";

export type WorkMode = "onsite" | "hybrid" | "remote";
export type JobType =
  | "full_time"
  | "part_time"
  | "contract"
  | "internship"
  | "volunteer";
export type JobStatus = "draft" | "open" | "closed";

// The "poster" info GET /jobs and GET /jobs/:id populate onto a Job —
// only a trimmed-down subset of the full User, not the whole profile.
// See api/src/controllers/job.controller.ts's .populate("posted_by", ...).
export interface JobPoster {
  id: string;
  display_name: string;
  photo?: string;
  bio?: string;
}

// The trimmed-down job info GET /bookmarks and GET /history populate
// onto each entry (.select("title company posted_by")) — not the full
// Job shape above. Both endpoints select the exact same fields, so this
// is shared between types/bookmark.ts and types/history.ts.
export interface JobSummary {
  id: string;
  title: string;
  company: JobCompany;
  posted_by: string;
  bookmarked: boolean;
}

// A single job, as returned by both GET /jobs (inside "items") and
// GET /jobs/:id.
export interface Job {
  id: string;
  title: string;
  description: string;
  posted_by: JobPoster;
  company: JobCompany;
  location?: string;
  work_mode: WorkMode;
  job_type: JobType;
  experience_level?: string;
  salary_min?: number;
  salary_max?: number;
  currency?: string;
  categories: string[];
  deadline?: string;
  status: JobStatus;
  applicant_count: number;
  view_count: number;
  createdAt: string;
  updatedAt: string;
  // Only present on GET /jobs (list) responses when signed in — GET
  // /jobs/:id does NOT include this field at all, so the job detail
  // page checks bookmark status separately via GET /bookmarks/check/:jobId.
  bookmarked?: boolean;
}

// Filters/sorting accepted by GET /jobs.
// See api/src/utils/validationSchemas.ts -> jobQuerySchema.
export interface JobQueryParams {
  page?: number;
  limit?: number;
  q?: string;
  company?: string;
  categories?: string[];
  work_mode?: WorkMode[];
  job_type?: JobType[];
  location?: string;
  experience_level?: string;
  salary_min?: number;
  sort?: "newest" | "salary_high" | "salary_low" | "deadline_soon";
}

// What POST /jobs and PATCH /jobs/:id accept.
// See api/src/utils/validationSchemas.ts -> jobCreateSchema / jobUpdateSchema.
// Requires an employer to already have a Company profile (the backend
// looks it up by the signed-in user, not by an id in the body).
export interface JobFormInput {
  title: string;
  description: string;
  location?: string;
  work_mode: WorkMode;
  job_type: JobType;
  experience_level?: string;
  salary_min?: number;
  salary_max?: number;
  currency?: string;
  categories?: string[];
  deadline?: string;
  status?: JobStatus;
}

// The shape every "list of jobs" hook returns — useJobs (public browse),
// and later the mine/bookmarked/history variants — so they can all plug
// into the same list component.
export interface JobListResult {
  jobs: Job[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  } | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}
