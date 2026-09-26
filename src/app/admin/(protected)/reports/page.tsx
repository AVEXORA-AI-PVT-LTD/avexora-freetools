import { requireAdminAuth } from "@/server/admin-auth";
import { getReportDashboardOverviewAction } from "./reports-actions";
import { ReportsDashboardClient } from "./ReportsDashboardClient";

export const metadata = {
  title: "Reports & Export Management | Avex Tools Admin",
  description: "Generate, schedule, preview, and download custom CSV, XLSX, and PDF exports.",
};

export default async function ReportsPage() {
  await requireAdminAuth("analytics.view");
  const overview = await getReportDashboardOverviewAction();
  return <ReportsDashboardClient overview={overview} />;
}
