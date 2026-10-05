"use client";

import {
  useCallback,
  useEffect,
  useEffectEvent,
  useRef,
  useState,
} from "react";
import { useAuth } from "@/context/AuthContext";
import { ApiError } from "@/types/api";

// "none"     — public endpoint, never needs a token (fetches immediately).
// "optional" — public endpoint that behaves better signed in (e.g. adds
//              `bookmarked`). Waits for the session check to finish so it
//              fires once, with the right token, instead of once anonymous
//              and again a beat later.
// "required" — needs a signed-in user; waits for the token.
export type QueryAuth = "none" | "optional" | "required";

interface Options {
  auth?: QueryAuth;
  // Shown when something other than an ApiError is thrown.
  errorMessage?: string;
}

interface Settled<T> {
  key: string;
  data?: T;
  error?: string;
}

// One data-fetching hook for every page (replaces nine near-identical
// useEffect + useState hooks). It fixes three real bugs they all shared:
//
// 1. Stale responses: a slower earlier request could land after a newer one
//    and overwrite it (typing in search, quick pagination). Each effect run
//    now ignores its result once superseded.
// 2. Token churn: they listed `accessToken` as a dependency, so every silent
//    ~15-minute token refresh re-fetched the page and flashed the loading
//    state (unmounting any form being edited). The token is read at call time
//    via getAccessToken() and only "am I signed in?" is a dependency.
// 3. Anonymous-then-authenticated double fetch on first load.
//
// `key` must change whenever the request's inputs change (page, filters...).
// Loading is derived (the stored result is for a different key), so no state
// is set synchronously inside the effect.
export function useApiQuery<T>(
  key: string,
  fetcher: (accessToken: string | null) => Promise<T>,
  {
    auth = "none",
    errorMessage = "Something went wrong. Please try again.",
  }: Options = {},
) {
  const { accessToken, isLoading: authLoading, getAccessToken } = useAuth();
  const isAuthenticated = !!accessToken;

  const ready =
    auth === "none"
      ? true
      : auth === "optional"
        ? !authLoading
        : !authLoading && isAuthenticated;
  // A sign-in/out must refetch ("optional" endpoints change their response),
  // but a token refresh must not — hence a boolean, not the token itself.
  const fullKey = auth === "none" ? key : `${key}|${isAuthenticated ? 1 : 0}`;

  const [settled, setSettled] = useState<Settled<T> | null>(null);
  const [reloadTick, setReloadTick] = useState(0);

  // The request currently (or last) in flight, by identity. React 18+/19
  // StrictMode (dev only) runs every effect twice on mount; without this the
  // page would fire each request twice in development — and e.g. GET
  // /jobs/:id has side effects (history upsert). Re-running an effect for the
  // SAME request reuses the same promise instead of sending another one.
  const inflight = useRef<{ id: string; promise: Promise<T> } | null>(null);

  const run = useEffectEvent((id: string) => {
    if (inflight.current?.id === id) return inflight.current.promise;
    const promise = fetcher(getAccessToken());
    inflight.current = { id, promise };
    return promise;
  });
  const toMessage = useEffectEvent((err: unknown) =>
    err instanceof ApiError ? err.message : errorMessage,
  );

  useEffect(() => {
    if (!ready) return;
    let superseded = false;
    run(`${fullKey}#${reloadTick}`).then(
      (data) => {
        if (!superseded) setSettled({ key: fullKey, data });
      },
      (err) => {
        if (!superseded) setSettled({ key: fullKey, error: toMessage(err) });
      },
    );
    return () => {
      superseded = true;
    };
  }, [ready, fullKey, reloadTick]);

  const current = settled && settled.key === fullKey ? settled : null;
  const hasError = !!current?.error;

  // After an error, "Try again" shows the loading state again. Otherwise
  // (e.g. refreshing a list after a withdraw/delete) the current data stays
  // on screen until the new data arrives — no skeleton flash.
  const refetch = useCallback(() => {
    if (hasError) setSettled(null);
    setReloadTick((t) => t + 1);
  }, [hasError]);

  return {
    data: current?.data,
    error: current?.error ?? null,
    isLoading: !ready || !current,
    refetch,
  };
}
