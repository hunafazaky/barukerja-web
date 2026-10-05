"use client";

import { useDocumentTitle } from "@/hooks/use-document-title";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { InlineError } from "@/components/inline-error";
import { PageHeader } from "@/components/page-header";
import { RequireAuth } from "@/components/require-auth";
import { CompanyForm } from "@/components/company-form";
import { Skeleton } from "@/components/ui/skeleton";
import { useMyCompany } from "@/hooks/use-my-company";

function CompanyPageContent() {
  useDocumentTitle("Company profile");
  const router = useRouter();
  const { company, isLoading, error, refetch } = useMyCompany();
  const [saved, setSaved] = useState(false);

  return (
    <>
      <PageHeader title="Company profile" />
      {isLoading && (
        <div className="space-y-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      )}

      {!isLoading && error && (
        <InlineError className="py-6">{error}</InlineError>
      )}

      {!isLoading && !error && (
        <>
          {!company && (
            <p
              className="mb-4 text-sm"
              style={{ color: "var(--color-text-muted)" }}
            >
              You&apos;ll need a company profile before you can post jobs.
            </p>
          )}
          {saved && (
            <p
              role="status"
              className="mb-4 text-sm"
              style={{ color: "var(--color-success, var(--color-text-muted))" }}
            >
              Company profile saved.
            </p>
          )}
          <CompanyForm
            existingCompany={company ?? undefined}
            onSuccess={() => {
              refetch();
              // First save = onboarding, so continue to posting jobs.
              // Editing an existing profile stays here with a confirmation.
              if (company) setSaved(true);
              else router.push("/dashboard/jobs");
            }}
          />
        </>
      )}
    </>
  );
}

export default function CompanyPage() {
  return (
    <RequireAuth role="employer">
      <CompanyPageContent />
    </RequireAuth>
  );
}
