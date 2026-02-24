import { redirect } from "next/navigation";
import { DashboardApp } from "@/components/dashboard/dashboard-app";
import { getCurrentUser } from "@/lib/auth/user";

export default async function DashboardPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  return <DashboardApp user={{ email: user.email, name: user.name }} />;
}
