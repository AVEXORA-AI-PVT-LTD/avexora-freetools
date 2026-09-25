import { requireAdminAuth } from "@/server/admin-auth";
import PaymentsClient from "./PaymentsClient";

export const metadata = {
  title: "Payments Management | Avex Tools Admin",
};

export default async function PaymentsPage() {
  await requireAdminAuth("settings.view");
  return (
    <main className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Payments</h1>
        <p className="text-slate-500 text-sm mt-1">Manage transactions and refunds.</p>
      </div>
      <PaymentsClient />
    </main>
  );
}
