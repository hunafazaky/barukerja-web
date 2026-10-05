"use client";

import Link from "next/link";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";

// Last-resort error boundary for the whole app. Without one, any render
// error (e.g. a null the UI didn't expect) blanks the entire page with no
// way back. This shows a plain message and a retry instead.
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto flex min-h-svh max-w-md flex-col items-center justify-center gap-4 px-4 text-center">
      <h1
        className="text-2xl font-black"
        style={{ fontFamily: "var(--font-heading)" }}
      >
        Something went wrong
      </h1>
      <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
        An unexpected error stopped this page from loading. You can try again,
        or go back to the job list.
      </p>
      <div className="flex gap-2">
        <Button onClick={reset}>Try again</Button>
        <Button
          variant="outline"
          nativeButton={false}
          render={<Link href="/jobs" />}
        >
          Back to jobs
        </Button>
      </div>
    </div>
  );
}
