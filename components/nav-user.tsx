"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  // DropdownMenuLabel,
  // DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  DotsThreeOutlineVerticalIcon,
  SignInIcon,
  UserCirclePlusIcon,
} from "@phosphor-icons/react";

// My Import
// import { User } from "@/types/user";
import { useAuth } from "@/context/AuthContext";
import { Skeleton } from "@/components/ui/skeleton";
import { SignoutConfirmation } from "./signout-confirmation";
import Link from "next/link";

export function NavUser() {
  const { isMobile } = useSidebar();

  // My Const
  const { user, isLoading } = useAuth();
  const guestUser = {
    id: "001",
    email: "guest@example.com",
    display_name: "Guest",
    photo: "/globe.svg",
    bio: "Guest Account, Limited Access.",
    role: "seeker" as const,
    createdAt: "",
    updatedAt: "",
  };

  return (
    <SidebarMenu>
      {isLoading ? (
        <div className="flex w-fit items-center gap-4">
          <Skeleton className="size-10 shrink-0 rounded-full" />
          <div className="grid gap-2">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-4 w-25" />
          </div>
        </div>
      ) : (
        <SidebarMenuItem>
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <SidebarMenuButton
                  size="lg"
                  className="aria-expanded:bg-muted"
                />
              }
            >
              <Avatar className="size-8 rounded-lg grayscale">
                <AvatarImage
                  src={user ? user.photo : guestUser.photo}
                  alt={user ? user.display_name : guestUser.display_name}
                />
                <AvatarFallback className="rounded-lg">RP</AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">
                  {user ? user.display_name : guestUser.display_name}
                </span>
                <span className="truncate text-xs text-foreground/70">
                  {user ? user.email : guestUser.email}
                </span>
              </div>
              <DotsThreeOutlineVerticalIcon className="ml-auto size-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent
              className="min-w-56"
              side={isMobile ? "bottom" : "right"}
              align="end"
              sideOffset={4}
            >
              <DropdownMenuGroup>
                {/* <DropdownMenuLabel className="p-0 font-normal">
                  <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                    <Avatar className="size-8">
                      <AvatarImage
                        src={user ? user.photo : guestUser.photo}
                        alt={user ? user.display_name : guestUser.display_name}
                      />
                      <AvatarFallback className="rounded-lg">RP</AvatarFallback>
                    </Avatar>
                    <div className="grid flex-1 text-left text-sm leading-tight">
                      <span className="truncate font-medium">
                        {user ? user.display_name : guestUser.display_name}
                      </span>
                      <span className="truncate text-xs text-muted-foreground">
                        {user ? user.email : guestUser.email}
                      </span>
                    </div>
                  </div>
                </DropdownMenuLabel> */}
              </DropdownMenuGroup>
              {/* <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuItem>
                  <CircleUserRoundIcon />
                  Account
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <CreditCardIcon />
                  Billing
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <BellIcon />
                  Notifications
                </DropdownMenuItem>
                </DropdownMenuGroup>
              <DropdownMenuSeparator /> */}
              {user ? (
                <SignoutConfirmation />
              ) : (
                <DropdownMenuGroup>
                  <Link href="/auth/signup">
                    <DropdownMenuItem>
                      <UserCirclePlusIcon />
                      Sign Up
                    </DropdownMenuItem>
                  </Link>
                  <Link href="/auth/signin">
                    <DropdownMenuItem>
                      <SignInIcon />
                      Sign In
                    </DropdownMenuItem>
                  </Link>
                </DropdownMenuGroup>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarMenuItem>
      )}
    </SidebarMenu>
  );
}
