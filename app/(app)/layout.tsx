import { AppShell } from "@/components/app-shell";

// Every page under (app) — public browsing, company profiles, and the
// seeker/employer pages — shares this one shell. The route group adds no
// URL segment, so paths are unchanged (/jobs, /applications,
// /dashboard/jobs, ...). Auth pages sit outside it on purpose: they're
// chromeless centred cards.
export default function AppLayout({ children }: { children: React.ReactNode }) {
  return <AppShell>{children}</AppShell>;
}
