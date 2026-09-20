"use client";

import { useState, useActionState } from "react";
import { useFormStatus } from "react-dom";
import { GoogleIcon, FacebookIcon } from "@/components/account/provider-icons";
import type { MagicLinkStatusArg } from "@/server/auth-actions";

const EMAIL_ERROR_MESSAGE: Record<string, string> = {
  invalid_email: "Enter a valid email address.",
  too_many_requests: "Too many requests. Please wait a minute and try again.",
  send_failed: "We couldn't send the sign-in link. Please try again.",
  not_configured: "Email sign-in isn't configured on this site yet.",
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const PROVIDER_BUTTON_CLS =
  "flex h-11 w-full items-center justify-center gap-2 rounded-md border border-slate-300 bg-white px-4 text-sm font-medium text-slate-700 shadow-sm transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-600";

type ProviderAction = (formData: FormData) => Promise<void>;

type SendMagicLinkAction = (
  prev: MagicLinkStatusArg,
  formData: FormData,
) => Promise<MagicLinkStatusArg>;

interface AuthCardProps {
  mode: "signin" | "signup"; // Kept to avoid breaking existing page imports, but ignored for unified UI
  next: string;
  emailEnabled: boolean;
  googleEnabled: boolean;
  facebookEnabled: boolean;
  serverError: string | null;
  sendMagicLink: SendMagicLinkAction;
  signInWithGoogle: ProviderAction;
  signInWithFacebook: ProviderAction;
}

export function AuthCard({
  next,
  emailEnabled,
  googleEnabled,
  facebookEnabled,
  serverError,
  sendMagicLink,
  signInWithGoogle,
  signInWithFacebook,
}: AuthCardProps) {
  const [state, formAction, pending] = useActionState(sendMagicLink, {
    error: undefined,
  });
  const [clientError, setClientError] = useState<string | null>(null);
  
  const inlineEmailError = clientError ?? (state.error ? EMAIL_ERROR_MESSAGE[state.error] : null);

  function handleEmailSubmit(e: React.FormEvent<HTMLFormElement>) {
    const email = String(new FormData(e.currentTarget).get("email") ?? "");
    if (!email.trim()) {
      e.preventDefault();
      setClientError("Enter your email address.");
      return;
    }
    if (!EMAIL_PATTERN.test(email.trim())) {
      e.preventDefault();
      setClientError("Enter a valid email address.");
      return;
    }
    setClientError(null);
  }

  return (
    <div className="mx-auto w-full max-w-md px-4 py-16 sm:py-24">
      <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Sign in to Avexora
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          One account for Avexora Tools and Brand Studio.
        </p>

        {serverError && (
          <div
            role="alert"
            className="mt-6 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          >
            {serverError}
          </div>
        )}

        <div className="mt-6">
          <form action={formAction} onSubmit={handleEmailSubmit} noValidate className="space-y-4">
            <input type="hidden" name="next" value={next} />
            
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-700">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                autoComplete="email"
                placeholder="you@company.in"
                aria-invalid={inlineEmailError ? true : undefined}
                aria-describedby={inlineEmailError ? "email-error" : undefined}
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20 disabled:bg-slate-50 sm:py-2.5"
              />
              {inlineEmailError && (
                <p id="email-error" role="alert" className="mt-1.5 text-sm text-red-600">
                  {inlineEmailError}
                </p>
              )}
              {!emailEnabled && (
                <p className="mt-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
                  Email sign-in isn&apos;t configured on this site yet.
                </p>
              )}
            </div>

            <div>
              <EmailSubmitButton pending={pending} />
              <p className="mt-2 text-center text-xs text-slate-500">
                We'll email you a secure sign-in link.
              </p>
            </div>
          </form>
        </div>

        {(googleEnabled || facebookEnabled) && (
          <div className="my-6 flex items-center gap-3">
            <span className="h-px flex-1 bg-slate-200" />
            <span className="text-xs uppercase tracking-wide text-slate-400">or continue with</span>
            <span className="h-px flex-1 bg-slate-200" />
          </div>
        )}

        {(googleEnabled || facebookEnabled) && (
          <div className="grid grid-cols-2 gap-3">
            {googleEnabled && (
              <form action={signInWithGoogle}>
                <input type="hidden" name="next" value={next} />
                <ProviderSubmitButton
                  label="Google"
                  pendingLabel="..."
                  icon={<GoogleIcon className="h-5 w-5 shrink-0" />}
                />
              </form>
            )}

            {facebookEnabled ? (
              <form action={signInWithFacebook}>
                <input type="hidden" name="next" value={next} />
                <ProviderSubmitButton
                  label="Facebook"
                  pendingLabel="..."
                  icon={<FacebookIcon className="h-5 w-5 shrink-0" />}
                />
              </form>
            ) : (
              <div>
                <button
                  type="button"
                  disabled
                  aria-disabled="true"
                  title="Facebook sign-in requires AUTH_FACEBOOK_ID and AUTH_FACEBOOK_SECRET to be configured."
                  className={`${PROVIDER_BUTTON_CLS} cursor-not-allowed`}
                >
                  <FacebookIcon className="h-5 w-5 shrink-0 grayscale opacity-50" />
                  Facebook
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function ProviderSubmitButton({
  label,
  pendingLabel,
  icon,
}: {
  label: string;
  pendingLabel: string;
  icon: React.ReactNode;
}) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className={PROVIDER_BUTTON_CLS}
      aria-busy={pending}
    >
      {icon}
      {pending ? pendingLabel : label}
    </button>
  );
}

function EmailSubmitButton({ pending }: { pending: boolean }) {
  return (
    <button
      type="submit"
      disabled={pending}
      aria-busy={pending}
      className="mt-2 flex h-11 w-full items-center justify-center rounded-md bg-orange-600 px-4 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-orange-700 disabled:cursor-not-allowed disabled:opacity-70 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-600"
    >
      {pending ? "Sending…" : "Continue with Email"}
    </button>
  );
}
