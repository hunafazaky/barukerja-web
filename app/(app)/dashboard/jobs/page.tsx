"use client";

import { useDocumentTitle } from "@/hooks/use-document-title";
import { Suspense, useState } from "react";
import Link from "next/link";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { InlineError } from "@/components/inline-error";
import { PageHeader } from "@/components/page-header";
import { RequireAuth } from "@/components/require-auth";
import { PaginationControls } from "@/components/pagination-controls";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/context/AuthContext";
import { useMyJobs } from "@/hooks/use-my-jobs";
import { useClampPage, usePageParam } from "@/hooks/use-page-param";
import { deleteJob } from "@/lib/job.api";
import { ApiError } from "@/types/api";
import { MyJob } from "@/types/job";

function MyJobsPageContent() {
  useDocumentTitle("My jobs");
  const { getAccessToken } = useAuth();
  const [page, setPage] = usePageParam();
  const { jobs, pagination, isLoading, error, refetch } = useMyJobs(page);
  const [deleteTarget, setDeleteTarget] = useState<MyJob | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  useClampPage(page, pagination, setPage);
  const showSkeleton =
    isLoading || (!!pagination && page > Math.max(pagination.totalPages, 1));

  async function handleDelete(id: string) {
    const token = getAccessToken();
    if (!token) return;
    setActionError(null);
    try {
      await deleteJob(id, token);
      refetch();
    } catch (err) {
      setActionError(
        err instanceof ApiError
          ? err.message
          : "Couldn't delete this job. Please try again.",
      );
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

      {actionError && <InlineError className="mb-4">{actionError}</InlineError>}

      {showSkeleton &&
        Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="mb-3 h-20 w-full" />
        ))}

      {!showSkeleton && error && (
        <InlineError className="py-6">{error}</InlineError>
      )}

      {!showSkeleton && !error && jobs.length === 0 && (
        <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
          You haven&apos;t posted any jobs yet.
        </p>
      )}

      <div className="divide-y" style={{ borderColor: "var(--color-border)" }}>
        {!showSkeleton &&
          !error &&
          jobs.map((job) => (
            <div key={job.id} className="py-4">
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
                <StatusBadge kind="job" status={job.status} />
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
                  onClick={() => setDeleteTarget(job)}
                  style={{ color: "var(--color-danger)" }}
                >
                  Delete
                </Button>
              </div>
            </div>
          ))}
      </div>

      {!showSkeleton && !error && pagination && (
        <PaginationControls
          page={pagination.page}
          totalPages={pagination.totalPages}
          onPageChange={setPage}
        />
      )}

      <ConfirmDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        title="Delete this job?"
        description={`"${deleteTarget?.title ?? ""}" will be deleted. If it already has applications, it will be closed instead so applicants keep their history.`}
        confirmLabel="Delete"
        destructive
        onConfirm={() =>
          deleteTarget ? handleDelete(deleteTarget.id) : undefined
        }
      />
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
