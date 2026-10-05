"use client";

import { useApiQuery } from "@/hooks/use-api-query";
import { getJobs } from "@/lib/job.api";
import { toPagination } from "@/lib/pagination";
import { JobListResult, JobQueryParams } from "@/types/job";

// Fetches a page of jobs from GET /api/jobs.
//
// If the user is signed in, their access token is sent so the backend can
// include each job's "bookmarked" status. The fetch waits for the session
// check to finish, so signed-in visitors load the list once (not once
// anonymous, then again with a token).
export function useJobs(params: JobQueryParams = {}): JobListResult {
  // Params can hold arrays and a fresh object every render, so the request
  // identity is their serialised form.
  const key = `jobs:${JSON.stringify(params)}`;

  const { data, isLoading, error, refetch } = useApiQuery(
    key,
    (token) => getJobs(params, token),
    {
      auth: "optional",
      errorMessage: "Failed to load jobs. Please try again.",
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
