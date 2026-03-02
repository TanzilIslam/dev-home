"use client";

import { Suspense, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { exchangeCodeForSession } from "@/lib/supabase/queries";
import { Spinner } from "@/components/ui/spinner";

/**
 * Handles OAuth code exchange (e.g. Google, GitHub login).
 * Supabase redirects here with ?code=... after a successful OAuth flow.
 */
function AuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const exchangedRef = useRef(false);

  useEffect(() => {
    if (exchangedRef.current) return;
    exchangedRef.current = true;

    const code = searchParams.get("code");

    if (!code) {
      router.replace("/auth/login");
      return;
    }

    exchangeCodeForSession(code).then(({ error }) => {
      if (error) {
        router.replace(`/auth/login?error=${encodeURIComponent(error.message)}`);
        return;
      }

      router.replace("/dashboard");
    });
  }, [router, searchParams]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <Spinner className="size-6" />
        <p className="text-muted-foreground text-sm">Signing in...</p>
      </div>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <Spinner className="size-6" />
            <p className="text-muted-foreground text-sm">Signing in...</p>
          </div>
        </div>
      }
    >
      <AuthCallbackContent />
    </Suspense>
  );
}
