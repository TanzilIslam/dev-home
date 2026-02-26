"use client";

import { LogOut, UserCircle } from "lucide-react";
import { useAppStore } from "@/store/use-app-store";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { ThemeToggle } from "@/components/theme-toggle";
import { DashboardBreadcrumbs } from "@/components/dashboard/dashboard-breadcrumbs";

export function DashboardHeader() {
  const setActiveSection = useAppStore((state) => state.setActiveSection);

  return (
    <header className="flex h-14 items-center gap-2 border-b px-4">
      <SidebarTrigger />
      <Separator orientation="vertical" className="h-4" />
      <DashboardBreadcrumbs />

      <div className="ml-auto flex items-center gap-1">
        <ThemeToggle />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" aria-label="User menu">
              <UserCircle className="size-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setActiveSection("profile")}>
              <UserCircle className="size-4" />
              Profile
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <form action="/api/auth/logout" method="post" className="w-full">
                <button type="submit" className="flex w-full items-center gap-2">
                  <LogOut className="size-4" />
                  Log out
                </button>
              </form>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
