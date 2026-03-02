import type { Metadata } from "next";
import Link from "next/link";
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";
import { AuthLayout } from "@/components/auth/auth-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Reset password",
  description: "Reset your Dev Home account password.",
  alternates: { canonical: "/auth/forgot-password" },
  robots: { index: false },
};

export default function ForgotPasswordPage() {
  return (
    <AuthLayout>
      <Card>
        <CardHeader>
          <CardTitle>Reset password</CardTitle>
          <CardDescription>
            Enter your email and we&apos;ll send you a link to reset your password.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ForgotPasswordForm />
          <p className="text-muted-foreground mt-4 text-sm">
            Remember your password?{" "}
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
