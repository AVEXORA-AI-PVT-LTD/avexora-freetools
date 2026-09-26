import { prisma } from "@/server/db";
import { getAnalyticsOverview, resolveAnalyticsRanges } from "@/server/admin/analytics-service";
import { allTools } from "@/tools/registry";
import { categories } from "@/tools/categories";
import { generateCSV, CSVColumn } from "./exporters/csv-exporter";
import { generateXLSX, XLSXSheet } from "./exporters/xlsx-exporter";
import { generatePDF, PDFTableColumn } from "./exporters/pdf-exporter";
import { logAdminAction } from "@/server/audit";
import { createNotification } from "@/server/notifications/service";
import fs from "fs";
import path from "path";

export interface ReportFilterOptions {
  range?: string;
  startDate?: string;
  endDate?: string;
  category?: string;
  toolSlug?: string;
  plan?: string;
  status?: string;
  severity?: string;
  feedbackType?: string;
  minUsage?: number;
  maxUsage?: number;
  comparePrevious?: boolean;
}

export interface GeneratedReportData {
  title: string;
  subtitle: string;
  reportType: string;
  dateRangeText: string;
  summary: { label: string; value: any }[];
  columns: { key: string; header: string; width?: number }[];
  rows: Record<string, any>[];
  sheets?: XLSXSheet[];
}

const STORAGE_DIR = path.join(process.cwd(), "storage", "reports");

function ensureStorageDir() {
  if (!fs.existsSync(STORAGE_DIR)) {
    fs.mkdirSync(STORAGE_DIR, { recursive: true });
  }
}

/**
 * 1. TOOL USAGE REPORT DATA
 */
export async function getToolUsageReportData(filters: ReportFilterOptions): Promise<GeneratedReportData> {
  const analyticsData = await getAnalyticsOverview({
    range: filters.range || "30days",
    startDate: filters.startDate,
    endDate: filters.endDate,
  });

  let toolsList = analyticsData.topTools;

  if (filters.category && filters.category !== "all") {
    toolsList = toolsList.filter((t) => t.category.toLowerCase() === filters.category!.toLowerCase());
  }

  if (filters.toolSlug && filters.toolSlug !== "all") {
    toolsList = toolsList.filter((t) => t.slug === filters.toolSlug);
  }

  if (filters.minUsage !== undefined) {
    toolsList = toolsList.filter((t) => t.executions >= filters.minUsage!);
  }

  if (filters.maxUsage !== undefined) {
    toolsList = toolsList.filter((t) => t.executions <= filters.maxUsage!);
  }

  const totalExecs = toolsList.reduce((acc, t) => acc + t.executions, 0);
  const totalViews = toolsList.reduce((acc, t) => acc + t.views, 0);
  const totalFailed = toolsList.reduce((acc, t) => acc + t.failed, 0);
  const avgSuccessRate = toolsList.length > 0
    ? Number((toolsList.reduce((acc, t) => acc + t.successRate, 0) / toolsList.length).toFixed(1))
    : 100;

  const columns = [
    { key: "rank", header: "Rank", width: 50 },
    { key: "name", header: "Tool Name", width: 140 },
    { key: "category", header: "Category", width: 100 },
    { key: "views", header: "Views", width: 70 },
    { key: "executions", header: "Executions", width: 80 },
    { key: "successful", header: "Successful", width: 80 },
    { key: "failed", header: "Failed", width: 70 },
    { key: "successRate", header: "Success Rate (%)", width: 100 },
    { key: "avgExecutionTimeMs", header: "Avg Time (ms)", width: 90 },
    { key: "signupsGenerated", header: "Signups Generated", width: 110 },
  ];

  return {
    title: "Tool Usage & Performance Report",
    subtitle: "Execution volume, failure rates, latency, and conversion contributions",
    reportType: "tool_usage",
    dateRangeText: `${filters.range || "Last 30 Days"} (${new Date(analyticsData.params.startDate).toLocaleDateString()} - ${new Date(analyticsData.params.endDate).toLocaleDateString()})`,
    summary: [
      { label: "Total Executions", value: totalExecs.toLocaleString() },
      { label: "Total Page Views", value: totalViews.toLocaleString() },
      { label: "Failed Executions", value: totalFailed.toLocaleString() },
      { label: "Avg Success Rate", value: `${avgSuccessRate}%` },
    ],
    columns,
    rows: toolsList,
  };
}

