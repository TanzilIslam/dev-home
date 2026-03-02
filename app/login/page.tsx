import Link from "next/link";
import { LoginForm } from "@/components/auth/login-form";
import { AuthLayout } from "@/components/auth/auth-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

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
          <div className="mt-4 flex items-center justify-between text-sm">
            <p className="text-muted-foreground">
              New here?{" "}
              <Link href="/signup" className="text-foreground underline">
                Create an account
              </Link>
              .
            </p>
            <Link href="/forgot-password" className="text-muted-foreground hover:text-foreground">
              Forgot password?
            </Link>
          </div>
        </CardContent>
      </Card>
    </AuthLayout>
  );
}
