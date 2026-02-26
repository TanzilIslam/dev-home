"use client";

import {
  LayoutDashboard,
  Users,
  FolderKanban,
  Code,
  Link,
} from "lucide-react";
import { useAppStore, type DashboardSection } from "@/store/use-app-store";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar";


const NAV_ITEMS: {
  label: string;
  icon: typeof LayoutDashboard;
  section: DashboardSection;
}[] = [
  { label: "Overview", icon: LayoutDashboard, section: "overview" },
  { label: "Clients", icon: Users, section: "clients" },
  { label: "Projects", icon: FolderKanban, section: "projects" },
  { label: "Codebases", icon: Code, section: "codebases" },
  { label: "Links", icon: Link, section: "links" },
];

export function AppSidebar() {
  const activeSection = useAppStore((state) => state.activeSection);
  const setActiveSection = useAppStore((state) => state.setActiveSection);
  const { isMobile, setOpenMobile } = useSidebar();

  function handleNav(section: DashboardSection) {
    setActiveSection(section);
    if (isMobile) {
      setOpenMobile(false);
    }
  }

  return (
    <Sidebar collapsible="icon" variant="sidebar">
      <SidebarHeader>
        <div className="flex h-8 items-center gap-2 px-2">
          <span className="text-lg font-semibold group-data-[collapsible=icon]:hidden">
            dev-home
          </span>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {NAV_ITEMS.map((item) => (
                <SidebarMenuItem key={item.section}>
                  <SidebarMenuButton
                    className="cursor-pointer"
                    isActive={activeSection === item.section}
                    tooltip={item.label}
                    onClick={() => handleNav(item.section)}
                  >
                    <item.icon />
                    <span>{item.label}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarRail />
    </Sidebar>
  );
}
