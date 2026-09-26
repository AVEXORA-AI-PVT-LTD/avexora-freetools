import { requireAdminAuth } from "@/server/admin-auth";
import { getSecuritySettings } from "@/server/admin/settings-service";
import { SecuritySettingsClient } from "./SecuritySettingsClient";

export const metadata = {
  title: "Security Settings — Avex Tools Admin",
  description: "Configure 2FA policies, session timeouts, password rules, lockout duration, and IP restrictions.",
};

export default async function SecuritySettingsPage() {
  await requireAdminAuth("settings.security.view");
  const settings = await getSecuritySettings();

  return <SecuritySettingsClient initialSettings={settings} />;
}
