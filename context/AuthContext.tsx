"use client";

import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { User } from "@/types/user";
import {
  signin as apiSignin,
  signup as apiSignup,
  signout as apiSignout,
  refreshAccessToken,
} from "@/lib/auth.api";
import { getUserById } from "@/lib/user.api";
import { decodeJwtPayload } from "@/lib/jwt";
import { ApiError } from "@/types/api";
import { registerAuthRefreshHandlers } from "@/lib/api";
import { useRouter } from "next/navigation";

interface AuthContextValue {
  // The signed-in user, or null if signed out.
  user: User | null;
  // The current JWT access token, kept in memory only (never localStorage).
  // Deliberately NOT persisted to storage: keeping it in memory means it
  // disappears on a full page refresh, which limits how long a stolen
  // token (e.g. via an XSS bug) could be reused. A fresh one is fetched
  // automatically via the refresh cookie (see the useEffect below).
  accessToken: string | null;
  // Always returns the LATEST token, without subscribing to changes. Data
  // fetching hooks use this instead of depending on `accessToken`: the token
  // is silently replaced every ~15 minutes, and a hook that lists it as a
  // dependency would re-fetch (and flash its loading state / unmount a form
  // the user is typing into) every time that happens.
  getAccessToken: () => string | null;
  // True for a moment right after the user chooses "Sign out", so
  // <RequireAuth> doesn't also redirect to /auth/signin?next=<this page>
  // (which would fight signout()'s own redirect and leave a stale ?next=).
  isSigningOut: () => boolean;
  // True while we're checking if there's an existing session (on first load).
  isLoading: boolean;
  signin: (email: string, password: string) => Promise<void>;
  signup: (input: {
    email: string;
    password: string;
    display_name?: string;
    photo?: string;
    bio?: string;
    role?: "seeker" | "employer";
  }) => Promise<void>;
  signout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

// ==================================================
// Turn a raw access token into a full User profile.
//
// The signin/signup/refresh endpoints only return { accessToken } — no
// user data. So we:
//   1. Decode the token to read the user's id (it's baked into the JWT,
//      no API call needed for this part).
//   2. Fetch the full profile with that id via GET /api/users/:id.
//
// This one function is reused by signin, signup, AND the silent-refresh-
// on-load logic below, so all three stay in sync — if the backend ever
// changes how tokens are structured, there's only one place to fix.
// ==================================================
async function loadUserFromToken(token: string): Promise<User | null> {
  const payload = decodeJwtPayload(token);
  if (!payload) return null;

  try {
    return await getUserById(payload.id);
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // The ref is updated synchronously (before React re-renders), so a request
  // started right after a silent refresh already sees the new token.
  const accessTokenRef = useRef<string | null>(null);
  const signingOutRef = useRef(false);

  const applyAccessToken = useCallback((token: string | null) => {
    accessTokenRef.current = token;
    setAccessToken(token);
  }, []);
  const getAccessToken = useCallback(() => accessTokenRef.current, []);
  const isSigningOut = useCallback(() => signingOutRef.current, []);

  // ==================================================
  // Let lib/api.ts's apiFetch() reach back into this context.
  //
  // apiFetch is a plain function, not a component — it can't call
  // setAccessToken/setUser directly. So it calls these two functions
  // instead (registered once, here), which do have access to this
  // component's real state. This is what makes a silent, mid-request
  // token refresh (see lib/api.ts) actually keep the rest of the app in
  // sync afterwards — e.g. the next request made anywhere else in the
  // app already uses the fresh token, and the user never sees anything.
  // ==================================================
  useEffect(() => {
    registerAuthRefreshHandlers({
      onTokenRefreshed: (newToken) => {
        applyAccessToken(newToken);
      },
      onRefreshFailed: () => {
        // The refresh cookie itself is gone or expired too — there's no
        // session left to recover, so reflect that honestly rather than
        // silently pretending everything's fine.
        applyAccessToken(null);
        setUser(null);
      },
    });
  }, [applyAccessToken]);

  // ==================================================
  // On first load, try to silently restore the session.
  // The browser still has the HttpOnly refresh token cookie (if the user
  // signed in before and didn't sign out), so we can trade it for a new
  // access token without asking the user to log in again.
  // ==================================================
  useEffect(() => {
    async function restoreSession() {
      try {
        const data = await refreshAccessToken();
        const restoredUser = await loadUserFromToken(data.accessToken);

        if (!restoredUser) {
          // We got a token back, but couldn't decode it or fetch the
          // matching profile. Treat this the same as "not signed in"
          // rather than leaving the app in a half-authenticated state.
          if (process.env.NODE_ENV === "development") {
            console.warn(
              "[AuthContext] Got an access token from /users/refresh, but " +
                "could not load the matching user profile.",
            );
          }
          applyAccessToken(null);
          setUser(null);
          return;
        }

        applyAccessToken(data.accessToken);
        setUser(restoredUser);
      } catch (err) {
        // No valid refresh cookie (or it expired) — that's the *expected*
        // case for a first-time visitor and isn't logged as an error.
        // But if the request failed for another reason (CORS, network,
        // server error), log it in development so it's easy to tell the
        // two cases apart instead of just seeing a blank "signed out" UI.
        if (process.env.NODE_ENV === "development") {
          console.warn(
            "[AuthContext] Silent session restore failed. This is expected " +
              "if you were never signed in. If you expected to still be " +
              "signed in, check the Network tab for the /users/refresh " +
              "request (status code + response body).",
            err,
          );
        }
        applyAccessToken(null);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    }

    restoreSession();
  }, [applyAccessToken]);

  // ==================================================
  // Sign in: call the API for a token, then load the full profile.
  // ==================================================
  async function signin(email: string, password: string) {
    const data = await apiSignin(email, password);
    const signedInUser = await loadUserFromToken(data.accessToken);

    if (!signedInUser) {
      throw new Error(
        "Signed in, but couldn't load your profile. Please try again.",
      );
    }

    signingOutRef.current = false;
    applyAccessToken(data.accessToken);
    setUser(signedInUser);
  }

  // ==================================================
  // Sign up: same idea as signin, the backend logs the user in immediately.
  // ==================================================
  async function signup(input: {
    email: string;
    password: string;
    display_name?: string;
    photo?: string;
    bio?: string;
    role?: "seeker" | "employer";
  }) {
    const data = await apiSignup(input);
    const newUser = await loadUserFromToken(data.accessToken);

    if (!newUser) {
      throw new Error(
        "Account created, but couldn't load your profile. Please try signing in.",
      );
    }

    signingOutRef.current = false;
    applyAccessToken(data.accessToken);
    setUser(newUser);
  }

  // ==================================================
  // Sign out: tell the backend to clear the refresh cookie, then clear
  // our local state regardless of whether the API call succeeds, so the
  // UI always ends up in a signed-out state.
  // ==================================================
  async function signout() {
    signingOutRef.current = true;
    try {
      await apiSignout();
    } catch (err) {
      // Log it, but a failed signout call on the backend shouldn't trap
      // the user in a signed-in-looking UI.
      if (err instanceof ApiError) {
        console.error("Signout request failed:", err.message);
      }
    } finally {
      applyAccessToken(null);
      setUser(null);
      router.replace("/auth/signin");
      // Long enough for the guard effects of the page we're leaving to run
      // and see the flag; short enough not to affect later navigation.
      setTimeout(() => {
        signingOutRef.current = false;
      }, 1000);
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        accessToken,
        getAccessToken,
        isSigningOut,
        isLoading,
        signin,
        signup,
        signout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// Small helper hook so components can do `const { user } = useAuth()`
// instead of importing useContext + AuthContext everywhere.
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
