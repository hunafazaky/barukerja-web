import { APPLICATION_STATUS_LABELS } from "@/lib/status";
import { JOB_STATUS_LABELS } from "@/lib/job-format";
import type { ApplicationStatus } from "@/types/application";
import type { JobStatus } from "@/types/job";

type Tone = "neutral" | "brand" | "highlight" | "danger";

const TONE_COLOR: Record<Tone, string> = {
  neutral: "var(--color-text-muted)",
  brand: "var(--color-success)",
  highlight: "var(--color-highlight)",
  danger: "var(--color-danger)",
};

const APPLICATION_TONE: Record<ApplicationStatus, Tone> = {
  applied: "neutral",
  reviewed: "neutral",
  interview: "highlight",
  accepted: "brand",
  rejected: "danger",
};

const JOB_TONE: Record<JobStatus, Tone> = {
  draft: "neutral",
  open: "brand",
  closed: "danger",
};

type Props =
  | { kind: "application"; status: ApplicationStatus }
  | { kind: "job"; status: JobStatus };

// The one status pill (application status on seeker/employer pages, job
// status on "My jobs"). Replaces three copies of a label map + a style
// function, and the `Badge` + `borderColor` combination that never drew a
// border (the Badge primitive has none).
export function StatusBadge(props: Props) {
  const tone =
    props.kind === "application"
      ? APPLICATION_TONE[props.status]
      : JOB_TONE[props.status];
  const label =
    props.kind === "application"
      ? APPLICATION_STATUS_LABELS[props.status]
      : JOB_STATUS_LABELS[props.status];
  const color = TONE_COLOR[tone];

  return (
    <span
      // A rubber stamp: heavy outline, spaced capitals, a slight tilt.
      className="inline-flex shrink-0 -rotate-2 items-center border-2 px-2 py-px font-label text-[0.7rem] font-bold tracking-[0.18em] whitespace-nowrap uppercase"
      style={{ color, borderColor: color }}
    >
      {label}
    </span>
  );
}
