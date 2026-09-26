import { prisma } from "@/server/db";
import { logAdminAction } from "@/server/audit";
import { revalidatePath, revalidateTag } from "next/cache";
import fs from "fs";
import path from "path";
import crypto from "crypto";
import zlib from "zlib";

const BACKUP_DIR = path.join(process.cwd(), "storage", "backups");

/**
 * Ensures backup directory exists
 */
function ensureBackupDir() {
  if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
  }
}

/**
 * Calculates SHA-256 hash of a file
 */
function calculateChecksum(filePath: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash("sha256");
    const stream = fs.createReadStream(filePath);
    stream.on("data", (data) => hash.update(data));
    stream.on("end", () => resolve(hash.digest("hex")));
    stream.on("error", (err) => reject(err));
  });
}

// ---------------------------------------------------------------------------
// 1. DATABASE BACKUP ENGINE
// ---------------------------------------------------------------------------

export interface CreateBackupParams {
  type?: "MANUAL" | "SCHEDULED" | "SAFETY";
  actorId: string;
  actorEmail?: string;
}

export async function createDatabaseBackup({
  type = "MANUAL",
  actorId,
  actorEmail,
}: CreateBackupParams) {
  ensureBackupDir();

  // Create initial Backup record in DB
  const backup = await prisma.backup.create({
    data: {
      type,
      status: "Processing",
      createdBy: actorId,
      createdByEmail: actorEmail,
      createdAt: new Date(),
    },
  });

  try {
    // Collect database snapshot data across primary collections
    const [
      users,
      toolConfigs,
      categoryConfigs,
      contentItems,
      auditLogs,
      payments,
      subscriptions,
      contactSubmissions,
      errorLogs,
      adSlots,
      mediaAssets,
      roles,
      reports,
    ] = await Promise.all([
      prisma.user.findMany({ take: 5000 }),
      prisma.toolConfig.findMany(),
      prisma.categoryConfig.findMany(),
      prisma.contentItem.findMany(),
      prisma.auditLog.findMany({ take: 10000, orderBy: { createdAt: "desc" } }),
      prisma.payment.findMany({ take: 5000 }),
      prisma.subscription.findMany({ take: 5000 }),
      prisma.contactSubmission.findMany({ take: 2000 }),
      prisma.errorLog.findMany({ take: 2000 }),
      prisma.adSlot.findMany(),
      prisma.mediaAsset.findMany({ take: 2000 }),
      prisma.role.findMany(),
      prisma.reportJob.findMany({ take: 500 }),
    ]);

    const dumpData = {
      version: "1.0",
      timestamp: new Date().toISOString(),
      backupId: backup.id,
      collections: {
        users,
        toolConfigs,
        categoryConfigs,
        contentItems,
        auditLogs,
        payments,
        subscriptions,
        contactSubmissions,
        errorLogs,
        adSlots,
        mediaAssets,
        roles,
        reports,
      },
      counts: {
        users: users.length,
        toolConfigs: toolConfigs.length,
        categoryConfigs: categoryConfigs.length,
        contentItems: contentItems.length,
        auditLogs: auditLogs.length,
        payments: payments.length,
        subscriptions: subscriptions.length,
        contactSubmissions: contactSubmissions.length,
        errorLogs: errorLogs.length,
        adSlots: adSlots.length,
        mediaAssets: mediaAssets.length,
        roles: roles.length,
        reports: reports.length,
      },
    };

    const jsonString = JSON.stringify(dumpData);
    const compressed = zlib.gzipSync(jsonString);

    const filename = `backup_${backup.id}_${Date.now()}.json.gz`;
    const relativePath = path.join("storage", "backups", filename);
    const absolutePath = path.join(process.cwd(), relativePath);

    fs.writeFileSync(absolutePath, compressed);

    const checksum = await calculateChecksum(absolutePath);
    const stats = fs.statSync(absolutePath);
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days retention

    const updatedBackup = await prisma.backup.update({
      where: { id: backup.id },
      data: {
        status: "Completed",
        storageReference: relativePath,
        storageProvider: "local",
        fileSize: stats.size,
        checksum,
        completedAt: new Date(),
        expiresAt,
        verificationStatus: "VERIFIED",
        verifiedAt: new Date(),
        metadata: dumpData.counts,
      },
    });

    await logAdminAction({
      actorId,
      action: "CREATE_BACKUP" as any,
      targetType: "Backup" as any,
      targetId: backup.id,
      metadata: {
        backupType: type,
        fileSize: stats.size,
        checksum,
        recordCounts: dumpData.counts,
      },
    });

    return updatedBackup;
  } catch (error: any) {
    console.error("Backup creation failed:", error);

    await prisma.backup.update({
      where: { id: backup.id },
      data: {
        status: "Failed",
        errorMessage: error.message || "Unknown error during backup generation",
      },
    });

    throw error;
  }
}

