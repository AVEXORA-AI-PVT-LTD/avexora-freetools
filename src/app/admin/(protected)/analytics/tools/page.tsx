import { requireAdminAuth } from "@/server/admin-auth";
import { getAnalyticsOverviewAction } from "../analytics-actions";
import { AnalyticsClient } from "../AnalyticsClient";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata = {
  title: "Tool Usage Analytics | Avex Tools Admin",
};

export default async function ToolsAnalyticsPage() {
  await requireAdminAuth("analytics.view");
  const initialData = await getAnalyticsOverviewAction({ range: "30days" });
  return <AnalyticsClient initialData={initialData} activeTab="tools" />;
}
