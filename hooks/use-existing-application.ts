"use client";

import { useApiQuery } from "@/hooks/use-api-query";
import { getMyApplications } from "@/lib/application.api";
import type { Application } from "@/types/application";

const PAGE_SIZE = 100;
const MAX_PAGES = 5;

// The job detail response doesn't say whether the signed-in seeker already
// applied, so look it up in their own applications (newest first). Stops as
// soon as it finds the job. Seeker-only: mount it only for seekers.
// (Backend suggestion B11 would make this a single field on the job.)
export function useExistingApplication(jobId: string) {
  const { data, isLoading, refetch } = useApiQuery<Application | null>(
    `application-for:${jobId}`,
    async (token) => {
      for (let page = 1; page <= MAX_PAGES; page++) {
        const res = await getMyApplications(
          { page, limit: PAGE_SIZE },
          token as string,
        );
        const found = res.items.find((a) => a.job?.id === jobId);
        if (found) return found;
        if (page >= res.totalPages) break;
      }
      return null;
    },
    { auth: "required", errorMessage: "Couldn't check your applications." },
  );
  return { application: data ?? null, isLoading, refetch };
}
