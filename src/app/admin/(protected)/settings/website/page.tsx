import { requireAdminAuth } from "@/server/admin-auth";
import { getWebsiteSettings } from "@/server/admin/settings-service";
import { WebsiteSettingsClient } from "./WebsiteSettingsClient";

export const metadata = {
  title: "Website Settings — Avex Tools Admin",
  description: "Configure website identity, branding logos, contact emails, and social media links.",
};

export default async function WebsiteSettingsPage() {
  await requireAdminAuth("settings.website.view");
  const settings = await getWebsiteSettings();

  return <WebsiteSettingsClient initialSettings={settings} />;
}