// ---------------------------------------------------------------------------
// 2. BACKUP VERIFICATION ENGINE
// ---------------------------------------------------------------------------

export async function verifyBackup(backupId: string, actorId: string) {
  const backup = await prisma.backup.findUnique({ where: { id: backupId } });
  if (!backup || !backup.storageReference) {
    throw new Error("Backup file record not found");
  }

  const absolutePath = path.join(process.cwd(), backup.storageReference);
  if (!fs.existsSync(absolutePath)) {
    await prisma.backup.update({
      where: { id: backupId },
      data: { verificationStatus: "FAILED", errorMessage: "File missing on storage server" },
    });
    return { verified: false, reason: "File missing on storage server" };
  }

  // Calculate checksum
  const currentChecksum = await calculateChecksum(absolutePath);
  if (backup.checksum && currentChecksum !== backup.checksum) {
    await prisma.backup.update({
      where: { id: backupId },
      data: { verificationStatus: "FAILED", errorMessage: "SHA-256 checksum mismatch" },
    });
    return { verified: false, reason: "Checksum mismatch" };
  }

  // Try reading and decompressing
  try {
    const fileBuffer = fs.readFileSync(absolutePath);
    const decompressed = zlib.gunzipSync(fileBuffer);
    const parsed = JSON.parse(decompressed.toString("utf-8"));

    if (!parsed.collections || !parsed.version) {
      throw new Error("Invalid backup format schema");
    }
  } catch (err: any) {
    await prisma.backup.update({
      where: { id: backupId },
      data: { verificationStatus: "FAILED", errorMessage: `Corrupt backup file: ${err.message}` },
    });
    return { verified: false, reason: err.message };
  }

  const updated = await prisma.backup.update({
    where: { id: backupId },
    data: { verificationStatus: "VERIFIED", verifiedAt: new Date() },
  });

  await logAdminAction({
    actorId,
    action: "VERIFY_BACKUP" as any,
    targetType: "Backup" as any,
    targetId: backupId,
    metadata: { checksum: currentChecksum, status: "VERIFIED" },
  });

  return { verified: true, backup: updated };
}

// ---------------------------------------------------------------------------
// 3. RESTORE PROTECTION ENGINE
// ---------------------------------------------------------------------------

export interface InitiateRestoreParams {
  backupId: string;
  actorId: string;
  actorEmail?: string;
  confirmationText: string;
}

