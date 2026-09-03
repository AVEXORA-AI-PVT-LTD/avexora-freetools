/**
 * The stationery set Brand Studio produces.
 *
 * Single source of truth: the `/studio` landing page and the homepage section
 * both read from here so the two surfaces can never advertise different sets.
 */
export interface StudioAsset {
  name: string;
  detail: string;
}

export const STUDIO_ASSETS: StudioAsset[] = [
  { name: "Logo suite", detail: "SVG, PNG, mono, reversed — four layouts" },
  { name: "Letterhead", detail: "A4 with the statutory footer block" },
  { name: "Envelopes", detail: "DL, C5 and C4 with bleed and crop marks" },
  { name: "Visiting cards", detail: "89 × 54 mm — the Indian standard size" },
  {
    name: "Employee ID cards",
    detail: "CR80 badges with vCard QR, generated in batches",
  },
  { name: "Social posts", detail: "Square, portrait, story and link-preview sizes" },
  { name: "Ad creatives", detail: "Meta feed and Google Display units" },
  { name: "Email signatures", detail: "Inline-styled HTML that survives Outlook" },
];
