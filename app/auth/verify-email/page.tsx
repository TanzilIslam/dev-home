import type { Metadata } from "next";
import Link from "next/link";
import { ResendVerificationForm } from "@/components/auth/resend-verification-form";
import { AuthLayout } from "@/components/auth/auth-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Resend verification email",
  description: "Resend the email verification link for your Dev Home account.",
  robots: { index: false },
};

export default function VerifyEmailPage() {
  return (
    <AuthLayout>
      <Card>
        <CardHeader>
          <CardTitle>Resend verification email</CardTitle>
          <CardDescription>
            Enter your email address and we&apos;ll send a new verification link.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResendVerificationForm />
          <p className="text-muted-foreground mt-4 text-sm">
            Already verified?{" "}
            <Link href="/auth/login" className="text-foreground underline">
              Log in
            </Link>
            .
          </p>
        </CardContent>
      </Card>
    </AuthLayout>
  );
}
