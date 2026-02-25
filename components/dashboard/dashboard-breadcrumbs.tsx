"use client";

import { useAppStore } from "@/store/use-app-store";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

const SECTION_LABELS: Record<string, string> = {
  overview: "Overview",
  clients: "Clients",
  projects: "Projects",
  codebases: "Codebases",
  links: "Links",
  settings: "Settings",
};

export function DashboardBreadcrumbs() {
  const activeSection = useAppStore((s) => s.activeSection);
  const expandedClientName = useAppStore((s) => s.expandedClientName);
  const setActiveSection = useAppStore((s) => s.setActiveSection);
  const setExpandedClient = useAppStore((s) => s.setExpandedClient);

  const sectionLabel = SECTION_LABELS[activeSection] ?? activeSection;
  const isClientExpanded = activeSection === "clients" && !!expandedClientName;

  return (
    <Breadcrumb>
      <BreadcrumbList>
        {/* Dashboard (always first) */}
        <BreadcrumbItem>
          {isClientExpanded || activeSection !== "overview" ? (
            <BreadcrumbLink asChild>
              <button type="button" onClick={() => setActiveSection("overview")}>
                Dashboard
              </button>
            </BreadcrumbLink>
          ) : (
            <BreadcrumbPage>Dashboard</BreadcrumbPage>
          )}
        </BreadcrumbItem>

        {/* Show section when not on overview, or always when on a real section */}
        {activeSection !== "overview" && (
          <>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              {isClientExpanded ? (
                <BreadcrumbLink asChild>
                  <button
                    type="button"
                    onClick={() => setExpandedClient(null, null)}
                  >
                    {sectionLabel}
                  </button>
                </BreadcrumbLink>
              ) : (
                <BreadcrumbPage>{sectionLabel}</BreadcrumbPage>
              )}
            </BreadcrumbItem>
          </>
        )}

        {/* Expanded client name */}
        {isClientExpanded && (
          <>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{expandedClientName}</BreadcrumbPage>
            </BreadcrumbItem>
          </>
        )}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
