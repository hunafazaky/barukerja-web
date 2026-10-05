"use client";

import { useState } from "react";
import { CategoriesInput } from "@/components/categories-input";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/context/AuthContext";
import { createJob, updateJob } from "@/lib/job.api";
import { ApiError } from "@/types/api";
import { Job, JobFormInput, JobStatus, JobType, WorkMode } from "@/types/job";

const WORK_MODE_LABELS: Record<WorkMode, string> = {
  onsite: "On-site",
  hybrid: "Hybrid",
  remote: "Remote",
};

const JOB_TYPE_LABELS: Record<JobType, string> = {
  full_time: "Full-time",
  part_time: "Part-time",
  contract: "Contract",
  internship: "Internship",
  volunteer: "Volunteer",
};

const STATUS_LABELS: Record<JobStatus, string> = {
  draft: "Draft (not visible to seekers)",
  open: "Open (accepting applications)",
  closed: "Closed",
};

// Tomorrow's date (in the user's own timezone) as "YYYY-MM-DD", for the
// deadline input's `min`. The backend requires a deadline strictly in the
// future (`Joi.date().greater('now')`) and a date-only value is read as
// midnight UTC, so "today" is always rejected — the picker must not offer it.
function tomorrowIsoDate(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

// express.json({ limit: "10kb" }) on the backend rejects bigger bodies with
// a bare "request entity too large". Stay a little under it and say so.
const MAX_BODY_BYTES = 9_500;

// Fields the backend's PATCH schema cannot clear once set (no `null`, and
// `""` fails validation for these). Documented in
// docs/BACKEND-SUGGESTIONS.md. Until that's fixed we say so instead of
// silently keeping the old value.
const NON_CLEARABLE: Record<string, string> = {
  experience_level: "Experience level",
  salary_min: "Min salary",
  salary_max: "Max salary",
  currency: "Currency",
  deadline: "Application deadline",
};

export function JobForm({
  existingJob,
  onSuccess,
}: {
  existingJob?: Job;
  onSuccess: (jobId: string) => void;
}) {
  const { getAccessToken } = useAuth();
  // The values the form started with — edits are sent as a diff against
  // these, so untouched fields (notably an already-passed deadline, which
  // the backend would reject) are never re-sent.
  const [initial] = useState(() => ({
    title: existingJob?.title ?? "",
    description: existingJob?.description ?? "",
    location: existingJob?.location ?? "",
    workMode: existingJob?.work_mode ?? "onsite",
    jobType: existingJob?.job_type ?? "full_time",
    experienceLevel: existingJob?.experience_level ?? "",
    salaryMin: existingJob?.salary_min?.toString() ?? "",
    salaryMax: existingJob?.salary_max?.toString() ?? "",
    currency: existingJob?.currency ?? "IDR",
    categories: existingJob?.categories ?? [],
    deadline: existingJob?.deadline ? existingJob.deadline.slice(0, 10) : "",
    status: existingJob?.status ?? "open",
  }));
  const [title, setTitle] = useState(initial.title);
  const [description, setDescription] = useState(initial.description);
  const [location, setLocation] = useState(initial.location);
  const [workMode, setWorkMode] = useState<WorkMode>(initial.workMode);
  const [jobType, setJobType] = useState<JobType>(initial.jobType);
  const [experienceLevel, setExperienceLevel] = useState(
    initial.experienceLevel,
  );
  const [salaryMin, setSalaryMin] = useState(initial.salaryMin);
  const [salaryMax, setSalaryMax] = useState(initial.salaryMax);
  const [currency, setCurrency] = useState(initial.currency);
  const [categories, setCategories] = useState<string[]>(initial.categories);
  const [deadline, setDeadline] = useState(initial.deadline);
  const [status, setStatus] = useState<JobStatus>(initial.status);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const accessToken = getAccessToken();
    if (!accessToken || !title.trim() || !description.trim()) return;

    if (salaryMin && salaryMax && Number(salaryMax) <= Number(salaryMin)) {
      setError("Maximum salary must be greater than minimum salary.");
      return;
    }

    // What the user has now, normalised the way the API wants it.
    const current = {
      title: title.trim(),
      description: description.trim(),
      location: location.trim(),
      work_mode: workMode,
      job_type: jobType,
      experience_level: experienceLevel.trim(),
      salary_min: salaryMin,
      salary_max: salaryMax,
      currency: currency.trim().toUpperCase(),
      categories,
      deadline,
      status,
    };

    let input: Partial<JobFormInput>;

    if (!existingJob) {
      input = {
        title: current.title,
        description: current.description,
        location: current.location || undefined,
        work_mode: current.work_mode,
        job_type: current.job_type,
        experience_level: current.experience_level || undefined,
        salary_min: salaryMin ? Number(salaryMin) : undefined,
        salary_max: salaryMax ? Number(salaryMax) : undefined,
        currency: current.currency || undefined,
        categories,
        deadline: deadline || undefined,
        status,
      };
    } else {
      // Edit: send only what changed.
      const before = {
        title: initial.title.trim(),
        description: initial.description.trim(),
        location: initial.location.trim(),
        work_mode: initial.workMode,
        job_type: initial.jobType,
        experience_level: initial.experienceLevel.trim(),
        salary_min: initial.salaryMin,
        salary_max: initial.salaryMax,
        currency: initial.currency.trim().toUpperCase(),
        categories: initial.categories,
        deadline: initial.deadline,
        status: initial.status,
      };
      const changed = (key: keyof typeof current) =>
        JSON.stringify(current[key]) !== JSON.stringify(before[key]);

      for (const [key, label] of Object.entries(NON_CLEARABLE)) {
        const k = key as keyof typeof current;
        if (changed(k) && !current[k] && before[k]) {
          setError(
            `${label} can't be removed once it's set. Enter a new value instead.`,
          );
          return;
        }
      }

      input = {};
      if (changed("title")) input.title = current.title;
      if (changed("description")) input.description = current.description;
      // "" is how the API clears a location.
      if (changed("location")) input.location = current.location;
      if (changed("work_mode")) input.work_mode = current.work_mode;
      if (changed("job_type")) input.job_type = current.job_type;
      if (changed("experience_level"))
        input.experience_level = current.experience_level;
      if (changed("salary_min")) input.salary_min = Number(salaryMin);
      if (changed("salary_max")) input.salary_max = Number(salaryMax);
      if (changed("currency")) input.currency = current.currency;
      if (changed("categories")) input.categories = categories;
      if (changed("deadline")) input.deadline = deadline;
      if (changed("status")) input.status = status;

      if (Object.keys(input).length === 0) {
        // Nothing to save (the API rejects an empty PATCH) — just leave.
        onSuccess(existingJob.id);
        return;
      }
    }

    if (new Blob([JSON.stringify(input)]).size > MAX_BODY_BYTES) {
      setError(
        "This job is too long to save. Shorten the description (the limit is roughly 9,000 characters).",
      );
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const result = existingJob
        ? await updateJob(existingJob.id, input, accessToken)
        : await createJob(input as JobFormInput, accessToken);

      onSuccess(result.job.id);
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "Failed to save this job. Please try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-lg space-y-4">
      <Field>
        <FieldLabel htmlFor="job-title">Job title</FieldLabel>
        <Input
          id="job-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
      </Field>

      <Field>
        <FieldLabel htmlFor="job-description">Description</FieldLabel>
        <Textarea
          id="job-description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={8}
          required
        />
      </Field>

      <div className="grid grid-cols-2 gap-4">
        <Field>
          <FieldLabel htmlFor="job-work-mode">Work mode</FieldLabel>
          <Select
            items={WORK_MODE_LABELS}
            value={workMode}
            onValueChange={(v) => setWorkMode(v as WorkMode)}
          >
            <SelectTrigger id="job-work-mode" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(Object.keys(WORK_MODE_LABELS) as WorkMode[]).map((mode) => (
                <SelectItem key={mode} value={mode}>
                  {WORK_MODE_LABELS[mode]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>

        <Field>
          <FieldLabel htmlFor="job-type">Job type</FieldLabel>
          <Select
            items={JOB_TYPE_LABELS}
            value={jobType}
            onValueChange={(v) => setJobType(v as JobType)}
          >
            <SelectTrigger id="job-type" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(Object.keys(JOB_TYPE_LABELS) as JobType[]).map((type) => (
                <SelectItem key={type} value={type}>
                  {JOB_TYPE_LABELS[type]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
      </div>

      <Field>
        <FieldLabel htmlFor="job-location">Location</FieldLabel>
        <Input
          id="job-location"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          placeholder="e.g. Cilegon, Banten"
        />
      </Field>

      <Field>
        <FieldLabel htmlFor="job-experience">
          Experience level{" "}
          <span style={{ color: "var(--color-text-muted)" }}>(optional)</span>
        </FieldLabel>
        <Input
          id="job-experience"
          value={experienceLevel}
          onChange={(e) => setExperienceLevel(e.target.value)}
          placeholder="e.g. Entry-level, 2+ years"
        />
      </Field>

      <div className="grid grid-cols-3 gap-4">
        <Field>
          <FieldLabel htmlFor="job-salary-min">Min salary</FieldLabel>
          <Input
            id="job-salary-min"
            type="number"
            min={0}
            value={salaryMin}
            onChange={(e) => setSalaryMin(e.target.value)}
          />
        </Field>
        <Field>
          <FieldLabel htmlFor="job-salary-max">Max salary</FieldLabel>
          <Input
            id="job-salary-max"
            type="number"
            min={0}
            value={salaryMax}
            onChange={(e) => setSalaryMax(e.target.value)}
          />
        </Field>
        <Field>
          <FieldLabel htmlFor="job-currency">Currency</FieldLabel>
          <Input
            id="job-currency"
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
            maxLength={3}
            placeholder="IDR"
          />
        </Field>
      </div>

      <Field>
        <FieldLabel htmlFor="job-categories">Categories</FieldLabel>
        <CategoriesInput
          id="job-categories"
          value={categories}
          onChange={setCategories}
        />
      </Field>

      <Field>
        <FieldLabel htmlFor="job-deadline">
          Application deadline{" "}
          <span style={{ color: "var(--color-text-muted)" }}>(optional)</span>
        </FieldLabel>
        <Input
          id="job-deadline"
          type="date"
          min={
            deadline === initial.deadline && existingJob
              ? undefined
              : tomorrowIsoDate()
          }
          value={deadline}
          onChange={(e) => setDeadline(e.target.value)}
        />
      </Field>

      <Field>
        <FieldLabel htmlFor="job-status">Status</FieldLabel>
        <Select
          items={STATUS_LABELS}
          value={status}
          onValueChange={(v) => setStatus(v as JobStatus)}
        >
          <SelectTrigger id="job-status" className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {(Object.keys(STATUS_LABELS) as JobStatus[]).map((s) => (
              <SelectItem key={s} value={s}>
                {STATUS_LABELS[s]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>

      {error && (
        <FieldDescription style={{ color: "var(--color-danger)" }}>
          {error}
        </FieldDescription>
      )}

      <Button
        type="submit"
        disabled={!title.trim() || !description.trim() || isSubmitting}
      >
        {isSubmitting ? "Saving..." : existingJob ? "Save changes" : "Post job"}
      </Button>
    </form>
  );
}
