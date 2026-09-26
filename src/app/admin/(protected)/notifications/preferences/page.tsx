import { requireAdminAuth } from "@/server/admin-auth";
import { getNotificationPreferencesAction } from "../notification-actions";
import { PreferencesClient } from "./PreferencesClient";

export const metadata = {
  title: "Notification Preferences | Avex Tools Admin",
  description: "Configure admin notification delivery preferences across dashboard and email channels.",
};

export default async function NotificationPreferencesPage() {
  await requireAdminAuth("dashboard.view");

  const initialPreferences = await getNotificationPreferencesAction();

  return <PreferencesClient initialPreferences={initialPreferences} />;
}
