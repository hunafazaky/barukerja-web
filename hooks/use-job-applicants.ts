"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { getApplicationsByJob } from "@/lib/application.api";
import { ApiError } from "@/types/api";
import { JobApplicant } from "@/types/application";

export function useJobApplicants(jobId: string, page: number) {
  const { accessToken } = useAuth();
  const [applicants, setApplicants] = useState<JobApplicant[]>([]);
  const [pagination, setPagination] = useState<{
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchApplicants = useCallback(async () => {
    if (!accessToken) return;
    setIsLoading(true);
    setError(null);
    try {
      const result = await getApplicationsByJob(jobId, { page }, accessToken);
      setApplicants(result.items);
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
          : "Failed to load applicants. Please try again.",
      );
    } finally {
      setIsLoading(false);
    }
  }, [jobId, page, accessToken]);

  useEffect(() => {
    fetchApplicants();
  }, [fetchApplicants]);

  return { applicants, pagination, isLoading, error, refetch: fetchApplicants };
}
