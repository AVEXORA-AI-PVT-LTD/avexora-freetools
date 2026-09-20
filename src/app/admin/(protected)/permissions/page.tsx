import { requireAdminAuth } from "@/server/admin-auth";

export const metadata = {
  title: "Permissions | Avex Tools Admin",
};

export default async function PermissionsPage() {
  await requireAdminAuth("roles.view");

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Permissions Matrix</h1>
          <p className="text-sm text-slate-500">View what each role is allowed to do.</p>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-slate-600 text-sm">This module provides read-only mapping of hardcoded permissions to system roles.</p>
      </div>
    </div>
  );
}
