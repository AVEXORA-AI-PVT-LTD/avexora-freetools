import Link from "next/link";

/**
 * Deliberately does not call `auth()`.
 *
 * The marketing pages under /studio are the primary SEO surface for the
 * compliance-intent keywords the whole funnel depends on, and reading the
 * session here would force every page in the segment to render dynamically.
 * The nav link points at /studio/app, which redirects to sign-in when needed —
 * so the header works for both states without costing us static rendering.
 */
export default function StudioLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col">
      <div className="border-b border-slate-200 bg-slate-50 print:hidden">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-2">
          <Link
            href="/studio"
            className="flex items-center gap-2 text-sm font-semibold text-slate-900"
          >
            <span className="rounded bg-orange-600 px-1.5 py-0.5 text-xs font-bold text-white">
              Studio
            </span>
            Brand Studio
          </Link>
          <nav className="flex items-center gap-4 text-sm">
            <Link href="/studio/pricing" className="text-slate-600 hover:text-slate-900">
              Pricing
            </Link>
            <Link
              href="/studio/app"
              className="rounded-md bg-orange-600 px-3 py-1.5 font-medium text-white hover:bg-orange-700"
            >
              Dashboard
            </Link>
          </nav>
        </div>
      </div>
      {children}
    </div>
  );
}
