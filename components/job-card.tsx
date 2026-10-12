import Link from "next/link";
import {
  formatPostedAt,
  formatSalary,
  jobExcerpt,
  JOB_TYPE_LABELS,
  WORK_MODE_LABELS,
} from "@/lib/job-format";
import { Job } from "@/types/job";

// One job as a newspaper item: kicker, headline, byline, teaser, dateline.
// Separation comes from rules drawn by the list around it (no boxes).
//   variant="story" — the normal column item.
//   variant="lead"  — the front-page lead: big headline, drop-cap teaser and
//                     the salary as a pull-quote beside it.
// Titles are <h3> in both so the heading outline is the same everywhere.
export function JobCard({
  job,
  variant = "story",
}: {
  job: Job;
  variant?: "story" | "lead";
}) {
  const salary = formatSalary(job);
  const lead = variant === "lead";
  const excerpt = jobExcerpt(job.description);
  const kicker = [
    JOB_TYPE_LABELS[job.job_type],
    WORK_MODE_LABELS[job.work_mode],
    job.location,
  ]
    .filter(Boolean)
    .join(" · ");

  const body = (
    <>
      <p className="kicker">{lead ? `Latest · ${kicker}` : kicker}</p>
      <h3
        className={`mt-1.5 font-extrabold leading-[1.12] group-hover:text-[var(--color-brand)] ${
          lead ? "text-[2rem] sm:text-[2.6rem]" : "text-[1.4rem] font-bold"
        }`}
        style={{ fontFamily: "var(--font-heading)" }}
      >
        {job.title}
      </h3>
      <p
        className={`italic ${lead ? "mt-2 text-lg" : "mt-1"}`}
        style={{ color: "var(--color-text-muted)" }}
      >
        {job.company.name}
      </p>
      {excerpt && (
        <p
          className={
            lead
              ? `${excerpt.length > 140 ? "dropcap " : ""}mt-4 line-clamp-5 text-[1.1rem] leading-relaxed`
              : "mt-2 line-clamp-2 leading-snug opacity-90"
          }
        >
          {excerpt}
        </p>
      )}
      <p
        className="mt-3 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 text-sm"
        style={{
          fontFamily: "var(--font-label)",
          color: "var(--color-text-muted)",
        }}
      >
        <span>
          {formatPostedAt(job.createdAt)}
          {job.experience_level ? ` · ${job.experience_level}` : ""}
        </span>
        {!lead && salary && (
          <span
            className="figure"
            style={{ color: "var(--color-text)", fontSize: "0.95rem" }}
          >
            {salary}
          </span>
        )}
        {lead && (
          <span className="font-bold" style={{ color: "var(--color-brand)" }}>
            Continue reading →
          </span>
        )}
      </p>
    </>
  );

  if (!lead) {
    return (
      <Link href={`/jobs/${job.id}`} className="group block py-6">
        {body}
      </Link>
    );
  }

  return (
    <div className="grid gap-6 py-7 md:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] md:gap-0">
      <Link href={`/jobs/${job.id}`} className="group block md:pr-10">
        {body}
      </Link>
      <aside
        className="flex flex-col justify-center md:border-l md:pl-10"
        style={{ borderColor: "var(--color-border)" }}
      >
        <p className="kicker">Compensation</p>
        <p className="rule-double mt-2 border-b-[3px] border-double py-3.5 text-[1.9rem] leading-tight figure"
          style={{ borderBottomColor: "var(--color-text)" }}
        >
          {salary ?? "Salary not listed"}
        </p>
        {job.categories?.length > 0 && (
          <p className="label-caps mt-3 font-normal">
            {job.categories.slice(0, 3).join(" · ")}
          </p>
        )}
      </aside>
    </div>
  );
}
