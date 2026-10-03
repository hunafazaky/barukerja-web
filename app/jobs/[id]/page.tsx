"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { SiteNav } from "@/components/site-nav";
import { ApplyForm } from "@/components/apply-form";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/context/AuthContext";
import { useBookmark } from "@/hooks/use-bookmark";
import { getJobById } from "@/lib/job.api";
import { ApiError } from "@/types/api";
import { Job } from "@/types/job";

const WORK_MODE_LABELS: Record<Job["work_mode"], string> = {
  onsite: "On-site",
  hybrid: "Hybrid",
  remote: "Remote",
};

const JOB_TYPE_LABELS: Record<Job["job_type"], string> = {
  full_time: "Full-time",
  part_time: "Part-time",
  contract: "Contract",
  internship: "Internship",
  volunteer: "Volunteer",
};

function formatSalary(job: Job): string | null {
  if (!job.salary_min && !job.salary_max) return null;
  const currency = job.currency ? `${job.currency} ` : "";
  const format = (n: number) => n.toLocaleString();
  if (job.salary_min && job.salary_max) {
    return `${currency}${format(job.salary_min)}–${format(job.salary_max)}`;
  }
  if (job.salary_min) return `${currency}${format(job.salary_min)}+`;
  return `Up to ${currency}${format(job.salary_max as number)}`;
}

export default function JobDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user, accessToken, isLoading: authLoading } = useAuth();

  const [job, setJob] = useState<Job | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const bookmark = useBookmark(id);

  useEffect(() => {
    // Wait for auth to settle first — GET /jobs/:id behaves slightly
    // differently signed in vs. out (it records viewing history when
    // signed in), so there's no harm in waiting, and it avoids firing
    // the request twice (once anonymous, once with a token a beat later).
    if (authLoading) return;

    let cancelled = false;
    setIsLoading(true);
    setError(null);

    getJobById(id, accessToken)
      .then((result) => {
        if (!cancelled) setJob(result);
      })
      .catch((err) => {
        if (!cancelled) {
          setError(
            err instanceof ApiError
              ? err.message
              : "Failed to load this job. Please try again.",
          );
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [id, accessToken, authLoading]);

  return (
    <div className="min-h-full" style={{ background: "var(--color-bg)" }}>
      <SiteNav />
      <main className="mx-auto max-w-3xl px-4 py-8 md:px-6">
        <Link
          href="/jobs"
          className="text-sm"
          style={{ color: "var(--color-text-muted)" }}
        >
          ← Back to jobs
        </Link>

        {isLoading && (
          <div className="mt-6 space-y-4">
            <Skeleton className="h-9 w-2/3" />
            <Skeleton className="h-5 w-1/2" />
            <Skeleton className="h-32 w-full" />
          </div>
        )}

        {!isLoading && error && (
          <div
            className="mt-6 rounded-md border px-4 py-6 text-sm"
            style={{
              borderColor: "var(--color-danger)",
              color: "var(--color-danger)",
            }}
          >
            {error}
          </div>
        )}

        {!isLoading && !error && job && (
          <>
            <div className="mt-6 flex items-start justify-between gap-4">
              <div>
                <h1
                  className="text-3xl font-black"
                  style={{ fontFamily: "var(--font-heading)" }}
                >
                  {job.title}
                </h1>
                <Link
                  href={`/companies/${job.company.id}`}
                  className="mt-1 inline-block text-sm font-medium hover:underline"
                  style={{ color: "var(--color-accent)" }}
                >
                  {job.company.name}
                </Link>
              </div>

              <Button
                variant="outline"
                size="sm"
                disabled={!bookmark.isSignedIn || bookmark.isToggling}
                onClick={bookmark.toggle}
                title={
                  bookmark.isSignedIn
                    ? undefined
                    : "Sign in to bookmark this job"
                }
              >
                {bookmark.isBookmarked ? "Bookmarked" : "Bookmark"}
              </Button>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <Badge variant="outline">{WORK_MODE_LABELS[job.work_mode]}</Badge>
              <Badge variant="outline">{JOB_TYPE_LABELS[job.job_type]}</Badge>
              {job.experience_level && (
                <Badge variant="outline">{job.experience_level}</Badge>
              )}
              {job.status === "closed" && (
                <Badge
                  style={{
                    borderColor: "var(--color-danger)",
                    color: "var(--color-danger)",
                  }}
                  variant="outline"
                >
                  Closed
                </Badge>
              )}
            </div>

            <p
              className="mt-3 text-sm"
              style={{ color: "var(--color-text-muted)" }}
            >
              {job.location ? `${job.location} · ` : ""}
              {formatSalary(job) ?? "Salary not listed"}
              {job.deadline &&
                ` · Apply by ${new Date(job.deadline).toLocaleDateString()}`}
            </p>

            <Separator className="my-6" />

            <div
              className="prose max-w-none whitespace-pre-wrap text-[15px] leading-relaxed"
              style={{ color: "var(--color-text)" }}
            >
              {job.description}
            </div>

            {job.categories.length > 0 && (
              <div className="mt-6 flex flex-wrap gap-2">
                {job.categories.map((category) => (
                  <Badge key={category} variant="secondary">
                    {category}
                  </Badge>
                ))}
              </div>
            )}

            <Separator className="my-6" />

            <ApplyCta
              jobId={job.id}
              jobStatus={job.status}
              userRole={user?.role ?? null}
              isEmployerViewingOwnJob={
                !!user &&
                user.role === "employer" &&
                job.posted_by.id === user.id
              }
              onSignInRequired={() =>
                router.push(`/auth/signin?next=/jobs/${job.id}`)
              }
            />
          </>
        )}
      </main>
    </div>
  );
}

// Applications aren't tracked as "already applied" on this page — the
// job detail response has no such field (only /applications/mine would
// tell us). If someone's already applied, the backend rejects the
// resubmit with a 409 and ApplyForm surfaces that message directly
// rather than this page trying to pre-detect it.
function ApplyCta({
  jobId,
  jobStatus,
  userRole,
  isEmployerViewingOwnJob,
  onSignInRequired,
}: {
  jobId: string;
  jobStatus: Job["status"];
  userRole: "seeker" | "employer" | "admin" | null;
  isEmployerViewingOwnJob: boolean;
  onSignInRequired: () => void;
}) {
  const [showForm, setShowForm] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  if (isEmployerViewingOwnJob) {
    return (
      <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
        This is one of your posted jobs.{" "}
        <Link
          href={`/dashboard/jobs/${jobId}/applicants`}
          className="underline"
        >
          View applicants
        </Link>
        .
      </p>
    );
  }

  if (jobStatus === "closed") {
    return <Button disabled>Applications closed</Button>;
  }

  if (userRole === null) {
    return <Button onClick={onSignInRequired}>Sign in to apply</Button>;
  }

  if (userRole === "employer") {
    return (
      <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
        Employer accounts can&apos;t apply to jobs.
      </p>
    );
  }

  if (submitted) {
    return (
      <p className="text-sm" style={{ color: "var(--color-accent)" }}>
        Application submitted — you can track its status from{" "}
        <Link href="/applications" className="underline">
          My applications
        </Link>
        .
      </p>
    );
  }

  if (showForm) {
    return <ApplyForm jobId={jobId} onSuccess={() => setSubmitted(true)} />;
  }

  return <Button onClick={() => setShowForm(true)}>Apply</Button>;
}
