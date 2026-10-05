"use client";

import { useApiQuery } from "@/hooks/use-api-query";
import { getMyJobs } from "@/lib/job.api";
import { toPagination } from "@/lib/pagination";

export function useMyJobs(page: number) {
  const { data, isLoading, error, refetch } = useApiQuery(
    `my-jobs:${page}`,
    (token) => getMyJobs({ page }, token as string),
    {
      auth: "required",
      errorMessage: "Failed to load your jobs. Please try again.",
    },
  );
  return {
    jobs: data?.items ?? [],
    pagination: toPagination(data),
    isLoading,
    error,
    refetch,
  };
}
