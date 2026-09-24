"use client";
import { useState, useTransition } from "react";
import { useDialog } from "@/components/admin/DialogProvider";
import { updateUserStatus, updateUserRole, deleteUser, revokeUserSessions, changeUserPlan } from "../user-actions";
import { ShieldAlert, Trash2, Shield, Activity, CreditCard, Power, Lock, Key } from "lucide-react";
import Image from "next/image";
import type { Prisma } from "@prisma/client";

type UserDetail = Prisma.UserGetPayload<{
  include: {
    subscription: true;
    accounts: true;
    sessions: true;
    auditLogs: true;
    _count: { select: { toolUsages: true } };
  };
}>;

interface TopTool {
  slug: string;
  count: number;
}

interface UserDetailClientProps {
  user: UserDetail;
  topTools: TopTool[];
  adminRole: string;
  adminId: string;
}

const errorMessage = (e: unknown) => (e instanceof Error ? e.message : String(e));

export function UserDetailClient({ user, topTools, adminRole, adminId }: UserDetailClientProps) {
  const [activeTab, setActiveTab] = useState("profile");
  const { showConfirm, showAlert } = useDialog();
  const [isPending, startTransition] = useTransition();
  const [status, setStatus] = useState(user.status || "ACTIVE");
  const [role, setRole] = useState(user.role || "user");

  const isSelf = adminId === user.id;
  const canManageRole = adminRole === "superadmin" || (adminRole === "admin" && user.role === "user");

  const handleStatusChange = (newStatus: "ACTIVE" | "DISABLED" | "BLOCKED") => {
    if (isSelf) return showAlert("Error", "You cannot change your own status.");
    
    showConfirm("Change Status", `Are you sure you want to change this user's status to ${newStatus}?`, async () => {
      try {
        await updateUserStatus(user.id, newStatus, `Status changed by admin`);
        setStatus(newStatus);
        showAlert("Success", "User status updated.");
      } catch (e) {
        showAlert("Error", errorMessage(e));
      }
    });
  };


  const handlePlanChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newPlan = e.target.value;
    showConfirm("Change Plan", `Are you sure you want to change this user's plan to ${newPlan.toUpperCase()}? This bypasses standard billing.`, async () => {
      try {
        await changeUserPlan(user.id, newPlan);
        showAlert("Success", "Plan changed successfully.");
      } catch (err) {
        showAlert("Error", errorMessage(err));
      }
    });
  };

  const handleRoleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newRole = e.target.value;
    if (isSelf) return showAlert("Error", "You cannot change your own role.");
    
    showConfirm("Change Role", `Are you sure you want to promote/demote this user to ${newRole}?`, async () => {
      try {
        await updateUserRole(user.id, newRole);
        setRole(newRole);
        showAlert("Success", "User role updated.");
      } catch (err) {
        showAlert("Error", errorMessage(err));
        e.target.value = role; // Reset
      }
    });
  };

  const handleDelete = () => {
    if (isSelf) return showAlert("Error", "You cannot delete your own account.");
    
    showConfirm("Delete User", "Are you sure? This will soft-delete the user account.", async () => {
      try {
        await deleteUser(user.id);
        setStatus("DELETED");
        showAlert("Success", "User deleted.");
      } catch (e) {
        showAlert("Error", errorMessage(e));
      }
    });
  };

  const handleRevokeSessions = () => {
    showConfirm("Revoke Sessions", "Are you sure you want to sign this user out of all active sessions?", async () => {
      try {
        await revokeUserSessions(user.id);
        showAlert("Success", "All sessions revoked.");
      } catch (e) {
        showAlert("Error", errorMessage(e));
      }
    });
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col md:flex-row">
      {/* Sidebar Tabs */}
      <div className="w-full md:w-64 bg-slate-50 border-b md:border-b-0 md:border-r border-slate-200 p-4 space-y-1">
        <button onClick={() => setActiveTab("profile")} className={`w-full text-left px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${activeTab === 'profile' ? 'bg-orange-100 text-orange-900' : 'text-slate-600 hover:bg-slate-200'}`}>Overview & Profile</button>
        <button onClick={() => setActiveTab("usage")} className={`w-full text-left px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${activeTab === 'usage' ? 'bg-orange-100 text-orange-900' : 'text-slate-600 hover:bg-slate-200'}`}>Tool Usage</button>
        <button onClick={() => setActiveTab("subscription")} className={`w-full text-left px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${activeTab === 'subscription' ? 'bg-orange-100 text-orange-900' : 'text-slate-600 hover:bg-slate-200'}`}>Subscription & Billing</button>
        <button onClick={() => setActiveTab("activity")} className={`w-full text-left px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${activeTab === 'activity' ? 'bg-orange-100 text-orange-900' : 'text-slate-600 hover:bg-slate-200'}`}>Audit Activity</button>
        <button onClick={() => setActiveTab("security")} className={`w-full text-left px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${activeTab === 'security' ? 'bg-red-50 text-red-700' : 'text-slate-600 hover:bg-slate-200'}`}>Security & Controls</button>
      </div>

      {/* Content Area */}
      <div className="flex-1 p-6 lg:p-8 min-h-[500px]">
        
        {/* PROFILE TAB */}
        {activeTab === "profile" && (
          <div className="space-y-8">
            <div className="flex items-center gap-6">
              <div className="h-24 w-24 rounded-full bg-slate-200 flex-shrink-0 overflow-hidden border-4 border-white shadow-md">
                {user.image ? <Image src={user.image} alt="Avatar" width={96} height={96} /> : <div className="w-full h-full flex items-center justify-center text-slate-500 text-3xl font-bold">{(user.name || user.email).charAt(0).toUpperCase()}</div>}
              </div>
              <div>
                <h2 className="text-2xl font-bold text-slate-900">{user.name || "No Name Provided"}</h2>
                <p className="text-slate-500">{user.email}</p>
                <div className="mt-3 flex gap-2">
                  <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${status === 'ACTIVE' ? 'bg-green-100 text-green-800' : status === 'BLOCKED' ? 'bg-red-100 text-red-800' : 'bg-slate-200 text-slate-800'}`}>
                    {status}
                  </span>
                  <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold bg-blue-100 text-blue-800 capitalize">
                    {role}
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-slate-100">
              <div>
                <h4 className="text-sm font-medium text-slate-500 mb-1">User ID</h4>
                <p className="font-mono text-sm text-slate-900">{user.id}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-slate-500 mb-1">Joined Date</h4>
                <p className="text-sm text-slate-900">{new Date(user.createdAt).toLocaleString()}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-slate-500 mb-1">Job Role</h4>
                <p className="text-sm text-slate-900">{user.jobRole || "Not specified"}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-slate-500 mb-1">Company</h4>
                <p className="text-sm text-slate-900">{user.companyName || "Not specified"}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-slate-500 mb-1">2FA Enabled</h4>
                <p className="text-sm text-slate-900">{user.twoFactorEnabled ? "Yes" : "No"}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-slate-500 mb-1">Account Connections</h4>
                <div className="flex gap-2 mt-1">
                  {user.accounts.length > 0 ? user.accounts.map((acc) => (
                    <span key={acc.provider} className="inline-flex items-center rounded bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600 capitalize">
                      {acc.provider}
                    </span>
                  )) : <span className="text-sm text-slate-500">Email/Password</span>}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* USAGE TAB */}
        {activeTab === "usage" && (
          <div className="space-y-6">
            <h3 className="text-lg font-bold text-slate-900 border-b pb-2">Tool Usage Analytics</h3>
            <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 text-center">
              <div className="text-4xl font-black text-orange-600">{user._count.toolUsages}</div>
              <div className="text-sm font-medium text-slate-500 mt-1">Total Lifetime Tool Executions</div>
            </div>
            
            {topTools.length > 0 && (
              <div>
                <h4 className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-4">Most Used Tools</h4>
                <div className="space-y-3">
                  {topTools.map((t) => (
                    <div key={t.slug} className="flex items-center justify-between p-3 rounded-lg border border-slate-100 hover:bg-slate-50">
                      <span className="font-medium text-slate-800">{t.slug}</span>
                      <span className="bg-slate-200 text-slate-700 px-2.5 py-0.5 rounded-full text-xs font-bold">{t.count} uses</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* SUBSCRIPTION TAB */}
        {activeTab === "subscription" && (
          <div className="space-y-6">
            <h3 className="text-lg font-bold text-slate-900 border-b pb-2">Subscription & Billing</h3>

            {user.subscription ? (
              <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="text-xl font-bold text-slate-900 capitalize">
                      <select onChange={handlePlanChange} defaultValue={user.subscription.plan} className="border-slate-300 rounded-md py-1 px-2 text-lg font-bold text-slate-900">
                        <option value="free">Free Plan</option>
                        <option value="launch">Launch Plan</option>
                        <option value="growth">Growth Plan</option>
                        <option value="agency">Agency Plan</option>
                      </select>
                    </h4>

                    <p className="text-sm text-slate-500">Billed {user.subscription.cycle}</p>
                  </div>
                  <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${user.subscription.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                    {user.subscription.status}
                  </span>
                </div>
                
                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-100">
                  <div>
                    <span className="block text-xs font-medium text-slate-500">Subscription ID</span>
                    <span className="block text-sm font-mono text-slate-800 mt-1">{user.subscription.razorpaySubscriptionId || "N/A"}</span>
                  </div>
                  <div>
                    <span className="block text-xs font-medium text-slate-500">Customer ID</span>
                    <span className="block text-sm font-mono text-slate-800 mt-1">{user.subscription.razorpayCustomerId || "N/A"}</span>
                  </div>
                  {user.subscription.currentPeriodEnd && (
                    <div>
                      <span className="block text-xs font-medium text-slate-500">Current Period Ends</span>
                      <span className="block text-sm text-slate-800 mt-1">{new Date(user.subscription.currentPeriodEnd).toLocaleDateString()}</span>
                    </div>
                  )}
                  <div>
                    <span className="block text-xs font-medium text-slate-500">Cancel at Period End</span>
                    <span className="block text-sm text-slate-800 mt-1">{user.subscription.cancelAtPeriodEnd ? "Yes" : "No"}</span>
                  </div>
                </div>
              </div>
            ) : (

              <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-300">
                <CreditCard className="w-8 h-8 text-slate-400 mx-auto mb-3" />
                <h4 className="font-medium text-slate-900">
                  <select onChange={handlePlanChange} defaultValue="free" className="border-slate-300 rounded-md py-1 px-2 text-sm font-medium text-slate-900 bg-transparent">
                    <option value="free">Free Plan</option>
                    <option value="launch">Launch Plan</option>
                    <option value="growth">Growth Plan</option>
                    <option value="agency">Agency Plan</option>
                  </select>
                </h4>
                <p className="text-sm text-slate-500 mt-1">This user is currently on the default Free plan.</p>
              </div>

            )}
          </div>
        )}

        {/* ACTIVITY TAB */}
        {activeTab === "activity" && (
          <div className="space-y-6">
            <h3 className="text-lg font-bold text-slate-900 border-b pb-2">Recent Security & Admin Activity</h3>
            {user.auditLogs.length > 0 ? (
              <div className="space-y-4">
                {user.auditLogs.map((log) => (
                  <div key={log.id} className="flex gap-4 p-4 rounded-lg border border-slate-100 bg-slate-50/50">
                    <div className="mt-1"><Activity className="w-4 h-4 text-slate-400" /></div>
                    <div>
                      <p className="text-sm font-medium text-slate-900">{log.action}</p>
                      <p className="text-xs text-slate-500 mt-1">By {log.actorRole} ({log.actorId}) on {new Date(log.createdAt).toLocaleString()}</p>
                      {!!log.metadata && <pre className="mt-2 text-[10px] bg-slate-100 p-2 rounded text-slate-600 font-mono">{JSON.stringify(log.metadata, null, 2)}</pre>}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-slate-500 text-sm italic">No security activity logged yet.</p>
            )}
          </div>
        )}

        {/* SECURITY & CONTROLS TAB */}
        {activeTab === "security" && (
          <div className="space-y-8">
            <h3 className="text-lg font-bold text-red-600 border-b border-red-100 pb-2 flex items-center gap-2"><ShieldAlert className="w-5 h-5" /> Danger Zone & Controls</h3>
            
            {/* RBAC Role Control */}
            <div className="bg-slate-50 p-5 rounded-xl border border-slate-200">
              <h4 className="font-bold text-slate-900 mb-1 flex items-center gap-2"><Shield className="w-4 h-4 text-blue-600" /> Administrative Role</h4>
              <p className="text-sm text-slate-500 mb-4">Change the access level for this user across the platform.</p>
              <select 
                value={role} 
                onChange={handleRoleChange} 
                disabled={!canManageRole || isSelf}
                className="border-slate-300 rounded-md py-2 px-3 text-sm focus:ring-blue-500 disabled:opacity-50"
              >
                <option value="user">Standard User</option>
                <option value="editor">Editor (CMS Access)</option>
                <option value="admin">Admin (Tool & User Access)</option>
                {adminRole === "superadmin" && <option value="superadmin">Super Admin (Full System Access)</option>}
              </select>
            </div>

            {/* Session Control */}
            <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 flex justify-between items-center">
              <div>
                <h4 className="font-bold text-slate-900 mb-1 flex items-center gap-2"><Key className="w-4 h-4 text-slate-600" /> Active Sessions ({user.sessions.length})</h4>
                <p className="text-sm text-slate-500">Revoke all active web sessions, forcing the user to log in again.</p>
              </div>
              <button onClick={handleRevokeSessions} disabled={isPending || user.sessions.length === 0} className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-medium rounded-md text-sm transition-colors disabled:opacity-50">
                Revoke All Sessions
              </button>
            </div>

            {/* Status Control */}
            <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 flex flex-wrap gap-4 justify-between items-center">
              <div className="flex-1 min-w-[200px]">
                <h4 className="font-bold text-slate-900 mb-1 flex items-center gap-2"><Power className="w-4 h-4 text-orange-600" /> Account Status</h4>
                <p className="text-sm text-slate-500">Disable or completely block this account from logging in.</p>
              </div>
              <div className="flex gap-2">
                {status !== "ACTIVE" && <button onClick={() => handleStatusChange("ACTIVE")} disabled={isPending || isSelf} className="px-4 py-2 bg-green-100 hover:bg-green-200 text-green-800 font-medium rounded-md text-sm transition-colors disabled:opacity-50">Activate</button>}
                {status !== "DISABLED" && <button onClick={() => handleStatusChange("DISABLED")} disabled={isPending || isSelf} className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-medium rounded-md text-sm transition-colors disabled:opacity-50">Disable</button>}
                {status !== "BLOCKED" && <button onClick={() => handleStatusChange("BLOCKED")} disabled={isPending || isSelf} className="px-4 py-2 bg-red-100 hover:bg-red-200 text-red-800 font-medium rounded-md text-sm transition-colors disabled:opacity-50">Block</button>}
              </div>
            </div>

            {/* Soft Delete */}
            <div className="bg-red-50 p-5 rounded-xl border border-red-200 flex justify-between items-center">
              <div>
                <h4 className="font-bold text-red-900 mb-1 flex items-center gap-2"><Trash2 className="w-4 h-4 text-red-600" /> Delete Account</h4>
                <p className="text-sm text-red-700">Soft-delete this user. This action is restricted to highly privileged admins.</p>
              </div>
              <button onClick={handleDelete} disabled={isPending || isSelf || status === "DELETED"} className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-md text-sm transition-colors disabled:opacity-50">
                {status === "DELETED" ? "Deleted" : "Delete User"}
              </button>
            </div>

          </div>
        )}

      </div>
    </div>
  );
}
