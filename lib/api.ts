import { ApiError, ApiErrorResponse } from "@/types/api";

// Every request goes to "/api/..." on THIS site — never straight to the
// backend. next.config.ts rewrites that, server-side, to
// `${BACKEND_API_URL}/api/...`. The browser never sees the real backend
// origin, and because the response comes back from our own origin, the
// refreshToken cookie is stored as a first-party cookie — not affected
// by third-party-cookie blocking or SameSite rules the way a
// cross-origin cookie would be.
//
// (There used to be a NEXT_PUBLIC_API_URL here that the browser called
// directly, cross-origin. That's been replaced by this proxy — see
// next.config.ts for where BACKEND_API_URL is actually configured.)
const API_BASE = "/api";

interface ApiFetchOptions {
  method?: "GET" | "POST" | "PATCH" | "DELETE";
  // The request body, as a plain JS object. We stringify it for you.
  body?: unknown;
  // The current access token, if the user is signed in and this route needs auth.
  accessToken?: string | null;
}

// ==================================================
// Automatic silent token refresh
//
// The access token is short-lived (see JWT_EXPIRES_IN on the backend —
// 15 minutes by default). If someone leaves a page open and idle past
// that, their next request fails with 401 and
// { code: "TOKEN_EXPIRED" } (see app/utils/authMiddleware.js on the
// backend). Rather than showing that as an error, we catch it here,
// silently trade the refresh cookie for a new access token, and retry
// the exact same request once — the caller never needs to know this
// happened.
//
// This is safe to retry blindly because of how the backend is built:
// authMiddleware runs BEFORE any controller logic, so a 401 means the
// request never reached the point of actually doing anything (creating a
// work, etc.) — retrying can't cause a duplicate action.
// ==================================================

// AuthContext registers these on mount, so a refresh triggered from here
// (deep inside a plain, non-React function) can still update the app's
// real React state — the signed-in user stays signed in with a fresh
// token, without any component needing to orchestrate that itself.
let onTokenRefreshed: ((newToken: string) => void) | null = null;
let onRefreshFailed: (() => void) | null = null;

export function registerAuthRefreshHandlers(handlers: {
  onTokenRefreshed: (newToken: string) => void;
  onRefreshFailed: () => void;
}) {
  onTokenRefreshed = handlers.onTokenRefreshed;
  onRefreshFailed = handlers.onRefreshFailed;
}

// If several requests happen to expire at the same moment (e.g. a page
// that fires off a few authenticated requests at once), we don't want
// each one racing to refresh separately — they all share this one
// in-flight promise instead, so only a single refresh call actually
// happens.
let refreshPromise: Promise<string | null> | null = null;

function refreshAccessTokenOnce(): Promise<string | null> {
  if (!refreshPromise) {
    refreshPromise = (async () => {
      try {
        const response = await fetch(`${API_BASE}/users/refresh`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
        });
        if (!response.ok) return null;

        const data = await response.json();
        return typeof data.accessToken === "string" ? data.accessToken : null;
      } catch {
        return null;
      } finally {
        // Let the next expired-token request (if any) trigger a fresh
        // refresh attempt, once this one has settled either way.
        refreshPromise = null;
      }
    })();
  }

  return refreshPromise;
}

// A single helper function used for every request to the backend.
//
// It takes care of:
// - Building the full URL (API_BASE + path, proxied to the real backend
//   by next.config.ts's rewrites — see the comment on API_BASE above)
// - Sending cookies (needed for the refresh token cookie)
// - Setting JSON headers and stringifying the body
// - Attaching the "Authorization: Bearer <token>" header when we have one
// - Silently refreshing and retrying once if the access token expired
// - Reading the JSON response
// - Throwing a typed ApiError when the response is not ok (status >= 400)
export async function apiFetch<TResponse>(
  path: string,
  options: ApiFetchOptions = {},
): Promise<TResponse> {
  const { method = "GET", body, accessToken } = options;

  async function send(token?: string | null) {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE}${path}`, {
      method,
      headers,
      // Same-origin now (see API_BASE above), so the browser would send
      // this cookie by default anyway — "include" is kept explicit
      // rather than relying on that default, since it costs nothing and
      // protects against this code being copied somewhere cross-origin
      // again later.
      credentials: "include",
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });

    // The backend always returns JSON, even for errors, so we can safely
    // parse it. (If parsing fails, something is very wrong — e.g. the API
    // is down — and we let that error bubble up naturally.)
    const data = await response.json();
    return { response, data };
  }

  let { response, data } = await send(accessToken);

  if (!response.ok && accessToken && (data as ApiErrorResponse)?.code === "TOKEN_EXPIRED") {
    const newToken = await refreshAccessTokenOnce();

    if (newToken) {
      onTokenRefreshed?.(newToken);
      ({ response, data } = await send(newToken));
    } else {
      // The refresh cookie itself is gone or expired too — there's no
      // way to silently recover from that, so the user really is signed
      // out. Let AuthContext know so the rest of the app reflects that,
      // and fall through below to surface the original error.
      onRefreshFailed?.();
    }
  }

  if (!response.ok) {
    const errorData = data as ApiErrorResponse;
    throw new ApiError(
      errorData.message || "Something went wrong. Please try again.",
      response.status,
      errorData.details,
    );
  }

  return data as TResponse;
}
