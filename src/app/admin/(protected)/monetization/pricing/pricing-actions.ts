"use server";

import { prisma } from "@/server/db";
import { requireAdminAuth } from "@/server/admin-auth";
import { revalidatePath, revalidateTag } from "next/cache";

export async function createPlan(data: any) {
  const admin = await requireAdminAuth("settings.view" as any);
  
  const plan = await prisma.plan.create({
    data: {
      slug: data.slug,
      name: data.name,
      description: data.description,
      tagline: data.tagline,
      monthlyPrice: parseInt(data.monthlyPrice) || 0,
      yearlyPrice: parseInt(data.yearlyPrice) || 0,
      currency: "INR",
      razorpayMonthlyId: data.razorpayMonthlyId || null,
      razorpayYearlyId: data.razorpayYearlyId || null,
      hasTrial: data.hasTrial || false,
      trialDays: parseInt(data.trialDays) || 0,
      limits: data.limits || {},
      capabilities: data.capabilities || {},
      watermark: data.watermark || false,
      highlights: data.highlights || [],
      isActive: data.isActive !== false,
      isFeatured: data.isFeatured || false,
      displayOrder: parseInt(data.displayOrder) || 0,
    }
  });

  await prisma.auditLog.create({
    data: {
      actorId: admin.id,
      actorRole: admin.role || "unknown",
      action: "PLAN_CREATED",
      targetType: "PLAN",
      targetId: plan.id,
      metadata: { slug: plan.slug }
    }
  });

  revalidatePath('/pricing');
  revalidatePath('/studio/pricing');
  revalidateTag('plans', 'max');
  return plan;
}

export async function updatePlan(id: string, data: any) {
  const admin = await requireAdminAuth("settings.view" as any);
  
  const plan = await prisma.plan.update({
    where: { id },
    data: {
      name: data.name,
      description: data.description,
      tagline: data.tagline,
      monthlyPrice: parseInt(data.monthlyPrice) || 0,
      yearlyPrice: parseInt(data.yearlyPrice) || 0,
      razorpayMonthlyId: data.razorpayMonthlyId || null,
      razorpayYearlyId: data.razorpayYearlyId || null,
      hasTrial: data.hasTrial || false,
      trialDays: parseInt(data.trialDays) || 0,
      limits: data.limits || {},
      capabilities: data.capabilities || {},
      watermark: data.watermark || false,
      highlights: data.highlights || [],
      isActive: data.isActive,
      isFeatured: data.isFeatured,
    }
  });

  await prisma.auditLog.create({
    data: {
      actorId: admin.id,
      actorRole: admin.role || "unknown",
      action: "PLAN_UPDATED",
      targetType: "PLAN",
      targetId: plan.id,
      metadata: { slug: plan.slug }
    }
  });

  revalidatePath('/pricing');
  revalidatePath('/studio/pricing');
  revalidateTag('plans', 'max');
  return plan;
}

export async function reorderPlans(orderedIds: string[]) {
  const admin = await requireAdminAuth("settings.view" as any);

  const ops = orderedIds.map((id, index) => 
    prisma.plan.update({
      where: { id },
      data: { displayOrder: index }
    })
  );

  await prisma.$transaction(ops);

  await prisma.auditLog.create({
    data: {
      actorId: admin.id,
      actorRole: admin.role || "unknown",
      action: "PLANS_REORDERED",
      targetType: "PLAN",
      metadata: { orderedIds }
    }
  });

  revalidatePath('/pricing');
  revalidatePath('/studio/pricing');
  revalidateTag('plans', 'max');
  return { success: true };
}

export async function deletePlan(id: string) {
  const admin = await requireAdminAuth("settings.view" as any);
  
  const plan = await prisma.plan.findUnique({ where: { id } });
  if (!plan) throw new Error("Plan not found");

  // Check if any subscriptions are active on this plan
  const subCount = await prisma.subscription.count({
    where: { plan: plan.slug }
  });

  if (subCount > 0) {
    throw new Error(`Cannot delete plan: ${subCount} subscriptions are currently using it. Deactivate it instead.`);
  }

  await prisma.plan.delete({ where: { id } });

  await prisma.auditLog.create({
    data: {
      actorId: admin.id,
      actorRole: admin.role || "unknown",
      action: "PLAN_DELETED",
      targetType: "PLAN",
      targetId: id,
      metadata: { slug: plan.slug }
    }
  });

  revalidatePath('/pricing');
  revalidatePath('/studio/pricing');
  revalidateTag('plans', 'max');
  return { success: true };
}
