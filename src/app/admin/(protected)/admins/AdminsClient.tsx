"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { getAdministratorsAction, assignAdminRolesAction, updateAdminStatusAction } from "./admins-actions";
import {
  Users,
  ShieldCheck,
  Search,
  RefreshCw,
  Edit,
  UserCheck,
  UserX,
  X,
  Check,
  Key,
  Shield,
  Clock,
  Sparkles,
  Lock,
} from "lucide-react";

interface Props {
  initialData: Awaited<ReturnType<typeof getAdministratorsAction>>;
}

export function AdminsClient({ initialData }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [data, setData] = useState(initialData);

  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");

  // Modal State
  const [editingAdmin, setEditingAdmin] = useState<any>(null);
  const [selectedPrimaryRole, setSelectedPrimaryRole] = useState("");
  const [selectedCustomRoles, setSelectedCustomRoles] = useState<string[]>([]);

  const [statusAdmin, setStatusAdmin] = useState<any>(null);
  const [selectedStatus, setSelectedStatus] = useState<"ACTIVE" | "DISABLED" | "BLOCKED">("ACTIVE");

  // Filter refetch
  const handleFilterChange = (newSearch?: string, newRole?: string, newStatus?: string) => {
    startTransition(async () => {
      const res = await getAdministratorsAction({
        search: newSearch ?? search,
        roleFilter: newRole ?? roleFilter,
        statusFilter: newStatus ?? statusFilter,
      });
      setData(res);
    });
  };

  // Open Assign Roles modal
  const handleOpenAssignModal = (admin: any) => {
    setEditingAdmin(admin);
    setSelectedPrimaryRole(admin.primaryRole);
    setSelectedCustomRoles(admin.customRoles || []);
  };

  // Submit Roles Assignment
  const handleSaveRoles = () => {
    if (!editingAdmin) return;

    startTransition(async () => {
      const res = await assignAdminRolesAction(editingAdmin.id, selectedPrimaryRole, selectedCustomRoles);
      if (res.success) {
        setEditingAdmin(null);
        handleFilterChange();
      } else {
        alert(res.error || "Failed to update admin roles");
      }
    });
  };

  // Submit Status Change
  const handleSaveStatus = () => {
    if (!statusAdmin) return;

    startTransition(async () => {
      const res = await updateAdminStatusAction(statusAdmin.id, selectedStatus);
      if (res.success) {
        setStatusAdmin(null);
        handleFilterChange();
      } else {
        alert(res.error || "Failed to update status");
      }
    });
  };

  // Toggle Custom Role selection
  const handleToggleCustomRole = (slug: string) => {
    if (selectedCustomRoles.includes(slug)) {
      setSelectedCustomRoles(selectedCustomRoles.filter((s) => s !== slug));
    } else {
      setSelectedCustomRoles([...selectedCustomRoles, slug]);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <Users className="w-7 h-7 text-orange-600" />
            Administrator Management
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Provision administrators, assign primary system & custom RBAC roles, and manage active session states.
          </p>
        </div>

        <button
          onClick={() => handleFilterChange()}
          disabled={isPending}
          className="inline-flex items-center gap-2 px-3.5 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 shadow-sm transition-colors disabled:opacity-50 self-start sm:self-auto"
        >
          <RefreshCw className={`w-4 h-4 ${isPending ? "animate-spin text-orange-600" : ""}`} />
          Refresh
        </button>
      </div>

      {/* Filter Toolbar */}
      <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-sm space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Search */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search admin name or email..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                handleFilterChange(e.target.value);
              }}
              className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-slate-900 placeholder:text-slate-400"
            />
          </div>

          {/* Role Filter */}
          <div>
            <select
              value={roleFilter}
              onChange={(e) => {
                setRoleFilter(e.target.value);
                handleFilterChange(undefined, e.target.value);
              }}
              className="w-full py-2 px-3 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-slate-700"
            >
              <option value="ALL">All Roles</option>
              <optgroup label="System Roles">
                {data.systemRoles.map((s) => (
                  <option key={s.slug} value={s.slug}>
                    {s.name}
                  </option>
                ))}
              </optgroup>
              {data.customRoles.length > 0 && (
                <optgroup label="Custom Roles">
                  {data.customRoles.map((c) => (
                    <option key={c.slug} value={c.slug}>
                      {c.name}
                    </option>
                  ))}
                </optgroup>
              )}
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                handleFilterChange(undefined, undefined, e.target.value);
              }}
              className="w-full py-2 px-3 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-slate-700"
            >
              <option value="ALL">All Account Statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="DISABLED">Disabled</option>
              <option value="BLOCKED">Blocked</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
              <tr>
                <th className="p-4">Administrator</th>
                <th className="p-4">Primary Role</th>
                <th className="p-4">Additional Roles</th>
                <th className="p-4 text-center">Effective Perms</th>
                <th className="p-4">Status</th>
                <th className="p-4">Last Active</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.items.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <Users className="w-8 h-8 text-slate-300" />
                      <div className="font-medium text-slate-700">No Administrators Found</div>
                      <p className="text-xs text-slate-400 max-w-sm">
                        No admin accounts match your current search and filter criteria.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                data.items.map((admin) => (
                  <tr key={admin.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="p-4 whitespace-nowrap">
                      <div className="font-semibold text-slate-900">{admin.name || "Administrator"}</div>
                      <div className="font-mono text-xs text-slate-500">{admin.email}</div>
                    </td>
                    <td className="p-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                          admin.primaryRole === "super_admin"
                            ? "bg-rose-50 text-rose-700 border-rose-200"
                            : admin.primaryRole === "admin"
                            ? "bg-orange-50 text-orange-700 border-orange-200"
                            : admin.primaryRole === "content_manager"
                            ? "bg-amber-50 text-amber-800 border-amber-200"
                            : admin.primaryRole === "support"
                            ? "bg-blue-50 text-blue-700 border-blue-200"
                            : admin.primaryRole === "finance"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : "bg-slate-100 text-slate-700 border-slate-200"
                        }`}
                      >
                        <ShieldCheck className="w-3 h-3" />
                        {admin.primaryRole}
                      </span>
                    </td>
                    <td className="p-4">
                      {admin.customRoles.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {admin.customRoles.map((cr: string) => (
                            <span
                              key={cr}
                              className="font-mono text-[11px] font-medium text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200"
                            >
                              +{cr}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400">-</span>
                      )}
                    </td>
                    <td className="p-4 whitespace-nowrap text-center">
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-orange-700 bg-orange-50 px-2.5 py-0.5 rounded-full border border-orange-200">
                        <Key className="w-3 h-3 text-orange-500" />
                        {admin.isSuperAdmin ? "All (*)" : `${admin.effectivePermissionCount} Perms`}
                      </span>
                    </td>
                    <td className="p-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${
                          admin.status === "ACTIVE"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : admin.status === "DISABLED"
                            ? "bg-amber-50 text-amber-800 border-amber-200"
                            : "bg-rose-50 text-rose-700 border-rose-200"
                        }`}
                      >
                        {admin.status}
                      </span>
                    </td>
                    <td className="p-4 whitespace-nowrap text-xs text-slate-500">
                      {admin.lastActiveAt
                        ? new Date(admin.lastActiveAt).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : "Never"}
                    </td>
                    <td className="p-4 whitespace-nowrap text-right text-xs">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleOpenAssignModal(admin)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-orange-50 hover:text-orange-600 rounded-md transition-colors"
                        >
                          <Edit className="w-3.5 h-3.5" />
                          Assign Roles
                        </button>
                        <button
                          onClick={() => {
                            setStatusAdmin(admin);
                            setSelectedStatus(admin.status as any);
                          }}
                          className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-md transition-colors"
                          title="Change Account Status"
                        >
                          <UserX className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Role Assignment Modal */}
      {editingAdmin && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-5 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div>
                <h3 className="text-base font-bold text-slate-900">Assign Roles</h3>
                <p className="text-xs text-slate-500">{editingAdmin.name || editingAdmin.email}</p>
              </div>
              <button onClick={() => setEditingAdmin(null)} className="p-1.5 text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Primary System Role Selector */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Primary Role *
              </label>
              <select
                value={selectedPrimaryRole}
                onChange={(e) => setSelectedPrimaryRole(e.target.value)}
                className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                {data.systemRoles.map((s) => (
                  <option key={s.slug} value={s.slug}>
                    {s.name} ({s.slug})
                  </option>
                ))}
              </select>
            </div>

            {/* Additional Custom Roles Checkboxes */}
            {data.customRoles.length > 0 && (
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Additional Roles (Optional)
                </label>
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2 max-h-48 overflow-y-auto">
                  {data.customRoles.map((cr) => {
                    const isChecked = selectedCustomRoles.includes(cr.slug);
                    return (
                      <label
                        key={cr.slug}
                        className="flex items-center justify-between text-xs p-2 bg-white rounded-lg border border-slate-200 cursor-pointer select-none"
                      >
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => handleToggleCustomRole(cr.slug)}
                            className="rounded border-slate-300 text-orange-600 focus:ring-orange-500"
                          />
                          <span className="font-semibold text-slate-900">{cr.name}</span>
                        </div>
                        <span className="font-mono text-[11px] text-slate-400">{cr.slug}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
              <button
                onClick={() => setEditingAdmin(null)}
                className="px-4 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveRoles}
                disabled={isPending}
                className="px-4 py-2 text-xs font-semibold text-white bg-orange-600 hover:bg-orange-700 rounded-lg transition-colors disabled:opacity-50"
              >
                Save Assigned Roles
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Account Status Modal */}
      {statusAdmin && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl">
            <h3 className="text-base font-bold text-slate-900">Manage Administrator Status</h3>
            <p className="text-xs text-slate-500">{statusAdmin.email}</p>

            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value as any)}
              className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-800"
            >
              <option value="ACTIVE">ACTIVE (Full access)</option>
              <option value="DISABLED">DISABLED (Access suspended)</option>
              <option value="BLOCKED">BLOCKED (Access revoked)</option>
            </select>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setStatusAdmin(null)}
                className="px-4 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveStatus}
                disabled={isPending}
                className="px-4 py-2 text-xs font-semibold text-white bg-orange-600 hover:bg-orange-700 rounded-lg transition-colors"
              >
                Confirm Status Change
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
