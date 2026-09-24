"use client";

import { useState } from "react";
import { formatINR } from "@/server/studio/plans";
import { Plus, Edit, Copy, Trash2, Power, GripVertical, Check } from "lucide-react";
import { updatePlan, reorderPlans, deletePlan } from "./pricing-actions";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { Plan } from "@prisma/client";

type PlanWithCount = Plan & { subscribersCount: number };

export default function PricingClient({ initialPlans }: { initialPlans: PlanWithCount[] }) {
  const [plans, setPlans] = useState(initialPlans);
  const [isReordering, setIsReordering] = useState(false);
  const router = useRouter();

  const handleToggleStatus = async (plan: PlanWithCount) => {
    try {
      await updatePlan(plan.id, { ...plan, isActive: !plan.isActive });
      router.refresh();
    } catch (e) {
      alert(e instanceof Error ? e.message : String(e));
    }
  };

  const handleDelete = async (plan: PlanWithCount) => {
    if (plan.subscribersCount > 0) {
      alert(`Cannot delete ${plan.name} because it has ${plan.subscribersCount} active subscribers. Deactivate it instead.`);
      return;
    }
    if (confirm(`Are you sure you want to permanently delete the ${plan.name} plan?`)) {
      try {
        await deletePlan(plan.id);
        router.refresh();
      } catch (e) {
        alert(e instanceof Error ? e.message : String(e));
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex space-x-3">
          <button 
            onClick={() => setIsReordering(!isReordering)}
            className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-md shadow-sm hover:bg-slate-50"
          >
            {isReordering ? "Finish Reordering" : "Reorder Plans"}
          </button>
        </div>
        <Link 
          href="/admin/monetization/pricing/new"
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
        >
          <Plus className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
          New Plan
        </Link>
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-md border border-slate-200">
        <ul role="list" className="divide-y divide-slate-200">
          {plans.map((plan, index) => (
            <li key={plan.id} className={!plan.isActive ? "bg-slate-50" : ""}>
              <div className="px-4 py-4 sm:px-6 flex items-center justify-between">
                <div className="flex items-center flex-1 min-w-0">
                  {isReordering && (
                    <div className="mr-4 cursor-move text-slate-400 hover:text-slate-600">
                      <GripVertical className="h-6 w-6" />
                    </div>
                  )}
                  <div className="min-w-0 flex-1 px-4 md:grid md:grid-cols-4 md:gap-4">
                    <div className="col-span-1">
                      <p className="text-sm font-medium text-orange-600 truncate flex items-center gap-2">
                        {plan.name}
                        {plan.isFeatured && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-800">
                            Featured
                          </span>
                        )}
                        {!plan.isActive && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-800">
                            Draft
                          </span>
                        )}
                      </p>
                      <p className="mt-2 flex items-center text-sm text-slate-500">
                        <span className="truncate">{plan.slug}</span>
                      </p>
                    </div>
                    <div className="hidden md:block col-span-1">
                      <p className="text-sm text-slate-900">
                        {plan.monthlyPrice === 0 ? "Free" : formatINR(plan.monthlyPrice)}
                        <span className="text-slate-500 text-xs">/mo</span>
                      </p>
                      <p className="mt-2 text-sm text-slate-500">
                        {plan.yearlyPrice === 0 ? "Free" : formatINR(plan.yearlyPrice)}
                        <span className="text-slate-500 text-xs">/yr</span>
                      </p>
                    </div>
                    <div className="hidden md:block col-span-1">
                      <p className="text-sm text-slate-900">
                        {plan.subscribersCount} <span className="text-slate-500">active</span>
                      </p>
                    </div>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <button onClick={() => handleToggleStatus(plan)} className="p-2 text-slate-400 hover:text-orange-600" title={plan.isActive ? "Deactivate" : "Activate"}>
                    <Power className="h-5 w-5" />
                  </button>
                  <Link href={`/admin/monetization/pricing/${plan.id}`} className="p-2 text-slate-400 hover:text-blue-600" title="Edit">
                    <Edit className="h-5 w-5" />
                  </Link>
                  <button onClick={() => handleDelete(plan)} className="p-2 text-slate-400 hover:text-red-600" title="Delete">
                    <Trash2 className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
