import type { Metadata } from "next";
import Link from "next/link";
import { LoginForm } from "@/components/auth/login-form";
import { AuthLayout } from "@/components/auth/auth-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { siteConfig } from "@/lib/config/site";

export const metadata: Metadata = {
  title: "Log in",
  description: "Log in to your Dev Home dashboard to manage clients, projects, and links.",
  alternates: { canonical: "/auth/login" },
  openGraph: {
    title: "Log in | Dev Home",
    description: "Log in to your Dev Home dashboard to manage clients, projects, and links.",
    url: "/auth/login",
    images: [{ url: `${siteConfig.url}/og.webp`, width: 1200, height: 630, alt: siteConfig.name }],
  },
};

type LoginPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const rawError = params.error;
  const error = Array.isArray(rawError) ? rawError[0] : rawError;

  return (
    <AuthLayout>
      <Card>
        <CardHeader>
          <CardTitle>Log in</CardTitle>
          <CardDescription>Access your developer dashboard and saved links.</CardDescription>
        </CardHeader>
        <CardContent>
          <LoginForm serverError={error} />
          <div className="mt-4 flex flex-col gap-2 text-sm">
            <div className="flex items-center justify-between">
              <p className="text-muted-foreground">
                New here?{" "}
                <Link href="/auth/signup" className="text-foreground underline">
                  Create an account
                </Link>
                .
              </p>
              <Link
                href="/auth/forgot-password"
                className="text-muted-foreground hover:text-foreground"
              >
                Forgot password?
              </Link>
            </div>
            <p className="text-muted-foreground">
              Link expired?{" "}
              <Link href="/auth/verify-email" className="text-foreground underline">
                Resend verification email
              </Link>
              .
            </p>
          </div>
        </CardContent>
      </Card>
    </AuthLayout>
  );
}
