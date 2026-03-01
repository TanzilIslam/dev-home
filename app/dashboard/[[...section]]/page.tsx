import { DashboardApp } from "@/components/dashboard/dashboard-app";
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
  const { section } = await params;
  const slug = section?.[0];
  const initialSection: DashboardSection =
    slug && VALID_SECTIONS.has(slug) ? (slug as DashboardSection) : "overview";

  return <DashboardApp initialSection={initialSection} />;
}
