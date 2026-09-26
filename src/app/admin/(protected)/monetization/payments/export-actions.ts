"use server";

import { prisma } from "@/server/db";
import { requireAdminAuth } from "@/server/admin-auth";

export async function exportPaymentsAction() {
  const admin = await requireAdminAuth("settings.view");

  const payments = await prisma.payment.findMany({
    include: {
      user: { select: { id: true, name: true, email: true } },
      subscription: { select: { id: true, plan: true } }
    },
    orderBy: { paymentDate: "desc" },
    take: 5000 // Limit to avoid memory issues
  });

  const headers = [
    "Transaction ID", "User ID", "User Email", "Plan", "Amount (INR)", 
    "Refund (INR)", "Status", "Gateway Ref", "Created At"
  ].join(",");

  const rows = payments.map(p => {
    return [
      p.id,
      p.userId,
      p.user?.email || "Unknown",
      p.subscription?.plan || "N/A",
      (p.amount / 100).toFixed(2),
      (p.refundAmount / 100).toFixed(2),
      p.status,
      p.providerTxId || "",
      new Date(p.paymentDate).toISOString()
    ].map(field => `"${String(field).replace(/"/g, '""')}"`).join(",");
  });

  await prisma.auditLog.create({
    data: {
      actorId: admin.id || "",
      actorRole: (admin as any).role || "admin",
      action: "PAYMENTS_EXPORTED",
      targetType: "PAYMENT",
      metadata: { recordsExported: payments.length }
    }
  });

  return [headers, ...rows].join("\n");
}
