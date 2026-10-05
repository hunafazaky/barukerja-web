"use client";

import { useState } from "react";
import { FileUploadField } from "@/components/file-upload-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import { useAuth } from "@/context/AuthContext";
import { createCompany, updateCompany } from "@/lib/company.api";
import { uploadFile } from "@/lib/upload.api";
import { ApiError } from "@/types/api";
import { Company } from "@/types/company";

// Handles both create (no existingCompany) and edit (existingCompany
// passed in) — the fields are identical either way, only which API call
// fires on submit differs.
export function CompanyForm({
  existingCompany,
  onSuccess,
}: {
  existingCompany?: Company;
  onSuccess: (company: Company) => void;
}) {
  const { getAccessToken } = useAuth();
  const [name, setName] = useState(existingCompany?.name ?? "");
  const [description, setDescription] = useState(
    existingCompany?.description ?? "",
  );
  const [website, setWebsite] = useState(existingCompany?.website ?? "");
  const [location, setLocation] = useState(existingCompany?.location ?? "");
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const accessToken = getAccessToken();
    if (!accessToken || !name.trim()) return;

    setIsSubmitting(true);
    setError(null);

    try {
      // Only upload a new logo if the user actually picked one — editing
      // shouldn't force a re-upload of the existing one.
      let logoUrl = existingCompany?.logo;
      if (logoFile) {
        const result = await uploadFile(logoFile, "logo", accessToken);
        logoUrl = result.url;
      }

      // When editing, an emptied field must be sent as "" — the API's PATCH
      // accepts "" to clear these, but a missing key means "leave as is", so
      // `|| undefined` silently kept the old value. (Creating: omit empties.)
      const blank = existingCompany ? "" : undefined;
      const input = {
        name: name.trim(),
        description: description.trim() || blank,
        website: website.trim() || blank,
        location: location.trim() || blank,
        logo: logoUrl,
      };

      const result = existingCompany
        ? await updateCompany(existingCompany.id, input, accessToken)
        : await createCompany(input, accessToken);

      onSuccess(result.company);
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "Failed to save your company profile. Please try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-lg space-y-4">
      <Field>
        <FieldLabel htmlFor="company-name">Company name</FieldLabel>
        <Input
          id="company-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
      </Field>

      <Field>
        <FieldLabel htmlFor="company-logo">Logo</FieldLabel>
        <FileUploadField
          id="company-logo"
          kind="logo"
          file={logoFile}
          onFileChange={setLogoFile}
          existingUrl={existingCompany?.logo}
        />
      </Field>

      <Field>
        <FieldLabel htmlFor="company-location">Location</FieldLabel>
        <Input
          id="company-location"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          placeholder="e.g. Cilegon, Banten"
        />
      </Field>

      <Field>
        <FieldLabel htmlFor="company-website">Website</FieldLabel>
        <Input
          id="company-website"
          type="url"
          value={website}
          onChange={(e) => setWebsite(e.target.value)}
          placeholder="https://..."
        />
      </Field>

      <Field>
        <FieldLabel htmlFor="company-description">About</FieldLabel>
        <Textarea
          id="company-description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={5}
        />
      </Field>

      {error && (
        <FieldDescription style={{ color: "var(--color-danger)" }}>
          {error}
        </FieldDescription>
      )}

      <Button type="submit" disabled={!name.trim() || isSubmitting}>
        {isSubmitting
          ? "Saving..."
          : existingCompany
            ? "Save changes"
            : "Create company profile"}
      </Button>
    </form>
  );
}
