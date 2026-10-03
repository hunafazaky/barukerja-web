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
        className={`mx-auto w-full max-w-3xl px-4 pt-6 md:px-6 md:pt-8 md:pb-10 ${
          hasBottomNav ? "pb-24" : "pb-10"
        }`}
      >
        {children}
      </main>
      <BottomNav />
    </div>
  );
}
