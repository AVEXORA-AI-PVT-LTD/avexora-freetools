"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createRoleAction, updateRoleAction } from "./roles-actions";
import { PERMISSION_REGISTRY, PermissionCategory } from "@/lib/admin/permissions";
import { ArrowLeft, Save, ShieldCheck, CheckSquare, Square, Check, RefreshCw } from "lucide-react";

interface RoleFormClientProps {
  initialRole?: {
    id?: string;
    name: string;
    slug?: string;
    description?: string;
    permissions: string[];
    isSystemRole?: boolean;
  };
}

export function RoleFormClient({ initialRole }: RoleFormClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const isEditing = !!initialRole?.id;

  const [name, setName] = useState(initialRole?.name || "");
  const [slug, setSlug] = useState(initialRole?.slug || "");
  const [description, setDescription] = useState(initialRole?.description || "");
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>(initialRole?.permissions || []);

  // Group permissions by category
  const categories = Array.from(new Set(PERMISSION_REGISTRY.map((p) => p.category)));

  // Toggle single permission
  const handleTogglePermission = (key: string) => {
    if (selectedPermissions.includes(key)) {
      setSelectedPermissions(selectedPermissions.filter((p) => p !== key));
    } else {
      setSelectedPermissions([...selectedPermissions, key]);
    }
  };

  // Toggle category permissions
  const handleToggleCategory = (category: PermissionCategory, enable: boolean) => {
    const categoryKeys = PERMISSION_REGISTRY.filter((p) => p.category === category).map((p) => p.key);

    if (enable) {
      setSelectedPermissions((prev) => Array.from(new Set([...prev, ...categoryKeys])));
    } else {
      setSelectedPermissions((prev) => prev.filter((p) => !categoryKeys.includes(p)));
    }
  };

  // Global Select All / Clear All
  const handleSelectAllGlobal = () => {
    setSelectedPermissions(PERMISSION_REGISTRY.map((p) => p.key));
  };

  const handleClearAllGlobal = () => {
    setSelectedPermissions([]);
  };

  // Submit Handler
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      alert("Role name is required");
      return;
    }

    startTransition(async () => {
      let res;
      if (isEditing && (initialRole?.id || initialRole?.slug)) {
        const targetIdOrSlug = initialRole.id || initialRole.slug!;
        res = await updateRoleAction(targetIdOrSlug, {
          name,
          description,
          permissions: selectedPermissions,
        });
      } else {
        res = await createRoleAction({
          name,
          slug,
          description,
          permissions: selectedPermissions,
        });
      }

      if (res.success) {
        router.push("/admin/roles");
      } else {
        alert(res.error || "Failed to save role");
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Top Navigation */}
      <div>
        <Link
          href="/admin/roles"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Role Management
        </Link>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <ShieldCheck className="w-7 h-7 text-orange-600" />
            {isEditing ? `Edit Custom Role: ${initialRole.name}` : "Create Custom Role"}
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Define role credentials, descriptive metadata, and assign category-grouped permission keys.
          </p>
        </div>

        <div className="flex items-center gap-3 self-start sm:self-auto">
          <Link
            href="/admin/roles"
            className="px-4 py-2 text-sm font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50"
          >
            Cancel
          </Link>

          <button
            type="submit"
            disabled={isPending || !name.trim()}
            className="inline-flex items-center gap-2 px-5 py-2 text-sm font-semibold text-white bg-orange-600 hover:bg-orange-700 rounded-xl shadow-sm transition-colors disabled:opacity-50"
          >
            {isPending ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save Role
          </button>
        </div>
      </div>

      {/* Basic Role Metadata Form */}
      <div className="p-6 bg-white border border-slate-200 rounded-2xl shadow-sm space-y-4">
        <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Role Details</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Role Name *</label>
            <input
              type="text"
              required
              placeholder="e.g., SEO Specialist, Support Lead"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full p-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white text-slate-900 font-medium"
            />
          </div>

          {!isEditing && (
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Internal Role Slug (Optional)</label>
              <input
                type="text"
                placeholder="Auto-generated if left blank (e.g. seo_specialist)"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                className="w-full p-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white text-slate-900 font-mono"
              />
            </div>
          )}
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">Role Description</label>
          <textarea
            rows={2}
            placeholder="Describe the primary responsibilities and target users for this role..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full p-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white text-slate-900"
          />
        </div>
      </div>

      {/* Permissions Selection Header */}
      <div className="flex items-center justify-between p-4 bg-slate-50 border border-slate-200 rounded-2xl">
        <div className="text-sm font-bold text-slate-800">
          Permissions ({selectedPermissions.length} of {PERMISSION_REGISTRY.length} selected)
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleSelectAllGlobal}
            className="text-xs font-medium text-orange-600 hover:text-orange-700 hover:underline"
          >
            Select All Permissions
          </button>
          <span className="text-slate-300">•</span>
          <button
            type="button"
            onClick={handleClearAllGlobal}
            className="text-xs font-medium text-slate-500 hover:text-slate-700 hover:underline"
          >
            Clear All
          </button>
        </div>
      </div>

      {/* Category-Grouped Permissions Grid */}
      <div className="space-y-4">
        {categories.map((cat) => {
          const categoryPerms = PERMISSION_REGISTRY.filter((p) => p.category === cat);
          const categoryKeys = categoryPerms.map((p) => p.key);
          const selectedCount = categoryKeys.filter((k) => selectedPermissions.includes(k)).length;
          const isAllSelected = selectedCount === categoryKeys.length;

          return (
            <div key={cat} className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
              <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-slate-800">{cat}</h3>
                  <span className="text-xs font-semibold text-slate-500 bg-slate-200/80 px-2 py-0.5 rounded-full">
                    {selectedCount} / {categoryKeys.length}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => handleToggleCategory(cat, !isAllSelected)}
                  className="text-xs font-semibold text-orange-600 hover:text-orange-700"
                >
                  {isAllSelected ? "Deselect Category" : "Select Category"}
                </button>
              </div>

              <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {categoryPerms.map((perm) => {
                  const isChecked = selectedPermissions.includes(perm.key);
                  return (
                    <div
                      key={perm.key}
                      onClick={() => handleTogglePermission(perm.key)}
                      className={`p-3 rounded-xl border cursor-pointer transition-all flex items-start gap-3 select-none ${
                        isChecked
                          ? "bg-orange-50/50 border-orange-300 shadow-sm"
                          : "bg-white border-slate-200 hover:border-slate-300"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {}}
                        className="mt-0.5 rounded border-slate-300 text-orange-600 focus:ring-orange-500"
                      />
                      <div className="space-y-0.5">
                        <div className="text-xs font-semibold text-slate-900">{perm.name}</div>
                        <div className="font-mono text-[11px] text-slate-400">{perm.key}</div>
                        <p className="text-[11px] text-slate-500 leading-tight pt-0.5">{perm.description}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </form>
  );
}
