import Link from "next/link";
import { Button } from "@/components/ui/button";
import { getSession } from "@/lib/auth/server";

export default async function Home() {
  const session = await getSession();

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-4xl flex-col justify-center px-6 py-16">
      <h1 className="text-4xl font-semibold tracking-tight">dev-home</h1>
      <p className="mt-4 max-w-2xl text-base text-zinc-600 dark:text-zinc-300">
        Save and organize all your client, project, and codebase links in one
        place.
      </p>
      <div className="mt-8 flex flex-wrap items-center gap-3">
        {session ? (
          <>
            <Button asChild>
              <Link href="/dashboard">Go to dashboard</Link>
            </Button>
            <form action="/api/auth/logout" method="post">
              <Button type="submit" variant="outline">
                Log out
              </Button>
            </form>
          </>
        ) : (
          <>
            <Button asChild>
              <Link href="/signup">Create account</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/login">Log in</Link>
            </Button>
          </>
        )}
      </div>
    </main>
  );
}
