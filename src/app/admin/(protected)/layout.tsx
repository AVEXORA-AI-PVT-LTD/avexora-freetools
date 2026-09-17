import { requireAdminAuth } from "@/server/admin-auth";
import { ReactNode } from "react";
import { AdminSidebar } from "./sidebar";

export const metadata = {
  title: "Avexora Tools Admin Panel",
};

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const user = await requireAdminAuth();

  return (
    <div className="fixed inset-0 z-[100] flex h-screen bg-zinc-50 text-zinc-900">
      <AdminSidebar user={user} />

      {/* Main Content */}
      <main className="flex-1 overflow-auto bg-zinc-50 flex flex-col relative w-full">
        {/* On mobile, we need top padding so content doesn't sit under the fixed hamburger menu */}
        <div className="p-4 pt-16 md:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
