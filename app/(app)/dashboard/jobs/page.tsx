"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { RequireAuth } from "@/components/require-auth";
import { PaginationControls } from "@/components/pagination-controls";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/context/AuthContext";
import { useMyJobs } from "@/hooks/use-my-jobs";
import { usePageParam } from "@/hooks/use-page-param";
import { deleteJob } from "@/lib/job.api";
import { JobStatus } from "@/types/job";

const STATUS_LABELS: Record<JobStatus, string> = {
  draft: "Draft",
  open: "Open",
  closed: "Closed",
};

function statusStyle(status: JobStatus) {
  if (status === "open") {
    return { borderColor: "var(--color-brand)", color: "var(--color-brand)" };
  }
  if (status === "closed") {
    return { borderColor: "var(--color-danger)", color: "var(--color-danger)" };
  }
  return undefined;
}

function MyJobsPageContent() {
  const { accessToken } = useAuth();
  const [page, setPage] = usePageParam();
  const { jobs, pagination, isLoading, error, refetch } = useMyJobs(page);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function handleDelete(id: string) {
    if (!accessToken) return;
    if (
      !confirm(
        "Delete this job? If it already has applications, it will be closed instead.",
      )
    ) {
      return;
    }
    setDeletingId(id);
    try {
      await deleteJob(id, accessToken);
      refetch();
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <>
      <PageHeader
        title="My jobs"
        actions={
          <Button
            nativeButton={false}
            render={<Link href="/dashboard/jobs/new" />}
          >
            Post a job
          </Button>
        }
      />

      {isLoading &&
        Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="mb-3 h-20 w-full" />
        ))}

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

      {!isLoading && !error && jobs.length === 0 && (
        <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
          You haven&apos;t posted any jobs yet.
        </p>
      )}

      <div className="divide-y" style={{ borderColor: "var(--color-border)" }}>
        {!isLoading &&
          !error &&
          jobs.map((job, i) => (
            <div
              key={job.id}
              className={`py-4 ${i === 0 ? "" : "border-t"}`}
              style={{ borderColor: "var(--color-border)" }}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <Link
                    href={`/jobs/${job.id}`}
                    className="font-bold hover:underline"
                    style={{ fontFamily: "var(--font-heading)" }}
                  >
                    {job.title}
                  </Link>
                  <p
                    className="text-sm"
                    style={{ color: "var(--color-text-muted)" }}
                  >
                    {job.applicant_count} applicant
                    {job.applicant_count === 1 ? "" : "s"} · {job.view_count}{" "}
                    view{job.view_count === 1 ? "" : "s"}
                  </p>
                </div>
                <Badge variant="outline" style={statusStyle(job.status)}>
                  {STATUS_LABELS[job.status]}
                </Badge>
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  nativeButton={false}
                  render={
                    <Link href={`/dashboard/jobs/${job.id}/applicants`} />
                  }
                >
                  Applicants
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  nativeButton={false}
                  render={<Link href={`/dashboard/jobs/${job.id}/edit`} />}
                >
                  Edit
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={deletingId === job.id}
                  onClick={() => handleDelete(job.id)}
                  style={{ color: "var(--color-danger)" }}
                >
                  Delete
                </Button>
              </div>
            </div>
          ))}
      </div>

      {!isLoading && !error && pagination && (
        <PaginationControls
          page={pagination.page}
          totalPages={pagination.totalPages}
          onPageChange={setPage}
        />
      )}
    </>
  );
}

export default function MyJobsPage() {
  return (
    <RequireAuth role="employer">
      <Suspense fallback={null}>
        <MyJobsPageContent />
      </Suspense>
    </RequireAuth>
  );
}