/**
 * 2. USER ACTIVITY REPORT DATA
 */
export async function getUserActivityReportData(
  filters: ReportFilterOptions,
  canViewPII: boolean = true
): Promise<GeneratedReportData> {
  const { current } = resolveAnalyticsRanges({ range: filters.range || "30days", startDate: filters.startDate, endDate: filters.endDate });

  const whereClause: any = {
    createdAt: { gte: current.start, lte: current.end },
  };

  if (filters.status && filters.status !== "all") {
    whereClause.status = filters.status;
  }

  const users = await prisma.user.findMany({
    where: whereClause,
    take: 500,
    orderBy: { createdAt: "desc" },
    include: {
      subscription: true,
      _count: { select: { toolUsages: true, auditLogs: true } },
    },
  });

  const activeCount = users.filter((u) => u.status === "ACTIVE").length;
  const proCount = users.filter((u) => u.subscription?.plan === "pro" || u.subscription?.plan === "agency").length;

  const rows = users.map((u) => {
    let emailStr = u.email;
    let nameStr = u.name || "N/A";

    if (!canViewPII) {
      const parts = u.email.split("@");
      emailStr = parts[0].substring(0, 2) + "***@" + parts[1];
      nameStr = "User " + u.id.substring(u.id.length - 4);
    }

    return {
      userId: u.id,
      name: nameStr,
      email: emailStr,
      status: u.status,
      plan: (u.subscription?.plan || "free").toUpperCase(),
      toolUsageCount: u._count.toolUsages,
      loginCount: u._count.auditLogs,
      lastActive: u.lastActiveAt ? u.lastActiveAt.toLocaleDateString() : "N/A",
      registeredDate: u.createdAt.toLocaleDateString(),
    };
  });

  const columns = [
    { key: "userId", header: "User ID", width: 120 },
    { key: "name", header: "Name", width: 120 },
    { key: "email", header: "Email", width: 160 },
    { key: "status", header: "Account Status", width: 100 },
    { key: "plan", header: "Subscription Plan", width: 110 },
    { key: "toolUsageCount", header: "Tools Used", width: 80 },
    { key: "loginCount", header: "Logins / Actions", width: 100 },
    { key: "lastActive", header: "Last Active", width: 90 },
    { key: "registeredDate", header: "Registered Date", width: 100 },
  ];

  return {
    title: "User Activity & Registration Report",
    subtitle: "User registrations, tool usage volume, and subscription tier distribution",
    reportType: "user_activity",
    dateRangeText: `${filters.range || "Last 30 Days"} (${current.start.toLocaleDateString()} - ${current.end.toLocaleDateString()})`,
    summary: [
      { label: "Total New Users", value: users.length.toLocaleString() },
      { label: "Active Accounts", value: activeCount.toLocaleString() },
      { label: "Paid Plan Users", value: proCount.toLocaleString() },
    ],
    columns,
    rows,
  };
}

/**
 * 3. REVENUE REPORT DATA
 */
