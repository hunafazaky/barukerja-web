"use client";

import { useDocumentTitle } from "@/hooks/use-document-title";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { InlineError } from "@/components/inline-error";
import { PageHeader } from "@/components/page-header";
import { RequireAuth } from "@/components/require-auth";
import { JobForm } from "@/components/job-form";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useMyCompany } from "@/hooks/use-my-company";

function NewJobPageContent() {
  useDocumentTitle("Post a job");
  const router = useRouter();
  const { company, isLoading, error } = useMyCompany();

  return (
    <>
      <PageHeader title="Post a job" />
      {isLoading && <Skeleton className="h-64 w-full" />}

      {!isLoading && error && (
        <InlineError className="py-6">{error}</InlineError>
      )}

      {!isLoading && !error && !company && (
        <div>
          <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
            You need a company profile before you can post a job.
          </p>
          <Button
            className="mt-4"
            nativeButton={false}
            render={<Link href="/dashboard/company" />}
          >
            Create company profile
          </Button>
        </div>
      )}

      {!isLoading && !error && company && (
        <JobForm onSuccess={() => router.push("/dashboard/jobs")} />
      )}
    </>
  );
}

export default function NewJobPage() {
  return (
    <RequireAuth role="employer">
      <NewJobPageContent />
    </RequireAuth>
  );
}
