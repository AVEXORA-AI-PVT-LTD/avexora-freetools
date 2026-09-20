import { requireAdminAuth } from "@/server/admin-auth";

export const metadata = {
  title: "Roles | Avex Tools Admin",
};

export default async function RolesPage() {
  await requireAdminAuth("roles.view");

  const roles = [
    { name: "SUPER_ADMIN", desc: "Full access to all systems and settings.", count: 1 },
    { name: "ADMIN", desc: "Access to manage tools, users, and content.", count: 1 },
    { name: "EDITOR", desc: "Can manage tools and content, no user management.", count: 0 },
    { name: "ANALYST", desc: "Read-only access to analytics and usage data.", count: 0 },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">System Roles</h1>
          <p className="text-sm text-slate-500">Manage role definitions and descriptions.</p>
        </div>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {roles.map((r) => (
          <div key={r.name} className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-slate-900">{r.name}</h3>
            <p className="mt-2 text-sm text-slate-600">{r.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
