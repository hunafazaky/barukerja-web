"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { RequireAuth } from "@/components/require-auth";
import { JobForm } from "@/components/job-form";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/context/AuthContext";
import { getJobById } from "@/lib/job.api";
import { ApiError } from "@/types/api";
import { Job } from "@/types/job";

function EditJobPageContent() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user, accessToken } = useAuth();

  const [job, setJob] = useState<Job | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    setError(null);

    getJobById(id, accessToken)
      .then((result) => {
        if (cancelled) return;
        if (result.posted_by.id !== user?.id) {
          // Not the owner — same "safe, always-valid landing spot"
          // pattern as RequireAuth's role mismatch.
          router.replace("/dashboard/jobs");
          return;
        }
        setJob(result);
      })
      .catch((err) => {
        if (!cancelled) {
          setError(
            err instanceof ApiError
              ? err.message
              : "Failed to load this job. Please try again.",
          );
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [id, accessToken, user?.id, router]);

  return (
    <>
      <PageHeader title="Edit job" />
      {isLoading && <Skeleton className="h-64 w-full" />}

      {!isLoading && error && (
        <div
          className="rounded-md border px-4 py-6 text-sm"
          style={{
            borderColor: "var(--color-danger)",
            color: "var(--color-danger)",
          }}
        >
          {error}
        </div>
      )}

      {!isLoading && !error && job && (
        <JobForm
          existingJob={job}
          onSuccess={() => router.push("/dashboard/jobs")}
        />
      )}
    </>
  );
}

export default function EditJobPage() {
  return (
    <RequireAuth role="employer">
      <EditJobPageContent />
    </RequireAuth>
  );
}
