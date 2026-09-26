import { requireAdminAuth } from "@/server/admin-auth";
import { getIntegrationsSettings } from "@/server/admin/settings-service";
import { IntegrationsSettingsClient } from "./IntegrationsSettingsClient";

export const metadata = {
  title: "Integrations Settings — Avex Tools Admin",
  description: "Manage Analytics Measurement IDs, AI providers, Payment Gateways, CDN URLs, and Webhook dispatchers.",
};

export default async function IntegrationsSettingsPage() {
  await requireAdminAuth("settings.integrations.view");
  const settings = await getIntegrationsSettings();

  return <IntegrationsSettingsClient initialSettings={settings} />;
}
