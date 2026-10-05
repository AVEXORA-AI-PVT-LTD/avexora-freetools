import { redirect } from "next/navigation";
import { currentUserId } from "@/server/auth";
import { prisma } from "@/server/db";
import { HeaderNav } from "@/components/editorial/header-nav";
import { FooterSection } from "@/components/editorial/footer-section";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const userId = await currentUserId();
  if (!userId) redirect("/studio/signin?next=/studio/app");

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { isOnboarded: true },
  });

  if (!user?.isOnboarded) {
    redirect("/studio/onboarding");
  }

  return (
    <div className="min-h-screen bg-white text-stone-900 font-sans selection:bg-orange-500 selection:text-white flex flex-col justify-between relative">
      <div className="absolute inset-0 bg-matrix-grid opacity-30 pointer-events-none" />
      <HeaderNav />
      <div className="flex-1 pt-24 sm:pt-28 pb-16 relative z-10">
        {children}
      </div>
      <FooterSection />
    </div>
  );
}
