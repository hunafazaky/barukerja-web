"use client";

import { useDocumentTitle } from "@/hooks/use-document-title";
import { Suspense, useState } from "react";
import { PageHeader } from "@/components/page-header";
import { JobListSection } from "@/components/job-list";
import { useJobs } from "@/hooks/use-jobs";
import { useClampPage, usePageParam } from "@/hooks/use-page-param";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { Input } from "@/components/ui/input";

// Public — no sign-in required to browse. Signing in just adds
// per-job "bookmarked" status (handled inside useJobs/getJobs already).
function JobsPageContent() {
  useDocumentTitle("Find work");
  const [page, setPage] = usePageParam();
  const [q, setQ] = useState("");
  // Query the API 300 ms after the last keystroke, not on every one.
  const debouncedQ = useDebouncedValue(q.trim(), 300);
  const jobsData = useJobs({ page, q: debouncedQ || undefined, sort: "newest" });
  useClampPage(page, jobsData.pagination, setPage);

  return (
    <>
      <PageHeader
        title="Find work"
        description="Open positions, newest first."
      />
      <div className="mb-6 flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
        <p className="label-caps font-normal" aria-live="polite">
          {jobsData.pagination
            ? `Today · ${jobsData.pagination.total} open ${
                jobsData.pagination.total === 1 ? "position" : "positions"
              }`
            : "\u00a0"}
        </p>
        <Input
          type="search"
          aria-label="Search jobs"
          placeholder="Search the classifieds…"
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            // replace, not push: resetting to page 1 while typing is a
            // correction, not a navigation worth a Back-button stop.
            if (page !== 1) setPage(1, { replace: true });
          }}
          className="max-w-xs"
        />
      </div>

      <JobListSection
        title="Open jobs"
        emptyMessage="No open jobs match your search right now."
        data={jobsData}
        onPageChange={setPage}
        frontPage
      />
    </>
  );
}

export default function JobsPage() {
  // usePageParam() needs a <Suspense> boundary above it — same
  // requirement the old work list pages had.
  return (
    <Suspense fallback={null}>
      <JobsPageContent />
    </Suspense>
  );
}
