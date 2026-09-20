"use client";

import { useState } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Search, Filter, MoreVertical, CreditCard } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";

export default function SubscriptionList({ subscriptions, total, totalPages, currentPage, plans, currentQuery }: any) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  
  const [q, setQ] = useState(currentQuery.q);
  
  const updateQuery = (updates: any) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(updates).forEach(([key, value]) => {
      if (value) {
        params.set(key, value as string);
      } else {
        params.delete(key);
      }
    });
    if (!updates.page) params.set("page", "1");
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4 bg-white p-4 rounded-lg shadow-sm border border-slate-200">
        <div className="relative flex-1">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <Search className="h-5 w-5 text-slate-400" aria-hidden="true" />
          </div>
          <input
            type="text"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && updateQuery({ q })}
            className="block w-full rounded-md border-0 py-2 pl-10 pr-3 text-slate-900 ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-orange-600 sm:text-sm sm:leading-6"
            placeholder="Search by name, email, or Razorpay ID..."
          />
        </div>
        
        <select
          value={currentQuery.plan}
          onChange={(e) => updateQuery({ plan: e.target.value === "all" ? "" : e.target.value })}
          className="block rounded-md border-0 py-2 pl-3 pr-10 text-slate-900 ring-1 ring-inset ring-slate-300 focus:ring-2 focus:ring-orange-600 sm:text-sm sm:leading-6"
        >
          <option value="all">All Plans</option>
          {plans.map((p: any) => (
            <option key={p.slug} value={p.slug}>{p.name}</option>
          ))}
        </select>

        <select
          value={currentQuery.status}
          onChange={(e) => updateQuery({ status: e.target.value === "all" ? "" : e.target.value })}
          className="block rounded-md border-0 py-2 pl-3 pr-10 text-slate-900 ring-1 ring-inset ring-slate-300 focus:ring-2 focus:ring-orange-600 sm:text-sm sm:leading-6"
        >
          <option value="all">All Statuses</option>
          <option value="active">Active</option>
          <option value="halted">Halted</option>
          <option value="cancelled">Cancelled</option>
          <option value="pending">Pending</option>
        </select>
      </div>

      <div className="bg-white shadow-sm overflow-hidden sm:rounded-lg border border-slate-200">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">User</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Plan & Cycle</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Created</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Gateway ID</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-slate-200">
            {subscriptions.map((sub: any) => (
              <tr key={sub.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-10 w-10">
                      {sub.user.image ? (
                        <img className="h-10 w-10 rounded-full" src={sub.user.image} alt="" />
                      ) : (
                        <div className="h-10 w-10 rounded-full bg-slate-200 flex items-center justify-center font-bold text-slate-500">
                          {(sub.user.name || "U").charAt(0)}
                        </div>
                      )}
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-slate-900">
                        <Link href={`/admin/users/${sub.user.id}`} className="hover:underline">{sub.user.name}</Link>
                      </div>
                      <div className="text-sm text-slate-500">{sub.user.email}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-slate-900 font-medium capitalize">{sub.plan}</div>
                  <div className="text-sm text-slate-500 capitalize">{sub.cycle}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${
                    sub.status === 'active' ? 'bg-green-100 text-green-800' :
                    sub.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {sub.status}
                  </span>
                  {sub.cancelAtPeriodEnd && (
                    <div className="text-xs text-amber-600 mt-1">Cancels at period end</div>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                  {format(new Date(sub.createdAt), 'MMM d, yyyy')}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 font-mono">
                  {sub.razorpaySubscriptionId || "N/A"}
                </td>
              </tr>
            ))}
            {subscriptions.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                  No subscriptions found matching your criteria.
                </td>
              </tr>
            )}
          </tbody>
        </table>
        
        {totalPages > 1 && (
          <div className="bg-white px-4 py-3 border-t border-slate-200 sm:px-6 flex justify-between items-center">
            <div className="text-sm text-slate-700">
              Showing page <span className="font-medium">{currentPage}</span> of <span className="font-medium">{totalPages}</span>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => updateQuery({ page: (currentPage - 1).toString() })}
                disabled={currentPage <= 1}
                className="relative inline-flex items-center px-4 py-2 border border-slate-300 text-sm font-medium rounded-md text-slate-700 bg-white hover:bg-slate-50 disabled:opacity-50"
              >
                Previous
              </button>
              <button
                onClick={() => updateQuery({ page: (currentPage + 1).toString() })}
                disabled={currentPage >= totalPages}
                className="relative inline-flex items-center px-4 py-2 border border-slate-300 text-sm font-medium rounded-md text-slate-700 bg-white hover:bg-slate-50 disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
