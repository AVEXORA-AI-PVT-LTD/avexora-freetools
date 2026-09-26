"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { hasPermission } from "@/lib/admin/permissions";
import { adminNavigation, AdminNavItem } from "@/config/admin-navigation";
import { Menu, X, HelpCircle } from "lucide-react";
import { LogoutButton } from "@/components/admin/auth/LogoutButton";

import type { requireAdminAuth } from "@/server/admin-auth";

export function AdminSidebar({ user }: { user: Awaited<ReturnType<typeof requireAdminAuth>> }) {
  const [collapsed, setCollapsed] = useState(false);
  // The mobile drawer remembers the route it was opened on, so navigating
  // anywhere else closes it without an effect.
  const [drawerPath, setDrawerPath] = useState<string | null>(null);

  const pathname = usePathname();
  const mobileOpen = drawerPath !== null && drawerPath === pathname;
  const setMobileOpen = (open: boolean) => setDrawerPath(open ? pathname : null);

  let activeParentIndex = -1;
  let longestMatchLength = -1;

  adminNavigation.forEach((item, index) => {
    if (item.children) {
      item.children.forEach(child => {
        if (child.href === pathname) {
          if (1000 > longestMatchLength) {
            longestMatchLength = 1000;
            activeParentIndex = index;
          }
        } else if (child.href && child.href !== "/admin" && pathname?.startsWith(child.href)) {
          if (child.href.length > longestMatchLength) {
            longestMatchLength = child.href.length;
            activeParentIndex = index;
          }
        }
      });
    } else if (item.href) {
      if (item.href === pathname) {
        if (1000 > longestMatchLength) {
          longestMatchLength = 1000;
          activeParentIndex = index;
        }
      } else if (item.href !== "/admin" && pathname?.startsWith(item.href)) {
        if (item.href.length > longestMatchLength) {
          longestMatchLength = item.href.length;
          activeParentIndex = index;
        }
      }
    }
  });

  const renderNavItem = (item: AdminNavItem, index: number) => {
    // Check permissions
    if (item.permission && !hasPermission(user.role, item.permission)) return null;
    
    let targetHref = item.href;
    const isActive = index === activeParentIndex;

    if (item.children) {
      // Find permitted children
      const permittedChildren = item.children.filter(child => !child.permission || hasPermission(user.role, child.permission));
      if (permittedChildren.length === 0) return null;
      
      // The target href is the first permitted child's href
      targetHref = permittedChildren[0].href;
    }

    if (!targetHref) return null;

    const Icon = item.icon;

    return (
      <Link
        key={item.label}
        href={targetHref}
        className={`flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors ${
          isActive 
            ? "bg-orange-200/50 text-orange-950 shadow-sm" 
            : "text-orange-900/70 hover:bg-orange-100/50 hover:text-orange-950"
        } ${collapsed ? "justify-center" : "gap-3"}`}
        title={collapsed ? item.label : undefined}
      >
        {Icon && <Icon className="h-5 w-5 shrink-0" />}
        {!collapsed && <span>{item.label}</span>}
      </Link>
    );
  };

  const sidebarContent = (
    <>
      <div className="flex h-14 shrink-0 items-center justify-between border-b border-orange-200/60 px-4">
        {!collapsed && <span className="font-bold tracking-tight text-orange-950">AVEX TOOLS</span>}
        <button 
          onClick={() => setCollapsed(!collapsed)}
          className="hidden md:flex rounded-md p-1.5 text-orange-700/60 hover:bg-orange-100"
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <Menu className="h-4 w-4" />
        </button>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto p-2 scrollbar-thin scrollbar-thumb-orange-200">
        {adminNavigation.map((item, index) => renderNavItem(item, index))}

        <div className="pt-3 mt-3 border-t border-orange-200/50">
          <button
            type="button"
            onClick={() => {
              const el = document.querySelector('button[title*="section documentation"]');
              if (el) (el as HTMLElement).click();
            }}
            className={`w-full flex items-center rounded-md px-3 py-2 text-xs font-medium text-orange-800/70 hover:bg-orange-100/60 hover:text-orange-950 transition-colors cursor-pointer ${
              collapsed ? "justify-center" : "gap-2.5"
            }`}
            title={collapsed ? "About Section Guide" : undefined}
          >
            <HelpCircle className="h-4 w-4 shrink-0 text-orange-600" />
            {!collapsed && <span>About Section Guide</span>}
          </button>
        </div>
      </nav>

      <div className="shrink-0 border-t border-orange-200/60 p-4 bg-orange-50/80">
        {!collapsed ? (
          <div>
            <LogoutButton collapsed={false} />
            <Link href="/" target="_blank" className="mt-2 block text-xs font-semibold text-orange-600 hover:underline">
              ↗ Public Website
            </Link>
            <div className="text-sm font-medium text-orange-950 truncate" title={user.name || user.email || undefined}>
              {user.name || user.email}
            </div>
            <div className="text-xs text-orange-700/60 uppercase tracking-wider mt-1">{user.role}</div>
          </div>
        ) : (
          <LogoutButton collapsed={true} />
        )}
      </div>
    </>
  );

  return (
    <>
      {/* Mobile Overlay */}
      {mobileOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/50 md:hidden" 
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile Toggle Button (Visible only on small screens) */}
      <button
        onClick={() => setMobileOpen(true)}
        className="md:hidden fixed top-3 left-4 z-30 rounded-md p-2 bg-orange-100 text-orange-900 shadow-sm"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Sidebar Container */}
      <aside 
        className={`fixed md:static inset-y-0 left-0 z-50 flex flex-col border-r border-orange-200/60 bg-orange-50/95 backdrop-blur-sm transition-all duration-300 transform 
          ${mobileOpen ? 'translate-x-0 w-64' : '-translate-x-full md:translate-x-0'} 
          ${collapsed ? 'md:w-16' : 'md:w-64'}`}
      >
        {/* Mobile Close Button */}
        <button
          onClick={() => setMobileOpen(false)}
          className="md:hidden absolute top-3 right-3 rounded-md p-2 text-orange-700/60 hover:bg-orange-100"
        >
          <X className="h-5 w-5" />
        </button>

        {sidebarContent}
      </aside>
    </>
  );
}
