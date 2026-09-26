"use client";

import { usePathname, useSearchParams } from "next/navigation";
import Link from "next/link";
import { adminNavigation } from "@/config/admin-navigation";
import { hasPermission } from "@/lib/admin/permissions";

export function AdminTopNav({ userRole }: { userRole: string | undefined | null }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const queryString = searchParams.toString();
  const fullPath = queryString ? `${pathname}?${queryString}` : pathname;

  // Find the active parent navigation item
  let activeParentIndex = -1;
  let longestMatchLength = -1;

  adminNavigation.forEach((item, index) => {
    if (item.children) {
      item.children.forEach((child) => {
        const childBase = child.href?.split("?")[0];
        if (child.href && fullPath && child.href.toLowerCase() === fullPath.toLowerCase()) {
          if (1000 > longestMatchLength) {
            longestMatchLength = 1000;
            activeParentIndex = index;
          }
        } else if (childBase && childBase !== "/admin" && pathname?.startsWith(childBase)) {
          if (childBase.length > longestMatchLength) {
            longestMatchLength = childBase.length;
            activeParentIndex = index;
          }
        }
      });
    }
  });

  const activeParent = activeParentIndex >= 0 ? adminNavigation[activeParentIndex] : undefined;

  if (!activeParent || !activeParent.children) {
    return null; // Don't render tabs for single-page items like Dashboard
  }

  // Filter permitted children
  const permittedChildren = activeParent.children.filter(
    (child) => !child.permission || hasPermission(userRole, child.permission)
  );

  if (permittedChildren.length === 0) return null;

  // Find exact active tab index matching full path or path prefix
  let activeIndex = permittedChildren.findIndex(
    (child) => child.href && child.href.toLowerCase() === fullPath.toLowerCase()
  );

  if (activeIndex === -1 && pathname) {
    let longestMatchLength = -1;
    permittedChildren.forEach((child, index) => {
      const childBase = child.href?.split("?")[0];
      if (childBase && childBase !== "/admin" && pathname.startsWith(childBase)) {
        if (childBase.length > longestMatchLength) {
          longestMatchLength = childBase.length;
          activeIndex = index;
        }
      }
    });
  }

  return (
    <div className="sticky top-0 z-20 bg-zinc-50 border-b border-zinc-200 pb-0 pt-4 px-4 md:px-8 -mx-4 md:-mx-8 mb-6 md:pt-6">
      <div className="flex items-center gap-3 mb-4">
        {activeParent.icon && <activeParent.icon className="w-8 h-8 text-orange-600" />}
        <h1 className="text-3xl font-extrabold text-zinc-900">{activeParent.label}</h1>
      </div>

      <div className="flex overflow-x-auto scrollbar-hide">
        <div className="flex space-x-1 border-b border-zinc-200 min-w-full">
          {permittedChildren.map((child, index) => {
            const isActive = index === activeIndex;
            return (
              <Link
                key={child.label}
                href={child.href!}
                className={`whitespace-nowrap py-3 px-4 text-sm font-medium transition-colors border-b-2 ${
                  isActive
                    ? "border-orange-600 text-orange-600 font-semibold"
                    : "border-transparent text-zinc-500 hover:text-zinc-700 hover:border-zinc-300"
                }`}
              >
                {child.label}
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
