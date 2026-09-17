import { requireAdminAuth } from "@/server/admin-auth";
import { getDashboardStats, DateRange } from "@/server/admin/dashboard-stats";
import { getRecentActivity } from "@/server/admin/activity-service";
import { DashboardMetrics, QuickActions } from "@/components/admin/DashboardCards";
import { Suspense } from "react";
import { DateRangePicker } from "@/components/admin/DateRangePicker";
import { RecentActivityFeed } from "@/components/admin/RecentActivityFeed";

export default async function AdminDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string }>;
}) {
  const user = await requireAdminAuth("dashboard.view");
  const params = await searchParams;
  const range = (params.range as DateRange) || "last30days";
  
  // Parallel fetch stats and activity
  const [stats, activities] = await Promise.all([
    getDashboardStats(range),
    getRecentActivity(15) // Fetch top 15 recent items
  ]);

  return (
    <div className="space-y-10 pb-10">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight text-zinc-900">Admin Dashboard</h1>
          <div className="mt-4 flex flex-col sm:flex-row sm:items-center gap-2 text-zinc-600">
            <p className="text-lg">
              Welcome back, <span className="font-semibold text-zinc-900">{user.name || user.email}</span>
            </p>
            <span className="hidden sm:inline text-zinc-300">•</span>
            <p className="text-sm rounded-full bg-zinc-100 px-3 py-1 font-medium text-zinc-700 w-fit">
              {user.role}
            </p>
          </div>
        </div>
        <Suspense fallback={<div className="h-10 w-40 animate-pulse bg-zinc-200 rounded-md" />}><DateRangePicker /></Suspense>
      </div>

      <div className="space-y-6">
        <h2 className="text-lg font-semibold text-zinc-900">Overview</h2>
        <DashboardMetrics stats={stats} />
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <h2 className="text-lg font-semibold text-zinc-900">Quick Actions</h2>
          <QuickActions role={user.role as string | null} />
        </div>
        
        <div className="lg:col-span-1 h-[600px]">
          <RecentActivityFeed activities={activities} />
        </div>
      </div>
    </div>
  );
}
