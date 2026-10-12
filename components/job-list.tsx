"use client";

import { InlineError } from "@/components/inline-error";
import { JobCard } from "@/components/job-card";
import { PaginationControls } from "@/components/pagination-controls";
import { JobListResult } from "@/types/job";

function JobCardSkeleton() {
  return (
    <div className="animate-pulse py-6">
      <div className="h-3 w-1/3 bg-black/10" />
      <div className="mt-3 h-6 w-2/3 bg-black/10" />
      <div className="mt-2 h-4 w-1/2 bg-black/5" />
      <div className="mt-3 h-4 w-full bg-black/5" />
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
  frontPage = false,
}: {
  title: string;
  emptyMessage: string;
  data: JobListResult;
  onPageChange: (page: number) => void;
  // Front-page layout: the newest job as a lead story (page 1 only), the rest
  // in two ruled columns from `md` up.
  frontPage?: boolean;
}) {
  const { jobs, pagination, isLoading, error, refetch } = data;
  const ready = !isLoading && !error;
  const useLead = frontPage && ready && jobs.length > 0 && (pagination?.page ?? 1) === 1;
  const lead = useLead ? jobs[0] : null;
  const rest = useLead ? jobs.slice(1) : jobs;
  const rule = { borderColor: "var(--color-border)" };

  return (
    <section>
      <h2
        className="label-caps border-b pb-2"
        style={{ borderColor: "var(--color-text)" }}
      >
        {title}
      </h2>

      {isLoading && (
        <div className="divide-y" style={rule}>
          {Array.from({ length: 4 }).map((_, i) => (
            <JobCardSkeleton key={i} />
          ))}
        </div>
      )}

      {!isLoading && error && (
        <InlineError className="my-6">
          {error}{" "}
          <button onClick={refetch} className="ml-1 underline">
            Try again
          </button>
        </InlineError>
      )}

      {ready && jobs.length === 0 && (
        <div
          className="my-8 border px-6 py-10 text-center"
          style={{ borderColor: "var(--color-rule-strong)" }}
        >
          <p
            className="text-2xl font-bold"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            Nothing to report
          </p>
          <p className="mt-1 italic" style={{ color: "var(--color-text-muted)" }}>
            {emptyMessage}
          </p>
        </div>
      )}

      {lead && (
        <div className="border-b" style={rule}>
          <JobCard job={lead} variant="lead" />
        </div>
      )}

      {ready && rest.length > 0 && (
        <div
          className={
            frontPage
              ? "md:grid md:grid-cols-2 [&>*]:border-b md:[&>*:nth-child(odd)]:pr-10 md:[&>*:nth-child(even)]:border-l md:[&>*:nth-child(even)]:pl-10"
              : "divide-y"
          }
          style={rule}
        >
          {rest.map((job) => (
            <div key={job.id} style={rule} className={frontPage ? "" : undefined}>
              <JobCard job={job} />
            </div>
          ))}
        </div>
      )}

      {ready && pagination && pagination.totalPages > 1 && (
        <PaginationControls
          page={pagination.page}
          totalPages={pagination.totalPages}
          onPageChange={onPageChange}
        />
      )}
    </section>
  );
}
