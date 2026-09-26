import { requireAdminAuth } from "@/server/admin-auth";
import { MaintenanceDashboardClient } from "./MaintenanceDashboardClient";

export const metadata = {
  title: "Backup & Maintenance — Avex Tools Admin",
  description: "System maintenance overview, backups, health checks, and site maintenance mode.",
};

export default async function MaintenanceOverviewPage() {
  await requireAdminAuth("maintenance.view");

  return <MaintenanceDashboardClient />;
}
