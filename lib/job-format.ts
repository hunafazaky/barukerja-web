import type { Job, JobStatus, JobType, WorkMode } from "@/types/job";

// Display labels and formatters shared by the job card, job detail page and
// job form (they each used to carry their own copy).

export const WORK_MODE_LABELS: Record<WorkMode, string> = {
  onsite: "On-site",
  hybrid: "Hybrid",
  remote: "Remote",
};

export const JOB_TYPE_LABELS: Record<JobType, string> = {
  full_time: "Full-time",
  part_time: "Part-time",
  contract: "Contract",
  internship: "Internship",
  volunteer: "Volunteer",
};

// Short labels, for badges and lists. (The job form has longer, explanatory
// ones for its dropdown.)
export const JOB_STATUS_LABELS: Record<JobStatus, string> = {
  draft: "Draft",
  open: "Open",
  closed: "Closed",
};

export function formatSalary(
  job: Pick<Job, "salary_min" | "salary_max" | "currency">,
): string | null {
  if (!job.salary_min && !job.salary_max) return null;
  const currency = job.currency ? `${job.currency} ` : "";
  const format = (n: number) => n.toLocaleString();

  if (job.salary_min && job.salary_max) {
    return `${currency}${format(job.salary_min)}–${format(job.salary_max)}`;
  }
  if (job.salary_min) return `${currency}${format(job.salary_min)}+`;
  return `Up to ${currency}${format(job.salary_max as number)}`;
}

export function formatPostedAt(dateString: string): string {
  const days = Math.floor(
    (Date.now() - new Date(dateString).getTime()) / 86_400_000,
  );
  if (days <= 0) return "Posted today";
  if (days === 1) return "Posted 1 day ago";
  if (days < 30) return `Posted ${days} days ago`;
  const months = Math.floor(days / 30);
  return months === 1 ? "Posted 1 month ago" : `Posted ${months} months ago`;
}
