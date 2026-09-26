import { requireAdminAuth } from "@/server/admin-auth";
import { getMaintenanceModeStatus } from "@/server/admin/maintenance-service";
import { MaintenanceModeClient } from "./MaintenanceModeClient";

export const metadata = {
  title: "Maintenance Mode — Avex Tools Admin",
  description: "Manage public site accessibility, visitor messages, and maintenance windows.",
};

export default async function MaintenanceModePage() {
  await requireAdminAuth("maintenance.mode.manage");

  const mode = await getMaintenanceModeStatus();

  return <MaintenanceModeClient initialMode={mode as any} />;
}
