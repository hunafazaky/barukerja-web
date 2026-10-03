"use client";

import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { RequireAuth } from "@/components/require-auth";
import { CompanyForm } from "@/components/company-form";
import { Skeleton } from "@/components/ui/skeleton";
import { useMyCompany } from "@/hooks/use-my-company";

function CompanyPageContent() {
  const router = useRouter();
  const { company, isLoading, error, refetch } = useMyCompany();

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
          <CompanyForm
            existingCompany={company ?? undefined}
            onSuccess={() => {
              refetch();
              router.push("/dashboard/jobs");
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
