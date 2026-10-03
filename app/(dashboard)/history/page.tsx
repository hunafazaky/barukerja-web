"use client";

import { Suspense } from "react";
import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { RequireAuth } from "@/components/require-auth";
import { PaginationControls } from "@/components/pagination-controls";
import { Skeleton } from "@/components/ui/skeleton";
import { useHistory } from "@/hooks/use-history";
import { usePageParam } from "@/hooks/use-page-param";

function HistoryPageContent() {
  const [page, setPage] = usePageParam();
  const { entries, pagination, isLoading, error } = useHistory(page);

  return (
    <>
      <SiteHeader title="Recently viewed" />
      <div className="mx-auto w-full max-w-3xl px-4 py-6 md:px-6">
        {isLoading &&
          Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="mb-3 h-16 w-full" />
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

        {!isLoading && !error && entries.length === 0 && (
          <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
            No viewed jobs yet.{" "}
            <Link href="/jobs" className="underline">
              Browse open jobs
            </Link>
            .
          </p>
        )}

        <div
          className="divide-y"
          style={{ borderColor: "var(--color-border)" }}
        >
          {!isLoading &&
            !error &&
            entries.map((entry, i) => (
              <div
                key={entry.id}
                className={`py-4 ${i === 0 ? "" : "border-t"}`}
                style={{ borderColor: "var(--color-border)" }}
              >
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

export default function HistoryPage() {
  return (
    <RequireAuth>
      <Suspense fallback={null}>
        <HistoryPageContent />
      </Suspense>
    </RequireAuth>
  );
}
