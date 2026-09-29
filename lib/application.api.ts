import { apiFetch } from "@/lib/api";
import { PaginatedResponse } from "@/types/api";
import { Application, ApplicationFormInput } from "@/types/application";

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
