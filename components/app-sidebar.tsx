"use client";

import * as React from "react";
import { NavMain } from "@/components/nav-main";
import { NavUser } from "@/components/nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

import {
  BriefcaseIcon,
  BookmarkSimpleIcon,
  ClockCounterClockwiseIcon,
  FileTextIcon,
} from "@phosphor-icons/react";

// My Import
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  // My Const
  const { user } = useAuth();

  // Employer-side dashboard links (company, posted jobs, applicant
  // review) are a later pass — see CLAUDE.md's progress tracker — so an
  // employer only sees "Browse jobs" for now, same as before this page
  // existed. Nothing here is guessed at; each link only appears once
  // its page actually exists.
  const navMain =
    user?.role === "seeker"
      ? [
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
        ]
      : [{ title: "Browse jobs", url: "/jobs", icon: <BriefcaseIcon /> }];

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <Link href={"/jobs"}>
              <SidebarMenuButton className="data-[slot=sidebar-menu-button]:p-1.5!">
                <BriefcaseIcon
                  className="size-5!"
                  color="var(--color-accent)"
                  weight="fill"
                />
                <span className="text-base font-semibold">BaruKerja</span>
              </SidebarMenuButton>
            </Link>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        {user && <NavMain items={navMain} />}
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
    </Sidebar>
  );
}
