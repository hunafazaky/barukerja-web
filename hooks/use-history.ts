"use client";

import { useApiQuery } from "@/hooks/use-api-query";
import { getMyHistory } from "@/lib/history.api";
import { toPagination } from "@/lib/pagination";

export function useHistory(page: number) {
  const { data, isLoading, error, refetch } = useApiQuery(
    `history:${page}`,
    (token) => getMyHistory({ page }, token as string),
    {
      auth: "required",
      errorMessage: "Failed to load your history. Please try again.",
    },
  );
  return {
    entries: data?.items ?? [],
    pagination: toPagination(data),
    isLoading,
    error,
    refetch,
  };
}
