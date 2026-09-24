"use client";
import { useState, useTransition } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useDialog } from "@/components/admin/DialogProvider";
import { Search, Filter, Shield, MoreVertical, Ban, Trash2, Power, Eye, ExternalLink } from "lucide-react";
import Link from "next/link";
import { bulkUpdateUserStatus } from "./user-actions";
import Image from "next/image";
import type { Prisma } from "@prisma/client";

/** A user row as selected by the users admin page (page.tsx). */
export type AdminUserRow = Prisma.UserGetPayload<{
  select: {
    id: true;
    name: true;
    email: true;
    image: true;
    role: true;
    status: true;
    createdAt: true;
    lastActiveAt: true;
    subscription: { select: { plan: true; status: true } };
  };
}>;

interface UsersClientProps {
  users: AdminUserRow[];
  total: number;
  page: number;
  limit: number;
  initialFilters: { q: string; role: string; status: string };
  adminRole: string;
}

export function UsersClient({ users, total, page, limit, initialFilters, adminRole }: UsersClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { showConfirm, showAlert } = useDialog();
  const [isPending, startTransition] = useTransition();

  const [q, setQ] = useState(initialFilters.q);
  const [role, setRole] = useState(initialFilters.role);
  const [status, setStatus] = useState(initialFilters.status);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const applyFilters = () => {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (role) params.set("role", role);
    if (status) params.set("status", status);
    params.set("page", "1");
    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`);
    });
  };

  const changePage = (newPage: number) => {
    const params = new URLSearchParams(window.location.search);
    params.set("page", newPage.toString());
    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`);
    });
  };

  const handleSelectAll = () => {
    if (selectedIds.size === users.length) setSelectedIds(new Set());
    else setSelectedIds(new Set(users.map((u) => u.id)));
  };

  const toggleSelect = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const handleBulkAction = (actionStatus: "ACTIVE" | "DISABLED" | "BLOCKED") => {
    const ids = Array.from(selectedIds);
    if (!ids.length) return;
    
    showConfirm("Bulk Action", `Are you sure you want to change status to ${actionStatus} for ${ids.length} users?`, async () => {
      try {
        await bulkUpdateUserStatus(ids, actionStatus);
        setSelectedIds(new Set());
        showAlert("Success", "Bulk action applied.");
        router.refresh();
      } catch (e) {
        showAlert("Error", e instanceof Error ? e.message : String(e));
      }
    });
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-4 items-center justify-between bg-white p-4 rounded-xl shadow-sm border border-slate-200">
        <div className="flex gap-4 flex-1">
          <div className="relative flex-1 max-w-xs">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search by name or email..." 
              value={q} 
              onChange={e => setQ(e.target.value)} 
              onKeyDown={e => e.key === "Enter" && applyFilters()}
              className="w-full pl-9 border-slate-300 rounded-md py-1.5 focus:ring-orange-500 text-sm" 
            />
          </div>
          <select value={role} onChange={e => setRole(e.target.value)} className="border-slate-300 rounded-md py-1.5 px-3 text-sm focus:ring-orange-500 bg-white">
            <option value="">All Roles</option>
            <option value="user">Users</option>
            <option value="editor">Editors</option>
            <option value="admin">Admins</option>
            <option value="superadmin">Super Admins</option>
          </select>
          <select value={status} onChange={e => setStatus(e.target.value)} className="border-slate-300 rounded-md py-1.5 px-3 text-sm focus:ring-orange-500 bg-white">
            <option value="">All Active/Blocked</option>
            <option value="ACTIVE">Active Only</option>
            <option value="DISABLED">Disabled Only</option>
            <option value="BLOCKED">Blocked Only</option>
            <option value="DELETED">Deleted Only</option>
          </select>
          <button onClick={applyFilters} disabled={isPending} className="px-4 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-medium rounded-md">
            Apply Filters
          </button>
        </div>
        
        {selectedIds.size > 0 && adminRole === "superadmin" && (
          <div className="flex gap-2 items-center bg-orange-50 px-3 py-1.5 rounded-md border border-orange-200">
            <span className="text-xs font-medium text-orange-800 mr-2">{selectedIds.size} selected</span>
            <button onClick={() => handleBulkAction("ACTIVE")} className="text-xs text-green-700 hover:underline">Activate</button>
            <button onClick={() => handleBulkAction("DISABLED")} className="text-xs text-slate-700 hover:underline">Disable</button>
            <button onClick={() => handleBulkAction("BLOCKED")} className="text-xs text-red-700 hover:underline">Block</button>
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-4 py-3 text-left w-10">
                <input type="checkbox" checked={selectedIds.size === users.length && users.length > 0} onChange={handleSelectAll} className="rounded text-orange-600 focus:ring-orange-500" />
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">User</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Role</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Status</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Plan</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Joined</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {users.map((u) => (
              <tr key={u.id} className="bg-white hover:bg-slate-50">
                <td className="px-4 py-4">
                  <input type="checkbox" checked={selectedIds.has(u.id)} onChange={() => toggleSelect(u.id)} className="rounded text-orange-600 focus:ring-orange-500" />
                </td>
                <td className="px-4 py-4">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-slate-200 flex-shrink-0 overflow-hidden">
                      {u.image ? <Image src={u.image} alt={u.name || "User"} width={32} height={32} /> : <div className="w-full h-full flex items-center justify-center text-slate-500 text-xs font-bold">{(u.name || u.email).charAt(0).toUpperCase()}</div>}
                    </div>
                    <div>
                      <div className="text-sm font-medium text-slate-900">{u.name || "No Name"}</div>
                      <div className="text-xs text-slate-500">{u.email}</div>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-4">
                  <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium capitalize ${u.role === 'superadmin' ? 'bg-purple-100 text-purple-800' : u.role === 'admin' ? 'bg-blue-100 text-blue-800' : 'bg-slate-100 text-slate-800'}`}>
                    {u.role}
                  </span>
                </td>
                <td className="px-4 py-4">
                  <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${u.status === 'ACTIVE' ? 'bg-green-100 text-green-800' : u.status === 'BLOCKED' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'}`}>
                    {u.status || "ACTIVE"}
                  </span>
                </td>
                <td className="px-4 py-4 text-sm text-slate-600 capitalize">
                  {u.subscription?.plan || "Free"}
                </td>
                <td className="px-4 py-4 text-sm text-slate-500">
                  {new Date(u.createdAt).toLocaleDateString()}
                </td>
                <td className="px-4 py-4 text-right">
                  <Link href={`/admin/users/${u.id}`} className="inline-flex items-center gap-1 text-sm font-medium text-orange-600 hover:text-orange-700 bg-orange-50 hover:bg-orange-100 px-3 py-1.5 rounded-md transition-colors">
                    Manage <ExternalLink className="w-4 h-4 ml-1" />
                  </Link>
                </td>
              </tr>
            ))}
            {users.length === 0 && (
              <tr><td colSpan={7} className="px-6 py-8 text-center text-slate-500">No users found matching your filters.</td></tr>
            )}
          </tbody>
        </table>
        
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-3 border-t border-slate-200 bg-slate-50">
            <div className="text-sm text-slate-500">Showing page {page} of {totalPages} ({total} total users)</div>
            <div className="flex gap-2">
              <button disabled={page === 1} onClick={() => changePage(page - 1)} className="px-3 py-1 rounded border border-slate-300 bg-white text-sm disabled:opacity-50">Prev</button>
              <button disabled={page === totalPages} onClick={() => changePage(page + 1)} className="px-3 py-1 rounded border border-slate-300 bg-white text-sm disabled:opacity-50">Next</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
