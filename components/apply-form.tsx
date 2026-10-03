"use client";

import { useState } from "react";
import { FileUploadField } from "@/components/file-upload-field";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { FieldDescription, FieldLabel } from "@/components/ui/field";
import { useAuth } from "@/context/AuthContext";
import { createApplication } from "@/lib/application.api";
import { uploadFile } from "@/lib/upload.api";
import { ApiError } from "@/types/api";

// Inline (not a modal — there's no plain Dialog primitive in this
// project, only alert-dialog/sheet/drawer, and a full-screen sheet felt
// heavier than this form warrants) apply flow: pick a CV, optionally
// write a cover letter, submit. Two network calls happen on submit —
// upload the file to R2 first (via /api/upload, kind "cv"), then create
// the application with the resulting key — not one call, since the
// backend only ever sees the already-uploaded cv_key, never the file
// itself (see api/src/utils/validationSchemas.ts's applicationCreateSchema).
export function ApplyForm({
  jobId,
  onSuccess,
}: {
  jobId: string;
  onSuccess: () => void;
}) {
  const { accessToken } = useAuth();
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [coverLetter, setCoverLetter] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!cvFile || !accessToken) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const uploadResult = await uploadFile(cvFile, "cv");
      if (!uploadResult.key) {
        throw new Error("Upload succeeded but didn't return a storage key.");
      }
      await createApplication(
        {
          jobId,
          cv_key: uploadResult.key,
          cover_letter: coverLetter.trim() || undefined,
        },
        accessToken,
      );
      onSuccess();
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "Failed to submit your application. Please try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mt-2 space-y-4 rounded-md border p-4"
      style={{ borderColor: "var(--color-border)" }}
    >
      <div>
        <FieldLabel htmlFor="cv-upload">CV (PDF)</FieldLabel>
        <FileUploadField
          id="cv-upload"
          kind="cv"
          file={cvFile}
          onFileChange={setCvFile}
        />
      </div>

      <div>
        <FieldLabel htmlFor="cover-letter">
          Cover letter{" "}
          <span style={{ color: "var(--color-text-muted)" }}>(optional)</span>
        </FieldLabel>
        <Textarea
          id="cover-letter"
          value={coverLetter}
          onChange={(e) => setCoverLetter(e.target.value)}
          maxLength={3000}
          rows={5}
          placeholder="Why you're a good fit for this role..."
        />
      </div>

      {error && (
        <FieldDescription style={{ color: "var(--color-danger)" }}>
          {error}
        </FieldDescription>
      )}

      <Button type="submit" disabled={!cvFile || isSubmitting}>
        {isSubmitting ? "Submitting..." : "Submit application"}
      </Button>
    </form>
  );
}
