"use client";

import { useApiQuery } from "@/hooks/use-api-query";
import { getMyBookmarks } from "@/lib/bookmark.api";
import { toPagination } from "@/lib/pagination";

export function useBookmarks(page: number) {
  const { data, isLoading, error, refetch } = useApiQuery(
    `bookmarks:${page}`,
    (token) => getMyBookmarks({ page }, token as string),
    {
      auth: "required",
      errorMessage: "Failed to load your bookmarks. Please try again.",
    },
  );
  return {
    bookmarks: data?.items ?? [],
    pagination: toPagination(data),
    isLoading,
    error,
    refetch,
  };
}
