export type ApplicationStatus =
  "applied" | "reviewed" | "interview" | "accepted" | "rejected";

// The trimmed-down job info GET /applications/mine populates onto each
// application (.populate("job", "title company status")).
export interface ApplicationJob {
  id: string;
  title: string;
  company: {
    id: string;
    name: string;
    logo?: string;
  };
  status: "draft" | "open" | "closed";
}

// The trimmed-down applicant info GET /applications/job/:jobId populates
// (.populate("applicant", "display_name photo email")) — only used on
// the employer's applicant-review view, not the seeker's "mine" view.
export interface ApplicationApplicant {
  id: string;
  display_name: string;
  photo?: string;
  email: string;
}

export interface Application {
  id: string;
  job: ApplicationJob;
  applicant?: ApplicationApplicant;
  cv_key: string;
  cover_letter: string;
  status: ApplicationStatus;
  createdAt: string;
  updatedAt: string;
}

// What POST /applications accepts.
// See api/src/utils/validationSchemas.ts -> applicationCreateSchema.
// cv_key comes from uploading through lib/upload.api.ts's "cv" kind first.
export interface ApplicationFormInput {
  jobId: string;
  cv_key: string;
  cover_letter?: string;
}

// The shape GET /applications/job/:jobId returns per item — notably
// different from Application above: `job` is just the raw id (the
// employer already knows which job, from the route), while `applicant`
// IS populated (the whole point of this endpoint, for the employer's
// applicant-review view).
export interface JobApplicant {
  id: string;
  job: string;
  applicant: ApplicationApplicant;
  cv_key: string;
  cover_letter: string;
  status: ApplicationStatus;
  createdAt: string;
  updatedAt: string;
}

// Allowed status transitions, mirroring
// api/src/utils/applicationStatus.ts exactly — kept here so the
// employer's applicant-review UI (a later pass) can show only the
// buttons that would actually be accepted, instead of guessing.
export const ALLOWED_STATUS_TRANSITIONS: Record<
  ApplicationStatus,
  ApplicationStatus[]
> = {
  applied: ["reviewed", "rejected"],
  reviewed: ["interview", "rejected"],
  interview: ["accepted", "rejected"],
  accepted: [],
  rejected: [],
};
