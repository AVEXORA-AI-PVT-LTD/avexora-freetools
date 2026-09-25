"use client";

import { requireAdminAuth } from "@/server/admin-auth";
import {
  createDatabaseBackup,
  verifyBackup,
  initiateDatabaseRestore,
  clearApplicationCache,
  reindexDatabaseCollections,
  rebuildAndValidateSitemap,
  checkSystemHealth,
  getMaintenanceModeStatus,
  setMaintenanceMode,
  CacheTarget,
} from "@/server/admin/maintenance-service";
import { prisma } from "@/server/db";
import { logAdminAction } from "@/server/audit";
import fs from "fs";
import path from "path";

// 1. Create Backup
export async function createBackupAction(type: "MANUAL" | "SCHEDULED" | "SAFETY" = "MANUAL") {
  try {
    const adminUser = await requireAdminAuth("maintenance.backup.create");
    const backup = await createDatabaseBackup({
      type,
      actorId: adminUser.id,
      actorEmail: adminUser.email || undefined,
    });
    return { success: true, backup };
  } catch (err: any) {
    console.error("Create backup action error:", err);
    return { success: false, error: err.message || "Failed to create backup" };
  }
}

// 2. Verify Backup
export async function verifyBackupAction(backupId: string) {
  try {
    const adminUser = await requireAdminAuth("maintenance.backup.verify");
    const result = await verifyBackup(backupId, adminUser.id);
    return { success: result.verified, result };
  } catch (err: any) {
    console.error("Verify backup action error:", err);
    return { success: false, error: err.message || "Backup verification failed" };
  }
}

// 3. Delete Backup
export async function deleteBackupAction(backupId: string) {
  try {
    const adminUser = await requireAdminAuth("maintenance.backup.delete");

    const backup = await prisma.backup.findUnique({ where: { id: backupId } });
    if (!backup) throw new Error("Backup not found");

    if (backup.storageReference) {
      const absolutePath = path.join(process.cwd(), backup.storageReference);
      if (fs.existsSync(absolutePath)) {
        fs.unlinkSync(absolutePath);
      }
    }

    await prisma.backup.update({
      where: { id: backupId },
      data: { status: "Deleted" },
    });

    await logAdminAction({
      actorId: adminUser.id,
      action: "DELETE_BACKUP" as any,
      targetType: "Backup" as any,
      targetId: backupId,
    });

    return { success: true };
  } catch (err: any) {
    console.error("Delete backup action error:", err);
    return { success: false, error: err.message || "Failed to delete backup" };
  }
}

// 4. Restore Database (High-Risk Operation)
export async function restoreDatabaseAction(backupId: string, confirmationText: string) {
  try {
    const adminUser = await requireAdminAuth("maintenance.restore");
    const restoreJob = await initiateDatabaseRestore({
      backupId,
      actorId: adminUser.id,
      actorEmail: adminUser.email || undefined,
      confirmationText,
    });
    return { success: true, restoreJob };
  } catch (err: any) {
    console.error("Restore database action error:", err);
    return { success: false, error: err.message || "Database restore failed" };
  }
}

// 5. Clear Cache
export async function clearCacheAction(target: CacheTarget) {
  try {
    const adminUser = await requireAdminAuth("maintenance.cache.clear");
    const result = await clearApplicationCache(target, adminUser.id);
    return { success: true, result };
  } catch (err: any) {
    console.error("Clear cache action error:", err);
    return { success: false, error: err.message || "Failed to clear cache" };
  }
}

// 6. Re-index Database
export async function reindexAction() {
  try {
    const adminUser = await requireAdminAuth("maintenance.reindex");
    const result = await reindexDatabaseCollections(adminUser.id);
    return { success: true, result };
  } catch (err: any) {
    console.error("Re-index action error:", err);
    return { success: false, error: err.message || "Re-index operation failed" };
  }
}

// 7. Rebuild Sitemap
export async function rebuildSitemapAction() {
  try {
    const adminUser = await requireAdminAuth("maintenance.sitemap.rebuild");
    const result = await rebuildAndValidateSitemap(adminUser.id);
    return { success: true, result };
  } catch (err: any) {
    console.error("Rebuild sitemap action error:", err);
    return { success: false, error: err.message || "Sitemap rebuild failed" };
  }
}

// 8. Health Check
export async function runHealthCheckAction() {
  try {
    const adminUser = await requireAdminAuth("maintenance.view");
    const health = await checkSystemHealth(adminUser.id);
    return { success: true, health };
  } catch (err: any) {
    console.error("Health check action error:", err);
    return { success: false, error: err.message || "Health check failed" };
  }
}

// 9. Maintenance Mode Toggle
export async function toggleMaintenanceModeAction(
  enabled: boolean,
  message?: string,
  estimatedDuration?: string
) {
  try {
    const adminUser = await requireAdminAuth("maintenance.mode.manage");
    const mode = await setMaintenanceMode({
      enabled,
      message,
      estimatedDuration,
      actorId: adminUser.id,
      actorEmail: adminUser.email || undefined,
    });
    return { success: true, mode };
  } catch (err: any) {
    console.error("Toggle maintenance mode action error:", err);
    return { success: false, error: err.message || "Failed to toggle maintenance mode" };
  }
}

// 10. Fetch Maintenance Data Summary
export async function getMaintenanceSummaryAction() {
  try {
    const adminUser = await requireAdminAuth("maintenance.view");

    const [latestBackup, backupsCount, latestRestore, maintenanceMode, health] =
      await Promise.all([
        prisma.backup.findFirst({
          where: { status: { in: ["Completed", "Processing", "Queued"] } },
          orderBy: { createdAt: "desc" },
        }),
        prisma.backup.count({ where: { status: "Completed" } }),
        prisma.restoreJob.findFirst({
          orderBy: { createdAt: "desc" },
        }),
        getMaintenanceModeStatus(),
        checkSystemHealth(),
      ]);

    return {
      success: true,
      latestBackup,
      backupsCount,
      latestRestore,
      maintenanceMode,
      health,
    };
  } catch (err: any) {
    console.error("Get maintenance summary action error:", err);
    return { success: false, error: err.message || "Failed to fetch maintenance summary" };
  }
}
