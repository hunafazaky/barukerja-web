"use client";

import { useDocumentTitle } from "@/hooks/use-document-title";
import { Suspense } from "react";
import Link from "next/link";
import { DeletedJobNotice } from "@/components/deleted-job-notice";
import { InlineError } from "@/components/inline-error";
import { PageHeader } from "@/components/page-header";
import { RequireAuth } from "@/components/require-auth";
import { PaginationControls } from "@/components/pagination-controls";
import { Skeleton } from "@/components/ui/skeleton";
import { useHistory } from "@/hooks/use-history";
import { useClampPage, usePageParam } from "@/hooks/use-page-param";

function HistoryPageContent() {
  useDocumentTitle("Recently viewed");
  const [page, setPage] = usePageParam();
  const { entries, pagination, isLoading, error } = useHistory(page);

  useClampPage(page, pagination, setPage);
  const showSkeleton =
    isLoading || (!!pagination && page > Math.max(pagination.totalPages, 1));

  return (
    <>
      <PageHeader title="Recently viewed" />
      {showSkeleton &&
        Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="mb-3 h-16 w-full" />
        ))}

      {!showSkeleton && error && (
        <InlineError className="py-6">{error}</InlineError>
      )}

      {!showSkeleton && !error && entries.length === 0 && (
        <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
          No viewed jobs yet.{" "}
          <Link href="/jobs" className="underline">
            Browse open jobs
          </Link>
          .
        </p>
      )}

      <div className="divide-y" style={{ borderColor: "var(--color-border)" }}>
        {!showSkeleton &&
          !error &&
          entries.map((entry) => (
            <div key={entry.id} className="py-4">
              {entry.job ? (
                <>
                  <Link
                    href={`/jobs/${entry.job.id}`}
                    className="font-bold hover:underline"
                    style={{ fontFamily: "var(--font-heading)" }}
                  >
                    {entry.job.title}
                  </Link>
                  <p
                    className="text-sm"
                    style={{ color: "var(--color-text-muted)" }}
                  >
                    {entry.job.company.name} · Viewed{" "}
                    {new Date(entry.last_read_at).toLocaleDateString()}
                  </p>
                </>
              ) : (
                <DeletedJobNotice />
              )}
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
    </>
  );
}

export default function HistoryPage() {
  return (
    <RequireAuth>
      <Suspense fallback={null}>
        <HistoryPageContent />
      </Suspense>
    </RequireAuth>
  );
}
