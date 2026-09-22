"use client";

import { useTransition, useState } from "react";
import { updateUserRole } from "./actions";
import { useDialog } from "@/components/admin/DialogProvider";
import { ALLOWED_ROLES } from "@/lib/admin/users";
import type { Role } from "@/lib/admin/permissions";

export function RoleSelect({
  userId,
  currentRole,
  isSuperAdmin,
  isSelf,
}: {
  userId: string;
  currentRole: string;
  isSuperAdmin: boolean;
  isSelf: boolean;
}) {
  const [isPending, startTransition] = useTransition();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const { showConfirm } = useDialog();

  const disabled = !isSuperAdmin || isSelf || isPending;

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newRole = e.target.value;
    if (newRole === currentRole) return;

    // Explicit confirmation for sensitive changes
    if (newRole === "superadmin" || currentRole === "superadmin") {
      const confirmMsg = newRole === "superadmin" 
        ? "Warning: This grants FULL administrative authority (Super Admin). Are you sure?"
        : "Warning: You are about to demote a Super Admin. Are you sure?";
      
      showConfirm("Confirm Role Change", confirmMsg, () => {
        proceedWithChange(newRole);
      }, () => {
        const selectEl = document.getElementById(`role-${userId}`) as HTMLSelectElement;
        if (selectEl) selectEl.value = currentRole;
      });
      return;
    }

    proceedWithChange(newRole);
  };

  const proceedWithChange = (newRole: string) => {
    setErrorMsg(null);
    startTransition(async () => {
      const formData = new FormData();
      formData.append("userId", userId);
      formData.append("role", newRole);

      const result = await updateUserRole(formData);
      if (result?.error) {
        setErrorMsg(result.error);
        const selectEl = document.getElementById(`role-${userId}`) as HTMLSelectElement;
        if (selectEl) selectEl.value = currentRole;
      }
    });
  };

  return (
    <div className="relative flex flex-col">
      <select
        id={`role-${userId}`}
        defaultValue={currentRole || "user"}
        onChange={handleChange}
        disabled={disabled}
        className={`rounded-md border border-slate-300 py-1.5 pl-3 pr-8 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500 ${
          disabled ? "bg-slate-50 opacity-70 cursor-not-allowed" : "bg-white"
        }`}
      >
        {!ALLOWED_ROLES.includes(currentRole as Role) && (
           <option value={currentRole}>{currentRole || "user"}</option>
        )}
        {ALLOWED_ROLES.map((role) => (
          <option key={role} value={role}>
            {role === "superadmin" ? "Super Admin" : role.charAt(0).toUpperCase() + role.slice(1)}
          </option>
        ))}
      </select>
      
      {isPending && (
        <div className="absolute right-[-24px] top-2">
          <svg className="animate-spin h-4 w-4 text-orange-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        </div>
      )}
      
      {errorMsg && (
        <p className="absolute top-full left-0 mt-1 text-xs font-medium text-red-600 whitespace-nowrap z-10 bg-white p-1 rounded shadow-sm border border-red-200">
          {errorMsg}
        </p>
      )}
    </div>
  );
}
