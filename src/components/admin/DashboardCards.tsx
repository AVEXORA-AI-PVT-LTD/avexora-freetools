import { DashboardStats } from "@/app/admin/actions";
import Link from "next/link";
import { hasPermission } from "@/lib/admin/permissions";

export function DashboardMetrics({ stats }: { stats: DashboardStats }) {
  if (stats.error) {
    return (
      <div className="p-6 mb-8 bg-red-50 text-red-700 rounded-xl border border-red-200">
        <p className="font-medium">{stats.error}</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <div className="p-6 bg-white rounded-xl shadow-sm border border-zinc-200">
        <h3 className="text-zinc-500 text-sm font-medium">Total Users</h3>
        <p className="text-3xl font-bold mt-2 text-zinc-900">
          {stats.totalUsers !== null ? stats.totalUsers.toLocaleString() : "Unavailable"}
        </p>
      </div>
      
      <div className="p-6 bg-white rounded-xl shadow-sm border border-zinc-200">
        <h3 className="text-zinc-500 text-sm font-medium">Active Tools</h3>
        <p className="text-3xl font-bold mt-2 text-zinc-900">
          {stats.activeTools !== null ? stats.activeTools.toLocaleString() : "Unavailable"}
        </p>
      </div>

      <div className="p-6 bg-white rounded-xl shadow-sm border border-zinc-200">
        <h3 className="text-zinc-500 text-sm font-medium">Categories</h3>
        <p className="text-3xl font-bold mt-2 text-zinc-900">
          {stats.totalCategories !== null ? stats.totalCategories.toLocaleString() : "Unavailable"}
        </p>
      </div>

      <div className="p-6 bg-white rounded-xl shadow-sm border border-zinc-200">
        <h3 className="text-zinc-500 text-sm font-medium">Admin Users</h3>
        <p className="text-3xl font-bold mt-2 text-zinc-900">
          {stats.adminUsers !== null ? stats.adminUsers.toLocaleString() : "Unavailable"}
        </p>
      </div>
    </div>
  );
}

export function QuickActions({ role }: { role: string | null | undefined }) {
  const canManageTools = hasPermission(role, "tools.view");
  const canManageCategories = hasPermission(role, "categories.view");
  const canManageUsers = hasPermission(role, "users.view");

  return (
    <div className="bg-white rounded-xl shadow-sm border border-zinc-200 p-6">
      <h2 className="text-xl font-bold mb-4">Quick Actions</h2>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {canManageTools && (
          <Link href="/admin/tools" className="p-4 border border-zinc-200 rounded-lg hover:border-zinc-400 transition-colors focus:ring-2 focus:ring-zinc-900 outline-none">
            <h3 className="font-semibold text-zinc-900">Manage Tools</h3>
            <p className="text-sm text-zinc-500 mt-1">Enable, disable, and order tools.</p>
          </Link>
        )}
        
        {canManageCategories && (
          <Link href="/admin/categories" className="p-4 border border-zinc-200 rounded-lg hover:border-zinc-400 transition-colors focus:ring-2 focus:ring-zinc-900 outline-none">
            <h3 className="font-semibold text-zinc-900">Manage Categories</h3>
            <p className="text-sm text-zinc-500 mt-1">Configure categories and visibility.</p>
          </Link>
        )}
        
        {canManageUsers && (
          <Link href="/admin/users" className="p-4 border border-zinc-200 rounded-lg hover:border-zinc-400 transition-colors focus:ring-2 focus:ring-zinc-900 outline-none">
            <h3 className="font-semibold text-zinc-900">Manage Users</h3>
            <p className="text-sm text-zinc-500 mt-1">Assign admin roles and permissions.</p>
          </Link>
        )}

        {!canManageTools && !canManageCategories && !canManageUsers && (
          <p className="text-sm text-zinc-500 col-span-full">No quick actions available for your role.</p>
        )}
      </div>
    </div>
  );
}
