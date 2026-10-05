"use client";

import { ChangeEvent, useEffect, useState } from "react";
import { getUploadRules } from "@/lib/upload-constraints";
import { Input } from "@/components/ui/input";
import { FieldDescription } from "@/components/ui/field";

interface FileUploadFieldProps {
  id?: string;
  kind: "cover" | "attachment" | "cv" | "logo";
  // The file picked in this session, not yet uploaded — owned by the
  // parent form. Nothing is sent to R2 until the parent's submit handler
  // actually uploads it (see WorkFormWrite / WorkFormEdit).
  file: File | null;
  onFileChange: (file: File | null) => void;
  // An already-uploaded URL to fall back to when no new file has been
  // picked — e.g. the work's current cover when editing.
  existingUrl?: string;
}

// A file picker that validates a chosen file (type + size) and previews
// it locally, but does NOT upload it right away. Uploading happens once,
// at submit time, in the parent form — otherwise picking a file 2-3 times
// before hitting Publish would upload 2-3 files to R2 and only use the
// last one, leaving the rest sitting there unused forever.
export function FileUploadField({
  id,
  kind,
  file,
  onFileChange,
  existingUrl,
}: FileUploadFieldProps) {
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const isImage = kind === "cover" || kind === "logo";
  const { allowedTypes, maxSize } = getUploadRules(kind);
  const maxSizeLabel = `${Math.round(maxSize / (1024 * 1024))}MB`;

  // Build a temporary, local preview URL for the picked file (images
  // only) using the browser's own object-URL API — this does NOT touch
  // the network or R2 at all, it's purely client-side. It's revoked
  // whenever the file changes or this component unmounts, so it doesn't
  // leak memory.
  useEffect(() => {
    // This effect owns a browser resource (an object URL) and mirrors it into
    // state so it can be revoked on cleanup — a legitimate "synchronise with
    // an external system" effect, which the rule can't tell from a data
    // fetch.
    if (!file || !isImage) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setPreviewUrl(null);
      return;
    }
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [file, isImage]);

  function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files?.[0];
    // Reset the input so picking the exact same file again later still
    // fires this handler (browsers don't fire "change" for a no-op pick).
    e.target.value = "";
    if (!selected) return;

    setError(null);

    if (!allowedTypes.includes(selected.type)) {
      setError(
        isImage
          ? "Please choose a JPEG, PNG, WEBP, or GIF image."
          : "Please choose a PDF file.",
      );
      return;
    }
    if (selected.size > maxSize) {
      setError(`File is too large. Max size is ${maxSizeLabel}.`);
      return;
    }

    onFileChange(selected);
  }

  // A freshly picked local preview (a "blob:" URL) always takes priority
  // over whatever was already uploaded. It's rendered with a plain <img>,
  // not next/image — "blob:" URLs are browser-local and temporary, which
  // next/image's remote-image handling isn't designed for.
  const imageSrc = previewUrl ?? (isImage ? existingUrl : undefined);

  return (
    <div className="flex flex-col gap-2">
      <Input
        id={id}
        type="file"
        accept={allowedTypes.join(",")}
        onChange={handleFileChange}
      />

      {error && (
        <FieldDescription className="text-destructive">
          {error}
        </FieldDescription>
      )}

      {isImage && imageSrc && (
        // blob: preview URLs aren't supported by next/image.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={imageSrc}
          alt="Preview"
          width={160}
          height={160}
          className="rounded object-cover"
        />
      )}

      {!isImage && file && (
        <FieldDescription>Attached: {file.name}</FieldDescription>
      )}
      {!isImage && !file && existingUrl && (
        <FieldDescription>
          Attached:{" "}
          <a href={existingUrl} target="_blank" rel="noreferrer">
            {existingUrl.split("/").pop()}
          </a>
        </FieldDescription>
      )}
    </div>
  );
}
