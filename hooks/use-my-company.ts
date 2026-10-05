"use client";

import { useApiQuery } from "@/hooks/use-api-query";
import { getMyCompany } from "@/lib/company.api";
import { ApiError } from "@/types/api";
import { Company } from "@/types/company";

// company === null means "confirmed no company yet" (a clean 404) — the
// caller should show the create form. error is for anything else going
// wrong, which the create form shouldn't be shown over.
export function useMyCompany() {
  const { data, isLoading, error, refetch } = useApiQuery<Company | null>(
    "my-company",
    async (token) => {
      try {
        return await getMyCompany(token as string);
      } catch (err) {
        if (err instanceof ApiError && err.statusCode === 404) return null;
        throw err;
      }
    },
    {
      auth: "required",
      errorMessage: "Failed to load your company profile. Please try again.",
    },
  );
  return { company: data ?? null, isLoading, error, refetch };
}
