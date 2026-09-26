import { requireAdminAuth } from "@/server/admin-auth";
import { getGeneralSettings } from "@/server/admin/settings-service";
import { getMaintenanceModeStatus } from "@/server/admin/maintenance-service";
import { GeneralSettingsClient } from "./GeneralSettingsClient";

export const metadata = {
  title: "General Settings — Avex Tools Admin",
  description: "Platform timezone, currency, language, and maintenance mode status.",
};

export default async function GeneralSettingsPage() {
  await requireAdminAuth("settings.general.view");

  const [settings, maintenance] = await Promise.all([
    getGeneralSettings(),
    getMaintenanceModeStatus(),
  ]);

  return <GeneralSettingsClient initialSettings={settings} maintenanceStatus={maintenance} />;
}
