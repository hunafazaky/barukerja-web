"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { Spinner } from "@/components/ui/spinner";
import {
  getServerSlowSnapshot,
  getSlowSince,
  getSlowSnapshot,
  subscribeSlow,
} from "@/lib/server-wakeup";

// Full-screen "starting up" page, shown once the backend has been silent for
// more than 3 s (see lib/server-wakeup.ts) and removed as soon as it answers.
// The backend is on a free tier that sleeps when idle, so the first request
// after a quiet period is slow; without this the app just looks frozen.
export function ServerWakeupNotice() {
  const slow = useSyncExternalStore(
    subscribeSlow,
    getSlowSnapshot,
    getServerSlowSnapshot,
  );
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!slow) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [slow]);

  if (!slow) return null;

  const since = getSlowSince();
  const seconds = since ? Math.max(0, Math.round((now - since) / 1000)) : 0;

  return (
    <div
      role="status"
      aria-live="polite"
      data-testid="server-wakeup"
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center gap-4 px-6 text-center"
      style={{ background: "var(--color-bg)" }}
    >
      <p
        className="text-4xl font-black tracking-tight"
        style={{ fontFamily: "var(--font-heading)" }}
      >
        BaruKerja
      </p>
      <div
        className="flex max-w-md flex-col items-center gap-3 border-[3px] border-double px-6 py-8"
        style={{
          borderColor: "var(--color-text)",
          background: "var(--color-bg-sunk)",
        }}
      >
        <Spinner />
        <h1 className="text-2xl font-bold">The presses are warming up…</h1>
        <p className="text-base" style={{ color: "var(--color-text-muted)" }}>
          Our server sleeps when it hasn&apos;t been used for a while. It can
          take up to a minute to start. This page will carry on by itself — no
          need to refresh.
        </p>
        <p className="label-caps font-normal tabular-nums">Waiting {seconds}s</p>
      </div>
    </div>
  );
}
