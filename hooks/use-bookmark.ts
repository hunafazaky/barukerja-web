"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useApiQuery } from "@/hooks/use-api-query";
import { checkBookmark, toggleBookmark } from "@/lib/bookmark.api";
import { ApiError } from "@/types/api";

// Manages bookmark state for a single job — used on the job detail page,
// where (unlike the list endpoint) GET /jobs/:id doesn't tell us whether
// it's bookmarked, so this checks separately once signed in.
export function useBookmark(jobId: string) {
  const { user, accessToken, getAccessToken } = useAuth();
  const [isToggling, setIsToggling] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // The result of the user's own toggle, for this job. It wins over the
  // initial check once set.
  const [override, setOverride] = useState<{
    jobId: string;
    value: boolean;
  } | null>(null);

  // A failed initial check isn't worth surfacing — the button just stays in
  // its default (unbookmarked) state.
  const { data } = useApiQuery(
    `bookmark-check:${jobId}`,
    (token) => checkBookmark(jobId, token as string),
    { auth: "required" },
  );

  const isBookmarked =
    override?.jobId === jobId
      ? override.value
      : user
        ? (data?.is_bookmarked ?? false)
        : false;

  async function toggle() {
    const token = getAccessToken() ?? accessToken;
    if (!token || isToggling) return;
    setIsToggling(true);
    setError(null);
    try {
      const result = await toggleBookmark(jobId, token);
      setOverride({ jobId, value: result.is_bookmarked });
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "Couldn't update your bookmark. Please try again.",
      );
    } finally {
      setIsToggling(false);
    }
  }

  return { isSignedIn: !!user, isBookmarked, isToggling, error, toggle };
}
