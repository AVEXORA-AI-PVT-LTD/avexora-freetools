/**
 * Centralised TDS rules for the Freelance TDS Calculator (Section 194J).
 *
 * Values apply to the Tax Year 2026-27 (Financial Year 2026-27, Assessment
 * Year 2027-28) under the Income-tax Act, 2025, which replaced the Income-tax
 * Act, 1961 from 1 April 2026. Old 1961-Act section numbers are noted against
 * the new ones. Drafting, rates and thresholds were verified against current
 * guidance for FY 2026-27 (see changes.md §14 for sources).
 */

export const FREELANCE_TDS_TAX_YEAR_LABEL = "Tax Year 2026-27 (FY 2026-27 / AY 2027-28)";

export const FREELANCE_TDS_ACT_NOTE = "Income-tax Act, 2025 — in force from 1 April 2026";

/**
 * Professional / technical fees TDS — old section 194J of the Income-tax Act,
 * 1961, renumbered as Section 393(1), Table Sl. No. 6(iii) of the Income-tax
 * Act, 2025. Deduction is required once the aggregate of amounts paid or
 * credited in the category during the tax year exceeds the threshold.
 */
export interface FreelanceTdsCategory {
  id: "professional" | "technical";
  label: string;
  /** Statutory description, shown in the tool's documentation. */
  description: string;
  /** Tax-deducted-at-source rate in percent. */
  rate: number;
  /** Income-tax return payment code used by the deductor. */
  paymentCode: string;
}

export const FREELANCE_TDS_CATEGORIES: Record<string, FreelanceTdsCategory> = {
  professional: {
    id: "professional",
    label: "Professional services",
    description:
      "Services rendered in the course of a legal, medical, engineering, architectural, accountancy, technical-consultancy, interior-decoration or advertising profession, or any other profession notified by the Board (definition of “professional services”, Section 402(28) of the 2025 Act).",
    rate: 10,
    paymentCode: "1027",
  },
  technical: {
    id: "technical",
    label: "Fees for technical services (FTS)",
    description:
      "Consideration for managerial, technical or consultancy services, including the supply of technical personnel — the FTS limb excludes professional services and non-professional services such as construction or the use of patents (Explanation to the definition of “fees for technical services”).",
    rate: 2,
    paymentCode: "1026",
  },
};

/**
 * Aggregate of amounts paid/credited in a single category during the tax year
 * up to which no TDS is deducted. Raised from ₹30,000 to ₹50,000 by the
 * Finance Act, 2025, with effect from 1 April 2025, and unchanged for the
 * 2025-Act numbering from 1 April 2026. Professional services and fees for
 * technical services are tested separately against this threshold.
 */
export const FREELANCE_TDS_THRESHOLD = 50_000;

/**
 * Rate applied when the payee does not furnish a valid PAN — Section 397(2)
 * of the 2025 Act (formerly Section 206AA): the higher of the specified rate
 * or 20%. The higher non-filer rate of old Section 206AB was eliminated from
 * 1 April 2026, so no separate non-filer step is modelled.
 */
export const FREELANCE_TDS_NO_PAN_RATE = 20;

/** Payer types with their statutory obligation to deduct 393(1) S.6(iii) TDS. */
export interface FreelanceTdsPayer {
  id: "non-individual" | "huf-specified" | "huf-exempt";
  label: string;
  /** Whether this class of payer is required to deduct the TDS. */
  deducts: boolean;
  note: string;
}

export const FREELANCE_TDS_PAYERS: Record<string, FreelanceTdsPayer> = {
  "non-individual": {
    id: "non-individual",
    label: "Company, firm or other non-individual",
    deducts: true,
    note: "Companies, firms and all non-individual payers must deduct 393(1) S.6(iii) TDS once the annual threshold in the category is crossed.",
  },
  "huf-specified": {
    id: "huf-specified",
    label: "Individual / HUF with turnover above ₹1 crore (business) or ₹50 lakh (profession) in the previous tax year",
    deducts: true,
    note: "An individual/HUF is a “specified person” once their business turnover or professional gross receipts exceed ₹1 crore / ₹50 lakh in the immediately preceding tax year (Section 393 of the 2025 Act), and must then deduct 393(1) S.6(iii) TDS.",
  },
  "huf-exempt": {
    id: "huf-exempt",
    label: "Individual / HUF below those limits, or paying you for personal purposes",
    deducts: false,
    note: "An individual/HUF whose turnover or professional receipts are within ₹1 crore / ₹50 lakh, or one paying exclusively for personal purposes, is exempt from deducting 393(1) S.6(iii) TDS.",
  },
};