"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Database,
  RotateCcw,
  Zap,
  Search,
  FileSpreadsheet,
  Activity,
  Power,
} from "lucide-react";

export function MaintenanceSubNav() {
  const pathname = usePathname();

  const navItems = [
    { label: "Overview", href: "/admin/settings/maintenance", icon: LayoutDashboard },
    { label: "Backups", href: "/admin/settings/maintenance/backups", icon: Database },
    { label: "Restore", href: "/admin/settings/maintenance/restore", icon: RotateCcw },
    { label: "Cache", href: "/admin/settings/maintenance/cache", icon: Zap },
    { label: "Search/Re-index", href: "/admin/settings/maintenance/reindex", icon: Search },
    { label: "Sitemap", href: "/admin/settings/maintenance/sitemap", icon: FileSpreadsheet },
    { label: "System Health", href: "/admin/settings/maintenance/health", icon: Activity },
    { label: "Maintenance Mode", href: "/admin/settings/maintenance/mode", icon: Power },
  ];

  return (
    <div className="flex items-center gap-1 overflow-x-auto border-b border-zinc-200 dark:border-zinc-800 pb-2 mb-6 scrollbar-thin">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive =
          item.href === "/admin/settings/maintenance"
            ? pathname === "/admin/settings/maintenance"
            : pathname.startsWith(item.href);

        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs md:text-sm font-semibold transition-all whitespace-nowrap ${
              isActive
                ? "bg-orange-500 text-white shadow-sm"
                : "text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:text-zinc-200 dark:hover:bg-zinc-800"
            }`}
          >
            <Icon className="h-4 w-4 shrink-0" />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </div>
  );
}
