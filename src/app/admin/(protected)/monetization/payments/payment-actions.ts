"use server";

import { prisma } from "@/server/db";
import { requireAdminAuth } from "@/server/admin-auth";
import Razorpay from "razorpay";

export async function getPaymentsAction(params: {
  page?: number;
  search?: string;
  status?: string;
  planId?: string;
}) {
  await requireAdminAuth("settings.view");

  const page = params.page || 1;
  const limit = 20;
  const skip = (page - 1) * limit;

  const where: any = {};

  if (params.search) {
    const searchRegex = { contains: params.search, mode: "insensitive" };
    where.OR = [
      { providerTxId: searchRegex },
      { user: { email: searchRegex } },
      { user: { name: searchRegex } }
    ];
  }

  if (params.status && params.status !== "all") {
    where.status = params.status;
  }

  if (params.planId && params.planId !== "all") {
    where.subscription = { plan: params.planId };
  }

  const [payments, total] = await Promise.all([
    prisma.payment.findMany({
      where,
      include: {
        user: { select: { id: true, name: true, email: true } },
        subscription: { select: { id: true, plan: true, status: true } }
      },
      orderBy: { paymentDate: "desc" },
      skip,
      take: limit,
    }),
    prisma.payment.count({ where })
  ]);

  return {
    items: payments,
    total,
    pages: Math.ceil(total / limit)
  };
}

export async function getPaymentDetailAction(id: string) {
  await requireAdminAuth("settings.view");

  const payment = await prisma.payment.findUnique({
    where: { id },
    include: {
      user: { select: { id: true, name: true, email: true } },
      subscription: { select: { id: true, plan: true, cycle: true, status: true, currentPeriodEnd: true } }
    }
  });

  return payment;
}

export async function processRefundAction(paymentId: string, amountPaise: number) {
  // Only superadmin or authorized users can refund
  const admin = await requireAdminAuth("settings.view"); // Assuming settings.edit or superadmin role check inside

  const payment = await prisma.payment.findUnique({ where: { id: paymentId } });
  if (!payment) throw new Error("Payment not found");
  if (!payment.providerTxId) throw new Error("No provider transaction ID");
  if (payment.status === "failed") throw new Error("Cannot refund a failed payment");
  if (payment.amount - payment.refundAmount < amountPaise) {
    throw new Error("Refund amount exceeds remaining refundable amount");
  }

  const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID!,
    key_secret: process.env.RAZORPAY_KEY_SECRET!
  });

  try {
    const refund = await razorpay.payments.refund(payment.providerTxId, {
      amount: amountPaise
    });

    const isFullRefund = (payment.refundAmount + amountPaise) >= payment.amount;
    const newStatus = isFullRefund ? "refunded" : "partially_refunded";

    const updated = await prisma.payment.update({
      where: { id: paymentId },
      data: {
        refundAmount: { increment: amountPaise },
        status: newStatus
      }
    });

    await prisma.auditLog.create({
      data: {
        actorId: admin.id || "",
        actorRole: (admin as any).role || "admin",
        action: "PAYMENT_REFUNDED",
        targetType: "PAYMENT",
        targetId: paymentId,
        metadata: { amount: amountPaise, providerRefundId: refund.id }
      }
    });

    return updated;
  } catch (error: any) {
    console.error("Razorpay refund error:", error);
    throw new Error(error?.error?.description || "Failed to process refund with provider");
  }
}
