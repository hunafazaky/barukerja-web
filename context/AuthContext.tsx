"use client";

import {
  createContext,
  useContext,
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
        setAccessToken(newToken);
      },
      onRefreshFailed: () => {
        // The refresh cookie itself is gone or expired too — there's no
        // session left to recover, so reflect that honestly rather than
        // silently pretending everything's fine.
        setAccessToken(null);
        setUser(null);
      },
    });
  }, []);

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
          setAccessToken(null);
          setUser(null);
          return;
        }

        setAccessToken(data.accessToken);
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
        setAccessToken(null);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    }

    restoreSession();
  }, []);

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

    setAccessToken(data.accessToken);
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

    setAccessToken(data.accessToken);
    setUser(newUser);
  }

  // ==================================================
  // Sign out: tell the backend to clear the refresh cookie, then clear
  // our local state regardless of whether the API call succeeds, so the
  // UI always ends up in a signed-out state.
  // ==================================================
  async function signout() {
    try {
      await apiSignout();
    } catch (err) {
      // Log it, but a failed signout call on the backend shouldn't trap
      // the user in a signed-in-looking UI.
      if (err instanceof ApiError) {
        console.error("Signout request failed:", err.message);
      }
    } finally {
      setAccessToken(null);
      setUser(null);
      router.replace("/auth/signin");
    }
  }

  return (
    <AuthContext.Provider
      value={{ user, accessToken, isLoading, signin, signup, signout }}
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
