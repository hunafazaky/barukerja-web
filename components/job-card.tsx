import Link from "next/link";
import {
  formatPostedAt,
  formatSalary,
  JOB_TYPE_LABELS,
  WORK_MODE_LABELS,
} from "@/lib/job-format";
import { Job } from "@/types/job";

// A single row in the job list ledger — hairline rule between rows (drawn by
// the list's `divide-y`), no card border/shadow. The negative margin +
// padding gives the hover tint some breathing room while keeping the text
// aligned with the page heading above it.
export function JobCard({ job }: { job: Job }) {
  const salary = formatSalary(job);

  return (
    <Link
      href={`/jobs/${job.id}`}
      className="-mx-2 block px-2 py-4 transition-colors hover:bg-black/[0.02]"
    >
      {/* Title and salary sit side by side from `sm` up; on a phone the
          salary drops under the title so a long title keeps the full width
          instead of being squeezed into a narrow column. */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
        <h3
          className="min-w-0 text-lg font-bold"
          style={{ fontFamily: "var(--font-heading)" }}
        >
          {job.title}
        </h3>
        {salary && (
          <span className="text-sm font-medium sm:shrink-0 sm:whitespace-nowrap">
            {salary}
          </span>
        )}
      </div>
      <p className="mt-1 text-sm" style={{ color: "var(--color-text-muted)" }}>
        {job.company.name}
        {job.location ? ` · ${job.location}` : ""} ·{" "}
        {WORK_MODE_LABELS[job.work_mode]}
      </p>
      <div
        className="mt-2 flex flex-wrap items-center justify-between gap-x-4 gap-y-1 text-sm"
        style={{ color: "var(--color-text-muted)" }}
      >
        <span>
          {JOB_TYPE_LABELS[job.job_type]}
          {job.experience_level ? ` · ${job.experience_level}` : ""}
        </span>
        <span>{formatPostedAt(job.createdAt)}</span>
      </div>
    </Link>
  );
}
