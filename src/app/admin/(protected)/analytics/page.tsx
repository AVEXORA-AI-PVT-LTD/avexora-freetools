import { Metadata } from "next";
import { requireAdminAuth } from "@/server/admin-auth";
import { AnalyticsDashboard } from "@/components/admin/analytics/AnalyticsDashboard";
import { 
  getAnalyticsSummary, 
  getTopTools, 
  getCategoryUsage, 
  getTimelineData, 
  getAuthVsAnon,
  type DateRange
} from "@/server/analytics";

export const metadata: Metadata = {
  title: "Analytics & Monitoring | Avexora Admin",
};

export const dynamic = "force-dynamic";

export default async function AnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string }>;
}) {
  await requireAdminAuth("analytics.view");
  const params = await searchParams;
  const range = (params.range || "30d") as DateRange;

  const [summary, topTools, catUsage, timeline, authAnon] = await Promise.all([
    getAnalyticsSummary(range),
    getTopTools(range, 10),
    getCategoryUsage(range),
    getTimelineData(range),
    getAuthVsAnon(range)
  ]);

  return (
    <AnalyticsDashboard 
      summary={summary} 
      topTools={topTools} 
      catUsage={catUsage} 
      timeline={timeline} 
      authAnon={authAnon} 
    />
  );
}
