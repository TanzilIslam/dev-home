import type { Metadata } from "next";
import Link from "next/link";
import { SignupForm } from "@/components/auth/signup-form";
import { AuthLayout } from "@/components/auth/auth-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { siteConfig } from "@/lib/config/site";

export const metadata: Metadata = {
  title: "Create account",
  description:
    "Sign up for Dev Home to organize your clients, projects, codebases, and links in one place.",
  alternates: { canonical: "/auth/signup" },
  openGraph: {
    title: "Create account | Dev Home",
    description:
      "Sign up for Dev Home to organize your clients, projects, codebases, and links in one place.",
    url: "/auth/signup",
    images: [{ url: `${siteConfig.url}/og.webp`, width: 1200, height: 630, alt: siteConfig.name }],
  },
};

type SignupPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function SignupPage({ searchParams }: SignupPageProps) {
  const params = await searchParams;
  const rawError = params.error;
  const error = Array.isArray(rawError) ? rawError[0] : rawError;

  return (
    <AuthLayout>
      <Card>
        <CardHeader>
          <CardTitle>Create account</CardTitle>
          <CardDescription>
            Set up your dashboard to manage client, project, and codebase links.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SignupForm serverError={error} />
          <p className="text-muted-foreground mt-4 text-sm">
            Already have an account?{" "}
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
