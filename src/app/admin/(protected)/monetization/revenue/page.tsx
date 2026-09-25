import { requireAdminAuth } from "@/server/admin-auth";
import RevenueDashboardClient from "./RevenueDashboardClient";

export const metadata = {
  title: "Revenue Dashboard | Avex Tools Admin",
};

export default async function RevenuePage() {
  await requireAdminAuth("settings.view");
  return (
    <main className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Revenue Dashboard</h1>
        <p className="text-slate-500 text-sm mt-1">Financial KPIs, metrics, and MRR.</p>
      </div>
      <RevenueDashboardClient />
    </main>
  );
}
