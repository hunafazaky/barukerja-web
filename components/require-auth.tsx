"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import type { UserRole } from "@/types/user";
import { SiteLoader } from "@/components/site-loader";

// Wrap a dashboard page's content in this to require sign-in (and,
// optionally, a specific role) before rendering it. Redirects to sign-in
// with a ?next= back to the current page, same pattern the job detail
// page's apply flow uses.
export function RequireAuth({
  role,
  children,
}: {
  role?: UserRole;
  children: React.ReactNode;
}) {
  const { user, isLoading, isSigningOut } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (isLoading) return;
    if (!user) {
      // The user just chose "Sign out": signout() is already sending them
      // to /auth/signin, so don't add a competing redirect with a ?next=.
      if (isSigningOut()) return;
      router.replace(`/auth/signin?next=${encodeURIComponent(pathname)}`);
      return;
    }
    if (role && user.role !== role) {
      // Signed in, but as the wrong role for this page (e.g. an
      // employer hitting a seeker-only page) — /jobs is a safe, always-
      // valid landing spot rather than guessing at a role-appropriate one.
      router.replace("/jobs");
    }
  }, [user, isLoading, role, router, pathname, isSigningOut]);

  if (isLoading || !user || (role && user.role !== role)) {
    return <SiteLoader />;
  }

  return <>{children}</>;
}
