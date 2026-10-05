"use client";

import { useApiQuery } from "@/hooks/use-api-query";
import { getMyApplications } from "@/lib/application.api";
import { toPagination } from "@/lib/pagination";

export function useApplications(page: number) {
  const { data, isLoading, error, refetch } = useApiQuery(
    `applications:${page}`,
    (token) => getMyApplications({ page }, token as string),
    {
      auth: "required",
      errorMessage: "Failed to load your applications. Please try again.",
    },
  );
  return {
    applications: data?.items ?? [],
    pagination: toPagination(data),
    isLoading,
    error,
    refetch,
  };
}
