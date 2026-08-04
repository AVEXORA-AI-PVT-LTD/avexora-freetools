import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { currentUserId } from "@/server/auth";
import { OnboardingWizard } from "@/components/studio/onboarding-wizard";

export const metadata: Metadata = {
  title: "Create a brand",
  robots: { index: false },
};

export default async function NewBrandPage() {
  const userId = await currentUserId();
  if (!userId) redirect("/studio/signin?next=/studio/app/new");

  return (
    <main className="mx-auto max-w-4xl px-4 py-10">
      <OnboardingWizard />
    </main>
  );
}
