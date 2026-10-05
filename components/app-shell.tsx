"use client";

import { BottomNav } from "@/components/bottom-nav";
import { SiteNav } from "@/components/site-nav";
import { useAuth } from "@/context/AuthContext";

// The single page shell for everything except the auth pages: top bar,
// one centred content column, and (mobile, signed in) the bottom tab bar.
// Rendered by app/(app)/layout.tsx, so pages inside the (app) route group
// never import SiteNav or set their own width/background — that's what
// kept drifting when each page built its own chrome.
export function AppShell({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  // BottomNav renders only for signed-in users (see its own early
  // return), so only reserve space for it in that case.
  const hasBottomNav = !isLoading && !!user;

  return (
    <div className="min-h-svh" style={{ background: "var(--color-bg)" }}>
      <SiteNav />
      <main
        // wrap-anywhere: user-supplied text (job titles, company names,
        // emails) has no spaces to wrap on, and would otherwise push the
        // page wider than the screen. (Also lets flex children shrink.)
        className={`mx-auto w-full max-w-3xl px-4 pt-6 wrap-anywhere md:px-6 md:pt-8 md:pb-10 ${
          // 4rem tab bar + breathing room + the iPhone home-indicator inset
          hasBottomNav ? "pb-[calc(6rem+env(safe-area-inset-bottom))]" : "pb-10"
        }`}
      >
        {children}
      </main>
      <BottomNav />
    </div>
  );
}
