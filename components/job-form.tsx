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
import { Job, JobStatus, JobType, WorkMode } from "@/types/job";

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

// today's date as "YYYY-MM-DD", for the deadline input's min attribute —
// the backend rejects a deadline that isn't in the future.
function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10);
}

export function JobForm({
  existingJob,
  onSuccess,
}: {
  existingJob?: Job;
  onSuccess: (jobId: string) => void;
}) {
  const { accessToken } = useAuth();
  const [title, setTitle] = useState(existingJob?.title ?? "");
  const [description, setDescription] = useState(
    existingJob?.description ?? "",
  );
  const [location, setLocation] = useState(existingJob?.location ?? "");
  const [workMode, setWorkMode] = useState<WorkMode>(
    existingJob?.work_mode ?? "onsite",
  );
  const [jobType, setJobType] = useState<JobType>(
    existingJob?.job_type ?? "full_time",
  );
  const [experienceLevel, setExperienceLevel] = useState(
    existingJob?.experience_level ?? "",
  );
  const [salaryMin, setSalaryMin] = useState(
    existingJob?.salary_min?.toString() ?? "",
  );
  const [salaryMax, setSalaryMax] = useState(
    existingJob?.salary_max?.toString() ?? "",
  );
  const [currency, setCurrency] = useState(existingJob?.currency ?? "IDR");
  const [categories, setCategories] = useState<string[]>(
    existingJob?.categories ?? [],
  );
  const [deadline, setDeadline] = useState(
    existingJob?.deadline ? existingJob.deadline.slice(0, 10) : "",
  );
  const [status, setStatus] = useState<JobStatus>(
    existingJob?.status ?? "open",
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!accessToken || !title.trim() || !description.trim()) return;

    if (salaryMin && salaryMax && Number(salaryMax) <= Number(salaryMin)) {
      setError("Maximum salary must be greater than minimum salary.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const input = {
        title: title.trim(),
        description: description.trim(),
        location: location.trim() || undefined,
        work_mode: workMode,
        job_type: jobType,
        experience_level: experienceLevel.trim() || undefined,
        salary_min: salaryMin ? Number(salaryMin) : undefined,
        salary_max: salaryMax ? Number(salaryMax) : undefined,
        currency: currency.trim() ? currency.trim().toUpperCase() : undefined,
        categories,
        deadline: deadline || undefined,
        status,
      };

      const result = existingJob
        ? await updateJob(existingJob.id, input, accessToken)
        : await createJob(input, accessToken);

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
        <CategoriesInput value={categories} onChange={setCategories} />
      </Field>

      <Field>
        <FieldLabel htmlFor="job-deadline">
          Application deadline{" "}
          <span style={{ color: "var(--color-text-muted)" }}>(optional)</span>
        </FieldLabel>
        <Input
          id="job-deadline"
          type="date"
          min={todayIsoDate()}
          value={deadline}
          onChange={(e) => setDeadline(e.target.value)}
        />
      </Field>

      <Field>
        <FieldLabel htmlFor="job-status">Status</FieldLabel>
        <Select value={status} onValueChange={(v) => setStatus(v as JobStatus)}>
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
