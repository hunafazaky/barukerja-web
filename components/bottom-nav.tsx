"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { getNavItems } from "@/lib/nav-items";

// The mobile-first primary nav — a fixed bottom tab bar, visible only
// below the md breakpoint (md:hidden). On desktop, the same destinations
// live in components/app-sidebar.tsx (dashboard pages) or inline in
// components/site-nav.tsx (public pages) instead; this is NOT rendered
// there. Account actions (sign in/out) are deliberately NOT tab items
// here — those live in the top bar (SiteNav/SiteHeader) on every screen
// size, since a bottom tab is a navigation destination, not an action.
//
// Rendered once, globally, from app/layout.tsx — content needs bottom
// padding (pb-16, already applied where this renders) on mobile so the
// fixed bar doesn't cover the last bit of scrollable content.
export function BottomNav() {
  const { user, isLoading } = useAuth();
  const pathname = usePathname();

  // Nothing role-specific to show when signed out — a single "Jobs" tab
  // spanning the full width would just duplicate the brand link already
  // in the header, and sign-in/up are already reachable there too.
  if (isLoading || !user) return null;

  const items = getNavItems(user?.role);

  // The sidebar's full labels ("My applications", "Company profile")
  // wrap awkwardly at bottom-tab width — shorten just for this display,
  // the underlying nav-items list stays the single source of truth for
  // which destinations exist and where they go.
  const shortLabel: Record<string, string> = {
    "Browse jobs": "Jobs",
    "My applications": "Applications",
    "Company profile": "Company",
  };

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 border-t md:hidden"
      style={{
        background: "var(--color-bg)",
        borderColor: "var(--color-border)",
        paddingBottom: "env(safe-area-inset-bottom, 0px)",
      }}
    >
      <div
        className="grid h-16"
        style={{ gridTemplateColumns: `repeat(${items.length}, 1fr)` }}
      >
        {items.map((item) => {
          const isActive =
            pathname === item.url ||
            (item.url !== "/jobs" && pathname.startsWith(item.url + "/"));
          return (
            <Link
              key={item.url}
              href={item.url}
              className="flex flex-col items-center justify-center gap-1 text-[11px]"
              style={{
                color: isActive
                  ? "var(--color-accent)"
                  : "var(--color-text-muted)",
              }}
            >
              <span className="text-xl leading-none">{item.icon}</span>
              <span>{shortLabel[item.title] ?? item.title}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
