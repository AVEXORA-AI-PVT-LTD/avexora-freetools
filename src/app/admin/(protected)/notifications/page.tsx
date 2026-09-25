import { requireAdminAuth } from "@/server/admin-auth";
import { getNotificationsAction } from "./notification-actions";
import { NotificationsClient } from "./NotificationsClient";

export const metadata = {
  title: "Notifications | Avex Tools Admin",
  description: "View and manage system, payment, security, and error notifications.",
};

export default async function NotificationsPage() {
  await requireAdminAuth("dashboard.view");

  const initialData = await getNotificationsAction({
    status: "ALL",
    page: 1,
    limit: 20,
  });

  return <NotificationsClient initialData={initialData} />;
}
