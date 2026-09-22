import { requireAdminAuth } from "@/server/admin-auth";
import { prisma } from "@/server/db";
import Link from "next/link";
import { Search, Filter, RefreshCcw } from "lucide-react";
import SubscriptionList from "./SubscriptionList";

export const metadata = {
  title: "Subscriptions | Avex Tools Admin",
};

export default async function SubscriptionsAdminPage(props: {
  searchParams: Promise<{ q?: string; status?: string; plan?: string; page?: string }>
}) {
  await requireAdminAuth("settings.view" as any);
  
  const searchParams = await props.searchParams;
  const q = searchParams.q || "";
  const status = searchParams.status || "all";
  const plan = searchParams.plan || "all";
  const page = parseInt(searchParams.page || "1") || 1;
  const take = 20;
  const skip = (page - 1) * take;

  const where: any = {};
  
  if (status !== "all") {
    where.status = status;
  }
  
  if (plan !== "all") {
    where.plan = plan;
  }
  
  if (q) {
    where.OR = [
      { user: { name: { contains: q, mode: "insensitive" } } },
      { user: { email: { contains: q, mode: "insensitive" } } },
      { id: { contains: q, mode: "insensitive" } },
      { razorpaySubscriptionId: { contains: q, mode: "insensitive" } },
    ];
  }

  const [subscriptions, total] = await Promise.all([
    prisma.subscription.findMany({
      where,
      include: {
        user: {
          select: { id: true, name: true, email: true, image: true }
        }
      },
      orderBy: { createdAt: "desc" },
      skip,
      take,
    }),
    prisma.subscription.count({ where })
  ]);

  const totalPages = Math.ceil(total / take);

  // Fetch unique plans for filter dropdown
  const plans = await prisma.plan.findMany({ select: { slug: true, name: true } });

  return (
    <div className="max-w-7xl mx-auto py-6">
      <div className="mb-8 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Subscriptions</h1>
          <p className="mt-2 text-sm text-slate-500">
            Monitor and manage active, cancelled, and pending subscriptions.
          </p>
        </div>
      </div>

      <SubscriptionList 
        subscriptions={subscriptions} 
        total={total} 
        totalPages={totalPages} 
        currentPage={page}
        plans={plans}
        currentQuery={{ q, status, plan }}
      />
    </div>
  );
}
