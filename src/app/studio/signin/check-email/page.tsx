import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { MailCheck, ArrowRight, ShieldCheck } from "lucide-react";
import { Auth3DCanvas } from "@/components/account/Auth3DCanvas";

export const metadata: Metadata = {
  title: "Check your email | Avexora Tools",
  robots: { index: false },
};

export default function CheckEmailPage() {
  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center p-4 sm:p-6 relative overflow-hidden bg-stone-950 text-stone-100 font-sans selection:bg-orange-500 selection:text-white">
      {/* 3D WebGL Background */}
      <Auth3DCanvas />

      {/* Cyber Grid */}
      <div className="absolute inset-0 bg-matrix-grid-dark opacity-45 pointer-events-none" />

      {/* Ambient Glow */}
      <div 
        className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] bg-gradient-to-br from-orange-600/20 via-amber-500/10 to-transparent rounded-full blur-3xl pointer-events-none" 
        aria-hidden="true"
      />

      {/* Top Branding */}
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

      {/* Card */}
      <div className="w-full max-w-md rounded-3xl border border-stone-800 bg-stone-900/90 backdrop-blur-2xl p-7 sm:p-9 shadow-2xl relative z-10 text-center">
        <div className="w-14 h-14 rounded-2xl bg-orange-600/20 border border-orange-500/40 text-orange-400 mx-auto flex items-center justify-center mb-5">
          <MailCheck className="w-7 h-7" />
        </div>

        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
          Check your email
        </h1>
        <p className="mt-3 text-sm text-stone-400 leading-relaxed">
          We&apos;ve sent a secure single-use sign-in link to your email address. It will expire in 24 hours.
        </p>

        <div className="mt-6 p-4 rounded-xl bg-stone-950/70 border border-stone-800 text-xs text-stone-400 leading-relaxed font-mono">
          Didn&apos;t receive it? Check your spam folder or wait a minute before requesting another link.
        </div>

        <div className="mt-6">
          <Link
            href="/studio/signin"
            className="btn-orange-glow !text-white w-full h-11 rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-orange-600/30 hover:shadow-orange-600/50 transition cursor-pointer"
          >
            <span>Back to Sign In</span>
            <ArrowRight className="w-4 h-4 text-white" />
          </Link>
        </div>
      </div>

      {/* Bottom Link */}
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