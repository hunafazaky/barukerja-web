"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

// Error boundary for pages inside the app shell. Sits below the shell's
// layout, so the top bar and bottom tabs stay usable when one page breaks.
export default function AppError({
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
    <div className="flex flex-col items-start gap-4 py-10">
      <h1
        className="text-2xl font-black"
        style={{ fontFamily: "var(--font-heading)" }}
      >
        Something went wrong
      </h1>
      <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
        This page hit an unexpected error. Try again, or use the menu to go
        somewhere else.
      </p>
      <Button onClick={reset}>Try again</Button>
    </div>
  );
}