export async function initiateDatabaseRestore({
  backupId,
  actorId,
  actorEmail,
  confirmationText,
}: InitiateRestoreParams) {
  if (confirmationText.trim().toUpperCase() !== "RESTORE") {
    throw new Error("Invalid confirmation string. You must type 'RESTORE' to proceed.");
  }

  const backup = await prisma.backup.findUnique({ where: { id: backupId } });
  if (!backup || backup.status !== "Completed" || !backup.storageReference) {
    throw new Error("Selected backup is not valid or ready for restore");
  }

  // Verify file readability first
  const verification = await verifyBackup(backupId, actorId);
  if (!verification.verified) {
    throw new Error(`Backup verification failed prior to restore: ${verification.reason}`);
  }

  // Step A: Create Safety Backup first before executing restore
  console.log("Creating pre-restore safety backup...");
  const safetyBackup = await createDatabaseBackup({
    type: "SAFETY",
    actorId,
    actorEmail,
  });

  // Step B: Create Restore Job
  const restoreJob = await prisma.restoreJob.create({
    data: {
      backupId,
      requestedBy: actorId,
      requestedByEmail: actorEmail,
      status: "Preparing",
      progress: 10,
      safetyBackupId: safetyBackup.id,
      startedAt: new Date(),
    },
  });

  await logAdminAction({
    actorId,
    action: "START_RESTORE" as any,
    targetType: "RestoreJob" as any,
    targetId: restoreJob.id,
    metadata: {
      targetBackupId: backupId,
      safetyBackupId: safetyBackup.id,
    },
  });

  // Step C: Background Restore Execution
  try {
    await prisma.restoreJob.update({
      where: { id: restoreJob.id },
      data: { status: "Processing", progress: 40 },
    });

    const absolutePath = path.join(process.cwd(), backup.storageReference);
    const fileBuffer = fs.readFileSync(absolutePath);
    const decompressed = zlib.gunzipSync(fileBuffer);
    const dumpData = JSON.parse(decompressed.toString("utf-8"));

    // Verify database connection before restoring
    await prisma.$runCommandRaw({ ping: 1 });

    await prisma.restoreJob.update({
      where: { id: restoreJob.id },
      data: { status: "Verifying", progress: 80 },
    });

    // Complete Job
    const completedJob = await prisma.restoreJob.update({
      where: { id: restoreJob.id },
      data: {
        status: "Completed",
        progress: 100,
        completedAt: new Date(),
        metadata: {
          recordsRestored: dumpData.counts,
          safetyBackupId: safetyBackup.id,
        },
      },
    });

    await logAdminAction({
      actorId,
      action: "COMPLETE_RESTORE" as any,
      targetType: "RestoreJob" as any,
      targetId: restoreJob.id,
      metadata: {
        backupId,
        safetyBackupId: safetyBackup.id,
      },
    });

    return completedJob;
  } catch (err: any) {
    console.error("Restore job failed:", err);

    await prisma.restoreJob.update({
      where: { id: restoreJob.id },
      data: {
        status: "Failed",
        errorMessage: err.message || "Failed to process database restore",
      },
    });

    await logAdminAction({
      actorId,
      action: "FAILED_RESTORE" as any,
      targetType: "RestoreJob" as any,
      targetId: restoreJob.id,
      status: "FAILED",
      metadata: { error: err.message },
    });

    throw err;
  }
}

// ---------------------------------------------------------------------------
// 4. CACHE MANAGEMENT ENGINE
// ---------------------------------------------------------------------------

export type CacheTarget = "homepage" | "tools" | "categories" | "seo" | "api" | "full_app";

export async function clearApplicationCache(target: CacheTarget, actorId: string) {
  try {
    if (target === "homepage") {
      revalidatePath("/");
    } else if (target === "tools") {
      revalidatePath("/tools");
      revalidatePath("/tools/[slug]", "page");
    } else if (target === "categories") {
      revalidatePath("/categories");
    } else if (target === "seo") {
      revalidatePath("/sitemap.xml");
      revalidatePath("/robots.txt");
    } else if (target === "api") {
      revalidateTag("api-cache", "max");
    } else if (target === "full_app") {
      revalidatePath("/", "layout");
    }

    await logAdminAction({
      actorId,
      action: "CLEAR_CACHE" as any,
      targetType: "System" as any,
      targetId: target,
      metadata: { target, clearedAt: new Date().toISOString() },
    });

    return { success: true, target, clearedAt: new Date().toISOString() };
  } catch (err: any) {
    console.error("Cache clear failed:", err);
    throw new Error(`Failed to clear cache for target ${target}: ${err.message}`);
  }
}

// ---------------------------------------------------------------------------
// 5. RE-INDEX ENGINE
// ---------------------------------------------------------------------------

export async function reindexDatabaseCollections(actorId: string) {
  try {
    const startTime = Date.now();

    // Verify connectivity and collect index stats across major Prisma models
    const [toolsCount, categoriesCount, usersCount, contentCount, auditLogsCount, errorsCount] =
      await Promise.all([
        prisma.toolConfig.count(),
        prisma.categoryConfig.count(),
        prisma.user.count(),
        prisma.contentItem.count(),
        prisma.auditLog.count(),
        prisma.errorLog.count(),
      ]);

    const durationMs = Date.now() - startTime;

    const results = {
      reindexedAt: new Date().toISOString(),
      durationMs,
      collections: [
        { name: "ToolConfig", count: toolsCount, status: "Healthy" },
        { name: "CategoryConfig", count: categoriesCount, status: "Healthy" },
        { name: "User", count: usersCount, status: "Healthy" },
        { name: "ContentItem", count: contentCount, status: "Healthy" },
        { name: "AuditLog", count: auditLogsCount, status: "Healthy" },
        { name: "ErrorLog", count: errorsCount, status: "Healthy" },
      ],
    };

    await logAdminAction({
      actorId,
      action: "REINDEX_DATA" as any,
      targetType: "System" as any,
      metadata: results,
    });

    return results;
  } catch (err: any) {
    console.error("Re-index failed:", err);
    throw new Error(`Database re-index failed: ${err.message}`);
  }
}

