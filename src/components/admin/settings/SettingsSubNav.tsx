"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Sliders,
  Globe,
  Mail,
  ShieldCheck,
  Cpu,
  Wrench,
} from "lucide-react";

export function SettingsSubNav() {
  const pathname = usePathname();

  const navItems = [
    { label: "General", href: "/admin/settings/general", icon: Sliders },
    { label: "Website", href: "/admin/settings/website", icon: Globe },
    { label: "Email", href: "/admin/settings/email", icon: Mail },
    { label: "Security", href: "/admin/settings/security", icon: ShieldCheck },
    { label: "Integrations", href: "/admin/settings/integrations", icon: Cpu },
    { label: "Backup & Maintenance", href: "/admin/settings/maintenance", icon: Wrench },
  ];

  return (
    <div className="flex items-center gap-1 overflow-x-auto border-b border-zinc-200 dark:border-zinc-800 pb-2 mb-6 scrollbar-thin">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive =
          item.href === "/admin/settings/general"
            ? pathname === "/admin/settings/general" || pathname === "/admin/settings"
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
