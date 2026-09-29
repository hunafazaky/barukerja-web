"use client";

// Browsing jobs doesn't require an account, so the root path just goes
// straight to the public /jobs list rather than forcing a sign-in first.
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { SiteLoader } from "@/components/site-loader";

export default function RootPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/jobs");
  }, [router]);

  return <SiteLoader />;
}