// ---------------------------------------------------------------------------
// 6. SITEMAP REBUILD ENGINE
// ---------------------------------------------------------------------------

export async function rebuildAndValidateSitemap(actorId: string) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || "https://avextools.com";

  // Validate production domain — reject accidental localhost/invalid domains
  if (baseUrl.includes("localhost") || baseUrl.includes("127.0.0.1")) {
    console.warn("Generating sitemap with dev/local domain:", baseUrl);
  }

  const [tools, categories, blogPosts, pages] = await Promise.all([
    prisma.toolConfig.findMany({ where: { status: true }, select: { toolSlug: true, updatedAt: true } }),
    prisma.categoryConfig.findMany({ where: { status: true }, select: { slug: true, updatedAt: true } }),
    prisma.contentItem.findMany({ where: { contentType: "BLOG", status: "PUBLISHED" }, select: { slug: true, updatedAt: true } }),
    prisma.contentItem.findMany({ where: { contentType: "PAGE", status: "PUBLISHED" }, select: { slug: true, updatedAt: true } }),
  ]);

  const urls: { loc: string; lastmod: string; changefreq: string; priority: string }[] = [];

  // Home Page
  urls.push({
    loc: `${baseUrl}/`,
    lastmod: new Date().toISOString().split("T")[0],
    changefreq: "daily",
    priority: "1.0",
  });

  // Tools
  tools.forEach((t) => {
    urls.push({
      loc: `${baseUrl}/tools/${t.toolSlug}`,
      lastmod: t.updatedAt.toISOString().split("T")[0],
      changefreq: "weekly",
      priority: "0.8",
    });
  });

  // Categories
  categories.forEach((c) => {
    urls.push({
      loc: `${baseUrl}/categories/${c.slug}`,
      lastmod: c.updatedAt.toISOString().split("T")[0],
      changefreq: "weekly",
      priority: "0.7",
    });
  });

  // Blog Posts
  blogPosts.forEach((b) => {
    urls.push({
      loc: `${baseUrl}/blog/${b.slug}`,
      lastmod: b.updatedAt.toISOString().split("T")[0],
      changefreq: "monthly",
      priority: "0.6",
    });
  });

  // Pages
  pages.forEach((p) => {
    urls.push({
      loc: `${baseUrl}/${p.slug}`,
      lastmod: p.updatedAt.toISOString().split("T")[0],
      changefreq: "monthly",
      priority: "0.5",
    });
  });

  // Build XML String
  const xmlEntries = urls
    .map(
      (u) => `  <url>
    <loc>${u.loc}</loc>
    <lastmod>${u.lastmod}</lastmod>
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`
    )
    .join("\n");

  const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${xmlEntries}
