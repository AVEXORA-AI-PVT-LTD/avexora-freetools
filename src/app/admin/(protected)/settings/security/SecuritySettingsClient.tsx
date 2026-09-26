"use client";

import { useState } from "react";
import { updateSecuritySettingsAction } from "../settings-actions";
import {
  ShieldCheck,
  KeyRound,
  Clock,
  Lock,
  Globe,
  Save,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
} from "lucide-react";

interface SecuritySettingsClientProps {
  initialSettings: {
    twoFactorPolicy: string;
    sessionTimeoutMinutes: number;
    passwordMinLength: number;
    requireUppercase: boolean;
    requireLowercase: boolean;
    requireNumber: boolean;
    requireSpecialChar: boolean;
    maxFailedAttempts: number;
    lockoutDurationMinutes: number;
    ipRestrictionsEnabled: boolean;
    allowedIps: string[];
  };
}

export function SecuritySettingsClient({ initialSettings }: SecuritySettingsClientProps) {
  const [formData, setFormData] = useState(initialSettings);
  const [ipInput, setIpInput] = useState(initialSettings.allowedIps.join("\n"));
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccessMessage("");
    setErrorMessage("");

    const parsedIps = ipInput
      .split(/[\n,]/)
      .map((ip) => ip.trim())
      .filter((ip) => ip.length > 0);

    try {
      const res = await updateSecuritySettingsAction({
        ...formData,
        allowedIps: parsedIps,
      });

      if (res.success && res.settings) {
        setFormData(res.settings);
        setIpInput(res.settings.allowedIps.join("\n"));
        setSuccessMessage("Security & authentication policies saved successfully!");
      } else {
        setErrorMessage(res.error || "Failed to update security settings.");
      }
    } catch (err: any) {
      setErrorMessage(err.message || "An unexpected error occurred.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Alert Notifications */}
      {successMessage && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-center gap-3 shadow-xs">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span className="font-medium">{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 text-sm flex items-center gap-3 shadow-xs">
          <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
          <span className="font-medium">{errorMessage}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* 2FA & Authentication Policy */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-indigo-600" />
            <div>
              <h2 className="font-semibold text-slate-800">Two-Factor Authentication (2FA) Policy</h2>
              <p className="text-xs text-slate-500">Enforce multi-factor authentication across admin and user roles.</p>
            </div>
          </div>

          <div className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">
                2FA Requirement Policy
              </label>
              <select
                value={formData.twoFactorPolicy}
                onChange={(e) => setFormData({ ...formData, twoFactorPolicy: e.target.value })}
                className="w-full max-w-md px-4 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-900 bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
              >
                <option value="Disabled">Disabled for all accounts</option>
                <option value="Optional">Optional for all users</option>
                <option value="Required for Admins">Required for Admins & Staff</option>
                <option value="Required for Super Admins">Required for Super Admins only</option>
              </select>
            </div>
          </div>
        </div>

        {/* Session Timeout */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center gap-2">
            <Clock className="w-5 h-5 text-indigo-600" />
            <div>
              <h2 className="font-semibold text-slate-800">Session Timeout & Lifetime</h2>
              <p className="text-xs text-slate-500">Automatically expire inactive administrator sessions.</p>
            </div>
          </div>

          <div className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">
                Session Timeout (Minutes) — Range: 15 to 1440 (24h)
              </label>
              <div className="flex items-center gap-4 max-w-md">
                <input
                  type="number"
                  min={15}
                  max={1440}
                  required
                  value={formData.sessionTimeoutMinutes}
                  onChange={(e) =>
                    setFormData({ ...formData, sessionTimeoutMinutes: parseInt(e.target.value) || 15 })
                  }
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-900 bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
                />
                <span className="text-xs font-medium text-slate-500 shrink-0">
                  ({Math.floor(formData.sessionTimeoutMinutes / 60)}h {formData.sessionTimeoutMinutes % 60}m)
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Password Complexity Rules */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center gap-2">
            <KeyRound className="w-5 h-5 text-indigo-600" />
            <div>
              <h2 className="font-semibold text-slate-800">Password Complexity & Strength Rules</h2>
              <p className="text-xs text-slate-500">Configure minimum password security requirements for registered users & staff.</p>
            </div>
          </div>

          <div className="p-6 space-y-6">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">
                Minimum Password Length
              </label>
              <input
                type="number"
                min={8}
                max={64}
                required
                value={formData.passwordMinLength}
                onChange={(e) =>
                  setFormData({ ...formData, passwordMinLength: parseInt(e.target.value) || 8 })
                }
                className="w-full max-w-xs px-4 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-900 bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <label className="flex items-center gap-3 p-3 border border-slate-200 rounded-xl hover:bg-slate-50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.requireUppercase}
                  onChange={(e) => setFormData({ ...formData, requireUppercase: e.target.checked })}
                  className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                />
                <span className="text-xs font-medium text-slate-700">Require Uppercase (A-Z)</span>
              </label>

              <label className="flex items-center gap-3 p-3 border border-slate-200 rounded-xl hover:bg-slate-50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.requireLowercase}
                  onChange={(e) => setFormData({ ...formData, requireLowercase: e.target.checked })}
                  className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                />
                <span className="text-xs font-medium text-slate-700">Require Lowercase (a-z)</span>
              </label>

              <label className="flex items-center gap-3 p-3 border border-slate-200 rounded-xl hover:bg-slate-50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.requireNumber}
                  onChange={(e) => setFormData({ ...formData, requireNumber: e.target.checked })}
                  className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                />
                <span className="text-xs font-medium text-slate-700">Require Number (0-9)</span>
              </label>

              <label className="flex items-center gap-3 p-3 border border-slate-200 rounded-xl hover:bg-slate-50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.requireSpecialChar}
                  onChange={(e) => setFormData({ ...formData, requireSpecialChar: e.target.checked })}
                  className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                />
                <span className="text-xs font-medium text-slate-700">Require Special Character (!@#$)</span>
              </label>
            </div>
          </div>
        </div>

        {/* Failed Login Lockouts */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center gap-2">
            <Lock className="w-5 h-5 text-indigo-600" />
            <div>
              <h2 className="font-semibold text-slate-800">Brute-Force Protection & Lockout Limits</h2>
              <p className="text-xs text-slate-500">Lock account after multiple consecutive invalid login attempts.</p>
            </div>
          </div>

          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">
                Max Allowed Failed Attempts
              </label>
              <input
                type="number"
                min={3}
                max={20}
                required
                value={formData.maxFailedAttempts}
                onChange={(e) =>
                  setFormData({ ...formData, maxFailedAttempts: parseInt(e.target.value) || 5 })
                }
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-900 bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">
                Lockout Duration (Minutes)
              </label>
              <input
                type="number"
                min={5}
                max={1440}
                required
                value={formData.lockoutDurationMinutes}
                onChange={(e) =>
                  setFormData({ ...formData, lockoutDurationMinutes: parseInt(e.target.value) || 15 })
                }
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-900 bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>
          </div>
        </div>

        {/* IP Restrictions */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Globe className="w-5 h-5 text-indigo-600" />
              <div>
                <h2 className="font-semibold text-slate-800">IP Whitelist & Restriction Rules</h2>
                <p className="text-xs text-slate-500">Restrict admin panel access to specific IP addresses.</p>
              </div>
            </div>

            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={formData.ipRestrictionsEnabled}
                onChange={(e) => setFormData({ ...formData, ipRestrictionsEnabled: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
            </label>
          </div>

          {formData.ipRestrictionsEnabled && (
            <div className="p-6 space-y-4 border-t border-slate-100">
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold">Lockout Safety Guard Active:</span> Ensure your current admin IP address is included in the list below before saving. System will block changes that lock out your current session.
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Allowed IP Addresses (One IP per line or comma separated)
                </label>
                <textarea
                  rows={4}
                  value={ipInput}
                  onChange={(e) => setIpInput(e.target.value)}
                  className="w-full p-4 rounded-xl border border-slate-300 text-xs font-mono text-slate-900 bg-slate-50 focus:bg-white outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="192.168.1.1&#10;203.0.113.5"
                />
              </div>
            </div>
          )}
        </div>

        {/* Save Actions */}
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm rounded-xl shadow-xs flex items-center gap-2 transition-all disabled:opacity-50 cursor-pointer"
          >
            <Save className="w-4 h-4" />
            {saving ? "Saving Security Policies..." : "Save Security Settings"}
          </button>
        </div>
      </form>
    </div>
  );
}
