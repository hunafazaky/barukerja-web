"use client";

import { Suspense, useState } from "react";
import { SiteNav } from "@/components/site-nav";
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
    <div className="min-h-full" style={{ background: "var(--color-bg)" }}>
      <SiteNav />
      <main className="mx-auto max-w-4xl px-4 py-8 md:px-6">
        <div className="mb-8">
          <h1
            className="text-4xl font-black"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            Find work
          </h1>
          <p
            className="mt-2 text-sm"
            style={{ color: "var(--color-text-muted)" }}
          >
            Open positions, newest first.
          </p>
          <Input
            type="search"
            placeholder="Search job titles or descriptions"
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setPage(1);
            }}
            className="mt-4 max-w-sm"
          />
        </div>

        <JobListSection
          title="Open jobs"
          emptyMessage="No open jobs match your search right now."
          data={jobsData}
          onPageChange={setPage}
        />
      </main>
    </div>
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
