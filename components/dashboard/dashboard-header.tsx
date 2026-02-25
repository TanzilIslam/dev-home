"use client";

import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { DashboardBreadcrumbs } from "@/components/dashboard/dashboard-breadcrumbs";

export function DashboardHeader() {
  return (
    <header className="flex h-14 items-center gap-2 border-b px-4">
      <SidebarTrigger />
      <Separator orientation="vertical" className="h-4" />
      <DashboardBreadcrumbs />

      <div className="ml-auto">
        <form action="/api/auth/logout" method="post">
          <Button type="submit" variant="ghost" size="sm">
            <LogOut />
            <span className="hidden sm:inline">Log out</span>
          </Button>
        </form>
      </div>
    </header>
  );
}
