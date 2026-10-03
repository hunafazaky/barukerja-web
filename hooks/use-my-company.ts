"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { getMyCompany } from "@/lib/company.api";
import { ApiError } from "@/types/api";
import { Company } from "@/types/company";

// company === null means "confirmed no company yet" (a clean 404) — the
// caller should show the create form. error is for anything else going
// wrong, which the create form shouldn't be shown over.
export function useMyCompany() {
  const { accessToken } = useAuth();
  const [company, setCompany] = useState<Company | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCompany = useCallback(async () => {
    if (!accessToken) return;
    setIsLoading(true);
    setError(null);
    try {
      const result = await getMyCompany(accessToken);
      setCompany(result);
    } catch (err) {
      if (err instanceof ApiError && err.statusCode === 404) {
        setCompany(null);
      } else {
        setError(
          err instanceof ApiError
            ? err.message
            : "Failed to load your company profile. Please try again.",
        );
      }
    } finally {
      setIsLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    fetchCompany();
  }, [fetchCompany]);

  return { company, isLoading, error, refetch: fetchCompany };
}
