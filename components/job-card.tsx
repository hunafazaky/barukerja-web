import Link from "next/link";
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

function formatPostedAt(dateString: string): string {
  const days = Math.floor(
    (Date.now() - new Date(dateString).getTime()) / 86_400_000,
  );
  if (days <= 0) return "Posted today";
  if (days === 1) return "Posted 1 day ago";
  if (days < 30) return `Posted ${days} days ago`;
  const months = Math.floor(days / 30);
  return months === 1 ? "Posted 1 month ago" : `Posted ${months} months ago`;
}

// A single row in the job list ledger — hairline rule above/below,
// no card border/shadow. See CLAUDE.md's layout wireframe.
export function JobCard({ job }: { job: Job }) {
  const salary = formatSalary(job);

  return (
    <Link
      href={`/jobs/${job.id}`}
      className="block px-1 py-4 transition-colors hover:bg-black/[0.02]"
    >
      <div className="flex items-start justify-between gap-4">
        <h3
          className="text-lg font-bold"
          style={{ fontFamily: "var(--font-heading)" }}
        >
          {job.title}
        </h3>
        {salary && (
          <span className="shrink-0 text-sm font-medium whitespace-nowrap">
            {salary}
          </span>
        )}
      </div>
      <p className="mt-1 text-sm" style={{ color: "var(--color-text-muted)" }}>
        {job.company.name}
        {job.location ? ` · ${job.location}` : ""} ·{" "}
        {WORK_MODE_LABELS[job.work_mode]}
      </p>
      <div className="mt-2 flex items-center justify-between text-sm">
        <span style={{ color: "var(--color-text-muted)" }}>
          {JOB_TYPE_LABELS[job.job_type]}
          {job.experience_level ? ` · ${job.experience_level}` : ""}
        </span>
        <span style={{ color: "var(--color-text-muted)" }}>
          {formatPostedAt(job.createdAt)}
        </span>
      </div>
    </Link>
  );
}
