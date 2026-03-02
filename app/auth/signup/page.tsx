import Link from "next/link";
import { SignupForm } from "@/components/auth/signup-form";
import { AuthLayout } from "@/components/auth/auth-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

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
