import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth, emailEnabled, googleEnabled, facebookEnabled } from "@/server/auth";
import {
  sendMagicLink,
  signInWithGoogle,
  signInWithFacebook,
} from "@/server/auth-actions";
import { safeRedirectPath } from "@/server/safe-redirect";
import { authErrorMessage } from "@/components/account/auth-errors";
import { AuthCard } from "@/components/account/auth-card";

export const metadata: Metadata = {
  title: "Sign in to Avex",
  robots: { index: false },
};

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; callbackUrl?: string; error?: string }>;
}) {
  const { next, callbackUrl, error } = await searchParams;
  const safeNext = safeRedirectPath(next || callbackUrl, "/studio/app");
  const session = await auth();
  if (session?.user) redirect(safeNext);

  const authReady = emailEnabled || googleEnabled || facebookEnabled;
  const serverError = authErrorMessage(error);

  if (!authReady) {
    return (
      <main className="mx-auto max-w-md px-4 py-16 text-center">
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-900 shadow-sm space-y-3">
          <p className="font-bold text-base text-amber-950">Authentication Service Updating</p>
          <p className="text-amber-800 leading-relaxed text-xs">
            Sign-in is currently undergoing scheduled configuration. Please check back shortly or explore our 130+ free tools.
          </p>
          <div className="pt-2">
            <a
              href="/"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-orange-600 text-white font-semibold text-xs hover:bg-orange-700 transition"
            >
              Back to Free Tools
            </a>
          </div>
        </div>
      </main>
    );
  }

  return (
    <AuthCard
      mode="signin"
      next={safeNext}
      emailEnabled={emailEnabled}
      googleEnabled={googleEnabled}
      facebookEnabled={facebookEnabled}
      serverError={serverError}
      sendMagicLink={sendMagicLink}
      signInWithGoogle={signInWithGoogle}
      signInWithFacebook={signInWithFacebook}
    />
  );
}