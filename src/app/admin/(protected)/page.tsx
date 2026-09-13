import { requireAdminAuth } from "@/server/admin-auth";
import { getDashboardStats } from "@/app/admin/actions";
import { DashboardMetrics, QuickActions } from "@/components/admin/DashboardCards";

export default async function AdminDashboardPage() {
  const user = await requireAdminAuth("dashboard.view");
  const stats = await getDashboardStats();

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <p className="text-zinc-500 mt-2">
          Welcome back, <span className="font-semibold text-zinc-900">{user.name || user.email}</span>
        </p>
        <p className="text-sm text-zinc-400">
          Role: <span className="uppercase text-zinc-600 font-medium">{user.role}</span>
        </p>
      </div>

      <DashboardMetrics stats={stats} />
      
      <QuickActions role={user.role as string | null} />
    </div>
  );
}
