// Shared between the client (for instant feedback before uploading) and
// the server route handler (the actual enforcement — client-side checks
// can always be bypassed, so the server re-checks the same rules).
// Keeping them in one file means there's only one place to change a
// limit.

export const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB
export const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB

export const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
];

// "Acceptable file is only pdf" — attachments are restricted to PDF only.
export const ALLOWED_FILE_TYPES = ["application/pdf"];

export function getUploadRules(kind: "cover" | "attachment" | "cv" | "logo") {
  return kind === "cover" || kind === "logo"
    ? { allowedTypes: ALLOWED_IMAGE_TYPES, maxSize: MAX_IMAGE_SIZE_BYTES }
    : { allowedTypes: ALLOWED_FILE_TYPES, maxSize: MAX_FILE_SIZE_BYTES };
}
