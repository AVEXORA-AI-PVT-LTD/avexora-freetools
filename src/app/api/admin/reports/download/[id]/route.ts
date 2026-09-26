import { NextRequest, NextResponse } from "next/server";
import { requireAdminAuth } from "@/server/admin-auth";
import { prisma } from "@/server/db";
import { logAdminAction } from "@/server/audit";
import fs from "fs";
import path from "path";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const adminUser = await requireAdminAuth("analytics.view");
    const { id } = await params;

    const job = await prisma.reportJob.findUnique({
      where: { id },
    });

    if (!job) {
      return NextResponse.json({ error: "Report job not found" }, { status: 404 });
    }

    if (job.status !== "COMPLETED" || !job.fileReference) {
      return NextResponse.json({ error: "Report file is not available" }, { status: 400 });
    }

    // Check Expiration
    if (job.expiresAt && new Date() > job.expiresAt) {
      return NextResponse.json({ error: "Report download link has expired" }, { status: 410 });
    }

    const absolutePath = path.join(process.cwd(), job.fileReference);
    if (!fs.existsSync(absolutePath)) {
      return NextResponse.json({ error: "Report file missing on storage server" }, { status: 404 });
    }

    // Read File Buffer
    const fileBuffer = fs.readFileSync(absolutePath);

    // Increment download count
    await prisma.reportJob.update({
      where: { id },
      data: { downloadCount: { increment: 1 } },
    });

    // Audit Log
    await logAdminAction({
      actorId: adminUser.id,
      action: "EXPORT_DATA" as any,
      targetType: "ReportJob" as any,
      targetId: job.id,
      metadata: {
        reportType: job.reportType,
        format: job.format,
      },
    });

    // Content Type Mapping
    let contentType = "application/octet-stream";
    if (job.format === "csv") contentType = "text/csv; charset=utf-8";
    else if (job.format === "xlsx") contentType = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
    else if (job.format === "pdf") contentType = "application/pdf";

    const fileName = `${job.reportType.replace(/_/g, "-")}-report.${job.format}`;

    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `attachment; filename="${fileName}"`,
        "Content-Length": fileBuffer.length.toString(),
        "Cache-Control": "private, no-transform, no-store, must-revalidate",
      },
    });
  } catch (err: any) {
    console.error("Report download error:", err);
    return NextResponse.json({ error: err.message || "Unauthorized" }, { status: 401 });
  }
}
