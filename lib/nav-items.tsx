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

// The one place that decides which nav destinations exist per role.
// Used by components/app-sidebar.tsx (desktop dashboard sidebar),
// components/bottom-nav.tsx (mobile tab bar), and components/site-nav.tsx
// (public-page top bar) — previously each of these either duplicated
// this list or, in site-nav.tsx's case, never had it at all (that's the
// "only Jobs and Sign out" gap). Edit here, not at each call site.
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
