import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import { categories, EBOS_URL, SITE_NAME, SITE_URL } from "@/tools/categories";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} — 120+ Free Business Tools`,
    template: `%s | ${SITE_NAME}`,
  },
  description:
    "Free calculators, generators, PDF & image utilities and AI writing tools for your business. No sign-up, no cost — by Avexora, makers of Enterprise Business OS.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col text-slate-900" suppressHydrationWarning>
        <header className="border-b border-slate-200 print:hidden">
          <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
            <Link href="/" className="text-lg font-bold tracking-tight text-slate-900">
              Avexora <span className="text-indigo-600">Free Tools</span>
            </Link>
            <nav className="flex items-center gap-4 text-sm">
              <Link href="/#categories" className="text-slate-600 hover:text-slate-900">
                All tools
              </Link>
              <a
                href={`${EBOS_URL}?utm_source=freetools&utm_medium=header&utm_campaign=site`}
                target="_blank"
                rel="noopener"
                className="rounded-md bg-indigo-600 px-3 py-1.5 font-semibold text-white hover:bg-indigo-700"
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
              {categories.map((c) => (
                <div key={c.slug}>
                  <Link
                    href={`/${c.slug}`}
                    className="text-sm font-semibold text-slate-800 hover:text-indigo-700"
                  >
                    {c.name}
                  </Link>
                </div>
              ))}
            </div>
            <p className="mt-8 text-xs text-slate-500">
              © {new Date().getFullYear()} Avexora · freetools.avexora.in — free
              business tools by the makers of{" "}
              <a href={EBOS_URL} className="underline hover:text-slate-700">
                Enterprise Business OS
              </a>
              . Tools are provided as-is without warranty; verify important
              calculations independently.
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
