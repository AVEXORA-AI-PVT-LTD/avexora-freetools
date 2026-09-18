import { redirect } from "next/navigation";
import { currentUserId } from "@/server/auth";
import { prisma } from "@/server/db";

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

  return <>{children}</>;
}
