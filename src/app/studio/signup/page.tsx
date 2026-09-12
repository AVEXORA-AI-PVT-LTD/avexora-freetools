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
  title: "Create your account",
  robots: { index: false },
};

export default async function SignUpPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const { next, error } = await searchParams;
  const safeNext = safeRedirectPath(next, "/studio/app");
  const session = await auth();
  // An already-authenticated visitor must not create a second account through
  // the normal UI — send them to their intended destination instead.
  if (session?.user) redirect(safeNext);

  const authReady = emailEnabled || googleEnabled || facebookEnabled;
  const serverError = authErrorMessage(error);

  if (!authReady) {
    return (
      <main className="mx-auto max-w-md px-4 py-16">
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <p className="font-semibold">Sign-up is not configured yet.</p>
          <p className="mt-1">
            Set <code className="font-mono">AUTH_SECRET</code> plus either{" "}
            <code className="font-mono">AUTH_RESEND_KEY</code> and{" "}
            <code className="font-mono">EMAIL_FROM</code> for magic links, or{" "}
            <code className="font-mono">AUTH_GOOGLE_ID</code> and{" "}
            <code className="font-mono">AUTH_GOOGLE_SECRET</code> for Google.
          </p>
        </div>
      </main>
    );
  }

  return (
    <AuthCard
      mode="signup"
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