"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { RequireAuth } from "@/components/require-auth";
import { JobForm } from "@/components/job-form";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useMyCompany } from "@/hooks/use-my-company";

function NewJobPageContent() {
  const router = useRouter();
  const { company, isLoading, error } = useMyCompany();

  return (
    <>
      <SiteHeader title="Post a job" />
      <div className="mx-auto w-full max-w-lg px-4 py-6 md:px-6">
        {isLoading && <Skeleton className="h-64 w-full" />}

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
      </div>
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