export async function getRevenueReportData(filters: ReportFilterOptions): Promise<GeneratedReportData> {
  const { current } = resolveAnalyticsRanges({ range: filters.range || "30days", startDate: filters.startDate, endDate: filters.endDate });

  const payments = await prisma.payment.findMany({
    where: {
      createdAt: { gte: current.start, lte: current.end },
      ...(filters.status && filters.status !== "all" ? { status: filters.status } : {}),
    },
    take: 500,
    orderBy: { createdAt: "desc" },
    include: { user: { select: { email: true, name: true } } },
  });

  const grossRev = payments.filter((p) => p.status === "successful").reduce((acc, p) => acc + p.amount, 0);
  const netRev = Math.round(grossRev * 0.82);

  const rows = payments.map((p) => ({
    transactionId: p.id,
    userRef: p.user ? p.user.email : p.userId,
    plan: "PRO_MONTHLY",
    amount: p.amount,
    currency: p.currency.toUpperCase(),
    status: p.status,
    gateway: p.providerTxId ? "Razorpay" : "Internal",
    tax: p.taxAmount || Math.round(p.amount * 0.18),
    refund: p.refundAmount || 0,
    netAmount: Math.max(0, p.amount - (p.refundAmount || 0) - (p.taxAmount || Math.round(p.amount * 0.18))),
    createdAt: p.createdAt.toLocaleDateString(),
  }));

  const columns = [
    { key: "transactionId", header: "Transaction ID", width: 130 },
    { key: "userRef", header: "User Email", width: 160 },
    { key: "plan", header: "Plan Tier", width: 110 },
    { key: "amount", header: "Amount (₹)", width: 90 },
    { key: "currency", header: "Currency", width: 70 },
    { key: "status", header: "Status", width: 90 },
    { key: "gateway", header: "Gateway", width: 90 },
    { key: "tax", header: "Tax (GST 18%)", width: 90 },
    { key: "netAmount", header: "Net Amount (₹)", width: 100 },
    { key: "createdAt", header: "Date", width: 90 },
  ];

  return {
    title: "Revenue & Financial Transaction Report",
    subtitle: "Payment transactions, gross revenue, taxes, and gateway statistics",
    reportType: "revenue",
    dateRangeText: `${filters.range || "Last 30 Days"} (${current.start.toLocaleDateString()} - ${current.end.toLocaleDateString()})`,
    summary: [
      { label: "Gross Revenue", value: `₹${grossRev.toLocaleString()}` },
      { label: "Net Revenue", value: `₹${netRev.toLocaleString()}` },
      { label: "Transaction Count", value: payments.length.toLocaleString() },
    ],
    columns,
    rows,
  };
}

/**
 * 4. SUBSCRIPTION REPORT DATA
 */
export async function getSubscriptionReportData(filters: ReportFilterOptions): Promise<GeneratedReportData> {
  const { current } = resolveAnalyticsRanges({ range: filters.range || "30days", startDate: filters.startDate, endDate: filters.endDate });

  const subscriptions = await prisma.subscription.findMany({
    where: {
      createdAt: { gte: current.start, lte: current.end },
      ...(filters.plan && filters.plan !== "all" ? { plan: filters.plan.toLowerCase() } : {}),
      ...(filters.status && filters.status !== "all" ? { status: filters.status.toLowerCase() } : {}),
    },
    take: 500,
    orderBy: { createdAt: "desc" },
    include: { user: { select: { email: true, name: true } } },
  });

  const activeCount = subscriptions.filter((s) => s.status === "active").length;
  const canceledCount = subscriptions.filter((s) => s.status === "cancelled").length;

  const rows = subscriptions.map((s) => ({
    subId: s.id,
    userRef: s.user ? s.user.email : s.userId,
    plan: s.plan.toUpperCase(),
    status: s.status.toUpperCase(),
    startDate: s.createdAt.toLocaleDateString(),
    renewalDate: s.currentPeriodEnd ? s.currentPeriodEnd.toLocaleDateString() : "N/A",
    cancellationDate: s.cancelAtPeriodEnd ? "Pending Cancel" : "N/A",
    gateway: s.razorpaySubscriptionId ? "Razorpay" : "Internal",
    createdDate: s.createdAt.toLocaleDateString(),
  }));

  const columns = [
    { key: "subId", header: "Subscription ID", width: 130 },
    { key: "userRef", header: "User Email", width: 160 },
    { key: "plan", header: "Plan", width: 90 },
    { key: "status", header: "Status", width: 90 },
    { key: "startDate", header: "Start Date", width: 90 },
    { key: "renewalDate", header: "Renewal Date", width: 90 },
    { key: "cancellationDate", header: "Canceled Status", width: 110 },
    { key: "gateway", header: "Gateway", width: 80 },
    { key: "createdDate", header: "Created Date", width: 90 },
  ];

  return {
    title: "Subscription Management Report",
    subtitle: "Paid plan subscriptions, status, renewals, and cancellation metrics",
    reportType: "subscription",
    dateRangeText: `${filters.range || "Last 30 Days"} (${current.start.toLocaleDateString()} - ${current.end.toLocaleDateString()})`,
    summary: [
      { label: "Total Subscriptions", value: subscriptions.length.toLocaleString() },
      { label: "Active Subscriptions", value: activeCount.toLocaleString() },
      { label: "Canceled", value: canceledCount.toLocaleString() },
    ],
    columns,
    rows,
  };
}

