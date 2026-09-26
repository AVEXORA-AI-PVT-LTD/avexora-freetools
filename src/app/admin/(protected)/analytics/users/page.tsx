import { requireAdminAuth } from "@/server/admin-auth";
import { getAnalyticsOverviewAction } from "../analytics-actions";
import { AnalyticsClient } from "../AnalyticsClient";

export const metadata = {
  title: "User Conversion Analytics | Avex Tools Admin",
};

export default async function UsersAnalyticsPage() {
  await requireAdminAuth("analytics.view");
  const initialData = await getAnalyticsOverviewAction({ range: "30days" });
  return <AnalyticsClient initialData={initialData} activeTab="users" />;
}
