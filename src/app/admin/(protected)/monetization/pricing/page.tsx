import { requireAdminAuth } from "@/server/admin-auth";
import { prisma } from "@/server/db";
import PricingClient from "./PricingClient";
import { seedPlansIfEmpty } from "@/server/studio/plans";

export const metadata = {
  title: "Pricing Plans | Avex Tools Admin",
};

export default async function PricingAdminPage() {
  await requireAdminAuth("settings.view" as any);
  
  // Ensure DB is seeded from legacy plans.ts if empty
  await seedPlansIfEmpty();

  const plans = await prisma.plan.findMany({
    orderBy: { displayOrder: "asc" },
  });

  // Calculate active subscribers per plan
  const subCounts = await prisma.subscription.groupBy({
    by: ['plan'],
    where: { status: 'active' },
    _count: { plan: true }
  });

  const subscribersMap = subCounts.reduce((acc, curr) => {
    acc[curr.plan] = curr._count.plan;
    return acc;
  }, {} as Record<string, number>);

  const plansWithCounts = plans.map(p => ({
    ...p,
    subscribersCount: subscribersMap[p.slug] || 0
  }));

  return (
    <div className="max-w-7xl mx-auto py-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Pricing Plans</h1>
        <p className="mt-2 text-sm text-slate-500">
          Manage your subscription plans, pricing, limits, and Razorpay integrations. Changes here instantly reflect on the public pricing page.
        </p>
      </div>

      <PricingClient initialPlans={plansWithCounts} />
    </div>
  );
}
