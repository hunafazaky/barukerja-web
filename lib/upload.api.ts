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
  kind: "cover" | "attachment" | "cv",
): Promise<UploadResult> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("kind", kind);

  const response = await fetch("/api/upload", {
    method: "POST",
    body: formData,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new ApiError(
      data.message || "Upload failed. Please try again.",
      response.status,
    );
  }

  return data as UploadResult;
}
