import {
  BriefcaseIcon,
  BookmarkSimpleIcon,
  BuildingOfficeIcon,
  ClockCounterClockwiseIcon,
  FileTextIcon,
} from "@phosphor-icons/react";
import type { UserRole } from "@/types/user";

export interface NavItem {
  title: string;
  url: string;
  icon: React.ReactNode;
}

// The one place that decides which nav destinations exist per role. Used
// by components/site-nav.tsx (desktop top bar) and
// components/bottom-nav.tsx (mobile tab bar). Add a destination here, not
// in either component.
export function getNavItems(role: UserRole | null | undefined): NavItem[] {
  if (role === "seeker") {
    return [
      { title: "Browse jobs", url: "/jobs", icon: <BriefcaseIcon /> },
      {
        title: "My applications",
        url: "/applications",
        icon: <FileTextIcon />,
      },
      {
        title: "Bookmarked",
        url: "/bookmarked",
        icon: <BookmarkSimpleIcon />,
      },
      {
        title: "History",
        url: "/history",
        icon: <ClockCounterClockwiseIcon />,
      },
    ];
  }

  if (role === "employer") {
    return [
      { title: "Browse jobs", url: "/jobs", icon: <BriefcaseIcon /> },
      { title: "My jobs", url: "/dashboard/jobs", icon: <FileTextIcon /> },
      {
        title: "Company profile",
        url: "/dashboard/company",
        icon: <BuildingOfficeIcon />,
      },
    ];
  }

  // Signed out, or a role with nothing built for it yet (admin) — just
  // the one thing that's always true: you can browse jobs.
  return [{ title: "Browse jobs", url: "/jobs", icon: <BriefcaseIcon /> }];
}

// One active-state rule for every nav surface (top bar, bottom bar), so a
// destination highlights on its nested pages too: "Browse jobs" stays lit
// on /jobs/[id], "My jobs" stays lit on /dashboard/jobs/new, /edit and
// /applicants. Previously each surface had its own copy of this check, and
// they disagreed (the /jobs one deliberately skipped nested routes).
export function isNavActive(pathname: string, url: string): boolean {
  return pathname === url || pathname.startsWith(url + "/");
}
