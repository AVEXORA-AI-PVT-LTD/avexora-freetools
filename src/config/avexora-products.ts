/**
 * Avexora's other products, shown on /products and as the "More from Avexora"
 * cards on selected tool pages, and listed in llms.txt and the Organization
 * JSON-LD so search and answer engines connect the sites as one company.
 *
 * Copy is written from each product's live site (title, meta description,
 * hero and feature headings) as captured on PRODUCTS_CAPTURED_AT — reworded,
 * not copied, to avoid duplicate content. Refresh it when those sites change.
 */

export const PRODUCTS_CAPTURED_AT = "2026-09-24";

export interface AvexoraProduct {
  id: string;
  name: string;
  url: string;
  /** Schema.org applicationCategory. */
  category: string;
  /** Short category label shown on the card. */
  kind: string;
  tagline: string;
  description: string;
  features: string[];
  audience: string;
}

export const AVEXORA_PRODUCTS: AvexoraProduct[] = [
  {
    id: "avexcrm",
    name: "Avexora AI CRM",
    url: "https://avexcrm.com",
    category: "BusinessApplication",
    kind: "CRM",
    tagline: "A CRM and project workspace for growing businesses.",
    description:
      "Track leads, customers and deals in one place, and run projects alongside your pipeline, with plans that scale from freelancers to enterprise teams.",
    features: ["Lead and customer management", "Project management", "Freelance, Business and Enterprise plans"],
    audience: "Small businesses, freelancers and sales teams",
  },
  {
    id: "avexwa",
    name: "AvexWA",
    url: "https://avexwa.com",
    category: "CommunicationApplication",
    kind: "WhatsApp Business API",
    tagline: "WhatsApp Business API platform for broadcasts, chatbots and automation.",
    description:
      "Send WhatsApp broadcasts, deploy AI chatbots, automate customer journeys and manage every conversation from one inbox, on the official WhatsApp Cloud API. Go live in minutes.",
    features: ["WhatsApp Cloud API", "Smart broadcasts", "AI chatbots and flow automation", "Click-to-WhatsApp ads"],
    audience: "E-commerce, education, healthcare, real estate and finance teams",
  },
  {
    id: "ai-ebos",
    name: "Avexora AI EBOS",
    url: "https://ai.avexora.in",
    category: "BusinessApplication",
    kind: "AI business ecosystem",
    tagline: "From a blank page to a live funnel in minutes.",
    description:
      "An all-in-one AI business ecosystem for coaches, consultants, agencies and freelancers: 25+ AI apps under one login that help you find your niche, build a strategy and funnel, then launch and grow.",
    features: ["25+ AI apps, one login", "Niche and strategy builder", "Funnel builder", "Launch and growth tools"],
    audience: "Coaches, consultants, agencies and freelancers",
  },
  {
    id: "avexora",
    name: "Avexora AI",
    url: "https://avexora.in",
    category: "BusinessApplication",
    kind: "Enterprise AI",
    tagline: "Enterprise-grade AI systems for operations and growth.",
    description:
      "Avexora builds AI systems that automate business operations, optimise growth and turn complex data into decision-making engines, with solutions for a range of industries.",
    features: ["AI automation for operations", "Growth optimisation", "Data-driven decision systems", "Industry solutions"],
    audience: "Businesses and enterprises adopting AI",
  },
  {
    id: "voice-agents",
    name: "Avexora AI Voice Agents",
    url: "https://va.avexora.in",
    category: "CommunicationApplication",
    kind: "AI voice calling",
    tagline: "Your business phone, answered by AI in every language, every hour.",
    description:
      "Human-sounding AI voice agents answer and make calls in Hindi, English and 10+ Indian languages, record and summarise every call, and follow up on WhatsApp automatically.",
    features: ["AI voice agents in 10+ Indian languages", "Call recording and AI transcription", "Outbound campaigns", "IVR and WhatsApp follow-ups"],
    audience: "Sales, support and operations teams in India",
  },
  {
    id: "examos",
    name: "Avexora ExamOS",
    url: "https://examos.avexora.in",
    category: "EducationalApplication",
    kind: "OMR exam software",
    tagline: "AI-powered OMR scanning and exam management for schools.",
    description:
      "Design OMR sheets, scan them with AI recognition, evaluate answers automatically and analyse results, for schools, coaching centres and institutes.",
    features: ["AI OMR recognition", "Drag-and-drop OMR designer", "Automatic evaluation", "Result analytics"],
    audience: "Schools, coaching centres and institutes",
  },
];

/** A product link tagged so the destination's analytics show where the visit came from. */
export function productUrl(product: AvexoraProduct, placement: string): string {
  const url = new URL(product.url);
  url.searchParams.set("utm_source", "tools.avexora.in");
  url.searchParams.set("utm_medium", "referral");
  url.searchParams.set("utm_campaign", placement);
  return url.toString();
}

/** Avexora as a schema.org Organization, tying its sites together (sameAs). */
export const AVEXORA_ORGANIZATION = {
  "@type": "Organization",
  "@id": "https://avexora.in/#organization",
  name: "Avexora",
  url: "https://avexora.in",
  logo: "https://tools.avexora.in/logo.png",
  sameAs: ["https://tools.avexora.in", ...AVEXORA_PRODUCTS.map((p) => p.url).filter((u) => u !== "https://avexora.in")],
} as const;
