import { requireAdminAuth } from "@/server/admin-auth";
import { getDashboardStats } from "@/app/admin/actions";
import { DashboardMetrics, QuickActions } from "@/components/admin/DashboardCards";

export default async function AdminDashboardPage() {
  const user = await requireAdminAuth("dashboard.view");
  const stats = await getDashboardStats();

  return (
    <div className="space-y-10">
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

      <div className="space-y-6">
        <h2 className="text-lg font-semibold text-zinc-900">Overview</h2>
        <DashboardMetrics stats={stats} />
      </div>
      
      <div className="space-y-6">
        <h2 className="text-lg font-semibold text-zinc-900">Quick Actions</h2>
        <QuickActions role={user.role as string | null} />
      </div>
    </div>
  );
}
