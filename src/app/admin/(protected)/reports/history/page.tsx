import { requireAdminAuth } from "@/server/admin-auth";
import { getReportHistoryAction } from "../reports-actions";
import { ReportHistoryClient } from "./ReportHistoryClient";

export const metadata = {
  title: "Report History & Background Jobs | Avex Tools Admin",
  description: "Track background job progress, file sizes, download logs, and expired reports.",
};

export default async function ReportHistoryPage() {
  await requireAdminAuth("analytics.view");
  const jobs = await getReportHistoryAction();
  return <ReportHistoryClient initialJobs={jobs} />;
}
