import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth, emailEnabled, googleEnabled, signIn } from "@/server/auth";

export const metadata: Metadata = {
  title: "Sign in to Brand Studio",
  robots: { index: false },
};

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const { next, error } = await searchParams;
  const session = await auth();
  if (session?.user) redirect(next ?? "/studio/app");

  const callbackUrl = next ?? "/studio/app";

  return (
    <main className="mx-auto max-w-md px-4 py-16">
      <h1 className="text-2xl font-bold tracking-tight text-slate-900">
        Sign in to Brand Studio
      </h1>
      <p className="mt-2 text-sm text-slate-600">
        Your free-tools history carries over — no separate account needed.
      </p>

      {error && (
        <p className="mt-6 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          That sign-in link didn&apos;t work. Try again.
        </p>
      )}

      {!emailEnabled && !googleEnabled && (
        <div className="mt-8 rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <p className="font-semibold">Sign-in is not configured yet.</p>
          <p className="mt-1">
            Set <code className="font-mono">AUTH_SECRET</code> plus either{" "}
            <code className="font-mono">AUTH_RESEND_KEY</code> and{" "}
            <code className="font-mono">EMAIL_FROM</code> for magic links, or{" "}
            <code className="font-mono">AUTH_GOOGLE_ID</code> and{" "}
            <code className="font-mono">AUTH_GOOGLE_SECRET</code> for Google.
          </p>
        </div>
      )}

      {emailEnabled && (
        <form
          className="mt-8 space-y-3"
          action={async (formData: FormData) => {
            "use server";
            await signIn("resend", {
              email: String(formData.get("email") ?? ""),
              redirectTo: callbackUrl,
            });
          }}
        >
          <label
            htmlFor="email"
            className="block text-sm font-medium text-slate-700"
          >
            Work email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            placeholder="you@company.in"
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
          />
          <button
            type="submit"
            className="w-full rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
          >
            Email me a sign-in link
          </button>
        </form>
      )}

      {emailEnabled && googleEnabled && (
        <div className="my-6 flex items-center gap-3">
          <span className="h-px flex-1 bg-slate-200" />
          <span className="text-xs uppercase tracking-wide text-slate-400">or</span>
          <span className="h-px flex-1 bg-slate-200" />
        </div>
      )}

      {googleEnabled && (
        <form
          action={async () => {
            "use server";
            await signIn("google", { redirectTo: callbackUrl });
          }}
        >
          <button
            type="submit"
            className="w-full rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:border-slate-400"
          >
            Continue with Google
          </button>
        </form>
      )}
    </main>
  );
}
