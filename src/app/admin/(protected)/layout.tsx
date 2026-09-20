import { requireAdminAuth } from "@/server/admin-auth";
import { ReactNode } from "react";
import { AdminSidebar } from "./sidebar";
import { AdminTopNav } from "./top-nav";
import { DialogProvider } from "@/components/admin/DialogProvider";


export const metadata = {
  title: "Avexora Tools Admin Panel",
};

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const user = await requireAdminAuth();

  return (
    <DialogProvider>
    <div className="fixed inset-0 z-[100] flex h-screen bg-zinc-50 text-zinc-900">
      <AdminSidebar user={user} />

      {/* Main Content */}
      <main className="flex-1 overflow-auto bg-zinc-50 flex flex-col relative w-full">
        <div className="p-4 pt-16 md:p-8 relative">
          <AdminTopNav userRole={user.role as string | undefined} />
          {children}
        </div>
      </main>
    </div>
    </DialogProvider>
  );
}
