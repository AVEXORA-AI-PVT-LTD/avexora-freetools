"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getRolesAction, deleteRoleAction, duplicateRoleAction } from "./roles-actions";
import {
  ShieldCheck,
  Shield,
  Plus,
  Users,
  Key,
  Copy,
  Trash2,
  Edit,
  Eye,
  Lock,
  Check,
  X,
  ExternalLink,
} from "lucide-react";

interface Props {
  initialData: Awaited<ReturnType<typeof getRolesAction>>;
}

export function RolesClient({ initialData }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [data, setData] = useState(initialData);

  const [activeTab, setActiveTab] = useState<"system" | "custom">("system");
  const [selectedRoleForView, setSelectedRoleForView] = useState<any>(null);

  // Refresh helper
  const refreshRoles = () => {
    startTransition(async () => {
      const res = await getRolesAction();
      setData(res);
    });
  };

  // Duplicate Role
  const handleDuplicate = (idOrSlug: string) => {
    startTransition(async () => {
      const res = await duplicateRoleAction(idOrSlug);
      if (res.success) {
        refreshRoles();
        if (res.roleId) router.push(`/admin/roles/${res.roleId}`);
      } else {
        alert(res.error || "Failed to duplicate role");
      }
    });
  };

  // Delete Role
  const handleDelete = (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete custom role "${name}"? This action cannot be undone.`)) {
      return;
    }

    startTransition(async () => {
      const res = await deleteRoleAction(id);
      if (res.success) {
        refreshRoles();
      } else {
        alert(res.error || "Failed to delete role");
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <ShieldCheck className="w-7 h-7 text-orange-600" />
            Admin Roles & Permissions
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage system roles, create custom RBAC roles, and define fine-grained permission assignments.
          </p>
        </div>

        <Link
          href="/admin/roles/new"
          className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-orange-600 hover:bg-orange-700 rounded-xl shadow-sm transition-colors self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          Create Custom Role
        </Link>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-sm">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">System Roles</div>
          <div className="text-2xl font-extrabold text-slate-900 mt-1">{data.systemRoles.length}</div>
          <p className="text-xs text-slate-400 mt-0.5">Predefined immutable RBAC roles</p>
        </div>

        <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-sm">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">Custom Roles</div>
          <div className="text-2xl font-extrabold text-orange-600 mt-1">{data.customRoles.length}</div>
          <p className="text-xs text-slate-400 mt-0.5">Administrator defined roles</p>
        </div>

        <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-sm">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">Total Permission Keys</div>
          <div className="text-2xl font-extrabold text-slate-900 mt-1">{data.totalPermissionsCount}</div>
          <p className="text-xs text-slate-400 mt-0.5">Category-grouped permissions</p>
        </div>
      </div>

      {/* Tab Switcher */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => setActiveTab("system")}
          className={`py-3 px-5 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === "system"
              ? "border-orange-600 text-orange-600"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <Lock className="w-4 h-4" />
          Predefined System Roles ({data.systemRoles.length})
        </button>

        <button
          onClick={() => setActiveTab("custom")}
          className={`py-3 px-5 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === "custom"
              ? "border-orange-600 text-orange-600"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          Custom Roles ({data.customRoles.length})
        </button>
      </div>

      {/* System Roles View */}
      {activeTab === "system" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {data.systemRoles.map((role) => (
            <div
              key={role.slug}
              className="p-5 bg-white border border-slate-200 rounded-2xl shadow-sm flex flex-col justify-between space-y-4 hover:border-slate-300 transition-colors"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                    {role.slug}
                  </span>
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                    <Lock className="w-3 h-3" /> System Role
                  </span>
                </div>

                <h3 className="text-base font-bold text-slate-900">{role.name}</h3>
                <p className="text-xs text-slate-500 leading-relaxed">{role.description}</p>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs">
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1 font-semibold text-slate-700">
                    <Users className="w-3.5 h-3.5 text-slate-400" />
                    {role.userCount} Admin{role.userCount === 1 ? "" : "s"}
                  </span>
                  <span className="flex items-center gap-1 font-semibold text-orange-600">
                    <Key className="w-3.5 h-3.5 text-orange-500" />
                    {role.permissions.includes("*") ? "All (*)" : `${role.permissionCount} Perms`}
                  </span>
                </div>

                <div className="flex items-center gap-1">
                  {role.slug !== "super_admin" && (
                    <Link
                      href={`/admin/roles/${role.id || role.slug}`}
                      className="p-1.5 text-slate-500 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors flex items-center gap-1 text-[11px] font-semibold"
                      title="Change Permissions"
                    >
                      <Edit className="w-3.5 h-3.5" />
                      Edit Perms
                    </Link>
                  )}
                  <button
                    onClick={() => handleDuplicate(role.slug)}
                    disabled={isPending}
                    className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                    title="Duplicate into Custom Role"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setSelectedRoleForView(role)}
                    className="p-1.5 text-slate-400 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                    title="Inspect Permissions"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Custom Roles View */}
      {activeTab === "custom" && (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                <tr>
                  <th className="p-4">Role Name & Slug</th>
                  <th className="p-4">Description</th>
                  <th className="p-4 text-center">Assigned Users</th>
                  <th className="p-4 text-center">Permissions</th>
                  <th className="p-4">Updated At</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.customRoles.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-500">
                      <div className="flex flex-col items-center justify-center space-y-2">
                        <ShieldCheck className="w-8 h-8 text-slate-300" />
                        <div className="font-medium text-slate-700">No Custom Roles Found</div>
                        <p className="text-xs text-slate-400 max-w-sm">
                          Create custom roles with specific permission sets to grant granular access to your team.
                        </p>
                        <Link
                          href="/admin/roles/new"
                          className="mt-2 inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-orange-600 hover:bg-orange-700 rounded-lg"
                        >
                          <Plus className="w-3.5 h-3.5" /> Create Custom Role
                        </Link>
                      </div>
                    </td>
                  </tr>
                ) : (
                  data.customRoles.map((role) => (
                    <tr key={role.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="p-4 whitespace-nowrap">
                        <div className="font-semibold text-slate-900">{role.name}</div>
                        <div className="font-mono text-xs text-slate-400">{role.slug}</div>
                      </td>
                      <td className="p-4 max-w-xs text-xs text-slate-600 truncate" title={role.description}>
                        {role.description || "-"}
                      </td>
                      <td className="p-4 whitespace-nowrap text-center">
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-slate-700 bg-slate-100 px-2.5 py-0.5 rounded-full">
                          <Users className="w-3 h-3 text-slate-400" /> {role.userCount}
                        </span>
                      </td>
                      <td className="p-4 whitespace-nowrap text-center">
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-orange-700 bg-orange-50 px-2.5 py-0.5 rounded-full border border-orange-200">
                          <Key className="w-3 h-3 text-orange-500" /> {role.permissionCount} Perms
                        </span>
                      </td>
                      <td className="p-4 whitespace-nowrap text-xs text-slate-500">
                        {new Date(role.updatedAt).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </td>
                      <td className="p-4 whitespace-nowrap text-right text-xs">
                        <div className="flex items-center justify-end gap-1">
                          <Link
                            href={`/admin/roles/${role.id}`}
                            className="p-1.5 text-slate-600 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                            title="Edit Role"
                          >
                            <Edit className="w-4 h-4" />
                          </Link>
                          <button
                            onClick={() => handleDuplicate(role.id)}
                            disabled={isPending}
                            className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                            title="Duplicate Role"
                          >
                            <Copy className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(role.id, role.name)}
                            disabled={isPending}
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete Role"
                          >
                            <Trash2 className="w-4 h-4" />
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
      )}

      {/* Permissions Inspection Modal */}
      {selectedRoleForView && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 space-y-4 shadow-xl max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-orange-600" />
                  {selectedRoleForView.name}
                </h3>
                <span className="font-mono text-xs text-slate-400">{selectedRoleForView.slug}</span>
              </div>
              <button
                onClick={() => setSelectedRoleForView(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="overflow-y-auto flex-1 space-y-3 pr-2">
              <p className="text-xs text-slate-500">{selectedRoleForView.description}</p>

              <div className="space-y-2">
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
                  Granted Permission Keys ({selectedRoleForView.permissions.length})
                </span>

                {selectedRoleForView.permissions.includes("*") ? (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-semibold text-emerald-800">
                    Full Unrestricted Wildcard Access (*)
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {selectedRoleForView.permissions.map((pKey: string) => (
                      <div
                        key={pKey}
                        className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono text-slate-700 flex items-center gap-2"
                      >
                        <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        {pKey}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="pt-3 border-t border-slate-200 flex justify-between items-center">
              {selectedRoleForView.slug !== "super_admin" ? (
                <Link
                  href={`/admin/roles/${selectedRoleForView.id || selectedRoleForView.slug}`}
                  className="px-4 py-2 text-xs font-semibold bg-orange-600 text-white rounded-lg hover:bg-orange-700 inline-flex items-center gap-1.5"
                >
                  <Edit className="w-3.5 h-3.5" /> Change Permissions
                </Link>
              ) : <div />}

              <button
                onClick={() => setSelectedRoleForView(null)}
                className="px-4 py-2 text-xs font-semibold bg-slate-900 text-white rounded-lg hover:bg-slate-800"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
