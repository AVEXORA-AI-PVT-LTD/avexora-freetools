"use server";

import { requireAdminAuth } from "@/server/admin-auth";
import { prisma } from "@/server/db";
import {
  resolveReportData,
  createAndProcessReportJob,
  ReportFilterOptions,
} from "@/server/admin/report-service";
import { logAdminAction } from "@/server/audit";
import fs from "fs";
import path from "path";

/**
 * 1. REPORT DASHBOARD OVERVIEW METRICS
 */
export async function getReportDashboardOverviewAction() {
  const adminUser = await requireAdminAuth("analytics.view");

  const [totalJobs, completedJobs, recentJobs] = await Promise.all([
    prisma.reportJob.count(),
    prisma.reportJob.count({ where: { status: "COMPLETED" } }),
    prisma.reportJob.findMany({
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
  ]);

  // Last generated date by reportType
  const lastGeneratedMap: Record<string, string> = {};
  const latestByTypes = await prisma.reportJob.findMany({
    where: { status: "COMPLETED" },
    orderBy: { completedAt: "desc" },
    take: 50,
  });

  latestByTypes.forEach((job) => {
    if (!lastGeneratedMap[job.reportType] && job.completedAt) {
      lastGeneratedMap[job.reportType] = job.completedAt.toLocaleDateString();
    }
  });

  return {
    totalJobs,
    completedJobs,
    recentJobs,
    lastGeneratedMap,
  };
}

/**
 * 2. GENERATE REPORT LIVE PREVIEW
 */
export async function generateReportPreviewAction(reportType: string, filters: ReportFilterOptions) {
  const adminUser = await requireAdminAuth("analytics.view");
  const role = (adminUser.role as string || "").toLowerCase();
  const canViewPII = role === "super_admin" || role === "admin";

  const data = await resolveReportData(reportType, filters, canViewPII);

  return {
    title: data.title,
    subtitle: data.subtitle,
    dateRangeText: data.dateRangeText,
    summary: data.summary,
    totalRows: data.rows.length,
    columns: data.columns,
    sampleRows: data.rows.slice(0, 5),
  };
}

/**
 * 3. REQUEST REPORT GENERATION (IMMEDIATE OR BACKGROUND)
 */
export async function requestReportGenerationAction(
  reportType: string,
  format: "csv" | "xlsx" | "pdf",
  filters: ReportFilterOptions
) {
  const adminUser = await requireAdminAuth("analytics.view");

  const job = await createAndProcessReportJob({
    reportType,
    format,
    requestedBy: adminUser.id,
    requestedByEmail: adminUser.email || "Admin",
    filters,
  });

  return {
    success: true,
    jobId: job.id,
    status: job.status,
    fileReference: job.fileReference,
  };
}

/**
 * 4. GET REPORT HISTORY & BACKGROUND JOBS
 */
export async function getReportHistoryAction() {
  await requireAdminAuth("analytics.view");

  const jobs = await prisma.reportJob.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return jobs;
}

/**
 * 5. DELETE REPORT JOB & EXPIRE FILE
 */
export async function deleteReportJobAction(jobId: string) {
  const adminUser = await requireAdminAuth("analytics.view");

  const job = await prisma.reportJob.findUnique({ where: { id: jobId } });
  if (!job) throw new Error("Report job not found");

  if (job.fileReference) {
    const absPath = path.join(process.cwd(), job.fileReference);
    if (fs.existsSync(absPath)) {
      try {
        fs.unlinkSync(absPath);
      } catch (e) {
        console.error("Failed to delete report file:", e);
      }
    }
  }

  await prisma.reportJob.delete({ where: { id: jobId } });

  await logAdminAction({
    action: "DELETE_RECORD" as any,
    targetType: "ReportJob" as any,
    targetId: jobId,
    targetName: job.reportType,
    actorId: adminUser.id,
  });

  return { success: true };
}

/**
 * 6. RETRY FAILED REPORT JOB
 */
export async function retryReportJobAction(jobId: string) {
  const adminUser = await requireAdminAuth("analytics.view");

  const job = await prisma.reportJob.findUnique({ where: { id: jobId } });
  if (!job) throw new Error("Report job not found");

  const filters: ReportFilterOptions = job.filters ? JSON.parse(job.filters) : {};

  const updated = await createAndProcessReportJob({
    reportType: job.reportType,
    format: job.format as any,
    requestedBy: adminUser.id,
    requestedByEmail: adminUser.email || "Admin",
    filters,
  });

  await logAdminAction({
    action: "CREATE_RECORD" as any,
    targetType: "ReportJob" as any,
    targetId: jobId,
    targetName: job.reportType,
    actorId: adminUser.id,
  });

  return { success: true, jobId: updated.id };
}
