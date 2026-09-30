import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import Image from "next/image";
import { categories, EBOS_URL, SITE_NAME, SITE_URL } from "@/tools/categories";
import AccountProviders from "@/components/account/providers";
import { NavAccount } from "@/components/account/nav-account";
import { getEffectiveNavigation } from "@/server/navigation";
import { getGlobalSeoOverride } from "@/server/seo-manager";
import { AdSlot } from "@/components/ads/ad-slot";

import { Suspense } from "react";
import { PageViewTracker } from "@/components/analytics/PageViewTracker";

import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

type OpenGraphType = Extract<NonNullable<Metadata["openGraph"]>, { type: string }>["type"];
type TwitterCard = Extract<NonNullable<Metadata["twitter"]>, { card: string }>["card"];

const DEFAULT_DESCRIPTION =
  "Free calculators, generators, PDF & image utilities and AI writing tools for your business. No sign-up, no cost — by Avexora, makers of Enterprise Business OS.";

export async function generateMetadata(): Promise<Metadata> {
  const globalSeo = await getGlobalSeoOverride();

  const title = globalSeo?.title || `${SITE_NAME} — 120+ free online tools`;
  const description = globalSeo?.description || DEFAULT_DESCRIPTION;
  const canonical = globalSeo?.canonical || SITE_URL;
  const ogImage = globalSeo?.ogImage || "/logo.png";
  
  return {
    metadataBase: new URL(SITE_URL),
    title: {
      default: title,
      template: `%s | ${SITE_NAME}`,
    },
    description,
    alternates: { canonical },
    robots: {
      index: globalSeo?.robotsIndex !== false,
      follow: globalSeo?.robotsFollow !== false,
    },
    openGraph: {
      title: globalSeo?.ogTitle || title,
      description: globalSeo?.ogDescription || description,
      url: canonical,
      siteName: SITE_NAME,
      type: (globalSeo?.ogType as OpenGraphType | undefined) || "website",
      images: [{ url: ogImage, width: 400, height: 100, alt: SITE_NAME }],
    },
    twitter: {
      card: (globalSeo?.twitterCard as TwitterCard | undefined) || "summary_large_image",
      title: globalSeo?.twitterTitle || title,
      description: globalSeo?.twitterDescription || description,
      images: [globalSeo?.twitterImage || ogImage],
    },
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const headerLinks = await getEffectiveNavigation("HEADER");
  const footerLinks = await getEffectiveNavigation("FOOTER");

  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col text-slate-900" suppressHydrationWarning>
        <AccountProviders>
          <Suspense fallback={null}>
            <PageViewTracker />
          </Suspense>
        <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/90 backdrop-blur-md transition-all print:hidden">
          <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-2 sm:py-2.5">
            <Link href="/" className="flex items-center -ml-2">
              <Image src="/logo.png" alt={SITE_NAME} width={400} height={100} className="h-11 w-auto object-contain sm:h-12" priority />
            </Link>
            <nav className="flex items-center gap-5 text-sm font-medium">
              <Link
                href="/#categories"
                className="hidden text-slate-600 hover:text-orange-600 transition-colors sm:inline"
              >
                All Tools
              </Link>
              {headerLinks.map(link => (
                <a
                  key={link.id}
                  href={link.href}
                  target={link.openInNewTab ? "_blank" : undefined}
                  rel={link.openInNewTab ? "noopener noreferrer" : undefined}
                  className="hidden text-slate-600 hover:text-orange-600 transition-colors sm:inline"
                >
                  {link.label}
                </a>
              ))}
              <NavAccount />

              <a
                href={`${EBOS_URL}?utm_source=avexora&utm_medium=header&utm_campaign=site`}
                target="_blank"
                rel="noopener"
                className="rounded-xl bg-orange-600 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-orange-700 transition-all hover:shadow-md"
              >
                Try EBOS
              </a>
            </nav>
          </div>
          <AdSlot placement="header" />
        </header>
        <main className="flex-1">{children}</main>
        <AdSlot placement="footer" />
        <footer className="border-t border-slate-200/80 bg-slate-50/70 print:hidden pt-12 pb-8">
          <div className="mx-auto max-w-6xl px-4 space-y-10">
            {/* Top Footer Brand & Privacy Badge */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200/80 pb-8">
              <div className="space-y-1">
                <Link href="/" className="flex items-center -ml-2">
                  <Image src="/logo.png" alt={SITE_NAME} width={400} height={100} className="h-10 w-auto object-contain" />
                </Link>
                <p className="text-xs text-slate-500 max-w-md leading-relaxed">
                  130+ free online tools for calculators, PDF editing, image processing & AI content. Runs 100% in your browser.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-orange-200/80 bg-orange-50 px-3 py-1 text-xs font-semibold text-orange-800">
                  <span>🔒 100% Private (No Upload)</span>
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200/80 bg-white px-3 py-1 text-xs font-semibold text-slate-700">
                  <span>⚡ Instant Execution</span>
                </span>
              </div>
            </div>

            {/* Category Links Grid */}
            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-5 text-xs">
              {categories.map((c) => (
                <div key={c.slug} className="space-y-2">
                  <Link
                    href={`/${c.slug}`}
                    className="font-bold text-slate-900 text-sm hover:text-orange-600 transition-colors block"
                  >
                    {c.name}
                  </Link>
                  <p className="text-slate-500 line-clamp-2 leading-relaxed">{c.description}</p>
                </div>
              ))}

              <div className="space-y-2">
                <span className="font-bold text-slate-900 text-sm block">Avexora Studio</span>
                <ul className="space-y-1.5 font-medium text-slate-600">
                  <li>
                    <Link href="/studio" className="hover:text-orange-600 transition-colors">
                      Brand Studio Overview
                    </Link>
                  </li>
                  <li>
                    <Link href="/studio/pricing" className="hover:text-orange-600 transition-colors">
                      Plans & Pricing
                    </Link>
                  </li>
                  <li>
                    <Link href="/products" className="hover:text-orange-600 transition-colors">
                      Avexora Products
                    </Link>
                  </li>
                </ul>
              </div>

              {footerLinks.length > 0 && (
                <div className="space-y-2">
                  <span className="font-bold text-slate-900 text-sm block">Company & Legal</span>
                  <ul className="space-y-1.5 font-medium text-slate-600">
                    {footerLinks.map(link => (
                      <li key={link.id}>
                        <a
                          href={link.href}
                          target={link.openInNewTab ? "_blank" : undefined}
                          rel={link.openInNewTab ? "noopener noreferrer" : undefined}
                          className="hover:text-orange-600 transition-colors"
                        >
                          {link.label}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Bottom Bar */}
            <div className="border-t border-slate-200/80 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
              <p>
                © {new Date().getFullYear()} Avexora · tools.avexora.in — Free business tools by{" "}
                <a href={EBOS_URL} target="_blank" rel="noopener" className="font-semibold text-orange-600 hover:underline">
                  Enterprise Business OS
                </a>
              </p>
              <p className="text-[11px] text-slate-400">
                Tools are provided as-is without warranty. Verify important tax & financial calculations.
              </p>
            </div>
          </div>
        </footer>
        </AccountProviders>
      </body>
    </html>
  );
}
