import { requireAdminAuth } from "@/server/admin-auth";
import { prisma } from "@/server/db";
import { notFound } from "next/navigation";
import PlanForm from "./PlanForm";

export default async function EditPlanPage({ params }: { params: Promise<{ planId: string }> }) {
  await requireAdminAuth("settings.view" as any);
  const { planId } = await params;
  
  let plan = null;
  
  if (planId !== "new") {
    plan = await prisma.plan.findUnique({ where: { id: planId } });
    if (!plan) notFound();
  }

  return (
    <div className="max-w-4xl mx-auto py-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">
          {plan ? `Edit Plan: ${plan.name}` : "Create New Pricing Plan"}
        </h1>
      </div>
      <PlanForm initialData={plan} />
    </div>
  );
}
