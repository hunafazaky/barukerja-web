"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { RequireAuth } from "@/components/require-auth";
import { PaginationControls } from "@/components/pagination-controls";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/context/AuthContext";
import { useApplications } from "@/hooks/use-applications";
import { usePageParam } from "@/hooks/use-page-param";
import { getApplicationCvUrl, withdrawApplication } from "@/lib/application.api";
import { ApplicationStatus } from "@/types/application";

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

function ApplicationsPageContent() {
  const { accessToken } = useAuth();
  const [page, setPage] = usePageParam();
  const { applications, pagination, isLoading, error, refetch } =
    useApplications(page);
  const [withdrawingId, setWithdrawingId] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  async function handleWithdraw(id: string) {
    if (!accessToken) return;
    setWithdrawingId(id);
    try {
      await withdrawApplication(id, accessToken);
      refetch();
    } finally {
      setWithdrawingId(null);
    }
  }

  async function handleDownloadCv(id: string) {
    if (!accessToken) return;
    setDownloadingId(id);
    try {
      const { url } = await getApplicationCvUrl(id, accessToken);
      window.open(url, "_blank", "noopener,noreferrer");
    } finally {
      setDownloadingId(null);
    }
  }

  return (
    <>
      <SiteHeader title="My applications" />
      <div className="mx-auto w-full max-w-3xl px-4 py-6 md:px-6">
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

        {!isLoading && !error && applications.length === 0 && (
          <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
            You haven&apos;t applied to any jobs yet.{" "}
            <Link href="/jobs" className="underline">
              Browse open jobs
            </Link>
            .
          </p>
        )}

        <div className="divide-y" style={{ borderColor: "var(--color-border)" }}>
          {!isLoading &&
            !error &&
            applications.map((application, i) => (
              <div
                key={application.id}
                className={`py-4 ${i === 0 ? "" : "border-t"}`}
                style={{ borderColor: "var(--color-border)" }}
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
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
                  </div>
                  <Badge variant="outline" style={statusStyle(application.status)}>
                    {STATUS_LABELS[application.status]}
                  </Badge>
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
                      disabled={withdrawingId === application.id}
                      onClick={() => handleWithdraw(application.id)}
                      style={{ color: "var(--color-danger)" }}
                    >
                      Withdraw
                    </Button>
                  )}
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
      </div>
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
