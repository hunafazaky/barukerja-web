"use client";

import { useDocumentTitle } from "@/hooks/use-document-title";
import { Suspense, useState } from "react";
import Link from "next/link";
import { DeletedJobNotice } from "@/components/deleted-job-notice";
import { InlineError } from "@/components/inline-error";
import { PageHeader } from "@/components/page-header";
import { RequireAuth } from "@/components/require-auth";
import { PaginationControls } from "@/components/pagination-controls";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/context/AuthContext";
import { useBookmarks } from "@/hooks/use-bookmarks";
import { useClampPage, usePageParam } from "@/hooks/use-page-param";
import { toggleBookmark } from "@/lib/bookmark.api";
import { ApiError } from "@/types/api";

function BookmarkedPageContent() {
  useDocumentTitle("Bookmarked jobs");
  const { getAccessToken } = useAuth();
  const [page, setPage] = usePageParam();
  const { bookmarks, pagination, isLoading, error, refetch } =
    useBookmarks(page);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  useClampPage(page, pagination, setPage);
  const outOfRange = !!pagination && page > Math.max(pagination.totalPages, 1);
  const showSkeleton = isLoading || outOfRange;

  async function handleRemove(bookmarkId: string, jobId: string) {
    const token = getAccessToken();
    // One removal at a time: the API *toggles*, so a second click while the
    // first is in flight would add the bookmark right back.
    if (!token || removingId) return;
    setRemovingId(bookmarkId);
    setActionError(null);
    try {
      await toggleBookmark(jobId, token);
      refetch();
    } catch (err) {
      setActionError(
        err instanceof ApiError
          ? err.message
          : "Couldn't remove this bookmark. Please try again.",
      );
    } finally {
      setRemovingId(null);
    }
  }

  return (
    <>
      <PageHeader title="Bookmarked jobs" />
      {actionError && <InlineError className="mb-4">{actionError}</InlineError>}

      {showSkeleton &&
        Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="mb-3 h-16 w-full" />
        ))}

      {!showSkeleton && error && (
        <InlineError className="py-6">{error}</InlineError>
      )}

      {!showSkeleton && !error && bookmarks.length === 0 && (
        <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
          No bookmarked jobs yet.{" "}
          <Link href="/jobs" className="underline">
            Browse open jobs
          </Link>
          .
        </p>
      )}

      <div className="divide-y" style={{ borderColor: "var(--color-border)" }}>
        {!showSkeleton &&
          !error &&
          bookmarks.map((bookmark) => (
            <div
              key={bookmark.id}
              className="flex items-center justify-between gap-4 py-4"
            >
              {bookmark.job ? (
                <>
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
                    disabled={removingId !== null}
                    onClick={() => handleRemove(bookmark.id, bookmark.job!.id)}
                  >
                    Remove
                  </Button>
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

export default function BookmarkedPage() {
  return (
    <RequireAuth>
      <Suspense fallback={null}>
        <BookmarkedPageContent />
      </Suspense>
    </RequireAuth>
  );
}
