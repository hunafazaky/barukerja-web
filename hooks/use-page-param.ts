"use client";

import { useCallback, useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { PaginationInfo } from "@/lib/pagination";

// Reads the current page number from the URL's "?page=" query param
// (defaulting to 1), and returns a setter that updates the URL. Storing
// it in the URL (rather than plain useState) means the current page
// survives a refresh, and the link can be shared/bookmarked.
//
// setPage(n, { replace: true }) swaps the history entry instead of adding
// one — use it for corrections (resetting to page 1 while typing a search,
// stepping back from an empty page) so the Back button isn't trapped.
//
// Note: useSearchParams() requires a <Suspense> boundary somewhere above
// wherever this hook is used — see how the list pages under
// app/(app)/ wrap their content in <Suspense>.
export function usePageParam(): [
  number,
  (page: number, options?: { replace?: boolean }) => void,
] {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();

  const page = Math.max(parseInt(searchParams.get("page") ?? "1", 10) || 1, 1);

  const setPage = useCallback(
    (newPage: number, options?: { replace?: boolean }) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set("page", String(newPage));
      const url = `${pathname}?${params.toString()}`;
      if (options?.replace) router.replace(url);
      else router.push(url);
    },
    [searchParams, pathname, router],
  );

  return [page, setPage];
}

// If the requested page is beyond the last page (the last item on the last
// page was just withdrawn/deleted, or someone hand-edited ?page=99), move to
// the last page that exists instead of showing a misleading "nothing here".
export function useClampPage(
  page: number,
  pagination: PaginationInfo | null,
  setPage: (page: number, options?: { replace?: boolean }) => void,
) {
  useEffect(() => {
    if (!pagination) return;
    const lastPage = Math.max(pagination.totalPages, 1);
    if (page > lastPage) setPage(lastPage, { replace: true });
  }, [page, pagination, setPage]);
}