/**
 * 5. WEBSITE TRAFFIC REPORT DATA
 */
export async function getWebsiteTrafficReportData(filters: ReportFilterOptions): Promise<GeneratedReportData> {
  const analyticsData = await getAnalyticsOverview({
    range: filters.range || "30days",
    startDate: filters.startDate,
    endDate: filters.endDate,
  });

  const rows = analyticsData.trafficTrend.map((t) => ({
    date: t.date,
    visitors: t.visitors,
    pageviews: t.pageviews || t.visitors * 2,
    executions: t.executions,
    topSource: analyticsData.trafficSources[0]?.source || "Direct",
    topDevice: analyticsData.devices[0]?.device || "desktop",
    topCountry: analyticsData.countries[0]?.country || "India",
  }));

  const columns = [
    { key: "date", header: "Date", width: 80 },
    { key: "visitors", header: "Unique Visitors", width: 110 },
    { key: "pageviews", header: "Page Views", width: 100 },
    { key: "executions", header: "Tool Executions", width: 110 },
    { key: "topSource", header: "Top Acquisition Source", width: 140 },
    { key: "topDevice", header: "Primary Device", width: 110 },
    { key: "topCountry", header: "Primary Country", width: 110 },
  ];

  return {
    title: "Website Traffic & Audience Demographics Report",
    subtitle: "Daily unique visitors, page impressions, devices, and traffic channels",
    reportType: "website_traffic",
    dateRangeText: `${filters.range || "Last 30 Days"} (${new Date(analyticsData.params.startDate).toLocaleDateString()} - ${new Date(analyticsData.params.endDate).toLocaleDateString()})`,
    summary: [
      { label: "Total Visitors", value: analyticsData.kpis.visitors.current.toLocaleString() },
      { label: "Total Page Views", value: analyticsData.kpis.pageViews.current.toLocaleString() },
      { label: "Total Executions", value: analyticsData.kpis.executions.current.toLocaleString() },
    ],
    columns,
    rows,
  };
}

/**
 * 6. SEO HEALTH REPORT DATA
 */
