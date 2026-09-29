"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { checkBookmark, toggleBookmark } from "@/lib/bookmark.api";

// Manages bookmark state for a single job — used on the job detail page,
// where (unlike the list endpoint) GET /jobs/:id doesn't tell us whether
// it's bookmarked, so this checks separately once signed in.
export function useBookmark(jobId: string) {
  const { user, accessToken } = useAuth();
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [isToggling, setIsToggling] = useState(false);

  useEffect(() => {
    if (!user || !accessToken) {
      setIsBookmarked(false);
      return;
    }
    let cancelled = false;
    checkBookmark(jobId, accessToken)
      .then((result) => {
        if (!cancelled) setIsBookmarked(result.is_bookmarked);
      })
      .catch(() => {
        // Not worth surfacing an error for — the bookmark button just
        // stays in its default (unbookmarked) state if this fails.
      });
    return () => {
      cancelled = true;
    };
  }, [jobId, user, accessToken]);

  async function toggle() {
    if (!accessToken || isToggling) return;
    setIsToggling(true);
    try {
      const result = await toggleBookmark(jobId, accessToken);
      setIsBookmarked(result.is_bookmarked);
    } finally {
      setIsToggling(false);
    }
  }

  return { isSignedIn: !!user, isBookmarked, isToggling, toggle };
}
