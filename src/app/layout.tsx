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
        <header className="border-b border-slate-200 print:hidden">
          <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-2 sm:py-1.5">
            <Link href="/" className="flex items-center -ml-4">
              <Image src="/logo.png" alt={SITE_NAME} width={400} height={100} className="h-12 w-auto object-contain sm:h-14" priority />
            </Link>
            <nav className="flex items-center gap-4 text-sm">
              <Link
                href="/#categories"
                className="hidden text-slate-600 hover:text-slate-900 sm:inline"
              >
                All tools
              </Link>
                            {headerLinks.map(link => (
                <a
                  key={link.id}
                  href={link.href}
                  target={link.openInNewTab ? "_blank" : undefined}
                  rel={link.openInNewTab ? "noopener noreferrer" : undefined}
                  className="hidden text-slate-600 hover:text-slate-900 sm:inline"
                >
                  {link.label}
                </a>
              ))}
              <NavAccount />

              <a
                href={`${EBOS_URL}?utm_source=avexora&utm_medium=header&utm_campaign=site`}
                target="_blank"
                rel="noopener"
                className="rounded-md bg-orange-600 px-3 py-1.5 font-semibold text-white hover:bg-orange-700"
              >
                Try EBOS
              </a>
            </nav>
          </div>
          <AdSlot placement="header" />
        </header>
        <main className="flex-1">{children}</main>
        <AdSlot placement="footer" />
        <footer className="border-t border-slate-200 bg-slate-50 print:hidden">
          <div className="mx-auto max-w-6xl px-4 py-10">
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-5">
              {categories.map((c) => (
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
                <Link
                  href="/products"
                  className="mt-1 block text-sm text-slate-600 hover:text-orange-800"
                >
                  Avexora products
                </Link>
              </div>
              {footerLinks.length > 0 && (
                <div>
                  {footerLinks.map(link => (
                    <a
                      key={link.id}
                      href={link.href}
                      target={link.openInNewTab ? "_blank" : undefined}
                      rel={link.openInNewTab ? "noopener noreferrer" : undefined}
                      className="block text-sm font-semibold text-slate-800 hover:text-orange-800 mb-1"
                    >
                      {link.label}
                    </a>
                  ))}
                </div>
              )}
            </div>
            <p className="mt-8 text-xs text-slate-500">
              © {new Date().getFullYear()} Avexora · tools.avexora.in — Avexora
              business tools by the makers of{" "}
              <a href={EBOS_URL} className="underline hover:text-slate-700">
                Enterprise Business OS
              </a>
              . Tools are provided as-is without warranty; verify important
              calculations independently.
            </p>
          </div>
        </footer>
        </AccountProviders>
      </body>
    </html>
  );
}
