"use client";

import { useDocumentTitle } from "@/hooks/use-document-title";
import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ApplyForm } from "@/components/apply-form";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/context/AuthContext";
import { InlineError } from "@/components/inline-error";
import { useApiQuery } from "@/hooks/use-api-query";
import { useBookmark } from "@/hooks/use-bookmark";
import { useExistingApplication } from "@/hooks/use-existing-application";
import { StatusBadge } from "@/components/status-badge";
import { getJobById } from "@/lib/job.api";
import { JobDescription } from "@/components/job-description";
import {
  formatPostedAt,
  formatSalary,
  JOB_TYPE_LABELS,
  WORK_MODE_LABELS,
} from "@/lib/job-format";
import { Job } from "@/types/job";

// A job only accepts applications while it is "open" AND its deadline (if
// any) hasn't passed. The jobs list already hides expired jobs, but the
// detail page is reachable by direct link (history, bookmarks, shared URLs),
// and the backend rejects an application to a draft/closed/expired job —
// after the seeker has already uploaded their CV. Say so up front instead.
function getApplyState(job: Job): "open" | "draft" | "closed" | "expired" {
  if (job.status === "draft") return "draft";
  if (job.status !== "open") return "closed";
  if (job.deadline && new Date(job.deadline).getTime() < Date.now()) {
    return "expired";
  }
  return "open";
}

