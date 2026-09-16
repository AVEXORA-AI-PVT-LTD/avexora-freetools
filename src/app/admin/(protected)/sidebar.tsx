"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { hasPermission } from "@/lib/admin/permissions";

export function AdminSidebar({ user }: { user: any }) {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();

  const allLinks = [
    { 
      href: "/admin", 
      label: "Dashboard", 
      permission: "dashboard.view",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
        </svg>
      )
    },
    { 
      href: "/admin/analytics", 
      label: "Analytics", 
      permission: "analytics.view" as any,
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" />
        </svg>
      )
    },
    { 
      href: "/admin/tools", 
      label: "Tools", 
      permission: "tools.view",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
          <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
        </svg>
      )
    },
    { 
      href: "/admin/categories", 
      label: "Categories", 
      permission: "categories.view",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 9.776c.112-.017.227-.026.344-.026h15.812c.117 0 .232.009.344.026m-16.5 0a2.25 2.25 0 00-1.883 2.542l.857 6a2.25 2.25 0 002.227 1.932H19.05a2.25 2.25 0 002.227-1.932l.857-6a2.25 2.25 0 00-1.883-2.542m-16.5 0V6A2.25 2.25 0 016 3.75h3.879a1.5 1.5 0 011.06.44l2.122 2.12a1.5 1.5 0 001.06.44H18A2.25 2.25 0 0120.25 9v.776" />
        </svg>
      )
    },
    { 
      href: "/admin/users", 
      label: "Users", 
      permission: "users.view",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
        </svg>
      )
    },
    { 
      href: "/admin/content", 
      label: "Website Content", 
      permission: "content.view",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m3.75 9v6m3-3H9m1.5-12H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
        </svg>
      )
    },
        { 
      href: "/admin/navigation", 
      label: "Navigation", 
      permission: "navigation.view" as any,
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
        </svg>
      )
    },
  ];

  const links = allLinks.filter(link => hasPermission(user.role, link.permission));

  return (
    <div className={`flex flex-col border-r border-orange-200/60 bg-orange-50/80 transition-all duration-300 ${collapsed ? 'w-16' : 'w-64'}`}>
      <div className="flex h-14 items-center justify-between border-b border-orange-200/60 px-4">
        {!collapsed && <span className="font-semibold tracking-tight text-orange-950">Avexora Admin</span>}
        <button 
          onClick={() => setCollapsed(!collapsed)}
          className="rounded-md p-1.5 text-orange-700/60 hover:bg-orange-100"
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? '▶' : '◀'}
        </button>
      </div>

      <nav className="flex-1 space-y-1 p-2">
        {links.map(link => {
          const active = pathname === link.href || (link.href !== "/admin" && pathname?.startsWith(link.href));
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                active ? "bg-orange-200/50 text-orange-900" : "text-orange-900/70 hover:bg-orange-100/50 hover:text-orange-950"
              } ${collapsed ? "justify-center" : "gap-3"}`}
              title={collapsed ? link.label : undefined}
            >
              {link.icon}
              {!collapsed && <span>{link.label}</span>}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-orange-200/60 p-4">
        {!collapsed ? (
          <div>
            <Link href="/" target="_blank" className="mb-3 block text-xs font-semibold text-orange-600 hover:underline">
              ↗ Go to Website
            </Link>
            <div className="text-sm font-medium text-orange-950 truncate" title={user.name || user.email}>
              {user.name || user.email}
            </div>
            <div className="text-xs text-orange-700/60 uppercase tracking-wider">{user.role}</div>
          </div>
        ) : (
          <Link href="/" target="_blank" className="text-center block text-sm text-orange-600 hover:text-orange-800" title="Go to Website">
            ↗
          </Link>
        )}
      </div>
    </div>
  );
}
