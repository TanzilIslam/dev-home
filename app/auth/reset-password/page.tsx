import type { Metadata } from "next";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";
import { AuthLayout } from "@/components/auth/auth-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Set new password",
  description: "Choose a new password for your Dev Home account.",
  robots: { index: false },
};

export default function ResetPasswordPage() {
  return (
    <AuthLayout>
      <Card>
        <CardHeader>
          <CardTitle>Set new password</CardTitle>
          <CardDescription>Choose a new password for your account.</CardDescription>
        </CardHeader>
        <CardContent>
          <ResetPasswordForm />
        </CardContent>
      </Card>
    </AuthLayout>
  );
}
