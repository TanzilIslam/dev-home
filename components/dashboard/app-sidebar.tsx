"use client";

import {
  LayoutDashboard,
  Users,
  FolderKanban,
  Code,
  Link,
  Settings,
} from "lucide-react";
import { useAppStore, type DashboardSection } from "@/store/use-app-store";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarSeparator,
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
  { label: "Settings", icon: Settings, section: "settings" },
];

type AppSidebarProps = {
  user: { email: string; name: string | null };
};

export function AppSidebar({ user }: AppSidebarProps) {
  const activeSection = useAppStore((state) => state.activeSection);
  const setActiveSection = useAppStore((state) => state.setActiveSection);
  const { isMobile, setOpenMobile } = useSidebar();

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
                    isActive={activeSection === item.section}
                    tooltip={item.label}
                    onClick={() => {
                      setActiveSection(item.section);
                      if (isMobile) {
                        setOpenMobile(false);
                      }
                    }}
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

      <SidebarSeparator />

      <SidebarFooter>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <span className="text-muted-foreground truncate text-xs group-data-[collapsible=icon]:hidden">
            {user.email}
          </span>
        </div>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
