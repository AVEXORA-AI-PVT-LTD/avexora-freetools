import { requireAdminAuth } from "@/server/admin-auth";
import { getEmailSettings, getEmailTemplates } from "@/server/admin/settings-service";
import { EmailSettingsClient } from "./EmailSettingsClient";

export const metadata = {
  title: "Email Settings — Avex Tools Admin",
  description: "Configure SMTP/Email provider, sender credentials, test emails, and email templates.",
};

export default async function EmailSettingsPage() {
  await requireAdminAuth("settings.email.view");

  const [settings, templates] = await Promise.all([
    getEmailSettings(),
    getEmailTemplates(),
  ]);

  return <EmailSettingsClient initialSettings={settings} initialTemplates={templates} />;
}
