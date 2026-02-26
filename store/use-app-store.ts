"use client";

import { create } from "zustand";

export type DashboardSection =
  | "overview"
  | "clients"
  | "projects"
  | "codebases"
  | "links"
  | "profile";

type AppStore = {
  activeSection: DashboardSection;
  setActiveSection: (section: DashboardSection) => void;
  expandedClientId: string | null;
  expandedClientName: string | null;
  setExpandedClient: (id: string | null, name: string | null) => void;
};

const SECTION_SLUGS: Record<string, DashboardSection> = {
  clients: "clients",
  projects: "projects",
  codebases: "codebases",
  links: "links",
  profile: "profile",
};

export function sectionFromPathname(pathname: string): DashboardSection {
  const slug = pathname.replace(/^\/dashboard\/?/, "").split("/")[0];
  return SECTION_SLUGS[slug] ?? "overview";
}

function pushSectionUrl(section: DashboardSection) {
  const path = section === "overview" ? "/dashboard" : `/dashboard/${section}`;
  if (typeof window !== "undefined" && window.location.pathname !== path) {
    window.history.pushState(null, "", path);
  }
}

export const useAppStore = create<AppStore>((set) => ({
  activeSection: "overview",
  setActiveSection: (section) => {
    pushSectionUrl(section);
    set({ activeSection: section, expandedClientId: null, expandedClientName: null });
  },
  expandedClientId: null,
  expandedClientName: null,
  setExpandedClient: (id, name) =>
    set({ expandedClientId: id, expandedClientName: name }),
}));