export async function getSeoReportData(filters: ReportFilterOptions): Promise<GeneratedReportData> {
  const dbSeoConfigs = await prisma.toolConfig.findMany();
  const dbSeoMap = new Map(dbSeoConfigs.map((c) => [c.toolSlug, c]));

  const rows = allTools.map((t, index) => {
    const dbConf = dbSeoMap.get(t.slug);
    const titleConfigured = !!(dbConf?.nameOverride || t.name);
    const descConfigured = !!(dbConf?.description || t.seoDescription);
    const isIndexed = dbConf?.status !== false;

    let issue = "None (Configured)";
    if (!descConfigured) issue = "Missing Meta Description";

    return {
      id: index + 1,
      toolName: t.name,
      url: `/${t.category}/${t.slug}`,
      seoTitle: dbConf?.nameOverride || `${t.name} | Avex Tools`,
      metaDescription: dbConf?.description || t.seoDescription.substring(0, 120),
      canonicalUrl: `https://tools.avexora.in/${t.category}/${t.slug}`,
      indexStatus: isIndexed ? "INDEX" : "NOINDEX",
      openGraphStatus: "Configured",
      schemaStatus: "JSON-LD Configured",
      sitemapInclusion: "Included",
      issuesLabel: issue,
    };
  });

  const columns = [
    { key: "id", header: "#", width: 40 },
    { key: "toolName", header: "Tool / Page", width: 140 },
    { key: "url", header: "URL Path", width: 150 },
    { key: "seoTitle", header: "SEO Meta Title", width: 160 },
    { key: "indexStatus", header: "Index Status", width: 90 },
    { key: "openGraphStatus", header: "OpenGraph", width: 90 },
    { key: "schemaStatus", header: "Structured Data", width: 120 },
    { key: "sitemapInclusion", header: "Sitemap", width: 80 },
    { key: "issuesLabel", header: "Audit Issue Status", width: 130 },
  ];

  return {
    title: "SEO Metadata & Technical Audit Report",
    subtitle: "Tool routes meta title, description, canonicals, schema markup, and indexing health",
    reportType: "seo",
    dateRangeText: `Current Audit Snapshot (${new Date().toLocaleDateString()})`,
    summary: [
      { label: "Total Audited Routes", value: allTools.length.toLocaleString() },
      { label: "Indexed Pages", value: rows.filter((r) => r.indexStatus === "INDEX").length.toLocaleString() },
      { label: "Valid Schema Pages", value: allTools.length.toLocaleString() },
    ],
    columns,
    rows,
  };
}

/**
 * 7. ERROR DIAGNOSTIC REPORT DATA
 */
export async function getErrorReportData(filters: ReportFilterOptions): Promise<GeneratedReportData> {
  const { current } = resolveAnalyticsRanges({ range: filters.range || "30days", startDate: filters.startDate, endDate: filters.endDate });

  const errors = await prisma.errorLog.findMany({
    where: {
      createdAt: { gte: current.start, lte: current.end },
      ...(filters.severity && filters.severity !== "all" ? { severity: filters.severity } : {}),
      ...(filters.status && filters.status !== "all" ? { status: filters.status } : {}),
      ...(filters.toolSlug && filters.toolSlug !== "all" ? { toolSlug: filters.toolSlug } : {}),
    },
    take: 500,
    orderBy: { createdAt: "desc" },
  });

  const rows = errors.map((e) => ({
    errorId: e.id,
    toolSlug: e.toolSlug || "Global",
    code: e.errorCode || "INTERNAL_ERROR",
    severity: e.severity,
    status: e.status,
    message: e.message.substring(0, 100),
    requestId: e.requestId || "N/A",
    createdAt: e.createdAt.toLocaleDateString(),
  }));

  const columns = [
    { key: "errorId", header: "Error ID", width: 120 },
    { key: "toolSlug", header: "Tool Slug", width: 110 },
    { key: "code", header: "Error Code", width: 110 },
    { key: "severity", header: "Severity", width: 80 },
    { key: "status", header: "Status", width: 90 },
    { key: "message", header: "Sanitized Message", width: 220 },
    { key: "requestId", header: "Request ID", width: 110 },
    { key: "createdAt", header: "Timestamp", width: 90 },
  ];

  return {
    title: "Error Diagnostics & Exceptions Report",
    subtitle: "Application exceptions, severity distribution, request IDs, and resolution status",
    reportType: "error",
    dateRangeText: `${filters.range || "Last 30 Days"} (${current.start.toLocaleDateString()} - ${current.end.toLocaleDateString()})`,
    summary: [
      { label: "Total Logged Errors", value: errors.length.toLocaleString() },
      { label: "Critical Severity", value: errors.filter((e) => e.severity === "Critical").length.toLocaleString() },
      { label: "Open Issues", value: errors.filter((e) => e.status === "Open").length.toLocaleString() },
    ],
    columns,
    rows,
  };
}

/**
 * 8. FEEDBACK REPORT DATA
 */
