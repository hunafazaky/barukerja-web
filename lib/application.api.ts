import { apiFetch } from "@/lib/api";
import { PaginatedResponse } from "@/types/api";
import {
  Application,
  ApplicationFormInput,
  ApplicationStatus,
  JobApplicant,
} from "@/types/application";

// ==================================================
// Submit an application to a job.
// Backend route: POST /api/applications (requires sign-in, role: seeker)
//
// input.cv_key must come from uploading a file first via
// lib/upload.api.ts's uploadFile(file, "cv") — this call only records
// the application, it doesn't handle the file itself.
// ==================================================
export function createApplication(
  input: ApplicationFormInput,
  accessToken: string,
): Promise<{ message: string; application: Application }> {
  return apiFetch(`/applications`, {
    method: "POST",
    body: input,
    accessToken,
  });
}

// ==================================================
// List the signed-in seeker's own applications.
// Backend route: GET /api/applications/mine (requires sign-in, role: seeker)
// ==================================================
export function getMyApplications(
  params: { page?: number; limit?: number },
  accessToken: string,
): Promise<PaginatedResponse<Application>> {
  const searchParams = new URLSearchParams();
  if (params.page) searchParams.set("page", String(params.page));
  if (params.limit) searchParams.set("limit", String(params.limit));
  const queryString = searchParams.toString();

  return apiFetch<PaginatedResponse<Application>>(
    `/applications/mine${queryString ? `?${queryString}` : ""}`,
    { accessToken },
  );
}

// ==================================================
// Withdraw an application — only allowed while it's still in the
// "applied" state (see api/src/utils/applicationStatus.ts); once an
// employer has moved it to "reviewed" or later, the backend rejects this.
// Backend route: DELETE /api/applications/:id (requires sign-in, role: seeker)
// ==================================================
export function withdrawApplication(
  id: string,
  accessToken: string,
): Promise<{ message: string }> {
  return apiFetch(`/applications/${id}`, {
    method: "DELETE",
    accessToken,
  });
}

// ==================================================
// Get a short-lived signed URL to download an application's CV.
// Backend route: GET /api/applications/:id/cv-url (requires sign-in —
// either the applicant themselves, or the job's owner)
// ==================================================
export function getApplicationCvUrl(
  id: string,
  accessToken: string,
): Promise<{ url: string; expiresIn: number }> {
  return apiFetch(`/applications/${id}/cv-url`, { accessToken });
}

// ==================================================
// List applicants for one of the signed-in employer's own jobs.
// Backend route: GET /api/applications/job/:jobId (requires sign-in,
// must own the job)
// ==================================================
export function getApplicationsByJob(
  jobId: string,
  params: { page?: number; limit?: number },
  accessToken: string,
): Promise<PaginatedResponse<JobApplicant>> {
  const searchParams = new URLSearchParams();
  if (params.page) searchParams.set("page", String(params.page));
  if (params.limit) searchParams.set("limit", String(params.limit));
  const queryString = searchParams.toString();

  return apiFetch<PaginatedResponse<JobApplicant>>(
    `/applications/job/${jobId}${queryString ? `?${queryString}` : ""}`,
    { accessToken },
  );
}

// ==================================================
// Move an application to its next status.
// Backend route: PATCH /api/applications/:id/status (requires sign-in,
// must own the application's job)
//
// The backend enforces the same transitions as
// ALLOWED_STATUS_TRANSITIONS below — rejects anything else with a 400.
// Only `status` is typed on the returned application, for the same
// reason as createJob/updateJob: the backend's populate here
// (`job: "posted_by"` only) isn't useful for display, so don't rely on
// it — the caller already knows which application this is.
// ==================================================
export function updateApplicationStatus(
  id: string,
  status: ApplicationStatus,
  accessToken: string,
): Promise<{
  message: string;
  application: { id: string; status: ApplicationStatus };
}> {
  return apiFetch(`/applications/${id}/status`, {
    method: "PATCH",
    body: { status },
    accessToken,
  });
}
