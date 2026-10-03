"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { getMyJobs } from "@/lib/job.api";
import { ApiError } from "@/types/api";
import { MyJob } from "@/types/job";

export function useMyJobs(page: number) {
  const { accessToken } = useAuth();
  const [jobs, setJobs] = useState<MyJob[]>([]);
  const [pagination, setPagination] = useState<{
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchJobs = useCallback(async () => {
    if (!accessToken) return;
    setIsLoading(true);
    setError(null);
    try {
      const result = await getMyJobs({ page }, accessToken);
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
          : "Failed to load your jobs. Please try again.",
      );
    } finally {
      setIsLoading(false);
    }
  }, [page, accessToken]);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  return { jobs, pagination, isLoading, error, refetch: fetchJobs };
}