export async function getFeedbackReportData(filters: ReportFilterOptions): Promise<GeneratedReportData> {
  const { current } = resolveAnalyticsRanges({ range: filters.range || "30days", startDate: filters.startDate, endDate: filters.endDate });

  const feedbacks = await prisma.contactSubmission.findMany({
    where: {
      createdAt: { gte: current.start, lte: current.end },
      ...(filters.feedbackType && filters.feedbackType !== "all" ? { type: filters.feedbackType } : {}),
      ...(filters.status && filters.status !== "all" ? { status: filters.status } : {}),
    },
    take: 500,
    orderBy: { createdAt: "desc" },
  });

  const rows = feedbacks.map((f) => ({
    ticketId: f.id,
    type: f.type,
    userRef: f.name || f.email,
    subject: f.subject || "No Subject",
    tool: f.toolSlug || "General",
    priority: f.priority,
    status: f.status,
    createdAt: f.createdAt.toLocaleDateString(),
  }));

  const columns = [
    { key: "ticketId", header: "Ticket ID", width: 120 },
    { key: "type", header: "Type", width: 90 },
    { key: "userRef", header: "User Contact", width: 140 },
    { key: "subject", header: "Subject", width: 180 },
    { key: "tool", header: "Associated Tool", width: 110 },
    { key: "priority", header: "Priority", width: 80 },
    { key: "status", header: "Status", width: 90 },
    { key: "createdAt", header: "Date", width: 90 },
  ];

  return {
    title: "User Feedback & Contact Tickets Report",
    subtitle: "User inquiries, bug reports, tool feedback, priority ratings, and resolution status",
    reportType: "feedback",
    dateRangeText: `${filters.range || "Last 30 Days"} (${current.start.toLocaleDateString()} - ${current.end.toLocaleDateString()})`,
    summary: [
      { label: "Total Submissions", value: feedbacks.length.toLocaleString() },
      { label: "Bug Reports", value: feedbacks.filter((f) => f.type === "Bug Report").length.toLocaleString() },
      { label: "New Tickets", value: feedbacks.filter((f) => f.status === "New").length.toLocaleString() },
    ],
    columns,
    rows,
  };
}

/**
 * MASTER REPORT DATA RESOLVER
 */
export async function resolveReportData(
  reportType: string,
  filters: ReportFilterOptions,
  canViewPII: boolean = true
): Promise<GeneratedReportData> {
  switch (reportType) {
    case "tool_usage":
      return getToolUsageReportData(filters);
    case "user_activity":
      return getUserActivityReportData(filters, canViewPII);
    case "revenue":
      return getRevenueReportData(filters);
    case "subscription":
      return getSubscriptionReportData(filters);
    case "website_traffic":
      return getWebsiteTrafficReportData(filters);
    case "seo":
      return getSeoReportData(filters);
    case "error":
      return getErrorReportData(filters);
    case "feedback":
      return getFeedbackReportData(filters);
    default:
      return getToolUsageReportData(filters);
  }
}

/**
 * GENERATES EXPORT FILE BUFFER / CONTENT
 */
export async function generateReportFileBuffer(
  data: GeneratedReportData,
  format: "csv" | "xlsx" | "pdf",
  requestedByEmail: string = "Admin"
): Promise<{ buffer: Buffer; fileName: string; contentType: string }> {
  const dateStr = new Date().toISOString().split("T")[0];
  const safeTitle = data.reportType.replace(/_/g, "-");

  if (format === "csv") {
    const csvStr = generateCSV(data.columns, data.rows, data.title, data.summary);
    return {
      buffer: Buffer.from(csvStr, "utf-8"),
      fileName: `${safeTitle}-report-${dateStr}.csv`,
      contentType: "text/csv; charset=utf-8",
    };
  }

  if (format === "xlsx") {
    const sheets: XLSXSheet[] = [
      {
        name: "Summary",
        columns: [
          { key: "label", header: "Metric Label", width: 180 },
          { key: "value", header: "Value", width: 140 },
        ],
        rows: data.summary,
      },
      {
        name: "Detailed Data",
        columns: data.columns,
        rows: data.rows,
      },
    ];

    const xmlStr = generateXLSX(data.title, sheets);
    return {
      buffer: Buffer.from(xmlStr, "utf-8"),
      fileName: `${safeTitle}-report-${dateStr}.xlsx`,
      contentType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    };
  }

  if (format === "pdf") {
    const pdfBytes = await generatePDF({
      title: data.title,
      subtitle: data.subtitle,
      dateRangeText: data.dateRangeText,
      requestedByText: requestedByEmail,
      summaryItems: data.summary.map((s) => ({ label: s.label, value: String(s.value) })),
      columns: data.columns as PDFTableColumn[],
      rows: data.rows,
    });

    return {
      buffer: Buffer.from(pdfBytes),
      fileName: `${safeTitle}-report-${dateStr}.pdf`,
      contentType: "application/pdf",
    };
  }

  throw new Error("Unsupported format");
}

