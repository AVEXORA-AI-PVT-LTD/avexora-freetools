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
    const adminUser = await requireAdminAuth("maintenance.backup.download");
    const { id } = await params;

    const backup = await prisma.backup.findUnique({
      where: { id },
    });

    if (!backup) {
      return NextResponse.json({ error: "Backup file record not found" }, { status: 404 });
    }

    if (backup.status !== "Completed" || !backup.storageReference) {
      return NextResponse.json({ error: "Backup file is not ready or available" }, { status: 400 });
    }

    // Check expiration
    if (backup.expiresAt && new Date() > backup.expiresAt) {
      return NextResponse.json({ error: "Backup download link has expired" }, { status: 410 });
    }

    const absolutePath = path.join(process.cwd(), backup.storageReference);
    if (!fs.existsSync(absolutePath)) {
      return NextResponse.json({ error: "Backup file missing on storage server" }, { status: 404 });
    }

    // Read File Buffer
    const fileBuffer = fs.readFileSync(absolutePath);

    // Audit Log
    await logAdminAction({
      actorId: adminUser.id,
      action: "DOWNLOAD_BACKUP" as any,
      targetType: "Backup" as any,
      targetId: backup.id,
      metadata: {
        fileSize: backup.fileSize,
        checksum: backup.checksum,
        type: backup.type,
      },
    });

    const fileName = path.basename(backup.storageReference);

    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/gzip",
        "Content-Disposition": `attachment; filename="${fileName}"`,
        "Content-Length": fileBuffer.length.toString(),
        "Cache-Control": "private, no-transform, no-store, must-revalidate",
      },
    });
  } catch (err: any) {
    console.error("Backup download error:", err);
    return NextResponse.json({ error: err.message || "Unauthorized" }, { status: 401 });
  }
}
