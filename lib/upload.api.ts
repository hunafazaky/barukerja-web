import { ApiError } from "@/types/api";

export interface UploadResult {
  // Present for "cover"/"attachment" (public assets). Never present for
  // "cv" — see app/api/upload/route.ts for why.
  url?: string;
  // Present for "cv" (a relative storage key, not a public URL — this is
  // what POST /applications expects as cv_key). Not returned for the
  // other kinds today, though nothing stops the route from adding it
  // later if something else needs it.
  key?: string;
}

// ==================================================
// Uploads a file to Cloudflare R2 via our own /api/upload route.
//
// Note: this deliberately does NOT use lib/api.ts's apiFetch() — both
// this and apiFetch hit a path under "/api/..." on our own origin, but
// they're handled completely differently. apiFetch's paths get rewritten
// server-side to the real backend (see next.config.ts) — but Next.js
// route handlers win over rewrites, and app/api/upload/route.ts is a
// real route handler, so "/api/upload" is NEVER forwarded to the
// backend. It's handled right here, in our own Next.js server, which is
// the only place that holds the R2 credentials.
// ==================================================
export async function uploadFile(
  file: File,
  kind: "cover" | "attachment" | "cv" | "logo",
  accessToken?: string | null,
): Promise<UploadResult> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("kind", kind);

  let response: Response;
  try {
    response = await fetch("/api/upload", {
      method: "POST",
      headers: accessToken
        ? { Authorization: `Bearer ${accessToken}` }
        : undefined,
      body: formData,
    });
  } catch {
    throw new ApiError(
      "Can't reach the server. Check your connection and try again.",
      0,
    );
  }

  // Not every failure comes from our route handler: a hosting-level
  // rejection (e.g. 413 "payload too large" on serverless platforms) is
  // plain text/HTML, so parse defensively instead of crashing on
  // response.json().
  let data: { message?: string } & UploadResult = {};
  try {
    data = await response.json();
  } catch {
    data = {};
  }

  if (!response.ok) {
    throw new ApiError(
      data.message ||
        (response.status === 413
          ? "That file is too large to upload. Try a smaller one."
          : "Upload failed. Please try again."),
      response.status,
    );
  }

  return data as UploadResult;
}
