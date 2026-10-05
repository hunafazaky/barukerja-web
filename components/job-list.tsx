"use client";

import { InlineError } from "@/components/inline-error";
import { JobCard } from "@/components/job-card";
import { PaginationControls } from "@/components/pagination-controls";
import { JobListResult } from "@/types/job";

function JobCardSkeleton() {
  return (
    <div className="animate-pulse py-4">
      <div className="h-5 w-2/3 bg-black/10" />
      <div className="mt-2 h-4 w-1/2 bg-black/5" />
      <div className="mt-3 h-4 w-1/3 bg-black/5" />
    </div>
  );
}

// Renders whatever a useJobs()-shaped hook returns: the ledger of rows
// (hairline dividers, no card shadows — see CLAUDE.md), loading
// skeletons, an error state, an empty state, and pagination.
export function JobListSection({
  title,
  emptyMessage,
  data,
  onPageChange,
}: {
  title: string;
  emptyMessage: string;
  data: JobListResult;
  onPageChange: (page: number) => void;
}) {
  const { jobs, pagination, isLoading, error, refetch } = data;

  return (
    <section>
      <h2
        className="text-xl font-black"
        style={{ fontFamily: "var(--font-heading)" }}
      >
        {title}
      </h2>

      <div
        className="mt-4 divide-y"
        style={{ borderColor: "var(--color-border)" }}
      >
        {isLoading &&
          Array.from({ length: 5 }).map((_, i) => <JobCardSkeleton key={i} />)}

        {!isLoading && error && (
          <InlineError className="py-6">
            {error}{" "}
            <button onClick={refetch} className="ml-1 underline">
              Try again
            </button>
          </InlineError>
        )}

        {!isLoading && !error && jobs.length === 0 && (
          <div
            className="px-1 py-10 text-center text-sm"
            style={{ color: "var(--color-text-muted)" }}
          >
            {emptyMessage}
          </div>
        )}

        {!isLoading &&
          !error &&
          jobs.map((job) => <JobCard key={job.id} job={job} />)}
      </div>

      {!isLoading && !error && pagination && pagination.totalPages > 1 && (
        <PaginationControls
          page={pagination.page}
          totalPages={pagination.totalPages}
          onPageChange={onPageChange}
        />
      )}
    </section>
  );
}
