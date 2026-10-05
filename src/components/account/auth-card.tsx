"use client";

import React, { useState, useActionState } from "react";
import { useFormStatus } from "react-dom";
import Link from "next/link";
import Image from "next/image";
import { ShieldCheck, Mail, ArrowRight, Lock, KeyRound } from "lucide-react";
import { GoogleIcon, FacebookIcon } from "@/components/account/provider-icons";
import { Auth3DCanvas } from "./Auth3DCanvas";
import type { MagicLinkStatusArg } from "@/server/auth-actions";

const EMAIL_ERROR_MESSAGE: Record<string, string> = {
  invalid_email: "Enter a valid email address.",
  too_many_requests: "Too many requests. Please wait a minute and try again.",
  send_failed: "We couldn't send the sign-in link. Please try again.",
  not_configured: "Email sign-in isn't configured on this site yet.",
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type ProviderAction = (formData: FormData) => Promise<void>;

type SendMagicLinkAction = (
  prev: MagicLinkStatusArg,
  formData: FormData,
) => Promise<MagicLinkStatusArg>;

interface AuthCardProps {
  mode: "signin" | "signup";
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

  // 3D Card Interactive Tilt
  const [cardTilt, setCardTilt] = useState({ x: 0, y: 0 });

  const handleCardMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width - 0.5) * 10;
    const y = ((e.clientY - rect.top) / rect.height - 0.5) * -10;
    setCardTilt({ x, y });
  };

  const handleCardMouseLeave = () => {
    setCardTilt({ x: 0, y: 0 });
  };

  const inlineEmailError =
    clientError ?? (state.error ? EMAIL_ERROR_MESSAGE[state.error] : null);

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
    <div className="min-h-screen w-full flex flex-col items-center justify-center p-4 sm:p-6 relative overflow-hidden bg-stone-950 text-stone-100 font-sans selection:bg-orange-500 selection:text-white">
      {/* 1. Interactive 3D WebGL Canvas Layer */}
      <Auth3DCanvas />

      {/* 2. Cyber Matrix Grid Background Overlay */}
      <div className="absolute inset-0 bg-matrix-grid-dark opacity-45 pointer-events-none" />

      {/* 3. Ambient Orange & Amber Glow Orbs */}
      <div 
        className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[550px] bg-gradient-to-br from-orange-600/25 via-amber-500/10 to-transparent rounded-full blur-3xl pointer-events-none" 
        aria-hidden="true"
      />
      <div 
        className="absolute bottom-6 right-10 w-[350px] h-[350px] bg-orange-600/10 rounded-full blur-3xl pointer-events-none" 
        aria-hidden="true"
      />

      {/* 4. Top Branding Logo */}
      <div className="mb-4 z-10 flex flex-col items-center w-full max-w-sm">
        <Link 
          href="/" 
          className="inline-flex items-center justify-center group transition-transform hover:scale-105 duration-200"
        >
          <Image
            src="/logo.png"
            alt="Avexora Tools"
            width={300}
            height={73}
            priority
            unoptimized
            className="h-12 sm:h-14 w-auto max-w-[270px] sm:max-w-[310px] object-contain drop-shadow-2xl"
          />
        </Link>
      </div>

      {/* 5. Main 3D Interactive Auth Card */}
      <div
        onMouseMove={handleCardMouseMove}
        onMouseLeave={handleCardMouseLeave}
        style={{
          transform: `perspective(1000px) rotateX(${cardTilt.y}deg) rotateY(${cardTilt.x}deg)`,
          transition: "transform 0.15s ease-out",
        }}
        className="w-full max-w-md rounded-3xl border border-stone-800 bg-stone-900/90 backdrop-blur-2xl p-7 sm:p-9 shadow-2xl shadow-stone-950/80 relative z-10 transition-colors hover:border-orange-500/40"
      >
        {/* Subtle orange accent glow inside card */}
        <div className="absolute top-0 right-0 w-36 h-36 bg-orange-500/10 rounded-full blur-2xl pointer-events-none" />

        {/* Identity Node Pill */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-950/80 border border-orange-500/30 text-orange-400 font-mono text-xs font-semibold mb-4">
          <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
          <span>AVEXORA TOOLS // IDENTITY NODE</span>
        </div>

        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
          Sign in to Avexora Tools
        </h1>
        <p className="mt-2 text-xs sm:text-sm text-stone-400 leading-relaxed">
          One unified account for Avexora Tools, Brand Studio & Enterprise Business OS.
        </p>

        {/* Server Error Alert */}
        {serverError && (
          <div
            role="alert"
            className="mt-5 rounded-xl border border-red-500/40 bg-red-950/50 px-4 py-3 text-xs sm:text-sm text-red-300 font-mono flex items-center gap-2"
          >
            <span>⚠️</span>
            <span>{serverError}</span>
          </div>
        )}

        {/* Form Container */}
        <div className="mt-6">
          <form action={formAction} onSubmit={handleEmailSubmit} noValidate className="space-y-4">
            <input type="hidden" name="next" value={next} />

            <div>
              <label
                htmlFor="email"
                className="block text-xs font-mono uppercase tracking-wider text-stone-300 font-semibold mb-1.5"
              >
                Work Email Address
              </label>
              <div className="relative">
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  autoComplete="email"
                  placeholder="you@company.in"
                  aria-invalid={inlineEmailError ? true : undefined}
                  aria-describedby={inlineEmailError ? "email-error" : undefined}
                  className="w-full rounded-xl border border-stone-700 bg-stone-950/70 px-4 py-3 text-sm text-white placeholder-stone-500 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/30 transition shadow-inner font-sans"
                />
              </div>
              {inlineEmailError && (
                <p id="email-error" role="alert" className="mt-1.5 text-xs text-red-400 font-mono">
                  {inlineEmailError}
                </p>
              )}
              {!emailEnabled && (
                <p className="mt-2 rounded-xl border border-amber-500/30 bg-amber-950/40 px-3 py-2 text-xs text-amber-300 font-mono">
                  Email sign-in isn&apos;t configured on this site yet.
                </p>
              )}
            </div>

            <div className="pt-1">
              <EmailSubmitButton pending={pending} />
              <p className="mt-2 text-center text-[11px] font-mono text-stone-400">
                🔒 Passwordless: We&apos;ll send you a single-use magic login link.
              </p>
            </div>
          </form>
        </div>

        {/* Social SSO Divider */}
        {(googleEnabled || facebookEnabled) && (
          <div className="my-6 flex items-center gap-3">
            <span className="h-px flex-1 bg-stone-800" />
            <span className="text-[11px] uppercase font-mono tracking-wider text-stone-400">
              or continue with
            </span>
            <span className="h-px flex-1 bg-stone-800" />
          </div>
        )}

        {/* Social SSO Buttons */}
        {(googleEnabled || facebookEnabled) && (
          <div className="grid grid-cols-2 gap-3">
            {googleEnabled && (
              <form action={signInWithGoogle}>
                <input type="hidden" name="next" value={next} />
                <ProviderSubmitButton
                  label="Google"
                  pendingLabel="..."
                  icon={<GoogleIcon className="h-4 w-4 shrink-0" />}
                />
              </form>
            )}

            {facebookEnabled ? (
              <form action={signInWithFacebook}>
                <input type="hidden" name="next" value={next} />
                <ProviderSubmitButton
                  label="Facebook"
                  pendingLabel="..."
                  icon={<FacebookIcon className="h-4 w-4 shrink-0" />}
                />
              </form>
            ) : (
              <div>
                <button
                  type="button"
                  disabled
                  aria-disabled="true"
                  title="Facebook sign-in requires configuration."
                  className="flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-stone-800 bg-stone-900/50 px-4 text-xs font-semibold text-stone-500 cursor-not-allowed opacity-50"
                >
                  <FacebookIcon className="h-4 w-4 shrink-0 grayscale" />
                  <span>Facebook</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* Card Security Guarantee Footer */}
        <div className="mt-6 pt-5 border-t border-stone-800 flex items-center justify-between text-[11px] font-mono text-stone-400">
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>256-Bit TLS</span>
          </span>
          <span>•</span>
          <span>No Password Storage</span>
          <span>•</span>
          <span className="text-orange-400">Browser WASM</span>
        </div>
      </div>

      {/* 6. Bottom Navigation Back Link */}
      <div className="mt-6 text-center text-xs text-stone-400 z-10">
        <Link 
          href="/" 
          className="hover:text-white transition flex items-center justify-center gap-1.5 font-mono group"
        >
          <span className="group-hover:-translate-x-1 transition-transform">←</span>
          <span>Return to Avexora Tools Directory</span>
        </Link>
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
      aria-busy={pending}
      className="flex h-11 w-full items-center justify-center gap-2.5 rounded-xl border border-stone-700 bg-stone-800/80 hover:bg-stone-800 text-xs font-semibold text-stone-200 transition hover:border-stone-600 disabled:opacity-50 cursor-pointer shadow-xs"
    >
      {icon}
      <span>{pending ? pendingLabel : label}</span>
    </button>
  );
}

function EmailSubmitButton({ pending }: { pending: boolean }) {
  return (
    <button
      type="submit"
      disabled={pending}
      aria-busy={pending}
      className="btn-orange-glow !text-white w-full h-11 sm:h-12 rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-orange-600/30 hover:shadow-orange-600/50 transition cursor-pointer disabled:opacity-60"
    >
      <span>{pending ? "Sending Secure Link…" : "Continue with Email"}</span>
      {!pending && <ArrowRight className="w-4 h-4 text-white" />}
    </button>
  );
}
