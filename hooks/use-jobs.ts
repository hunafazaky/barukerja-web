"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { getJobs } from "@/lib/job.api";
import { ApiError } from "@/types/api";
import { Job, JobListResult, JobQueryParams } from "@/types/job";

// Fetches a page of jobs from GET /api/jobs.
//
// If the user is signed in, their access token is sent automatically so
// the backend can include each job's "bookmarked" status.
export function useJobs(params: JobQueryParams = {}): JobListResult {
  const { accessToken } = useAuth();

  const [jobs, setJobs] = useState<Job[]>([]);
  const [pagination, setPagination] =
    useState<JobListResult["pagination"]>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Pull out individual primitives for the dependency array below —
  // passing "params" itself would re-run the effect every render, since
  // a brand new object is created each time even with identical values.
  const {
    page,
    limit,
    q,
    company,
    location,
    experience_level,
    salary_min,
    sort,
  } = params;
  // Arrays have the same problem, so turn each into a single comparable
  // string just for dependency-checking purposes.
  const categoriesKey = params.categories?.join(",") ?? "";
  const workModeKey = params.work_mode?.join(",") ?? "";
  const jobTypeKey = params.job_type?.join(",") ?? "";

  const fetchJobs = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await getJobs(
        {
          page,
          limit,
          q,
          company,
          location,
          experience_level,
          salary_min,
          sort,
          categories: params.categories,
          work_mode: params.work_mode,
          job_type: params.job_type,
        },
        accessToken,
      );
      setJobs(result.items);
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
          : "Failed to load jobs. Please try again.",
      );
    } finally {
      setIsLoading(false);
    }
    // "categories"/"work_mode"/"job_type" are left out of the dependency
    // array on purpose — the *Key strings above stand in for them so this
    // doesn't re-run just because a new array instance was passed in with
    // the same values.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    page,
    limit,
    q,
    company,
    location,
    experience_level,
    salary_min,
    sort,
    categoriesKey,
    workModeKey,
    jobTypeKey,
    accessToken,
  ]);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  return { jobs, pagination, isLoading, error, refetch: fetchJobs };
}
