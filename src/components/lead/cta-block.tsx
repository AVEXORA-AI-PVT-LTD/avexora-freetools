"use client";

import { submitLead } from "./client";

/**
 * EBOS module CTA (spec §4): category-specific pitch + link to the mapped
 * module with UTM params. Clicks are logged as cta_click lead events.
 */
export function CtaBlock({
  headline,
  body,
  href,
  moduleName,
  toolSlug,
  category,
}: {
  headline: string;
  body: string;
  href: string;
  moduleName: string;
  toolSlug: string;
  category: string;
}) {
  return (
    <aside className="rounded-xl bg-gradient-to-br from-orange-600 to-orange-800 p-6 text-white print:hidden">
      <p className="text-xs font-semibold uppercase tracking-wide text-orange-200">
        EBOS {moduleName} Module
      </p>
      <h2 className="mt-1 text-xl font-bold">{headline}</h2>
      <p className="mt-2 text-sm text-orange-100">{body}</p>
      <a
        href={href}
        target="_blank"
        rel="noopener"
        onClick={() => {
          void submitLead({ event: "cta_click", toolSlug, category });
        }}
        className="mt-4 inline-block rounded-md bg-white px-5 py-2.5 text-sm font-semibold text-orange-800 hover:bg-orange-50"
      >
        Explore EBOS {moduleName} →
      </a>
    </aside>
  );
}
