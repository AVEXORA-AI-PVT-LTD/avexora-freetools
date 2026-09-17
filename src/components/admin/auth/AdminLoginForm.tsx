"use client";

import { useState } from "react";
import { adminLoginAction } from "@/app/actions/admin-auth";
import { Eye, EyeOff, Lock, Mail, AlertCircle } from "lucide-react";
import { useRouter } from "next/navigation";

export function AdminLoginForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    try {
      const result = await adminLoginAction(formData);
      
      if (!result.success) {
        setError(result.error || "An error occurred during login.");
        setLoading(false);
      } else if (result.requiresTwoFactor) {
        // Implement 2FA UI flow (Phase 4.2)
        router.push(`/admin/login/2fa?userId=${result.userId}`);
      } else if (result.redirectUrl) {
        // Hard refresh to update auth state globally
        window.location.href = result.redirectUrl;
      }
    } catch (err) {
      setError("An unexpected error occurred.");
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="bg-white px-8 py-10 shadow-xl rounded-2xl border border-orange-100">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-orange-950 tracking-tight">AVEX TOOLS</h1>
          <p className="text-orange-900/60 mt-1 font-medium">Admin Panel Access</p>
        </div>

        {error && (
          <div className="mb-6 flex items-center gap-3 rounded-lg bg-red-50 p-4 text-sm text-red-900 border border-red-200/50">
            <AlertCircle className="h-5 w-5 shrink-0 text-red-600" />
            <p>{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-orange-950 mb-2">Email Address</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-orange-900/40">
                <Mail className="h-5 w-5" />
              </div>
              <input
                type="email"
                name="email"
                required
                autoComplete="email"
                className="block w-full pl-10 pr-3 py-2.5 border border-orange-200 rounded-lg bg-orange-50/30 text-orange-950 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 sm:text-sm transition-shadow"
                placeholder="admin@avexora.in"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-orange-950">Password</label>
              <a href="/admin/login/forgot" className="text-xs font-medium text-orange-600 hover:text-orange-500 hover:underline">
                Forgot password?
              </a>
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-orange-900/40">
                <Lock className="h-5 w-5" />
              </div>
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                required
                autoComplete="current-password"
                className="block w-full pl-10 pr-10 py-2.5 border border-orange-200 rounded-lg bg-orange-50/30 text-orange-950 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 sm:text-sm transition-shadow"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-orange-900/40 hover:text-orange-950 transition-colors"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
          </div>

          <div className="flex items-center">
            <input
              id="rememberMe"
              name="rememberMe"
              type="checkbox"
              className="h-4 w-4 rounded border-orange-300 text-orange-600 focus:ring-orange-500"
            />
            <label htmlFor="rememberMe" className="ml-2 block text-sm text-orange-950">
              Remember me
            </label>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Authenticating..." : "Sign In"}
          </button>
        </form>
      </div>
    </div>
  );
}
