import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { categories, EBOS_URL, SITE_NAME, SITE_URL } from "@/tools/categories";
import AccountProviders from "@/components/account/providers";
import { getEffectiveNavigation } from "@/server/navigation";
import { getGlobalSeoOverride } from "@/server/seo-manager";
import { AdSlot } from "@/components/ads/ad-slot";

import { Suspense } from "react";
import { PageViewTracker } from "@/components/analytics/PageViewTracker";

import "./globals.css";
import "./design3.css";

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

import { SvgSprite } from "@/components/editorial/svg-sprite";

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
      data-theme="light"
      suppressHydrationWarning
    >
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500&family=Inter+Tight:wght@400;500;600;700&family=Instrument+Serif:ital@0;1&family=JetBrains+Mono:wght@400;500;600&family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&family=Space+Grotesk:wght@500;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body suppressHydrationWarning>
        <SvgSprite />
        <AccountProviders>
          <Suspense fallback={null}>
            <PageViewTracker />
          </Suspense>
        {children}
        </AccountProviders>
      </body>
    </html>
  );
}
