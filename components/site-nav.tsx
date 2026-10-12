"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSyncExternalStore } from "react";
import { SignoutConfirmation } from "@/components/signout-confirmation";
import { useAuth } from "@/context/AuthContext";
import { getNavItems, isNavActive } from "@/lib/nav-items";

// The date is only known in the browser (server and visitor time zones
// differ), so read it with useSyncExternalStore: "" on the server and during
// hydration, the real date afterwards. No effect, no hydration mismatch.
const subscribeNever = () => () => {};
const getDate = () => new Date().toDateString();
const getServerDate = () => "";

function useToday() {
  const key = useSyncExternalStore(subscribeNever, getDate, getServerDate);
  if (!key) return null;
  const d = new Date(key);
  const start = new Date(d.getFullYear(), 0, 0).getTime();
  return {
    long: d.toLocaleDateString("en-GB", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    }),
    short: d.toLocaleDateString("en-GB", {
      weekday: "short",
      day: "numeric",
      month: "short",
      year: "numeric",
    }),
    // "No. 284" — the issue number is simply the day of the year.
    issue: Math.floor((d.getTime() - start) / 86_400_000),
  };
}

const dateline =
  "label-caps flex min-h-10 items-center text-[0.65rem] sm:text-[0.7rem]";
const datelineLink =
  "inline-flex min-h-10 items-center px-1 hover:text-[var(--color-brand)]";

// The masthead: dateline, nameplate, double rule and (md+) the section bar.
// One header for every page in the app shell. On mobile the sections live in
// components/bottom-nav.tsx's tab bar instead (two navs on one small screen
// would be too much), so mobile keeps dateline + nameplate.
export function SiteNav() {
  const { user, isLoading } = useAuth();
  const pathname = usePathname();
  const navItems = getNavItems(user?.role);
  const today = useToday();

  return (
    <header className="pt-[env(safe-area-inset-top)]">
      <div className="mx-auto max-w-5xl px-4 md:px-6">
        <div className="flex items-center justify-between gap-3">
          <p className={dateline} suppressHydrationWarning>
            <span className="hidden sm:inline">{today?.long}</span>
            <span className="sm:hidden">{today?.short}</span>
          </p>
          <p className={`${dateline} hidden md:flex`} aria-hidden="true">
            {today ? `Vol. I · No. ${today.issue}` : ""}
          </p>
          <div className={`${dateline} gap-1`}>
            {!isLoading && user ? (
              <>
                <Link
                  href="/account"
                  className={datelineLink}
                  style={
                    isNavActive(pathname, "/account")
                      ? { color: "var(--color-brand)" }
                      : undefined
                  }
                >
                  Account
                </Link>
                <span aria-hidden="true">·</span>
                {/* Same confirm-before-signing-out flow everywhere; only the
                    visible trigger is customised. */}
                <SignoutConfirmation
                  trigger={
                    <button
                      className={`${datelineLink} uppercase tracking-[0.15em]`}
                    >
                      Sign out
                    </button>
                  }
                />
              </>
            ) : (
              !isLoading && (
                <>
                  <Link href="/auth/signin" className={datelineLink}>
                    Sign in
                  </Link>
                  <span aria-hidden="true">·</span>
                  <Link
                    href="/auth/signup"
                    className={`${datelineLink} font-bold`}
                    style={{ color: "var(--color-brand)" }}
                  >
                    Sign up
                  </Link>
                </>
              )
            )}
          </div>
        </div>

        <div
          className="border-t pb-2 pt-3 text-center md:pb-3 md:pt-4"
          style={{ borderColor: "var(--color-text)" }}
        >
          <Link
            href="/jobs"
            className="inline-block font-black leading-none tracking-tight text-[2.6rem] md:text-[4.5rem]"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            BaruKerja
          </Link>
          <p
            className="mt-1 hidden text-base italic md:block"
            style={{ color: "var(--color-text-muted)" }}
          >
            Find work, or find the people to do it.
          </p>
        </div>

        {/* Thick-over-thin rule */}
        <div
          className="border-t-[3px] pt-[3px]"
          style={{ borderColor: "var(--color-text)" }}
        >
          <div className="border-t" style={{ borderColor: "var(--color-text)" }} />
        </div>

        {!isLoading && user && (
          <nav
            aria-label="Sections"
            className="label-caps hidden items-center justify-center gap-9 border-b md:flex"
            style={{ borderColor: "var(--color-text)" }}
          >
            {navItems.map((item) => {
              const active = isNavActive(pathname, item.url);
              return (
                <Link
                  key={item.url}
                  href={item.url}
                  aria-current={active ? "page" : undefined}
                  className="inline-flex min-h-11 items-center border-b-2 border-transparent hover:text-[var(--color-brand)]"
                  style={
                    active
                      ? {
                          color: "var(--color-brand)",
                          borderBottomColor: "var(--color-brand)",
                        }
                      : { color: "var(--color-text)" }
                  }
                >
                  {item.title}
                </Link>
              );
            })}
          </nav>
        )}
      </div>
    </header>
  );
}
