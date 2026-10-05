"use client";

import { Suspense } from "react";
import { SigninForm } from "@/components/signin-form";
import { useAuth } from "@/context/AuthContext";
import { useRouter, useSearchParams } from "next/navigation";
import { safeNextPath } from "@/lib/safe-redirect";
import { useEffect } from "react";

function SigninPageContent() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  // This effect is the ONE place that leaves the sign-in page once a user
  // exists (fresh sign-in or an already-signed-in visitor). The form used to
  // also router.push(next) itself, and the two navigations raced — the
  // effect's replace("/jobs") won, so ?next= was silently ignored.
  const destination = safeNextPath(searchParams.get("next"));

  useEffect(() => {
    if (!isLoading && user) {
      router.replace(destination);
    }
  }, [user, router, isLoading, destination]);

  if (user || isLoading) {
    return null;
  }

  return (
    <div className="flex min-h-svh flex-col items-center justify-center bg-muted p-6 md:p-10">
      <div className="w-full max-w-sm md:max-w-4xl">
        <SigninForm />
      </div>
    </div>
  );
}

export default function SigninPage() {
  return (
    <Suspense fallback={null}>
      <SigninPageContent />
    </Suspense>
  );
}
