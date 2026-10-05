"use client";

import { useDocumentTitle } from "@/hooks/use-document-title";
import { Suspense } from "react";
import { useParams } from "next/navigation";
import { InlineError } from "@/components/inline-error";
import { JobListSection } from "@/components/job-list";
import { Skeleton } from "@/components/ui/skeleton";
import { getCompanyById } from "@/lib/company.api";
import { useApiQuery } from "@/hooks/use-api-query";
import { useJobs } from "@/hooks/use-jobs";
import { useClampPage, usePageParam } from "@/hooks/use-page-param";

function CompanyProfileContent() {
  const { id } = useParams<{ id: string }>();
  const [page, setPage] = usePageParam();
  const {
    data: company,
    isLoading,
    error,
  } = useApiQuery(`company:${id}`, () => getCompanyById(id), {
    errorMessage: "Failed to load this company. Please try again.",
  });
  useDocumentTitle(company?.name);
  const jobsData = useJobs({ company: id, page, sort: "newest" });
  useClampPage(page, jobsData.pagination, setPage);

  return (
    <>
      {isLoading && (
        <div className="space-y-4">
          <Skeleton className="h-10 w-1/2" />
          <Skeleton className="h-20 w-full" />
        </div>
      )}

      {!isLoading && error && (
        <InlineError className="py-6">{error}</InlineError>
      )}

      {!isLoading && !error && company && (
        <>
          <div className="flex items-center gap-4">
            {company.logo && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={company.logo}
                alt=""
                className="h-16 w-16 border object-cover"
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
              style={{ color: "var(--color-brand)" }}
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
    </>
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
