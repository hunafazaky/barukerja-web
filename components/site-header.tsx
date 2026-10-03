import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { SignoutConfirmation } from "@/components/signout-confirmation";
import { SignOutIcon } from "@phosphor-icons/react";

export function SiteHeader({ title }: { title: string }) {
  return (
    <header className="flex h-(--header-height) shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
        {/* Desktop only — the sidebar this opens is hidden on mobile
            (see app-sidebar.tsx), where components/bottom-nav.tsx covers
            the same destinations instead. */}
        <SidebarTrigger className="-ml-1 hidden md:flex" />
        <Separator
          orientation="vertical"
          className="mx-2 hidden h-4 data-vertical:self-auto md:block"
        />
        <h1 className="flex-1 text-base font-medium">{title}</h1>
        {/* Sign-out normally lives in the sidebar footer (NavUser) —
            that's hidden on mobile along with the rest of the sidebar,
            so it needs a reachable spot here instead. Same confirm-
            before-signing-out flow, just a compact trigger. */}
        <div className="md:hidden">
          <SignoutConfirmation
            trigger={
              <button
                aria-label="Sign out"
                style={{ color: "var(--color-text-muted)" }}
              >
                <SignOutIcon className="size-5" />
              </button>
            }
          />
        </div>
      </div>
    </header>
  );
}
