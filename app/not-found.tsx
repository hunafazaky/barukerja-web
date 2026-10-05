import Link from "next/link";
import type { Metadata } from "next";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Page not found" };

// Shown for any URL that doesn't exist (and for notFound() calls).
export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-svh max-w-md flex-col items-center justify-center gap-4 px-4 text-center">
      <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
        404
      </p>
      <h1
        className="text-2xl font-black"
        style={{ fontFamily: "var(--font-heading)" }}
      >
        Page not found
      </h1>
      <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
        The page you&apos;re looking for doesn&apos;t exist or has moved.
      </p>
      <Button nativeButton={false} render={<Link href="/jobs" />}>
        Browse jobs
      </Button>
    </div>
  );
}
