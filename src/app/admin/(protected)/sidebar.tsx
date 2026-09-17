"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { hasPermission } from "@/lib/admin/permissions";
import { adminNavigation, AdminNavItem } from "@/config/admin-navigation";
import { ChevronDown, ChevronRight, Menu, X } from "lucide-react";
import { LogoutButton } from "@/components/admin/auth/LogoutButton";

export function AdminSidebar({ user }: { user: any }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});
  const pathname = usePathname();

  // Auto-expand sections that contain the active route
  useEffect(() => {
    const newExpanded = { ...expandedSections };
    adminNavigation.forEach((item) => {
      if (item.children) {
        const hasActiveChild = item.children.some((child) => child.href === pathname || (child.href && child.href !== "/admin" && pathname?.startsWith(child.href)));
        if (hasActiveChild) {
          newExpanded[item.label] = true;
        }
      }
    });
    setExpandedSections(newExpanded);
  }, [pathname]);

  // Close mobile drawer on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  const toggleSection = (label: string) => {
    if (collapsed) setCollapsed(false); // Auto expand sidebar if clicking a section while collapsed
    setExpandedSections((prev) => ({ ...prev, [label]: !prev[label] }));
  };

  const renderNavItem = (item: AdminNavItem, isChild = false) => {
    // Check permissions
    if (item.permission && !hasPermission(user.role, item.permission)) return null;
    
    // Check children permissions
    const permittedChildren = item.children?.filter(child => !child.permission || hasPermission(user.role, child.permission));
    if (item.children && (!permittedChildren || permittedChildren.length === 0)) return null;

    const Icon = item.icon;
    const isExpanded = expandedSections[item.label];
    
    // Determine active state
    let isActive = false;
    if (item.href) {
      isActive = pathname === item.href || (item.href !== "/admin" && pathname?.startsWith(item.href));
    } else if (item.children) {
      isActive = permittedChildren!.some((child) => child.href === pathname || (child.href && child.href !== "/admin" && pathname?.startsWith(child.href)));
    }

    if (item.children) {
      return (
        <div key={item.label} className="flex flex-col">
          <button
            onClick={() => toggleSection(item.label)}
            className={`flex items-center justify-between rounded-md px-3 py-2 text-sm font-medium transition-colors w-full ${
              isActive && !isExpanded
                ? "bg-orange-200/50 text-orange-950" 
                : "text-orange-900/70 hover:bg-orange-100/50 hover:text-orange-950"
            }`}
            title={collapsed ? item.label : undefined}
          >
            <div className="flex items-center gap-3">
              {Icon && <Icon className="h-5 w-5 shrink-0" />}
              {!collapsed && <span>{item.label}</span>}
            </div>
            {!collapsed && (
              isExpanded ? <ChevronDown className="h-4 w-4 opacity-70" /> : <ChevronRight className="h-4 w-4 opacity-70" />
            )}
          </button>
          
          {(!collapsed && isExpanded) && (
            <div className="mt-1 flex flex-col space-y-1 pl-9 pr-2">
              {permittedChildren!.map((child) => renderNavItem(child, true))}
            </div>
          )}
        </div>
      );
    }

    return (
      <Link
        key={item.label}
        href={item.href!}
        className={`flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors ${
          isActive 
            ? "bg-orange-200/50 text-orange-950 shadow-sm" 
            : "text-orange-900/70 hover:bg-orange-100/50 hover:text-orange-950"
        } ${collapsed ? "justify-center" : isChild ? "py-1.5 text-xs" : "gap-3"}`}
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
        {adminNavigation.map(item => renderNavItem(item))}
      </nav>

      <div className="shrink-0 border-t border-orange-200/60 p-4 bg-orange-50/80">
        {!collapsed ? (
          <div>
            <LogoutButton collapsed={false} />
            <Link href="/" target="_blank" className="mt-2 block text-xs font-semibold text-orange-600 hover:underline">
              ↗ Public Website
            </Link>
            <div className="text-sm font-medium text-orange-950 truncate" title={user.name || user.email}>
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
