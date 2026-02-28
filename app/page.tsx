import Link from "next/link";
import { ArrowRight, Code, FolderKanban, Link2, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { getSession } from "@/lib/auth/server";

const FEATURES = [
  {
    icon: Users,
    title: "Clients",
    description: "Track all your clients and engagement details in one place.",
  },
  {
    icon: FolderKanban,
    title: "Projects",
    description: "Organize projects by client with status tracking.",
  },
  {
    icon: Code,
    title: "Codebases",
    description: "Map codebases to projects for quick reference.",
  },
  {
    icon: Link2,
    title: "Links",
    description: "Save important URLs at any level — client, project, or codebase.",
  },
];

export default async function Home() {
  const session = await getSession();

  return (
    <div className="relative flex min-h-screen flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 md:px-10">
        <span className="text-lg font-semibold tracking-tight">Dev Home</span>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          {session ? (
            <Button asChild size="sm">
              <Link href="/dashboard">Dashboard</Link>
            </Button>
          ) : (
            <Button asChild size="sm" variant="ghost">
              <Link href="/login">Log in</Link>
            </Button>
          )}
        </div>
      </header>

      {/* Hero */}
      <main className="flex flex-1 flex-col items-center justify-center px-6 text-center">
        <div className="bg-muted text-muted-foreground mb-6 inline-flex items-center rounded-full px-3 py-1 text-xs font-medium">
          Your developer workspace
        </div>

        <h1 className="max-w-3xl text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
          Everything you need,{" "}
          <span className="bg-linear-to-r from-indigo-500 via-purple-500 to-pink-500 bg-clip-text text-transparent">
            all in one place
          </span>
        </h1>

        <p className="text-muted-foreground mt-4 max-w-xl text-base leading-relaxed md:text-lg">
          Organize your clients, projects, codebases, and links with a clean
          dashboard built for developers.
        </p>

        <div className="mt-8 flex items-center gap-3">
          {session ? (
            <Button asChild size="lg">
              <Link href="/dashboard">
                Go to Dashboard
                <ArrowRight className="ml-2 size-4" />
              </Link>
            </Button>
          ) : (
            <>
              <Button asChild size="lg">
                <Link href="/signup">
                  Get Started
                  <ArrowRight className="ml-2 size-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="/login">Log in</Link>
              </Button>
            </>
          )}
        </div>

        {/* Features */}
        <div className="mt-20 mb-16 grid w-full max-w-4xl grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((feature) => (
            <div
              key={feature.title}
              className="bg-card border-border group rounded-xl border p-5 text-left transition-shadow hover:shadow-md"
            >
              <div className="bg-primary/10 text-primary mb-3 inline-flex size-9 items-center justify-center rounded-lg">
                <feature.icon className="size-4" />
              </div>
              <h3 className="text-sm font-semibold">{feature.title}</h3>
              <p className="text-muted-foreground mt-1 text-xs leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer className="text-muted-foreground border-t px-6 py-4 text-center text-xs">
        Dev Home
      </footer>
    </div>
  );
}
