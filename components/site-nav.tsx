"use client";

import Link from "next/link";
import { useAuth } from "@/context/AuthContext";

// The top nav for public-facing pages (job browsing, landing) — separate
// from the authenticated dashboard's sidebar shell (see app-sidebar.tsx),
// which only applies once a seeker/employer is inside their dashboard.
export function SiteNav() {
  const { user, isLoading, signout } = useAuth();

  return (
    <header
      className="border-b"
      style={{ borderColor: "var(--color-border)" }}
    >
      <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-4 md:px-6">
        <Link
          href="/jobs"
          className="text-lg font-black"
          style={{ fontFamily: "var(--font-heading)" }}
        >
          BaruKerja
        </Link>
        <nav className="flex items-center gap-4 text-sm">
          <Link href="/jobs" className="hover:underline">
            Jobs
          </Link>
          {!isLoading && user ? (
            <>
              {/* The seeker/employer dashboard is a later build pass —
                  see CLAUDE.md's route map. Nothing to link to yet. */}
              <button
                onClick={() => signout()}
                className="hover:underline"
                style={{ color: "var(--color-text-muted)" }}
              >
                Sign out
              </button>
            </>
          ) : (
            !isLoading && (
              <>
                <Link href="/auth/signin" className="hover:underline">
                  Sign in
                </Link>
                <Link
                  href="/auth/signup"
                  className="rounded-md border px-3 py-1.5 font-medium"
                  style={{
                    borderColor: "var(--color-accent)",
                    color: "var(--color-accent)",
                  }}
                >
                  Sign up
                </Link>
              </>
            )
          )}
        </nav>
      </div>
    </header>
  );
}
