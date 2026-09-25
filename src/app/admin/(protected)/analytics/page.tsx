import { requireAdminAuth } from "@/server/admin-auth";
import { getAnalyticsOverviewAction } from "./analytics-actions";
import { AnalyticsClient } from "./AnalyticsClient";

export const metadata = {
  title: "Analytics | Avex Tools Admin",
  description: "View real-time production analytics for website traffic, tool usage, conversions, and revenue.",
};

export default async function AnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string; compare?: string }>;
}) {
  await requireAdminAuth("analytics.view");

  const params = await searchParams;
  const range = params.range || "30days";
  const comparePrevious = params.compare !== "false";

  const initialData = await getAnalyticsOverviewAction({
    range,
    comparePrevious,
  });

  return <AnalyticsClient initialData={initialData} activeTab="overview" />;
}