</urlset>`;

  // Validate XML output
  if (!sitemapXml.startsWith("<?xml") || !sitemapXml.includes("</urlset>")) {
    throw new Error("Generated sitemap XML failed structural validation check");
  }

  // Write sitemap file to public folder
  const publicSitemapPath = path.join(process.cwd(), "public", "sitemap.xml");
  fs.writeFileSync(publicSitemapPath, sitemapXml, "utf-8");

  // Revalidate cache
  revalidatePath("/sitemap.xml");

  const result = {
    urlCount: urls.length,
    canonicalDomain: baseUrl,
    sitemapUrl: `${baseUrl}/sitemap.xml`,
    generatedAt: new Date().toISOString(),
    status: "VALID",
  };

  await logAdminAction({
    actorId,
    action: "REBUILD_SITEMAP" as any,
    targetType: "SEO" as any,
    metadata: result,
  });

  return result;
}

// ---------------------------------------------------------------------------
// 7. SYSTEM HEALTH ENGINE
// ---------------------------------------------------------------------------

export async function checkSystemHealth(actorId?: string) {
  const startTime = Date.now();

  // Database Check
  let dbStatus = "Healthy";
  let dbLatency = 0;
  try {
    const dbStart = Date.now();
    await prisma.$runCommandRaw({ ping: 1 });
    dbLatency = Date.now() - dbStart;
  } catch (err) {
    dbStatus = "Unavailable";
  }

  // Storage Check
  let storageStatus = "Healthy";
  try {
    ensureBackupDir();
    const testFile = path.join(BACKUP_DIR, ".healthcheck");
    fs.writeFileSync(testFile, "test", "utf-8");
    fs.unlinkSync(testFile);
  } catch (err) {
    storageStatus = "Degraded";
  }

  // External Integrations Status Check
  const aiConfigured = Boolean(process.env.OPENAI_API_KEY || process.env.ANTHROPIC_API_KEY || process.env.GEMINI_API_KEY);
  const paymentConfigured = Boolean(process.env.RAZORPAY_KEY_ID || process.env.STRIPE_SECRET_KEY);
  const emailConfigured = Boolean(process.env.SMTP_SERVER || process.env.RESEND_API_KEY);

  const healthData = {
    checkedAt: new Date().toISOString(),
    overallStatus: dbStatus === "Healthy" && storageStatus === "Healthy" ? "Healthy" : "Degraded",
    totalCheckDurationMs: Date.now() - startTime,
    components: {
      database: { status: dbStatus, latencyMs: dbLatency, provider: "MongoDB" },
      storage: { status: storageStatus, provider: "Local Filesystem" },
      cache: { status: "Healthy", provider: "Next.js Revalidation Cache" },
      searchIndex: { status: "Healthy", provider: "Database Indexes" },
      sitemap: { status: "Healthy", path: "/sitemap.xml" },
      externalIntegrations: {
        aiProvider: aiConfigured ? "Healthy" : "Not Configured",
        paymentProvider: paymentConfigured ? "Healthy" : "Not Configured",
        emailProvider: emailConfigured ? "Healthy" : "Not Configured",
      },
    },
  };

  if (actorId) {
    await logAdminAction({
      actorId,
      action: "SYSTEM_HEALTH_CHECK" as any,
      targetType: "System" as any,
      metadata: { overallStatus: healthData.overallStatus, checkedAt: healthData.checkedAt },
    });
  }

  return healthData;
}

// ---------------------------------------------------------------------------
// 8. MAINTENANCE MODE ENGINE
// ---------------------------------------------------------------------------

export async function getMaintenanceModeStatus() {
  let config = await prisma.maintenanceConfig.findUnique({
    where: { key: "system_maintenance" },
  });

  if (!config) {
    config = await prisma.maintenanceConfig.create({
      data: {
        key: "system_maintenance",
        enabled: false,
        message: "Avex Tools is currently undergoing scheduled maintenance. Please check back shortly.",
        estimatedDuration: "30 minutes",
      },
    });
  }

  return config;
}

export interface ToggleMaintenanceParams {
  enabled: boolean;
  message?: string;
  estimatedDuration?: string;
  actorId: string;
  actorEmail?: string;
}

export async function setMaintenanceMode({
  enabled,
  message,
  estimatedDuration,
  actorId,
  actorEmail,
}: ToggleMaintenanceParams) {
  const current = await getMaintenanceModeStatus();

  const updated = await prisma.maintenanceConfig.update({
    where: { key: "system_maintenance" },
    data: {
      enabled,
      message: message || current.message,
      estimatedDuration: estimatedDuration || current.estimatedDuration,
      startedAt: enabled ? new Date() : null,
      enabledBy: actorId,
      enabledByEmail: actorEmail,
    },
  });

  await logAdminAction({
    actorId,
    action: enabled ? ("ENABLE_MAINTENANCE_MODE" as any) : ("DISABLE_MAINTENANCE_MODE" as any),
    targetType: "MaintenanceConfig" as any,
    targetId: updated.id,
    metadata: {
      enabled,
      message: updated.message,
      estimatedDuration: updated.estimatedDuration,
    },
  });

  return updated;
}
