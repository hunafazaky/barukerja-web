"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { SignoutConfirmation } from "@/components/signout-confirmation";
import { useAuth } from "@/context/AuthContext";
import { getNavItems, isNavActive } from "@/lib/nav-items";

// The one header for every page inside the app shell (public browsing
// AND the seeker/employer pages) — see components/app-shell.tsx. There
// used to be a second, sidebar-based shell for the dashboard pages, which
// is why moving from "Browse jobs" to "My jobs" swapped the whole chrome.
//
// Responsive split: on desktop (md+) the role-aware destinations show
// inline here. On mobile they live in components/bottom-nav.tsx's tab
// bar instead (repeating them here would be two navs on one small
// screen), so mobile keeps just the brand and the account action.
export function SiteNav() {
  const { user, isLoading } = useAuth();
  const pathname = usePathname();
  const navItems = getNavItems(user?.role);

  return (
    <header className="border-b" style={{ borderColor: "var(--color-border)" }}>
      <div className="mx-auto flex max-w-3xl items-center justify-between gap-4 px-4 py-4 md:px-6">
        <Link
          href="/jobs"
          className="text-lg font-black"
          style={{ fontFamily: "var(--font-heading)" }}
        >
          BaruKerja
        </Link>

        {!isLoading && user && (
          <nav className="hidden items-center gap-5 text-sm md:flex">
            {navItems.map((item) => (
              <Link
                key={item.url}
                href={item.url}
                className="hover:underline"
                style={
                  isNavActive(pathname, item.url)
                    ? { color: "var(--color-brand)", fontWeight: 700 }
                    : undefined
                }
              >
                {item.title}
              </Link>
            ))}
          </nav>
        )}

        <div className="flex items-center gap-4 text-sm">
          {!isLoading && user ? (
            // Same confirm-before-signing-out flow everywhere; only the
            // visible trigger is customised.
            <SignoutConfirmation
              trigger={
                <button
                  className="hover:underline"
                  style={{ color: "var(--color-text-muted)" }}
                >
                  Sign out
                </button>
              }
            />
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
                    borderColor: "var(--color-brand)",
                    color: "var(--color-brand)",
                  }}
                >
                  Sign up
                </Link>
              </>
            )
          )}
        </div>
      </div>
    </header>
  );
}
