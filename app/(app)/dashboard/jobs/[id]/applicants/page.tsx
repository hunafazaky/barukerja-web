"use client";

import { Suspense, useState } from "react";
import { useParams } from "next/navigation";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { InlineError } from "@/components/inline-error";
import { PageHeader } from "@/components/page-header";
import { RequireAuth } from "@/components/require-auth";
import { PaginationControls } from "@/components/pagination-controls";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/context/AuthContext";
import { useJobApplicants } from "@/hooks/use-job-applicants";
import { useClampPage, usePageParam } from "@/hooks/use-page-param";
import { openUrlInNewTab } from "@/lib/open-url";
import { ApiError } from "@/types/api";
import {
  getApplicationCvUrl,
  updateApplicationStatus,
} from "@/lib/application.api";
import {
  ALLOWED_STATUS_TRANSITIONS,
  ApplicationStatus,
  JobApplicant,
} from "@/types/application";

const STATUS_LABELS: Record<ApplicationStatus, string> = {
  applied: "Applied",
  reviewed: "Reviewed",
  interview: "Interview",
  accepted: "Accepted",
  rejected: "Rejected",
};

function statusStyle(status: ApplicationStatus) {
  if (status === "accepted") {
    return { borderColor: "var(--color-brand)", color: "var(--color-brand)" };
  }
  if (status === "rejected") {
    return { borderColor: "var(--color-danger)", color: "var(--color-danger)" };
  }
  if (status === "interview") {
    return {
      borderColor: "var(--color-highlight)",
      color: "var(--color-highlight)",
    };
  }
  return undefined;
}

function ApplicantsPageContent() {
  const { id: jobId } = useParams<{ id: string }>();
  const { getAccessToken } = useAuth();
  const [page, setPage] = usePageParam();
  const { applicants, pagination, isLoading, error, refetch } =
    useJobApplicants(jobId, page);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  // Rejecting is final (rejected has no allowed next status), so it asks
  // first; the other transitions are one click.
  const [rejectTarget, setRejectTarget] = useState<JobApplicant | null>(null);

  useClampPage(page, pagination, setPage);
  const showSkeleton =
    isLoading || (!!pagination && page > Math.max(pagination.totalPages, 1));

  async function handleStatusChange(id: string, status: ApplicationStatus) {
    const token = getAccessToken();
    if (!token) return;
    setBusyId(id);
    setActionError(null);
    try {
      await updateApplicationStatus(id, status, token);
      refetch();
    } catch (err) {
      setActionError(
        err instanceof ApiError
          ? err.message
          : "Couldn't update this application. Please try again.",
      );
    } finally {
      setBusyId(null);
    }
  }

  async function handleViewCv(id: string) {
    const token = getAccessToken();
    if (!token) return;
    setBusyId(id);
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
      setBusyId(null);
    }
  }

  return (
    <>
      <PageHeader title="Applicants" />
      {actionError && <InlineError className="mb-4">{actionError}</InlineError>}

      {showSkeleton &&
        Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="mb-3 h-28 w-full" />
        ))}

      {!showSkeleton && error && (
        <InlineError className="py-6">{error}</InlineError>
      )}

      {!showSkeleton && !error && applicants.length === 0 && (
        <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
          No applicants yet.
        </p>
      )}

      <div className="divide-y" style={{ borderColor: "var(--color-border)" }}>
        {!showSkeleton &&
          !error &&
          applicants.map((applicant, i) => {
            const nextStatuses = ALLOWED_STATUS_TRANSITIONS[applicant.status];
            const isBusy = busyId === applicant.id;

            return (
              <div
                key={applicant.id}
                className={`py-4 ${i === 0 ? "" : "border-t"}`}
                style={{ borderColor: "var(--color-border)" }}
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p
                      className="font-bold"
                      style={{ fontFamily: "var(--font-heading)" }}
                    >
                      {applicant.applicant.display_name}
                    </p>
                    <p
                      className="text-sm"
                      style={{ color: "var(--color-text-muted)" }}
                    >
                      {applicant.applicant.email}
                    </p>
                  </div>
                  <Badge
                    variant="outline"
                    style={statusStyle(applicant.status)}
                  >
                    {STATUS_LABELS[applicant.status]}
                  </Badge>
                </div>

                {applicant.cover_letter && (
                  <p className="mt-2 text-sm whitespace-pre-wrap">
                    {applicant.cover_letter}
                  </p>
                )}

                <div className="mt-3 flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={isBusy}
                    onClick={() => handleViewCv(applicant.id)}
                  >
                    View CV
                  </Button>
                  {nextStatuses.map((nextStatus) => (
                    <Button
                      key={nextStatus}
                      variant="outline"
                      size="sm"
                      disabled={isBusy}
                      onClick={() =>
                        nextStatus === "rejected"
                          ? setRejectTarget(applicant)
                          : handleStatusChange(applicant.id, nextStatus)
                      }
                      style={
                        nextStatus === "rejected"
                          ? { color: "var(--color-danger)" }
                          : undefined
                      }
                    >
                      Mark as {STATUS_LABELS[nextStatus]}
                    </Button>
                  ))}
                </div>
              </div>
            );
          })}
      </div>

      {!showSkeleton && !error && pagination && (
        <PaginationControls
          page={pagination.page}
          totalPages={pagination.totalPages}
          onPageChange={setPage}
        />
      )}

      <ConfirmDialog
        open={rejectTarget !== null}
        onOpenChange={(open) => {
          if (!open) setRejectTarget(null);
        }}
        title="Reject this applicant?"
        description={`${rejectTarget?.applicant.display_name ?? "This applicant"} will be marked as rejected. This can't be undone.`}
        confirmLabel="Reject"
        destructive
        onConfirm={() =>
          rejectTarget
            ? handleStatusChange(rejectTarget.id, "rejected")
            : undefined
        }
      />
    </>
  );
}

export default function ApplicantsPage() {
  return (
    <RequireAuth role="employer">
      <Suspense fallback={null}>
        <ApplicantsPageContent />
      </Suspense>
    </RequireAuth>
  );
}
