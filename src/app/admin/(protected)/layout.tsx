import { requireAdminAuth } from "@/server/admin-auth";
import { ReactNode } from "react";
import { AdminSidebar } from "./sidebar";
import { AdminTopNav } from "./top-nav";
import { DialogProvider } from "@/components/admin/DialogProvider";


export const metadata = {
  title: "Avexora Tools Admin Panel",
};

import { NotificationBell } from "@/components/admin/notifications/NotificationBell";
import { AdminAboutPanel } from "@/components/admin/AdminAboutPanel";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const user = await requireAdminAuth();

  return (
    <DialogProvider>
      <div className="fixed inset-0 z-[100] flex h-screen bg-zinc-50 text-zinc-900">
        <AdminSidebar user={user} />

        {/* Main Content */}
        <main className="flex-1 overflow-auto bg-zinc-50 flex flex-col relative w-full">
          <div className="p-4 pt-4 md:p-8 relative min-h-full flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-end mb-2">
                <NotificationBell />
              </div>
              <AdminTopNav userRole={user.role as string | undefined} />
              {children}
            </div>
            
            {/* Section About & Details Panel */}
            <div className="mt-12 pt-6 border-t border-zinc-200/80">
              <AdminAboutPanel />
            </div>
          </div>
        </main>
      </div>
    </DialogProvider>
  );
}
