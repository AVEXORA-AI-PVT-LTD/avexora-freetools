"use client";

import { useState } from "react";
import { verify2FALoginAction } from "@/app/actions/admin-2fa";
import { AlertCircle, ShieldCheck } from "lucide-react";
import { useRouter } from "next/navigation";

export function Verify2FAForm({ userId }: { userId: string }) {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const code = formData.get("code") as string;
    
    // Defaulting remember me to false during 2fa stage if not passed through,
    // though realistically we'd pass it via session/cookies. 
    // For now we assume normal expiration.
    const rememberMe = false; 

    try {
      const result = await verify2FALoginAction(userId, code, rememberMe);
      
      if (!result.success) {
        setError(result.error || "Invalid verification code.");
        setLoading(false);
      } else if (result.redirectUrl) {
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
          <div className="mx-auto bg-orange-100 w-12 h-12 rounded-full flex items-center justify-center mb-4">
            <ShieldCheck className="h-6 w-6 text-orange-600" />
          </div>
          <h1 className="text-2xl font-bold text-orange-950 tracking-tight">Two-Factor Authentication</h1>
          <p className="text-orange-900/60 mt-2 font-medium text-sm">Enter the code from your authenticator app</p>
        </div>

        {error && (
          <div className="mb-6 flex items-center gap-3 rounded-lg bg-red-50 p-4 text-sm text-red-900 border border-red-200/50">
            <AlertCircle className="h-5 w-5 shrink-0 text-red-600" />
            <p>{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-orange-950 mb-2">Authentication Code</label>
            <input
              type="text"
              name="code"
              required
              autoComplete="one-time-code"
              className="block w-full px-4 py-3 text-center tracking-[0.5em] font-mono text-xl border border-orange-200 rounded-lg bg-orange-50/30 text-orange-950 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-shadow"
              placeholder="000000"
              maxLength={8}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Verifying..." : "Verify & Sign In"}
          </button>
        </form>
        
        <div className="mt-6 text-center">
          <a href="/admin/login" className="text-sm font-medium text-orange-600 hover:text-orange-500 hover:underline">
            Back to login
          </a>
        </div>
      </div>
    </div>
  );
}
