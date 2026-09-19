import { redirect } from "next/navigation";
import { auth } from "@/server/auth";
import { prisma } from "@/server/db";
import { OnboardingForm } from "./onboarding-form";

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
    <div className="flex min-h-[80vh] flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-slate-900">
          Welcome to Avex
        </h2>
        <p className="mt-2 text-center text-sm text-slate-600">
          Let&apos;s get your account set up.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white px-4 py-8 shadow-sm sm:rounded-lg sm:border sm:border-slate-200 sm:px-10">
          <OnboardingForm initialName={user?.name ?? ""} />
        </div>
      </div>
    </div>
  );
}
