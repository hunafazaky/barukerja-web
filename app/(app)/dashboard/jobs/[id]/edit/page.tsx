"use client";

import { useDocumentTitle } from "@/hooks/use-document-title";
import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { RequireAuth } from "@/components/require-auth";
import { InlineError } from "@/components/inline-error";
import { JobForm } from "@/components/job-form";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/context/AuthContext";
import { useApiQuery } from "@/hooks/use-api-query";
import { getJobById } from "@/lib/job.api";

function EditJobPageContent() {
  useDocumentTitle("Edit job");
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();

  // Fetched once. A silent token refresh (e.g. while the employer is mid-
  // edit or submitting) must NOT re-run this: it used to, which swapped the
  // form for a skeleton and discarded what they had typed.
  const {
    data: fetchedJob,
    isLoading,
    error,
  } = useApiQuery(`edit-job:${id}`, (token) => getJobById(id, token), {
    auth: "required",
    errorMessage: "Failed to load this job. Please try again.",
  });

  // Not the owner — same "safe, always-valid landing spot" pattern as
  // RequireAuth's role mismatch.
  const isOwner = !!fetchedJob && fetchedJob.posted_by.id === user?.id;
  const notOwner = !!fetchedJob && !isOwner;
  useEffect(() => {
    if (notOwner) router.replace("/dashboard/jobs");
  }, [notOwner, router]);
  const job = isOwner ? fetchedJob : null;

  return (
    <>
      <PageHeader title="Edit job" />
      {(isLoading || notOwner) && <Skeleton className="h-64 w-full" />}

      {!isLoading && error && (
        <InlineError className="py-6">{error}</InlineError>
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
