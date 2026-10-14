import { redirect } from "next/navigation";
import { auth } from "@/server/auth";
import { prisma } from "@/server/db";
import { OnboardingForm } from "./onboarding-form";
import { HeaderNav } from "@/components/editorial/header-nav";
import { FooterSection } from "@/components/editorial/footer-section";
import { Sparkles } from "lucide-react";

export default async function OnboardingPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/studio/signin");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
  });

  if (user?.isOnboarded) {
    redirect("/studio/app");
  }

  return (
    <div className="min-h-screen bg-white text-stone-900 font-sans selection:bg-orange-500 selection:text-white flex flex-col justify-between relative">
      <div className="absolute inset-0 bg-matrix-grid opacity-35 pointer-events-none" />
      <HeaderNav />

      <div className="flex-1 pt-24 sm:pt-28 pb-16 relative z-10 flex flex-col justify-center">
        <div className="sm:mx-auto sm:w-full sm:max-w-md px-4">
          <div className="inline-flex items-center gap-2 rounded-full border border-orange-200/80 bg-orange-100/70 px-3.5 py-1 text-xs font-mono font-bold uppercase tracking-wider text-orange-800 shadow-2xs mb-4 mx-auto">
            <Sparkles className="w-3.5 h-3.5 text-orange-600" />
            <span>ONBOARDING SETUP</span>
          </div>
          <h1 className="text-center text-3xl font-extrabold tracking-tight text-stone-900">
            Welcome to Avexora
          </h1>
          <p className="mt-2 text-center text-xs sm:text-sm text-stone-500">
            Let&apos;s get your workspace profile set up.
          </p>

          <div className="mt-8 bg-white p-6 sm:p-8 rounded-3xl border border-stone-200/90 shadow-xl">
            <OnboardingForm initialName={user?.name ?? ""} />
          </div>
        </div>
      </div>

      <FooterSection />
    </div>
  );
}
