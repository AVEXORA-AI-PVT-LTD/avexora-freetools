import { requireAdminAuth } from "@/server/admin-auth";
import { isHigherOrEqualRole, hasPermission } from "@/lib/admin/permissions";
import { prisma } from "@/server/db";
import { RoleSelect } from "./RoleSelect";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ALLOWED_ROLES } from "@/lib/admin/users";
import type { Prisma } from "@prisma/client";

export const metadata = {
  title: "Users | Admin",
};

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; role?: string; page?: string }>;
}) {
  const session = await requireAdminAuth();
  
  // Require users.view permission
  if (!hasPermission(session.role, "users.view")) {
    redirect("/admin");
  }

  const isSuperAdmin = isHigherOrEqualRole(session.role, "superadmin");

  const { q = "", role = "", page = "1" } = await searchParams;

  const pageSize = 20;
  const currentPage = Math.max(1, parseInt(page) || 1);

  // Prisma Where Clause
  const where: Prisma.UserWhereInput = {};

  if (q.trim()) {
    where.OR = [
      { name: { contains: q.trim(), mode: "insensitive" } },
      { email: { contains: q.trim(), mode: "insensitive" } },
    ];
  }

  if (role) {
    if (role === "user") {
      where.OR = [
        { role: "user" },
        { role: null }, // Treat null as user
      ];
    } else {
      where.role = role;
    }
  }

  const [totalUsers, users] = await Promise.all([
    prisma.user.count({ where }),
    prisma.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (currentPage - 1) * pageSize,
      take: pageSize,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        image: true,
        createdAt: true,
      }
    }),
  ]);

  const totalPages = Math.ceil(totalUsers / pageSize) || 1;
  const validPage = Math.min(currentPage, totalPages);

  const buildQuery = (updates: { q?: string; role?: string; page?: string }) => {
    const params = new URLSearchParams();
    if (updates.q !== undefined ? updates.q : q) params.set("q", updates.q !== undefined ? updates.q : q);
    if (updates.role !== undefined ? updates.role : role) params.set("role", updates.role !== undefined ? updates.role : role);
    if (updates.page !== undefined ? updates.page : validPage.toString()) params.set("page", updates.page !== undefined ? updates.page : validPage.toString());
    return `/admin/users?${params.toString()}`;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-slate-900">Users</h1>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:flex sm:items-center sm:justify-between">
        <form className="flex w-full flex-col gap-3 sm:flex-row sm:items-center">
          <div className="flex-1">
            <label htmlFor="search" className="sr-only">Search users</label>
            <input
              type="search"
              id="search"
              name="q"
              defaultValue={q}
              placeholder="Search by name or email..."
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
            />
          </div>
          <div className="sm:w-48">
            <label htmlFor="role-filter" className="sr-only">Filter by role</label>
            <select
              id="role-filter"
              name="role"
              defaultValue={role}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
            >
              <option value="">All Roles</option>
              {ALLOWED_ROLES.map((r) => (
                <option key={r} value={r}>
                  {r === "superadmin" ? "Super Admin" : r.charAt(0).toUpperCase() + r.slice(1)}
                </option>
              ))}
            </select>
          </div>
          <button
            type="submit"
            className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
          >
            Filter
          </button>
          {(q || role) && (
            <Link
              href="/admin/users"
              className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Clear
            </Link>
          )}
        </form>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  User
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Role
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Joined
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {users.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-6 py-12 text-center text-sm text-slate-500">
                    No users found matching your filters.
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id}>
                    <td className="whitespace-nowrap px-6 py-4">
                      <div className="flex items-center">
                        <div className="h-10 w-10 flex-shrink-0">
                          {user.image ? (
                            <img className="h-10 w-10 rounded-full" src={user.image} alt="" />
                          ) : (
                            <div className="h-10 w-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 font-medium">
                              {(user.name || user.email).charAt(0).toUpperCase()}
                            </div>
                          )}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-slate-900">{user.name || "Unknown"}</div>
                          <div className="text-sm text-slate-500">{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-500">
                      <RoleSelect 
                        userId={user.id} 
                        currentRole={user.role || "user"} 
                        isSuperAdmin={isSuperAdmin}
                        isSelf={session.id === user.id}
                      />
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-500">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-slate-200 bg-white px-4 py-3 sm:px-6">
            <div className="flex flex-1 justify-between sm:hidden">
              <Link
                href={buildQuery({ page: (validPage - 1).toString() })}
                className={`relative inline-flex items-center rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 ${validPage <= 1 ? "pointer-events-none opacity-50" : ""}`}
              >
                Previous
              </Link>
              <Link
                href={buildQuery({ page: (validPage + 1).toString() })}
                className={`relative ml-3 inline-flex items-center rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 ${validPage >= totalPages ? "pointer-events-none opacity-50" : ""}`}
              >
                Next
              </Link>
            </div>
            <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-slate-700">
                  Showing <span className="font-medium">{(validPage - 1) * pageSize + 1}</span> to <span className="font-medium">{Math.min(validPage * pageSize, totalUsers)}</span> of{" "}
                  <span className="font-medium">{totalUsers}</span> users
                </p>
              </div>
              <div>
                <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
                  <Link
                    href={buildQuery({ page: (validPage - 1).toString() })}
                    className={`relative inline-flex items-center rounded-l-md px-2 py-2 text-slate-400 ring-1 ring-inset ring-slate-300 hover:bg-slate-50 focus:z-20 focus:outline-offset-0 ${validPage <= 1 ? "pointer-events-none opacity-50" : ""}`}
                  >
                    <span className="sr-only">Previous</span>
                    <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path fillRule="evenodd" d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z" clipRule="evenodd" />
                    </svg>
                  </Link>
                  
                  {/* Simplified pagination links for brevity */}
                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter(p => p === 1 || p === totalPages || Math.abs(p - validPage) <= 2)
                    .map((p, i, arr) => {
                      if (i > 0 && p - arr[i - 1] > 1) {
                        return (
                          <span key={`ellipsis-${p}`} className="relative inline-flex items-center px-4 py-2 text-sm font-semibold text-slate-700 ring-1 ring-inset ring-slate-300">
                            ...
                          </span>
                        );
                      }
                      return (
                        <Link
                          key={p}
                          href={buildQuery({ page: p.toString() })}
                          className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold focus:z-20 focus:outline-offset-0 ${
                            p === validPage
                              ? "z-10 bg-orange-600 text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-600"
                              : "text-slate-900 ring-1 ring-inset ring-slate-300 hover:bg-slate-50"
                          }`}
                        >
                          {p}
                        </Link>
                      );
                    })}

                  <Link
                    href={buildQuery({ page: (validPage + 1).toString() })}
                    className={`relative inline-flex items-center rounded-r-md px-2 py-2 text-slate-400 ring-1 ring-inset ring-slate-300 hover:bg-slate-50 focus:z-20 focus:outline-offset-0 ${validPage >= totalPages ? "pointer-events-none opacity-50" : ""}`}
                  >
                    <span className="sr-only">Next</span>
                    <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" />
                    </svg>
                  </Link>
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
