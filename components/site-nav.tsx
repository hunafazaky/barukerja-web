"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { getNavItems } from "@/lib/nav-items";

// The top bar for public-facing pages (job browsing, landing) — separate
// from the authenticated dashboard's sidebar shell (see app-sidebar.tsx).
//
// Responsive split: on desktop (md+), this shows the full role-aware nav
// inline, same destinations as the dashboard sidebar. On mobile, those
// destinations move to components/bottom-nav.tsx's fixed tab bar instead
// (rendered globally from app/layout.tsx) — repeating them here too
// would just be two navs fighting for the same screen. Mobile keeps only
// the brand and the sign-in/out action, since that's not a nav
// destination BottomNav covers.
export function SiteNav() {
  const { user, isLoading, signout } = useAuth();
  const pathname = usePathname();
  const navItems = getNavItems(user?.role);

  return (
    <header className="border-b" style={{ borderColor: "var(--color-border)" }}>
      <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-4 md:px-6">
        <Link
          href="/jobs"
          className="text-lg font-black"
          style={{ fontFamily: "var(--font-heading)" }}
        >
          BaruKerja
        </Link>

        {!isLoading && user && (
          <nav className="hidden items-center gap-5 text-sm md:flex">
            {navItems.map((item) => {
              const isActive =
                pathname === item.url ||
                (item.url !== "/jobs" && pathname.startsWith(item.url + "/"));
              return (
                <Link
                  key={item.url}
                  href={item.url}
                  className="hover:underline"
                  style={
                    isActive ? { color: "var(--color-accent)" } : undefined
                  }
                >
                  {item.title}
                </Link>
              );
            })}
          </nav>
        )}

        <div className="flex items-center gap-4 text-sm">
          {!isLoading && user ? (
            <button
              onClick={() => signout()}
              className="hover:underline"
              style={{ color: "var(--color-text-muted)" }}
            >
              Sign out
            </button>
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
        </div>
      </div>
    </header>
  );
}
