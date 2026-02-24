import Link from "next/link";
import { LoginForm } from "@/components/auth/login-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type LoginPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const rawError = params.error;
  const error = Array.isArray(rawError) ? rawError[0] : rawError;

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center px-6 py-16">
      <Card>
        <CardHeader>
          <CardTitle>Log in</CardTitle>
          <CardDescription>
            Access your developer dashboard and saved links.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <LoginForm serverError={error} />
          <p className="mt-4 text-sm text-muted-foreground">
            New here?{" "}
            <Link href="/signup" className="text-foreground underline">
              Create an account
            </Link>
            .
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
