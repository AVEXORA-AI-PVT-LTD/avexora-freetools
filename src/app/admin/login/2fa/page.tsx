import Link from "next/link";
import { Verify2FAForm } from "@/components/admin/auth/Verify2FAForm";

export const metadata = {
  title: "Two-Factor Authentication | Avexora Tools",
};

export default function Verify2FAPage({
  searchParams,
}: {
  searchParams: { userId?: string };
}) {
  const userId = searchParams.userId;

  if (!userId) {
    return (
      <div className="min-h-screen bg-zinc-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="w-full max-w-md mx-auto text-center">
          <p className="text-red-600">Missing user context. Please sign in again.</p>
          <Link href="/admin/login" className="mt-4 text-orange-600 hover:underline inline-block">Back to Login</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <Verify2FAForm userId={userId} />
    </div>
  );
}
