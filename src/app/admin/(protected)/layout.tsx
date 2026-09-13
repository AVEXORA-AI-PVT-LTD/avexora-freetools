import { requireAdminAuth } from "@/server/admin-auth";
import { ReactNode } from "react";
import Link from "next/link";

export const metadata = {
  title: "Avexora Tools Admin Panel",
};

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const user = await requireAdminAuth();

  return (
    <div className="fixed inset-0 z-50 flex h-screen bg-zinc-50 text-zinc-900">
      {/* Sidebar */}
      <aside className="w-64 bg-zinc-900 text-zinc-100 flex flex-col">
        <div className="p-4 border-b border-zinc-800">
          <h1 className="font-bold text-lg">Avexora Admin</h1>
          <p className="text-xs text-zinc-400">admin.tools.avexora.in</p>
        </div>
        
        <nav className="flex-1 p-4 space-y-2">
          <Link href="/admin" className="block px-3 py-2 rounded-md hover:bg-zinc-800">Dashboard</Link>
          <Link href="/admin/tools" className="block px-3 py-2 rounded-md hover:bg-zinc-800">Tools</Link>
          <Link href="/admin/categories" className="block px-3 py-2 rounded-md hover:bg-zinc-800">Categories</Link>
          <Link href="/admin/users" className="block px-3 py-2 rounded-md hover:bg-zinc-800">Users</Link>
        </nav>
        
        <div className="p-4 border-t border-zinc-800">
          <div className="text-sm font-medium">{user.name || user.email}</div>
          <div className="text-xs text-zinc-400 uppercase">{user.role}</div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto bg-zinc-50">
        {children}
      </main>
    </div>
  );
}
