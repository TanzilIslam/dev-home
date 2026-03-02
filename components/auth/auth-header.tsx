import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";

type AuthHeaderProps = {
  actions?: React.ReactNode;
};

export function AuthHeader({ actions }: AuthHeaderProps) {
  return (
    <header className="flex items-center justify-between border-b px-6 py-4 md:px-10">
      <Link href="/" className="text-lg font-semibold tracking-tight">
        Dev Home
      </Link>
      <div className="flex items-center gap-2">
        <ThemeToggle />
        {actions}
      </div>
    </header>
  );
}
