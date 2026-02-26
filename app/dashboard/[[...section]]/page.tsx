import { redirect } from "next/navigation";
import { DashboardApp } from "@/components/dashboard/dashboard-app";
import { getCurrentUser } from "@/lib/auth/user";
import type { DashboardSection } from "@/store/use-app-store";

const VALID_SECTIONS = new Set<string>([
  "overview",
  "clients",
  "projects",
  "codebases",
  "links",
  "profile",
]);

type DashboardPageProps = {
  params: Promise<{ section?: string[] }>;
};

export default async function DashboardPage({ params }: DashboardPageProps) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const { section } = await params;
  const slug = section?.[0];

  if (slug && !VALID_SECTIONS.has(slug)) {
    redirect("/dashboard");
  }

  const initialSection = (slug as DashboardSection) ?? "overview";

  return (
    <DashboardApp
      user={{ email: user.email, name: user.name }}
      initialSection={initialSection}
    />
  );
}
