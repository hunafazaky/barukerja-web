"use client";

import { Spinner } from "@/components/ui/spinner";

// Two flavours:
//  - default (inline): fills the content area under the header, so the top
//    bar and bottom tabs stay visible and tappable while a page waits for
//    the session check (used by <RequireAuth>, loading.tsx).
//  - fullscreen: the bare redirect page at "/", which has no chrome at all.
//
// The backend runs on a free tier that can take ~30 s to wake up. Rather than
// telling everyone "still connecting to the database…" on every load, the
// extra hint fades in only if loading is actually slow — via a CSS animation
// delay, so no timer/state is needed.
export function SiteLoader({ fullscreen = false }: { fullscreen?: boolean }) {
  return (
    <div
      role="status"
      className={
        fullscreen
          ? "fixed inset-0 z-20 flex flex-col items-center justify-center gap-3 text-center"
          : "flex min-h-[50svh] flex-col items-center justify-center gap-3 text-center"
      }
      style={fullscreen ? { background: "var(--color-bg)" } : undefined}
    >
      <Spinner />
      <span className="text-sm">Loading…</span>
      <span
        className="animate-in fade-in fill-mode-backwards delay-[4000ms] duration-500 max-w-xs px-4 text-xs"
        style={{ color: "var(--color-text-muted)" }}
      >
        Still working — the server may be waking up. This can take a few
        seconds.
      </span>
    </div>
  );
}
