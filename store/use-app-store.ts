"use client";

import { create } from "zustand";

export type DashboardSection =
  | "overview"
  | "clients"
  | "projects"
  | "codebases"
  | "links"
  | "settings";

type AppStore = {
  activeSection: DashboardSection;
  setActiveSection: (section: DashboardSection) => void;
  expandedClientId: string | null;
  expandedClientName: string | null;
  setExpandedClient: (id: string | null, name: string | null) => void;
};

export const useAppStore = create<AppStore>((set) => ({
  activeSection: "overview",
  setActiveSection: (section) =>
    set({ activeSection: section, expandedClientId: null, expandedClientName: null }),
  expandedClientId: null,
  expandedClientName: null,
  setExpandedClient: (id, name) =>
    set({ expandedClientId: id, expandedClientName: name }),
}));
