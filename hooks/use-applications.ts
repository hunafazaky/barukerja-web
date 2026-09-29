"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { getMyApplications } from "@/lib/application.api";
import { ApiError } from "@/types/api";
import { Application } from "@/types/application";

export function useApplications(page: number) {
  const { accessToken } = useAuth();
  const [applications, setApplications] = useState<Application[]>([]);
  const [pagination, setPagination] = useState<{
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchApplications = useCallback(async () => {
    if (!accessToken) return;
    setIsLoading(true);
    setError(null);
    try {
      const result = await getMyApplications({ page }, accessToken);
      setApplications(result.items);
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
          : "Failed to load your applications. Please try again.",
      );
    } finally {
      setIsLoading(false);
    }
  }, [page, accessToken]);

  useEffect(() => {
    fetchApplications();
  }, [fetchApplications]);

  return { applications, pagination, isLoading, error, refetch: fetchApplications };
}
