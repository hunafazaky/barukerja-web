"use client";

import { useApiQuery } from "@/hooks/use-api-query";
import { getApplicationsByJob } from "@/lib/application.api";
import { toPagination } from "@/lib/pagination";

export function useJobApplicants(jobId: string, page: number) {
  const { data, isLoading, error, refetch } = useApiQuery(
    `applicants:${jobId}:${page}`,
    (token) => getApplicationsByJob(jobId, { page }, token as string),
    {
      auth: "required",
      errorMessage: "Failed to load applicants. Please try again.",
    },
  );
  return {
    applicants: data?.items ?? [],
    pagination: toPagination(data),
    isLoading,
    error,
    refetch,
  };
}
