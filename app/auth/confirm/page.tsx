"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ShieldAlert } from "lucide-react";
import { verifyOtp } from "@/lib/supabase/queries";
import { Spinner } from "@/components/ui/spinner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AuthLayout } from "@/components/auth/auth-layout";
import { ResendVerificationForm } from "@/components/auth/resend-verification-form";
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";

function AuthConfirmContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const verifiedRef = useRef(false);
  const [error, setError] = useState<string | null>(null);
  const type = searchParams.get("type") as "signup" | "email" | "recovery" | "invite" | null;

  useEffect(() => {
    if (verifiedRef.current) return;
    verifiedRef.current = true;

    const tokenHash = searchParams.get("token_hash");

    if (!tokenHash || !type) {
      router.replace("/auth/login");
      return;
    }

    verifyOtp({ tokenHash, type }).then(({ error: verifyError }) => {
      if (verifyError) {
        setError(verifyError.message);
        return;
      }

      if (type === "recovery") {
        router.replace("/auth/reset-password");
      } else {
        router.replace("/dashboard");
      }
    });
  }, [router, searchParams, type]);

  if (error) {
    const isSignup = type === "signup" || type === "email";
    const isRecovery = type === "recovery";

    return (
      <AuthLayout>
        <Card>
          <CardHeader>
            <div className="flex flex-col items-center text-center">
              <div className="bg-destructive/10 mb-4 inline-flex size-12 items-center justify-center rounded-full">
                <ShieldAlert className="text-destructive size-6" />
              </div>
              <CardTitle>Verification failed</CardTitle>
              <p className="text-muted-foreground mt-1 text-sm">{error}</p>
            </div>
          </CardHeader>
          <CardContent>
            {isSignup ? (
              <>
                <div className="bg-muted mb-4 rounded-md px-4 py-3">
                  <p className="text-muted-foreground text-xs">
                    Your verification link may have expired. Enter your email below to receive a new
                    one.
                  </p>
                </div>
                <ResendVerificationForm />
              </>
            ) : null}
            {isRecovery ? (
              <>
                <div className="bg-muted mb-4 rounded-md px-4 py-3">
                  <p className="text-muted-foreground text-xs">
                    Your password reset link may have expired. Enter your email below to receive a
                    new one.
                  </p>
                </div>
                <ForgotPasswordForm />
              </>
            ) : null}
            <div className="mt-4 text-center">
              <Button variant="ghost" asChild>
                <Link href="/auth/login">Back to login</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </AuthLayout>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <Spinner className="size-6" />
        <p className="text-muted-foreground text-sm">Verifying...</p>
      </div>
    </div>
  );
}

export default function AuthConfirmPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <Spinner className="size-6" />
            <p className="text-muted-foreground text-sm">Verifying...</p>
          </div>
        </div>
      }
    >
      <AuthConfirmContent />
    </Suspense>
  );
}
