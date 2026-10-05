"use client";

import { useDocumentTitle } from "@/hooks/use-document-title";
import { Suspense, useState } from "react";
import Link from "next/link";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { DeletedJobNotice } from "@/components/deleted-job-notice";
import { InlineError } from "@/components/inline-error";
import { PageHeader } from "@/components/page-header";
import { RequireAuth } from "@/components/require-auth";
import { PaginationControls } from "@/components/pagination-controls";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/context/AuthContext";
import { useApplications } from "@/hooks/use-applications";
import { useClampPage, usePageParam } from "@/hooks/use-page-param";
import { openUrlInNewTab } from "@/lib/open-url";
import { ApiError } from "@/types/api";
import {
  getApplicationCvUrl,
  withdrawApplication,
} from "@/lib/application.api";
import { Application } from "@/types/application";

function ApplicationsPageContent() {
  useDocumentTitle("My applications");
  const { getAccessToken } = useAuth();
  const [page, setPage] = usePageParam();
  const { applications, pagination, isLoading, error, refetch } =
    useApplications(page);
  const [withdrawTarget, setWithdrawTarget] = useState<Application | null>(
    null,
  );
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  // After the last item on the last page is withdrawn, step back a page
  // instead of showing "You haven't applied to any jobs yet".
  useClampPage(page, pagination, setPage);
  const showSkeleton =
    isLoading || (!!pagination && page > Math.max(pagination.totalPages, 1));

  async function handleWithdraw(id: string) {
    const token = getAccessToken();
    if (!token) return;
    setActionError(null);
    try {
      await withdrawApplication(id, token);
      refetch();
    } catch (err) {
      setActionError(
        err instanceof ApiError
          ? err.message
          : "Couldn't withdraw this application. Please try again.",
      );
    }
  }

  async function handleDownloadCv(id: string) {
    const token = getAccessToken();
    if (!token) return;
    setDownloadingId(id);
    setActionError(null);
    try {
      await openUrlInNewTab(
        async () => (await getApplicationCvUrl(id, token)).url,
      );
    } catch (err) {
      setActionError(
        err instanceof ApiError
          ? err.message
          : "Couldn't open this CV. Please try again.",
      );
    } finally {
      setDownloadingId(null);
    }
  }

  return (
    <>
      <PageHeader title="My applications" />
      {actionError && <InlineError className="mb-4">{actionError}</InlineError>}

      {showSkeleton &&
        Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="mb-3 h-20 w-full" />
        ))}

      {!showSkeleton && error && (
        <InlineError className="py-6">{error}</InlineError>
      )}

      {!showSkeleton && !error && applications.length === 0 && (
        <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
          You haven&apos;t applied to any jobs yet.{" "}
          <Link href="/jobs" className="underline">
            Browse open jobs
          </Link>
          .
        </p>
      )}

      <div className="divide-y" style={{ borderColor: "var(--color-border)" }}>
        {!showSkeleton &&
          !error &&
          applications.map((application) => (
            <div
              key={application.id}
              data-testid={`application-${application.id}`}
              className="py-4"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  {application.job ? (
                    <>
                      <Link
                        href={`/jobs/${application.job.id}`}
                        className="font-bold hover:underline"
                        style={{ fontFamily: "var(--font-heading)" }}
                      >
                        {application.job.title}
                      </Link>
                      <p
                        className="text-sm"
                        style={{ color: "var(--color-text-muted)" }}
                      >
                        {application.job.company.name}
                      </p>
                    </>
                  ) : (
                    <DeletedJobNotice />
                  )}
                </div>
                <StatusBadge kind="application" status={application.status} />
              </div>

              <div className="mt-3 flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={downloadingId === application.id}
                  onClick={() => handleDownloadCv(application.id)}
                >
                  View CV
                </Button>
                {application.status === "applied" && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setWithdrawTarget(application)}
                    style={{ color: "var(--color-danger)" }}
                  >
                    Withdraw
                  </Button>
                )}
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
        open={withdrawTarget !== null}
        onOpenChange={(open) => {
          if (!open) setWithdrawTarget(null);
        }}
        title="Withdraw application?"
        description={
          withdrawTarget?.job
            ? `Your application to "${withdrawTarget.job.title}" will be removed. You can apply again later if the job is still open.`
            : "Your application will be removed."
        }
        confirmLabel="Withdraw"
        destructive
        onConfirm={() =>
          withdrawTarget ? handleWithdraw(withdrawTarget.id) : undefined
        }
      />
    </>
  );
}

export default function ApplicationsPage() {
  return (
    <RequireAuth role="seeker">
      <Suspense fallback={null}>
        <ApplicationsPageContent />
      </Suspense>
    </RequireAuth>
  );
}
