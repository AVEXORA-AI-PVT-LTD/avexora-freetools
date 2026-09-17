"use client";

import { adminLogoutAction } from "@/app/actions/admin-auth";
import { LogOut } from "lucide-react";

export function LogoutButton({ collapsed = false }: { collapsed?: boolean }) {
  const handleLogout = async () => {
    const result = await adminLogoutAction();
    if (result.success && result.redirectUrl) {
      window.location.href = result.redirectUrl;
    }
  };

  return (
    <button
      onClick={handleLogout}
      className={`w-full flex items-center rounded-md px-3 py-2 text-sm font-medium text-orange-900/70 hover:bg-orange-100/50 hover:text-orange-950 transition-colors ${
        collapsed ? "justify-center" : "gap-3"
      }`}
      title={collapsed ? "Log out" : undefined}
    >
      <LogOut className="h-5 w-5 shrink-0" />
      {!collapsed && <span>Log out</span>}
    </button>
  );
}
