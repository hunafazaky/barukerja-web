"use client";

import { useEffect } from "react";

// Sets the browser tab title for a client page: "Find work · BaruKerja".
// Pages here are client components (so they can't export `metadata`), and
// without this every tab was just "BaruKerja". Pass undefined while the title
// isn't known yet (e.g. a job that is still loading) to keep the default.
export function useDocumentTitle(title: string | undefined | null) {
  useEffect(() => {
    if (!title) return;
    const previous = document.title;
    document.title = `${title} · BaruKerja`;
    return () => {
      document.title = previous;
    };
  }, [title]);
}
