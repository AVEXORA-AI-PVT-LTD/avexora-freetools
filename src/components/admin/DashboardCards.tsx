import { DashboardStats } from "@/app/admin/actions";
import Link from "next/link";
import { hasPermission } from "@/lib/admin/permissions";

export function DashboardMetrics({ stats }: { stats: DashboardStats }) {
  if (stats.error) {
    return (
      <div className="p-4 bg-red-50 text-red-700 rounded-lg border border-red-200">
        <p className="font-medium text-sm">{stats.error}</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      <div className="p-6 bg-white rounded-2xl shadow-sm border border-zinc-100 flex flex-col justify-between">
        <h3 className="text-zinc-500 text-sm font-medium">Total Users</h3>
        <p className="text-4xl font-bold mt-3 text-zinc-900 tracking-tight">
          {stats.totalUsers !== null ? stats.totalUsers.toLocaleString() : "..."}
        </p>
      </div>
      
      <div className="p-6 bg-white rounded-2xl shadow-sm border border-zinc-100 flex flex-col justify-between">
        <h3 className="text-zinc-500 text-sm font-medium">Active Tools</h3>
        <p className="text-4xl font-bold mt-3 text-zinc-900 tracking-tight">
          {stats.activeTools !== null ? stats.activeTools.toLocaleString() : "..."}
        </p>
      </div>

      <div className="p-6 bg-white rounded-2xl shadow-sm border border-zinc-100 flex flex-col justify-between">
        <h3 className="text-zinc-500 text-sm font-medium">Categories</h3>
        <p className="text-4xl font-bold mt-3 text-zinc-900 tracking-tight">
          {stats.totalCategories !== null ? stats.totalCategories.toLocaleString() : "..."}
        </p>
      </div>

      <div className="p-6 bg-white rounded-2xl shadow-sm border border-zinc-100 flex flex-col justify-between">
        <h3 className="text-zinc-500 text-sm font-medium">Admin Users</h3>
        <p className="text-4xl font-bold mt-3 text-zinc-900 tracking-tight">
          {stats.adminUsers !== null ? stats.adminUsers.toLocaleString() : "..."}
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
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
      {canManageTools && (
        <Link href="/admin/tools" className="group p-6 bg-white border border-zinc-200 rounded-2xl hover:border-zinc-300 hover:shadow-md transition-all focus:ring-2 focus:ring-zinc-900 outline-none">
          <div className="flex items-center gap-3 mb-3 text-zinc-900">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6 text-zinc-600">
              <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
            </svg>
            <h3 className="font-semibold">Manage Tools</h3>
          </div>
          <p className="text-sm text-zinc-500">Enable, disable, and reorder tools across the platform.</p>
        </Link>
      )}
      
      {canManageCategories && (
        <Link href="/admin/categories" className="group p-6 bg-white border border-zinc-200 rounded-2xl hover:border-zinc-300 hover:shadow-md transition-all focus:ring-2 focus:ring-zinc-900 outline-none">
          <div className="flex items-center gap-3 mb-3 text-zinc-900">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-zinc-600">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 9.776c.112-.017.227-.026.344-.026h15.812c.117 0 .232.009.344.026m-16.5 0a2.25 2.25 0 00-1.883 2.542l.857 6a2.25 2.25 0 002.227 1.932H19.05a2.25 2.25 0 002.227-1.932l.857-6a2.25 2.25 0 00-1.883-2.542m-16.5 0V6A2.25 2.25 0 016 3.75h3.879a1.5 1.5 0 011.06.44l2.122 2.12a1.5 1.5 0 001.06.44H18A2.25 2.25 0 0120.25 9v.776" />
            </svg>
            <h3 className="font-semibold">Manage Categories</h3>
          </div>
          <p className="text-sm text-zinc-500">Configure category visibility, display order, and grouping.</p>
        </Link>
      )}
      
      {canManageUsers && (
        <Link href="/admin/users" className="group p-6 bg-white border border-zinc-200 rounded-2xl hover:border-zinc-300 hover:shadow-md transition-all focus:ring-2 focus:ring-zinc-900 outline-none">
          <div className="flex items-center gap-3 mb-3 text-zinc-900">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-zinc-600">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
            </svg>
            <h3 className="font-semibold">Manage Users</h3>
          </div>
          <p className="text-sm text-zinc-500">Assign admin roles, manage permissions, and oversee accounts.</p>
        </Link>
      )}

      {!canManageTools && !canManageCategories && !canManageUsers && (
        <p className="text-sm text-zinc-500 col-span-full">No quick actions available for your role.</p>
      )}
    </div>
  );
}
