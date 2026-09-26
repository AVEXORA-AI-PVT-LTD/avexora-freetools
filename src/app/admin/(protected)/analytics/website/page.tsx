import { requireAdminAuth } from "@/server/admin-auth";
import { getAnalyticsOverviewAction } from "../analytics-actions";
import { AnalyticsClient } from "../AnalyticsClient";

export const metadata = {
  title: "Website Traffic Analytics | Avex Tools Admin",
};

export default async function WebsiteAnalyticsPage() {
  await requireAdminAuth("analytics.view");
  const initialData = await getAnalyticsOverviewAction({ range: "30days" });
  return <AnalyticsClient initialData={initialData} activeTab="website" />;
}