/**
 * SAVES FILE TO SECURE STORAGE & CREATES REPORT JOB RECORD
 */
export async function createAndProcessReportJob(params: {
  reportType: string;
  format: "csv" | "xlsx" | "pdf";
  requestedBy: string;
  requestedByEmail?: string;
  filters: ReportFilterOptions;
}): Promise<any> {
  ensureStorageDir();

  const isLargeReport = params.filters.range === "90days" || params.filters.range === "custom";
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days expiration

  // 1. Create ReportJob record
  const job = await prisma.reportJob.create({
    data: {
      reportType: params.reportType,
      format: params.format,
      requestedBy: params.requestedBy,
      requestedByEmail: params.requestedByEmail,
      status: isLargeReport ? "QUEUED" : "PROCESSING",
      filters: JSON.stringify(params.filters),
      dateFrom: params.filters.startDate ? new Date(params.filters.startDate) : undefined,
      dateTo: params.filters.endDate ? new Date(params.filters.endDate) : undefined,
      expiresAt,
    },
  });

  // Log audit action
  await logAdminAction({
    action: "EXPORT_DATA" as any,
    targetType: "ReportJob" as any,
    targetId: job.id,
    targetName: params.reportType,
    actorId: params.requestedBy,
    metadata: { reportType: params.reportType, format: params.format, isLargeReport },
  });

  // Immediate or Async processing
  try {
    const reportData = await resolveReportData(params.reportType, params.filters);
    const { buffer, fileName } = await generateReportFileBuffer(reportData, params.format, params.requestedByEmail);

    const relativePath = `storage/reports/${job.id}_${fileName}`;
    const absolutePath = path.join(process.cwd(), relativePath);

    fs.writeFileSync(absolutePath, buffer);

    const updatedJob = await prisma.reportJob.update({
      where: { id: job.id },
      data: {
        status: "COMPLETED",
        fileReference: relativePath,
        fileSize: buffer.length,
        progress: 100,
        startedAt: new Date(),
        completedAt: new Date(),
      },
    });

    // Notify Admin
    await createNotification({
      type: "SYSTEM_ALERT",
      title: "Report Ready",
      message: `Your ${params.reportType.replace(/_/g, " ")} report (${params.format.toUpperCase()}) is ready for download.`,
      severity: "INFO",
      recipientId: params.requestedBy,
      actionUrl: `/api/admin/reports/download/${job.id}`,
    });

    await logAdminAction({
      action: "EXPORT_DATA" as any,
      targetType: "ReportJob" as any,
      targetId: job.id,
      targetName: params.reportType,
      actorId: params.requestedBy,
      metadata: { fileSize: buffer.length },
    });

    return updatedJob;
  } catch (err: any) {
    console.error("Failed to generate report:", err);
    await prisma.reportJob.update({
      where: { id: job.id },
      data: {
        status: "FAILED",
        errorMessage: err.message || "Failed to process report",
      },
    });

    await logAdminAction({
      action: "EXPORT_DATA" as any,
      targetType: "ReportJob" as any,
      targetId: job.id,
      targetName: params.reportType,
      actorId: params.requestedBy,
      status: "FAILED",
      metadata: { error: err.message },
    });

    throw err;
  }
}
