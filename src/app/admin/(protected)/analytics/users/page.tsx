import { requireAdminAuth } from "@/server/admin-auth";

export const metadata = {
  title: "Analytics | Avex Tools Admin",
};

export default async function AnalyticsSubPage() {
  await requireAdminAuth("analytics.view");
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-slate-900 mb-4 capitalize">users Analytics</h1>
      <p className="text-slate-600">This module is under development.</p>
    </div>
  );
}
