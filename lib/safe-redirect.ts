// Validates a post-sign-in redirect target taken from the "?next=" query
// param. Only same-site, in-app paths are allowed.
//
// A bare `startsWith("/")` check is NOT enough: "//evil.com" and "/\evil.com"
// both start with "/" but browsers treat them as protocol-relative URLs
// pointing at another host. We also refuse /auth/* targets, which would send
// a freshly signed-in user straight back into the sign-in redirect effect.
export const DEFAULT_REDIRECT = "/jobs";

export function safeNextPath(
  next: string | null | undefined,
  fallback: string = DEFAULT_REDIRECT,
): string {
  if (!next) return fallback;
  if (!next.startsWith("/")) return fallback;
  if (next.startsWith("//") || next.startsWith("/\\")) return fallback;
  if (/[\u0000-\u001f\u007f]/.test(next)) return fallback;
  if (next === "/auth" || next.startsWith("/auth/")) return fallback;
  return next;
}
