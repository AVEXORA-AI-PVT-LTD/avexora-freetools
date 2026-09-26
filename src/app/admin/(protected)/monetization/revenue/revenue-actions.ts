"use server";

import { prisma } from "@/server/db";
import { requireAdminAuth } from "@/server/admin-auth";
import { subDays, startOfDay } from "date-fns";

export async function getRevenueMetricsAction(days: number = 30) {
  await requireAdminAuth("settings.view");

  const startDate = startOfDay(subDays(new Date(), days));

  // Get Payments in date range
  const payments = await prisma.payment.findMany({
    where: {
      paymentDate: { gte: startDate },
      status: { in: ["successful", "refunded", "partially_refunded"] }
    }
  });

  // Calculate gross, refunds, net
  let gross = 0;
  let refunds = 0;
  let taxes = 0;
  
  payments.forEach(p => {
    gross += p.amount;
    refunds += p.refundAmount;
    taxes += p.taxAmount;
  });

  const net = gross - refunds;

  // Calculate MRR from ACTIVE subscriptions (not just payments)
  const activeSubs = await prisma.subscription.findMany({
    where: { status: "active" }
  });
  
  // We need plan prices to calculate exact MRR.
  const plans = await prisma.plan.findMany();
  const planMap = new Map(plans.map(p => [p.slug, p]));

  let mrr = 0;
  activeSubs.forEach(sub => {
    const plan = planMap.get(sub.plan);
    if (plan && plan.monthlyPrice > 0) {
      if (sub.cycle === "monthly") {
        mrr += plan.monthlyPrice;
      } else if (sub.cycle === "yearly") {
        mrr += Math.round(plan.yearlyPrice / 12);
      }
    }
  });

  return {
    gross,
    refunds,
    net,
    taxes,
    mrr,
    paymentCount: payments.length,
    averageTxValue: payments.length > 0 ? Math.round(gross / payments.length) : 0
  };
}

export async function getRevenueChartsAction(days: number = 30) {
  await requireAdminAuth("settings.view");

  const startDate = startOfDay(subDays(new Date(), days));

  const payments = await prisma.payment.findMany({
    where: {
      paymentDate: { gte: startDate },
      status: { in: ["successful", "refunded", "partially_refunded"] }
    },
    select: { amount: true, refundAmount: true, paymentDate: true }
  });

  // Group by day string YYYY-MM-DD
  const dailyData: Record<string, { gross: number, refunds: number, net: number }> = {};
  
  // Initialize all days in range to 0
  for (let i = days; i >= 0; i--) {
    const d = startOfDay(subDays(new Date(), i));
    const dateStr = d.toISOString().split("T")[0];
    dailyData[dateStr] = { gross: 0, refunds: 0, net: 0 };
  }

  payments.forEach(p => {
    const dateStr = new Date(p.paymentDate).toISOString().split("T")[0];
    if (dailyData[dateStr]) {
      dailyData[dateStr].gross += p.amount;
      dailyData[dateStr].refunds += p.refundAmount;
      dailyData[dateStr].net += (p.amount - p.refundAmount);
    }
  });

  return Object.keys(dailyData).map(date => ({
    date,
    gross: dailyData[date].gross / 100,
    refunds: dailyData[date].refunds / 100,
    net: dailyData[date].net / 100,
  }));
}
