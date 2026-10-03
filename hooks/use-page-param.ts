"use client";

import { useCallback } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

// Reads the current page number from the URL's "?page=" query param
// (defaulting to 1), and returns a setter that updates the URL. Storing
// it in the URL (rather than plain useState) means the current page
// survives a refresh, and the link can be shared/bookmarked.
//
// Note: useSearchParams() requires a <Suspense> boundary somewhere above
// wherever this hook is used — see how the list pages under
// app/(app)/ wrap their content in <Suspense>.
export function usePageParam(): [number, (page: number) => void] {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();

  const page = Math.max(parseInt(searchParams.get("page") ?? "1", 10) || 1, 1);

  const setPage = useCallback(
    (newPage: number) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set("page", String(newPage));
      router.push(`${pathname}?${params.toString()}`);
    },
    [searchParams, pathname, router],
  );

  return [page, setPage];
}
