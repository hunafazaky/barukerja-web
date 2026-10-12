import Link from "next/link";
import type { Metadata } from "next";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Page not found" };

// Shown for any URL that doesn't exist (and for notFound() calls).
export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-svh max-w-md flex-col items-center justify-center gap-4 px-4 text-center">
      <p className="label-caps">Error 404</p>
      <h1 className="text-4xl leading-tight font-black">
        This page has been withdrawn
      </h1>
      <p className="text-lg italic" style={{ color: "var(--color-text-muted)" }}>
        We couldn&apos;t find what you were looking for. It may never have run,
        or it has moved.
      </p>
      <Button nativeButton={false} render={<Link href="/jobs" />}>
        Browse jobs
      </Button>
    </div>
  );
}
