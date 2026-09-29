"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { getMyBookmarks } from "@/lib/bookmark.api";
import { ApiError } from "@/types/api";
import { Bookmark } from "@/types/bookmark";

export function useBookmarks(page: number) {
  const { accessToken } = useAuth();
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [pagination, setPagination] = useState<{
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBookmarks = useCallback(async () => {
    if (!accessToken) return;
    setIsLoading(true);
    setError(null);
    try {
      const result = await getMyBookmarks({ page }, accessToken);
      setBookmarks(result.items);
      setPagination({
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: result.totalPages,
      });
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "Failed to load your bookmarks. Please try again.",
      );
    } finally {
      setIsLoading(false);
    }
  }, [page, accessToken]);

  useEffect(() => {
    fetchBookmarks();
  }, [fetchBookmarks]);

  return { bookmarks, pagination, isLoading, error, refetch: fetchBookmarks };
}
