"use client";

import { Suspense, useState } from "react";
import { PageHeader } from "@/components/page-header";
import { JobListSection } from "@/components/job-list";
import { useJobs } from "@/hooks/use-jobs";
import { usePageParam } from "@/hooks/use-page-param";
import { Input } from "@/components/ui/input";

// Public — no sign-in required to browse. Signing in just adds
// per-job "bookmarked" status (handled inside useJobs/getJobs already).
function JobsPageContent() {
  const [page, setPage] = usePageParam();
  const [q, setQ] = useState("");
  const jobsData = useJobs({ page, q: q || undefined, sort: "newest" });

  return (
    <>
      <PageHeader
        title="Find work"
        description="Open positions, newest first."
      />
      <Input
        type="search"
        placeholder="Search job titles or descriptions"
        value={q}
        onChange={(e) => {
          setQ(e.target.value);
          setPage(1);
        }}
        className="mb-8 max-w-sm"
      />

      <JobListSection
        title="Open jobs"
        emptyMessage="No open jobs match your search right now."
        data={jobsData}
        onPageChange={setPage}
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
