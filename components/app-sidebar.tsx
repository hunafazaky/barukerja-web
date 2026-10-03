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

import { BriefcaseIcon } from "@phosphor-icons/react";

// My Import
import { useAuth } from "@/context/AuthContext";
import { getNavItems } from "@/lib/nav-items";
import Link from "next/link";

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  // My Const
  const { user } = useAuth();
  const navMain = getNavItems(user?.role);

  return (
    // Desktop only, functionally — components/bottom-nav.tsx covers the
    // same nav destinations on mobile with a thumb-reachable tab bar
    // instead of an offcanvas drawer. Note: `hidden md:flex` below does
    // NOT hide this on mobile — this component's own isMobile branch
    // renders a Sheet directly and never forwards className to it. What
    // actually keeps it closed on mobile is site-header.tsx hiding the
    // only SidebarTrigger that could set openMobile to true. The
    // className is kept anyway as a correct-on-desktop no-op, not as
    // the mechanism — don't rely on it to mean "hidden on mobile".
    <Sidebar collapsible="offcanvas" className="hidden md:flex" {...props}>
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
      <SidebarContent>{user && <NavMain items={navMain} />}</SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
    </Sidebar>
  );
}
