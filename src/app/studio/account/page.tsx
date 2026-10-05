import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/server/auth";
import { prisma } from "@/server/db";
import { HeaderNav } from "@/components/editorial/header-nav";
import { FooterSection } from "@/components/editorial/footer-section";
import { AccountSettingsForm } from "@/components/account/account-settings-form";
import { ArrowLeft, Settings, ShieldCheck } from "lucide-react";

export default async function AccountPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/studio/signin");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      name: true,
      email: true,
      phone: true,
      companyName: true,
      jobRole: true,
    },
  });

  if (!user) {
    redirect("/studio/signin");
  }

  return (
    <div className="min-h-screen bg-white text-stone-900 font-sans selection:bg-orange-500 selection:text-white flex flex-col justify-between relative">
      <div className="absolute inset-0 bg-matrix-grid opacity-35 pointer-events-none" />
      <HeaderNav />

      <div className="flex-1 pt-24 sm:pt-28 pb-16 relative z-10">
        <main className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 space-y-8">
          {/* Back Navigation Bar */}
          <div className="flex items-center justify-between pb-2 border-b border-stone-200/80">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-xs font-mono font-semibold text-stone-600 hover:text-orange-600 bg-white border border-stone-200 hover:border-orange-300 px-3.5 py-2 rounded-xl shadow-2xs transition group"
            >
              <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
              <span>Back to Avexora Free Tools Website</span>
            </Link>
            <div className="flex items-center gap-2 text-xs font-mono text-stone-500 bg-stone-50 border border-stone-200/80 px-3 py-1.5 rounded-full">
              <Settings className="w-3.5 h-3.5 text-orange-600" />
              <span>Account Hub</span>
            </div>
          </div>

          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-orange-200/80 bg-orange-100/70 px-3.5 py-1 text-xs font-mono font-bold uppercase tracking-wider text-orange-800 shadow-2xs mb-2">
              <ShieldCheck className="w-3.5 h-3.5 text-orange-600" />
              <span>PROFILE &amp; SECURITY</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-stone-900">
              Account Settings
            </h1>
            <p className="text-xs sm:text-sm text-stone-500 mt-1">
              Manage your personal and business particulars across Avexora Free Tools, Brand Studio &amp; EBOS.
            </p>
          </div>

          <AccountSettingsForm user={user} />
        </main>
      </div>

      <FooterSection />
    </div>
  );
}