export default function JobDetailPage() {
    const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();

  // "optional" auth: GET /jobs/:id behaves slightly differently signed in
  // vs. out (it records viewing history when signed in), so the query waits
  // for the session check and fires once. A silent token refresh no longer
  // re-fetches the page (which used to unmount an open apply form).
  const {
    data: job,
    isLoading,
    error,
  } = useApiQuery(`job:${id}`, (token) => getJobById(id, token), {
    auth: "optional",
    errorMessage: "Failed to load this job. Please try again.",
  });

  const bookmark = useBookmark(id);
  useDocumentTitle(job ? `${job.title} at ${job.company.name}` : undefined);

  return (
    <>
      <Link
        href="/jobs"
        className="label-caps inline-flex min-h-10 items-center hover:text-[var(--color-brand)]"
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

      {!isLoading && error && <InlineError className="mt-6 py-6">{error}</InlineError>}

      {!isLoading && !error && job && (
        <>
          <header
            className="mt-2 border-b-[3px] border-double pb-6"
            style={{ borderColor: "var(--color-text)" }}
          >
            <p className="kicker">
              {[
                JOB_TYPE_LABELS[job.job_type],
                WORK_MODE_LABELS[job.work_mode],
                job.experience_level,
              ]
                .filter(Boolean)
                .join(" · ")}
            </p>
            <h1 className="mt-3 text-[2.1rem] leading-[1.05] font-black tracking-tight sm:text-5xl md:text-6xl">
              {job.title}
            </h1>
            <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
              <p
                className="min-w-0 text-lg italic"
                style={{ color: "var(--color-text-muted)" }}
              >
                Posted by{" "}
                <Link
                  href={`/companies/${job.company.id}`}
                  className="font-semibold not-italic hover:underline"
                  style={{ color: "var(--color-brand)" }}
                >
                  {job.company.name}
                </Link>
                {job.location ? ` · ${job.location}` : ""} ·{" "}
                {formatPostedAt(job.createdAt).replace("Posted ", "")}
                {job.status === "draft" && (
                  <span className="ml-3 not-italic">
                    <Badge variant="outline">Draft</Badge>
                  </span>
                )}
                {job.status === "closed" && (
                  <span
                    className="ml-3 not-italic"
                    style={{ color: "var(--color-danger)" }}
                  >
                    <Badge variant="outline" className="text-[var(--color-danger)]">
                      Closed
                    </Badge>
                  </span>
                )}
              </p>

              {/* Bookmarks are a seeker feature: the API doesn't stop an
                  employer from creating one, but the employer nav has no
                  "Bookmarked" page, so they'd save jobs they can never
                  view. Signed-out visitors still see the (disabled) button
                  as a nudge to sign in. */}
              {user?.role !== "employer" && (
                <Button
                  variant="outline"
                  className="shrink-0"
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
              )}
            </div>
            {bookmark.error && (
              <InlineError className="mt-3">{bookmark.error}</InlineError>
            )}
          </header>

          <div className="grid gap-10 pt-8 lg:grid-cols-[minmax(0,1fr)_20rem] lg:gap-0">
            <article
              className="min-w-0 lg:border-r lg:pr-12"
              style={{ borderColor: "var(--color-border)" }}
            >
              <div className="max-w-[40rem]">
                <JobDescription text={job.description} dropcap />

                {job.categories.length > 0 && (
                  <div
                    className="mt-8 flex flex-wrap gap-2 border-t pt-4"
                    style={{ borderColor: "var(--color-border)" }}
                  >
                    {job.categories.map((category) => (
                      <span
                        key={category}
                        className="label-caps border px-2.5 py-0.5 font-normal"
                        style={{ borderColor: "var(--color-rule-strong)" }}
                      >
                        {category}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </article>

            <aside className="lg:pl-10">
              <p className="kicker">Compensation</p>
              <p className="rule-double figure mt-2 border-b-[3px] border-double py-3.5 text-[1.9rem] leading-tight"
                style={{ borderBottomColor: "var(--color-text)" }}
              >
                {formatSalary(job) ?? "Salary not listed"}
              </p>

              <dl className="mt-6 grid grid-cols-[auto_1fr] gap-x-5 gap-y-2.5">
                <dt className="label-caps pt-1">Type</dt>
                <dd>{JOB_TYPE_LABELS[job.job_type]}</dd>
                <dt className="label-caps pt-1">Mode</dt>
                <dd>{WORK_MODE_LABELS[job.work_mode]}</dd>
                {job.experience_level && (
                  <>
                    <dt className="label-caps pt-1">Level</dt>
                    <dd>{job.experience_level}</dd>
                  </>
                )}
                {job.deadline && (
                  <>
                    <dt className="label-caps pt-1">Apply by</dt>
                    <dd>{new Date(job.deadline).toLocaleDateString()}</dd>
                  </>
                )}
              </dl>

              <div
                className="mt-8 border-2 border-dashed p-5"
                style={{
                  borderColor: "var(--color-text)",
                  background: "var(--color-bg-sunk)",
                }}
              >
                <p className="kicker mb-3">Application</p>
                <ApplyCta
                  jobId={job.id}
                  applyState={getApplyState(job)}
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
              </div>
            </aside>
          </div>
        </>
      )}
    </>
  );
}

// "Already applied" comes from the seeker's own applications (the job
// response has no such field); the backend still rejects a duplicate with a
// 409, which ApplyForm shows as a fallback.
function ApplyCta({
  jobId,
  applyState,
  userRole,
  isEmployerViewingOwnJob,
  onSignInRequired,
}: {
  jobId: string;
  applyState: ReturnType<typeof getApplyState>;
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

  if (applyState !== "open") {
    const reason =
      applyState === "draft"
        ? "This job isn't published yet"
        : applyState === "expired"
          ? "The application deadline has passed"
          : "Applications closed";
    return (
      <div>
        <Button disabled>Applications closed</Button>
        <p
          className="mt-3 italic"
          style={{ color: "var(--color-text-muted)" }}
        >
          {reason}.
        </p>
      </div>
    );
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

  return (
    <SeekerApply
      jobId={jobId}
      showForm={showForm}
      setShowForm={setShowForm}
      submitted={submitted}
      setSubmitted={setSubmitted}
    />
  );
}

// Seeker-only part of the CTA, split out so the "already applied" lookup
// only runs for signed-in seekers on open jobs.
function SeekerApply({
  jobId,
  showForm,
  setShowForm,
  submitted,
  setSubmitted,
}: {
  jobId: string;
  showForm: boolean;
  setShowForm: (v: boolean) => void;
  submitted: boolean;
  setSubmitted: (v: boolean) => void;
}) {
  const { application, isLoading } = useExistingApplication(jobId);

  if (application && !submitted) {
    return (
      <div className="flex flex-wrap items-center gap-3 text-sm">
        <StatusBadge kind="application" status={application.status} />
        <span style={{ color: "var(--color-text-muted)" }}>
          You&apos;ve already applied to this job.
        </span>
        <Link href="/applications" className="underline">
          View my applications
        </Link>
      </div>
    );
  }

  if (submitted) {
    return (
      <p className="text-sm" style={{ color: "var(--color-brand)" }}>
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

  return (
    <Button disabled={isLoading} onClick={() => setShowForm(true)}>
      Apply
    </Button>
  );
}
