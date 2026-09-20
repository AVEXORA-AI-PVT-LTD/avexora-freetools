"use server";
import { requireAdminAuth } from "@/server/admin-auth";
import { prisma } from "@/server/db";
import { revalidateTag } from "next/cache";


// Helper: Validate destination URL
function validateDestination(dest: string) {
  if (!dest) throw new Error("Destination cannot be empty.");
  
  if (dest.startsWith("/")) return; // Valid internal path
  
  try {
    const url = new URL(dest);
    if (!['http:', 'https:'].includes(url.protocol)) {
      throw new Error(`Invalid protocol: ${url.protocol}. Only http and https are allowed for external URLs.`);
    }
  } catch (e: any) {
    throw new Error(e.message || "Invalid destination URL format.");
  }
}

// Helper: Check for loops
async function checkRedirectLoop(source: string, destination: string, excludeId?: string) {
  if (source === destination) return "Cannot redirect to self.";
  
  // Basic chain detection (up to 5 jumps)
  let currentDest = destination;
  const visited = new Set<string>();
  visited.add(source);
  
  for (let i = 0; i < 5; i++) {
    if (visited.has(currentDest)) {
      return "Redirect loop detected.";
    }
    visited.add(currentDest);
    
    // Check if the current destination redirects somewhere else
    const nextRedirect = await prisma.redirect.findFirst({
      where: { source: currentDest, active: true, id: excludeId ? { not: excludeId } : undefined }
    });
    
    if (!nextRedirect) break;
    currentDest = nextRedirect.destination;
  }
  
  return null; // No loop
}

// Helper: Check for chains
async function checkRedirectChain(destination: string, excludeId?: string) {
  const nextRedirect = await prisma.redirect.findFirst({
    where: { source: destination, active: true, id: excludeId ? { not: excludeId } : undefined }
  });
  if (nextRedirect) {
    return `Warning: This creates a redirect chain. Consider redirecting directly to ${nextRedirect.destination}.`;
  }
  return null;
}

export async function createRedirect(data: { source: string, destination: string, statusCode: number, reason?: string }) {
  const user = await requireAdminAuth("seo.edit");
  if (!data.source.startsWith("/")) throw new Error("Source must start with / for internal redirects.");
  validateDestination(data.destination);
  
  const existing = await prisma.redirect.findUnique({ where: { source: data.source } });
  if (existing) {
    if (!existing.active) {
      throw new Error(`An inactive redirect for ${data.source} already exists. Please edit/reactivate it instead.`);
    }
    throw new Error(`An active redirect for ${data.source} already exists.`);
  }

  const loopError = await checkRedirectLoop(data.source, data.destination);
  if (loopError) throw new Error(loopError);
  
  const chainWarning = await checkRedirectChain(data.destination);

  const created = await prisma.redirect.create({
    data: {
      ...data,
      createdBy: user.id
    }
  });

  await prisma.auditLog.create({
    data: {
      actorId: user.id, actorRole: user.role || "unknown", action: "REDIRECT_CREATED",
      targetType: "SEO", targetId: created.id, metadata: { source: data.source, destination: data.destination }
    }
  });

  revalidateTag('seo-redirects', 'max');
  return { created, warning: chainWarning };
}

export async function updateRedirect(id: string, data: { source: string, destination: string, statusCode: number, active: boolean, reason?: string }) {
  const user = await requireAdminAuth("seo.edit");
  if (!data.source.startsWith("/")) throw new Error("Source must start with / for internal redirects.");
  validateDestination(data.destination);

  const existing = await prisma.redirect.findFirst({ where: { source: data.source, id: { not: id } } });
  if (existing) throw new Error(`Another redirect for ${data.source} already exists.`);

  const loopError = await checkRedirectLoop(data.source, data.destination, id);
  if (loopError) throw new Error(loopError);

  const chainWarning = await checkRedirectChain(data.destination, id);

  const updated = await prisma.redirect.update({
    where: { id },
    data
  });

  await prisma.auditLog.create({
    data: {
      actorId: user.id, actorRole: user.role || "unknown", action: "REDIRECT_UPDATED",
      targetType: "SEO", targetId: id, metadata: { source: data.source, destination: data.destination }
    }
  });

  revalidateTag('seo-redirects', 'max');
  return { updated, warning: chainWarning };
}

export async function toggleRedirect(id: string, active: boolean) {
  const user = await requireAdminAuth("seo.edit");
  const updated = await prisma.redirect.update({ where: { id }, data: { active } });
  
  await prisma.auditLog.create({
    data: {
      actorId: user.id, actorRole: user.role || "unknown", action: active ? "REDIRECT_ACTIVATED" : "REDIRECT_DEACTIVATED",
      targetType: "SEO", targetId: id, metadata: { source: updated.source }
    }
  });
  
  revalidateTag('seo-redirects', 'max');
  return updated;
}

export async function deleteRedirect(id: string) {
  const user = await requireAdminAuth("seo.edit");
  const r = await prisma.redirect.findUnique({ where: { id }});
  if (!r) return { success: true };

  await prisma.redirect.delete({ where: { id } });
  
  await prisma.auditLog.create({
    data: {
      actorId: user.id, actorRole: user.role || "unknown", action: "REDIRECT_DELETED",
      targetType: "SEO", targetId: id, metadata: { source: r.source }
    }
  });
  
  revalidateTag('seo-redirects', 'max');
  return { success: true };
}

export async function bulkToggleRedirects(ids: string[], active: boolean) {
  const user = await requireAdminAuth("seo.edit");
  await prisma.redirect.updateMany({ where: { id: { in: ids } }, data: { active } });
  
  await prisma.auditLog.create({
    data: {
      actorId: user.id, actorRole: user.role || "unknown", action: active ? "REDIRECT_BULK_ACTIVATED" : "REDIRECT_BULK_DEACTIVATED",
      targetType: "SEO", targetId: "bulk", metadata: { count: ids.length }
    }
  });
  
  revalidateTag('seo-redirects', 'max');
  return { success: true };
}

export async function bulkDeleteRedirects(ids: string[]) {
  const user = await requireAdminAuth("seo.edit");
  await prisma.redirect.deleteMany({ where: { id: { in: ids } } });
  
  await prisma.auditLog.create({
    data: {
      actorId: user.id, actorRole: user.role || "unknown", action: "REDIRECT_BULK_DELETED",
      targetType: "SEO", targetId: "bulk", metadata: { count: ids.length }
    }
  });
  
  revalidateTag('seo-redirects', 'max');
  return { success: true };
}
