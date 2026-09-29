"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { getMyHistory } from "@/lib/history.api";
import { ApiError } from "@/types/api";
import { HistoryEntry } from "@/types/history";

export function useHistory(page: number) {
  const { accessToken } = useAuth();
  const [entries, setEntries] = useState<HistoryEntry[]>([]);
  const [pagination, setPagination] = useState<{
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchHistory = useCallback(async () => {
    if (!accessToken) return;
    setIsLoading(true);
    setError(null);
    try {
      const result = await getMyHistory({ page }, accessToken);
      setEntries(result.items);
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
          : "Failed to load your history. Please try again.",
      );
    } finally {
      setIsLoading(false);
    }
  }, [page, accessToken]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  return { entries, pagination, isLoading, error, refetch: fetchHistory };
}
