"use client";

import { Suspense, useState } from "react";
import { useParams } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
import { RequireAuth } from "@/components/require-auth";
import { PaginationControls } from "@/components/pagination-controls";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/context/AuthContext";
import { useJobApplicants } from "@/hooks/use-job-applicants";
import { usePageParam } from "@/hooks/use-page-param";
import {
  getApplicationCvUrl,
  updateApplicationStatus,
} from "@/lib/application.api";
import {
  ALLOWED_STATUS_TRANSITIONS,
  ApplicationStatus,
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
    return { borderColor: "var(--color-accent)", color: "var(--color-accent)" };
  }
  if (status === "rejected") {
    return { borderColor: "var(--color-danger)", color: "var(--color-danger)" };
  }
  if (status === "interview") {
    return {
      borderColor: "var(--color-accent-secondary)",
      color: "var(--color-accent-secondary)",
    };
  }
  return undefined;
}

function ApplicantsPageContent() {
  const { id: jobId } = useParams<{ id: string }>();
  const { accessToken } = useAuth();
  const [page, setPage] = usePageParam();
  const { applicants, pagination, isLoading, error, refetch } =
    useJobApplicants(jobId, page);
  const [busyId, setBusyId] = useState<string | null>(null);

  async function handleStatusChange(id: string, status: ApplicationStatus) {
    if (!accessToken) return;
    setBusyId(id);
    try {
      await updateApplicationStatus(id, status, accessToken);
      refetch();
    } finally {
      setBusyId(null);
    }
  }

  async function handleViewCv(id: string) {
    if (!accessToken) return;
    setBusyId(id);
    try {
      const { url } = await getApplicationCvUrl(id, accessToken);
      window.open(url, "_blank", "noopener,noreferrer");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <>
      <SiteHeader title="Applicants" />
      <div className="mx-auto w-full max-w-3xl px-4 py-6 md:px-6">
        {isLoading &&
          Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="mb-3 h-28 w-full" />
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

        {!isLoading && !error && applicants.length === 0 && (
          <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
            No applicants yet.
          </p>
        )}

        <div
          className="divide-y"
          style={{ borderColor: "var(--color-border)" }}
        >
          {!isLoading &&
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
                          handleStatusChange(applicant.id, nextStatus)
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

        {!isLoading && !error && pagination && (
          <PaginationControls
            page={pagination.page}
            totalPages={pagination.totalPages}
            onPageChange={setPage}
          />
        )}
      </div>
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
