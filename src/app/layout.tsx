import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import Image from "next/image";
import { EBOS_URL, SITE_NAME, SITE_OG_IMAGE, SITE_URL } from "@/tools/categories";
import { getEffectiveCategories } from "@/server/categories";
import { DISPLAYED_TOOL_COUNT } from "@/tools/registry";
import AccountProviders from "@/components/account/providers";
import { NavAccount } from "@/components/account/nav-account";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const DEFAULT_DESCRIPTION =
  "Free calculators, generators, PDF & image utilities and AI writing tools for your business. No sign-up, no cost — by Avexora, makers of Enterprise Business OS.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} — ${DISPLAYED_TOOL_COUNT}+ Avex Business Tools`,
    template: `%s | ${SITE_NAME}`,
  },
  description: DEFAULT_DESCRIPTION,
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    title: `${SITE_NAME} — ${DISPLAYED_TOOL_COUNT}+ Avex Business Tools`,
    description: DEFAULT_DESCRIPTION,
    url: "/",
    images: [SITE_OG_IMAGE],
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE_NAME} — ${DISPLAYED_TOOL_COUNT}+ Avex Business Tools`,
    description: DEFAULT_DESCRIPTION,
    images: [SITE_OG_IMAGE],
  },
};



export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const effectiveCategories = await getEffectiveCategories();

  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col text-slate-900" suppressHydrationWarning>
        <AccountProviders>
          <header className="border-b border-slate-200 print:hidden">
            <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-2 sm:py-1.5">
              <Link href="/" className="flex items-center -ml-4">
                <Image src="/logo.png" alt="Avex Tools" width={400} height={100} className="h-12 w-auto object-contain sm:h-14" priority />
              </Link>
              <nav className="flex items-center gap-4 text-sm">
                <Link
                  href="/#categories"
                  className="hidden text-slate-600 hover:text-slate-900 sm:inline"
                >
                  All tools
                </Link>
                <NavAccount />
                <a
                  href={`${EBOS_URL}?utm_source=avextools&utm_medium=header&utm_campaign=site`}
                  target="_blank"
                  rel="noopener"
                  className="rounded-md bg-orange-600 px-3 py-1.5 font-semibold text-white hover:bg-orange-700"
                >
                  Try EBOS
                </a>
              </nav>
            </div>
          </header>
          <main className="flex-1">{children}</main>
          <footer className="border-t border-slate-200 bg-slate-50 print:hidden">
            <div className="mx-auto max-w-6xl px-4 py-10">
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-5">
                {effectiveCategories.map((c) => (
                  <div key={c.slug}>
                    <Link
                      href={`/${c.slug}`}
                      className="text-sm font-semibold text-slate-800 hover:text-orange-800"
                    >
                      {c.name}
                    </Link>
                  </div>
                ))}
                <div>
                  <Link
                    href="/studio"
                    className="text-sm font-semibold text-slate-800 hover:text-orange-800"
                  >
                    Brand Studio
                  </Link>
                  <Link
                    href="/studio/pricing"
                    className="mt-1 block text-sm text-slate-600 hover:text-orange-800"
                  >
                    Studio pricing
                  </Link>
                </div>
                <div className="lg:col-start-5 sm:col-start-2">
                  <Link
                    href="/admin"
                    className="text-sm font-semibold text-slate-400 hover:text-slate-600 tracking-wider text-[10px]"
                  >
                    admin panel
                  </Link>
                </div>
              </div>
              <div className="mt-8 flex flex-col gap-4">
                <nav className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
                  <Link href="/privacy-policy" className="hover:text-slate-700 hover:underline">
                    Privacy Policy
                  </Link>
                  <Link href="/terms" className="hover:text-slate-700 hover:underline">
                    Terms &amp; Conditions
                  </Link>
                  <Link href="/refund-policy" className="hover:text-slate-700 hover:underline">
                    Refund Policy
                  </Link>
                </nav>
                <p className="text-xs text-slate-500">
                  © {new Date().getFullYear()} Avexora · {new URL(SITE_URL).host} — Avexora Tools, by Avexora, provides practical online business tools. By the makers of{" "}
                  <a href={EBOS_URL} className="underline hover:text-slate-700">
                    Enterprise Business OS
                  </a>
                  . Tools are provided as-is without warranty; verify important
                  calculations independently.
                </p>
              </div>
            </div>
        </footer>
        </AccountProviders>
      </body>
    </html>
  );
}
