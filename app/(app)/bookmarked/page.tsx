"use client";

import { Suspense } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { RequireAuth } from "@/components/require-auth";
import { PaginationControls } from "@/components/pagination-controls";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/context/AuthContext";
import { useBookmarks } from "@/hooks/use-bookmarks";
import { usePageParam } from "@/hooks/use-page-param";
import { toggleBookmark } from "@/lib/bookmark.api";

function BookmarkedPageContent() {
  const { accessToken } = useAuth();
  const [page, setPage] = usePageParam();
  const { bookmarks, pagination, isLoading, error, refetch } =
    useBookmarks(page);

  async function handleRemove(jobId: string) {
    if (!accessToken) return;
    await toggleBookmark(jobId, accessToken);
    refetch();
  }

  return (
    <>
      <PageHeader title="Bookmarked jobs" />
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

      {!isLoading && !error && bookmarks.length === 0 && (
        <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
          No bookmarked jobs yet.{" "}
          <Link href="/jobs" className="underline">
            Browse open jobs
          </Link>
          .
        </p>
      )}

      <div className="divide-y" style={{ borderColor: "var(--color-border)" }}>
        {!isLoading &&
          !error &&
          bookmarks.map((bookmark, i) => (
            <div
              key={bookmark.id}
              className={`flex items-center justify-between gap-4 py-4 ${i === 0 ? "" : "border-t"}`}
              style={{ borderColor: "var(--color-border)" }}
            >
              <div>
                <Link
                  href={`/jobs/${bookmark.job.id}`}
                  className="font-bold hover:underline"
                  style={{ fontFamily: "var(--font-heading)" }}
                >
                  {bookmark.job.title}
                </Link>
                <p
                  className="text-sm"
                  style={{ color: "var(--color-text-muted)" }}
                >
                  {bookmark.job.company.name}
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleRemove(bookmark.job.id)}
              >
                Remove
              </Button>
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

export default function BookmarkedPage() {
  return (
    <RequireAuth>
      <Suspense fallback={null}>
        <BookmarkedPageContent />
      </Suspense>
    </RequireAuth>
  );
}
