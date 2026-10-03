import { NextRequest, NextResponse } from "next/server";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { randomUUID } from "crypto";
import { getUploadRules } from "@/lib/upload-constraints";

// Route Handlers run on the server (Node.js runtime by default in
// Next.js), so it's safe to use the real R2 secret key here — it never
// reaches the browser. Compare this to BACKEND_API_URL in
// next.config.ts, which is the same idea for the main backend: kept
// server-side only, never exposed to the client.
function getR2Client() {
  const accountId = process.env.CLOUDFLARE_R2_ACCOUNT_ID;
  const accessKeyId = process.env.CLOUDFLARE_R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY;

  if (!accountId || !accessKeyId || !secretAccessKey) {
    throw new Error(
      "Cloudflare R2 environment variables are missing. Copy .env.example to .env.local and fill in the CLOUDFLARE_R2_* values.",
    );
  }

  // R2 speaks the S3 API, so the regular AWS SDK works — it just needs
  // to be pointed at R2's endpoint instead of AWS's. "auto" is the region
  // R2 expects here, it isn't a real AWS region.
  return new S3Client({
    region: "auto",
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId, secretAccessKey },
  });
}

export async function POST(request: NextRequest) {
  const bucketName = process.env.CLOUDFLARE_R2_BUCKET_NAME;
  const publicUrlBase = process.env.CLOUDFLARE_R2_PUBLIC_URL;

  if (!bucketName || !publicUrlBase) {
    return NextResponse.json(
      { message: "File storage isn't configured on the server yet." },
      { status: 500 },
    );
  }

  const formData = await request.formData();
  const file = formData.get("file");
  const kind = formData.get("kind");

  if (!(file instanceof File)) {
    return NextResponse.json(
      { message: "No file was provided." },
      { status: 400 },
    );
  }

  if (
    kind !== "cover" &&
    kind !== "attachment" &&
    kind !== "cv" &&
    kind !== "logo"
  ) {
    return NextResponse.json(
      { message: "Invalid upload kind." },
      { status: 400 },
    );
  }

  // Re-check the same rules the client already checked — never trust
  // client-side validation alone, since it's trivial to bypass by calling
  // this endpoint directly.
  const { allowedTypes, maxSize } = getUploadRules(kind);

  if (!allowedTypes.includes(file.type)) {
    return NextResponse.json(
      {
        message:
          kind === "cover"
            ? "Cover must be a JPEG, PNG, WEBP, or GIF image."
            : kind === "logo"
              ? "Logo must be a JPEG, PNG, WEBP, or GIF image."
              : kind === "cv"
                ? "CV must be a PDF file."
                : "Attachment must be a PDF file.",
      },
      { status: 400 },
    );
  }

  if (file.size > maxSize) {
    return NextResponse.json(
      {
        message: `File is too large. Max size is ${Math.round(maxSize / (1024 * 1024))}MB.`,
      },
      { status: 400 },
    );
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  // A random key instead of the original filename — avoids collisions
  // between different users uploading files with the same name, and
  // avoids leaking the original filename if that matters to anyone.
  //
  // CVs live under their own prefix, separate from
  // "covers"/"attachments"/"logos". Those three are meant to be publicly
  // readable (see the public-URL logic below) — CVs are not: they
  // contain personal data, so they're only ever handed out via a
  // short-lived signed URL (see application.controller.getCvDownloadUrl
  // on the API). This route deliberately does NOT build or return a
  // public URL for kind "cv" — only the relative key, which is what POST
  // /applications' cv_key field expects. Whatever bucket this points at,
  // its bucket policy needs to keep the "applications/cvs/" prefix
  // non-public while "covers/"/"attachments/"/"logos/" stay public —
  // that's an infra setting, not something this route can enforce on
  // its own.
  const keyPrefix =
    kind === "cover"
      ? "covers"
      : kind === "logo"
        ? "logos"
        : kind === "cv"
          ? "applications/cvs"
          : "attachments";
  const extension = file.name.includes(".")
    ? file.name.split(".").pop()
    : undefined;
  const key = `${keyPrefix}/${randomUUID()}${extension ? `.${extension}` : ""}`;

  try {
    const client = getR2Client();
    await client.send(
      new PutObjectCommand({
        Bucket: bucketName,
        Key: key,
        Body: buffer,
        ContentType: file.type,
      }),
    );
  } catch (err) {
    console.error("R2 upload failed:", err);
    return NextResponse.json(
      { message: "Upload failed. Please try again." },
      { status: 502 },
    );
  }

  if (kind === "cv") {
    // No public URL — see the comment above. The caller uses `key`
    // directly as the application's cv_key.
    return NextResponse.json({ key });
  }

  // Build the public URL, and validate it BEFORE sending it back.
  //
  // Without this, a malformed CLOUDFLARE_R2_PUBLIC_URL (e.g. missing
  // "https://", or with stray whitespace from a copy-paste into
  // .env.local) would silently produce an invalid URL string that gets
  // sent to the browser — which then breaks in two different, confusing
  // places later: next/image throwing "Failed to construct 'URL': Invalid
  // URL" when trying to preview it, and the backend rejecting it with a
  // generic "Data validation error" (Joi's .uri() check) when it's
  // submitted as the work's cover/attachment link. Catching it here, with
  // a clear message, is much easier to debug than either of those.
  let url: string;
  try {
    const trimmedBase = publicUrlBase.trim();
    const normalizedBase = /^https?:\/\//.test(trimmedBase)
      ? trimmedBase
      : `https://${trimmedBase}`;
    url = `${normalizedBase.replace(/\/$/, "")}/${key}`;
    new URL(url); // throws if still not a valid URL
  } catch {
    console.error(
      "CLOUDFLARE_R2_PUBLIC_URL doesn't produce a valid URL:",
      publicUrlBase,
    );
    return NextResponse.json(
      {
        message:
          "File storage is misconfigured on the server (invalid public URL). Check CLOUDFLARE_R2_PUBLIC_URL in .env.local.",
      },
      { status: 500 },
    );
  }

  return NextResponse.json({ url });
}
