import { requireAdminAuth } from "@/server/admin-auth";
import { ReportGeneratorClient } from "./ReportGeneratorClient";
import { categories } from "@/tools/categories";

export const metadata = {
  title: "Generate Report | Avex Tools Admin",
  description: "Configure report parameters, preview datasets, and export CSV, XLSX, or PDF files.",
};

export default async function GenerateReportPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string }>;
}) {
  await requireAdminAuth("analytics.view");
  const params = await searchParams;
  const toolCatSlugs = categories.map((c) => c.slug);

  return <ReportGeneratorClient initialType={params.type} toolCategories={toolCatSlugs} />;
}
