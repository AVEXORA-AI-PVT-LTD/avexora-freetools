import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Check your email",
  robots: { index: false },
};

export default function CheckEmailPage() {
  return (
    <main className="mx-auto max-w-md px-4 py-16">
      <h1 className="text-2xl font-bold tracking-tight text-slate-900">
        Check your email
      </h1>
      <p className="mt-3 text-sm text-slate-600">
        We&apos;ve sent you a sign-in link. It expires in 24 hours and can only be
        used once.
      </p>
      <p className="mt-4 text-sm text-slate-500">
        Nothing arrived? Check spam, then try again from the sign-in page.
      </p>
    </main>
  );
}
