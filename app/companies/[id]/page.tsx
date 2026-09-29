"use client";

import { Suspense, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { SiteNav } from "@/components/site-nav";
import { JobListSection } from "@/components/job-list";
import { Skeleton } from "@/components/ui/skeleton";
import { getCompanyById } from "@/lib/company.api";
import { useJobs } from "@/hooks/use-jobs";
import { usePageParam } from "@/hooks/use-page-param";
import { ApiError } from "@/types/api";
import { Company } from "@/types/company";

function CompanyProfileContent() {
  const { id } = useParams<{ id: string }>();
  const [page, setPage] = usePageParam();
  const [company, setCompany] = useState<Company | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const jobsData = useJobs({ company: id, page, sort: "newest" });

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    setError(null);

    getCompanyById(id)
      .then((result) => {
        if (!cancelled) setCompany(result);
      })
      .catch((err) => {
        if (!cancelled) {
          setError(
            err instanceof ApiError
              ? err.message
              : "Failed to load this company. Please try again.",
          );
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [id]);

  return (
    <div className="min-h-full" style={{ background: "var(--color-bg)" }}>
      <SiteNav />
      <main className="mx-auto max-w-3xl px-4 py-8 md:px-6">
        {isLoading && (
          <div className="space-y-4">
            <Skeleton className="h-10 w-1/2" />
            <Skeleton className="h-20 w-full" />
          </div>
        )}

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

        {!isLoading && !error && company && (
          <>
            <div className="flex items-center gap-4">
              {company.logo && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={company.logo}
                  alt=""
                  className="h-16 w-16 rounded-md border object-cover"
                  style={{ borderColor: "var(--color-border)" }}
                />
              )}
              <div>
                <h1
                  className="text-3xl font-black"
                  style={{ fontFamily: "var(--font-heading)" }}
                >
                  {company.name}
                </h1>
                {company.location && (
                  <p
                    className="text-sm"
                    style={{ color: "var(--color-text-muted)" }}
                  >
                    {company.location}
                  </p>
                )}
              </div>
            </div>

            {company.website && (
              <a
                href={company.website}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 inline-block text-sm hover:underline"
                style={{ color: "var(--color-accent)" }}
              >
                {company.website}
              </a>
            )}

            {company.description && (
              <p
                className="mt-6 whitespace-pre-wrap text-[15px] leading-relaxed"
                style={{ color: "var(--color-text)" }}
              >
                {company.description}
              </p>
            )}

            <div className="mt-10">
              <JobListSection
                title="Open jobs"
                emptyMessage="No open jobs at this company right now."
                data={jobsData}
                onPageChange={setPage}
              />
            </div>
          </>
        )}
      </main>
    </div>
  );
}

export default function CompanyProfilePage() {
  // usePageParam() needs a <Suspense> boundary above it, same as /jobs.
  return (
    <Suspense fallback={null}>
      <CompanyProfileContent />
    </Suspense>
  );
}
