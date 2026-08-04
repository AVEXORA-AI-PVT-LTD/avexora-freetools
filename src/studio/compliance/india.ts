import {
  validateCin,
  validateGstin,
  validateLlpin,
  validatePan,
  validatePincode,
} from "./validators";

/**
 * India statutory rules for business stationery (spec 22 §4).
 *
 * This is the product's reason to exist: Canva, Looka and Vistaprint will all
 * happily produce a letterhead that puts an Indian company in breach of
 * Companies Act 2013 §12(3)(c). The rules live in a data table rather than in
 * branching code so a second jurisdiction is a new table, not a rewrite.
 *
 * NOT LEGAL ADVICE. Every surface that renders these findings must say so.
 */

export const COMPLIANCE_DISCLAIMER =
  "This is an automated formatting check, not legal advice. Statutory requirements change and depend on your specific circumstances — confirm with your company secretary or chartered accountant before relying on it.";

export type EntityType =
  | "pvt-ltd"
  | "public-ltd"
  | "opc"
  | "llp"
  | "partnership"
  | "proprietorship";

export const ENTITY_TYPES: { value: EntityType; label: string }[] = [
  { value: "pvt-ltd", label: "Private Limited Company" },
  { value: "public-ltd", label: "Public Limited Company" },
  { value: "opc", label: "One Person Company (OPC)" },
  { value: "llp", label: "Limited Liability Partnership (LLP)" },
  { value: "partnership", label: "Partnership Firm" },
  { value: "proprietorship", label: "Sole Proprietorship" },
];

export function entityLabel(type: string): string {
  return ENTITY_TYPES.find((e) => e.value === type)?.label ?? type;
}

/** Document classes the rules distinguish between. */
export type DocType =
  | "letterhead"
  | "envelope"
  | "business-card"
  | "invoice"
  | "id-card"
  | "social-post"
  | "ad"
  | "email-signature";

export type Severity = "fail" | "warn" | "info";

export interface Finding {
  id: string;
  severity: Severity;
  /** Brand field the finding is about, for deep-linking the fix. */
  field: string;
  title: string;
  detail: string;
  /** Statutory source, shown verbatim to the user. */
  citation?: string;
  /** Exposure if ignored. */
  penalty?: string;
}

export interface ComplianceResult {
  status: "pass" | "warn" | "fail";
  findings: Finding[];
  disclaimer: string;
}

/** The brand fields the compliance engine reads. */
export interface ComplianceInput {
  entityType: EntityType;
  name: string;
  legalName?: string | null;
  cin?: string | null;
  llpin?: string | null;
  gstin?: string | null;
  pan?: string | null;
  registeredAddress?: string | null;
  city?: string | null;
  state?: string | null;
  pincode?: string | null;
  phone?: string | null;
  email?: string | null;
}

const COMPANY_TYPES: EntityType[] = ["pvt-ltd", "public-ltd", "opc"];

const SECTION_12 =
  "Companies Act 2013, s.12(3)(c) — every company shall get its name, address of its registered office and Corporate Identity Number, along with telephone number and, if any, fax number, e-mail and website addresses, printed in all its business letters, billheads, letter papers and in all its notices and other official publications.";

const SECTION_12_PENALTY =
  "Default attracts a penalty of ₹1,000 for every day the default continues, up to a maximum of ₹1,00,000.";

const LLP_SECTION_21 =
  "Limited Liability Partnership Act 2008, s.21(1) — every LLP shall ensure that its invoices, correspondence and official publications bear its name, registered office address and registration number (LLPIN).";

/**
 * Documents that count as "business letters, billheads, letter papers ...
 * notices and other official publications" under s.12(3)(c).
 *
 * Business cards, ID cards and social posts are deliberately excluded: they
 * are not official publications, and flagging them would train users to
 * ignore the checker.
 */
const STATUTORY_DOCS: DocType[] = ["letterhead", "invoice"];
/** Correspondence-adjacent — good practice, not a statutory requirement. */
const ADVISORY_DOCS: DocType[] = ["envelope", "email-signature"];

export function validateStationery(
  brand: ComplianceInput,
  docType: DocType,
): ComplianceResult {
  const findings: Finding[] = [];
  const isCompany = COMPANY_TYPES.includes(brand.entityType);
  const isLlp = brand.entityType === "llp";
  const statutory = STATUTORY_DOCS.includes(docType);
  const advisory = ADVISORY_DOCS.includes(docType);
  const applies = statutory || advisory;

  // Severity for a missing mandatory particular: a hard fail on documents the
  // statute names, a warning where it is merely good practice.
  const missingSeverity: Severity = statutory ? "fail" : "warn";

  // --- name ---------------------------------------------------------------
  if (applies && !(brand.legalName ?? brand.name)?.trim()) {
    findings.push({
      id: "name-missing",
      severity: missingSeverity,
      field: "legalName",
      title: "Registered name is missing",
      detail:
        "The full registered name of the entity must appear, exactly as recorded with the registrar.",
      citation: isCompany ? SECTION_12 : isLlp ? LLP_SECTION_21 : undefined,
      penalty: isCompany && statutory ? SECTION_12_PENALTY : undefined,
    });
  }

  // --- registered office --------------------------------------------------
  if (applies && (isCompany || isLlp)) {
    if (!brand.registeredAddress?.trim()) {
      findings.push({
        id: "registered-address-missing",
        severity: missingSeverity,
        field: "registeredAddress",
        title: "Registered office address is missing",
        detail:
          "The address of the registered office — not a branch or a mailing address — must be printed on this document.",
        citation: isCompany ? SECTION_12 : LLP_SECTION_21,
        penalty: isCompany && statutory ? SECTION_12_PENALTY : undefined,
      });
    } else if (!brand.pincode?.trim()) {
      findings.push({
        id: "pincode-missing",
        severity: "warn",
        field: "pincode",
        title: "PIN code is missing from the registered office address",
        detail:
          "An address without a PIN code is incomplete for correspondence and for most registrar filings.",
      });
    }
  }

  if (brand.pincode?.trim()) {
    const pin = validatePincode(brand.pincode);
    if (!pin.valid) {
      findings.push({
        id: "pincode-invalid",
        severity: "warn",
        field: "pincode",
        title: "PIN code looks wrong",
        detail: pin.message!,
      });
    }
  }

  // --- CIN (companies) ----------------------------------------------------
  if (isCompany && applies) {
    if (!brand.cin?.trim()) {
      findings.push({
        id: "cin-missing",
        severity: missingSeverity,
        field: "cin",
        title: "CIN is missing",
        detail: `A ${entityLabel(brand.entityType)} must print its Corporate Identity Number on this document. This is the single most commonly missed requirement — and the one that carries a daily penalty.`,
        citation: SECTION_12,
        penalty: statutory ? SECTION_12_PENALTY : undefined,
      });
    } else {
      const cin = validateCin(brand.cin);
      if (!cin.valid) {
        findings.push({
          id: "cin-invalid",
          severity: "fail",
          field: "cin",
          title: "CIN format is invalid",
          detail: cin.message!,
          citation: SECTION_12,
        });
      } else {
        // Cross-check the CIN's own class segment against the declared type.
        const code = cin.parsed?.ownershipCode;
        const expected: Record<string, string[]> = {
          "pvt-ltd": ["PTC", "FTC", "GAT", "ULT"],
          "public-ltd": ["PLC", "FLC", "GAP", "ULL", "SGC", "GOI", "NPL"],
          opc: ["OPC"],
        };
        const allowed = expected[brand.entityType] ?? [];
        if (code && allowed.length > 0 && !allowed.includes(code)) {
          findings.push({
            id: "cin-entity-mismatch",
            severity: "warn",
            field: "cin",
            title: "CIN class does not match the entity type",
            detail: `You selected ${entityLabel(brand.entityType)}, but this CIN is registered as "${cin.parsed?.ownership}". One of the two is wrong.`,
            citation: SECTION_12,
          });
        }
      }
    }
  }

  // --- LLPIN (LLPs) -------------------------------------------------------
  if (isLlp && applies) {
    if (!brand.llpin?.trim()) {
      findings.push({
        id: "llpin-missing",
        severity: missingSeverity,
        field: "llpin",
        title: "LLPIN is missing",
        detail:
          "An LLP must print its registration number (LLPIN) on invoices, correspondence and official publications.",
        citation: LLP_SECTION_21,
      });
    } else {
      const llpin = validateLlpin(brand.llpin);
      if (!llpin.valid) {
        findings.push({
          id: "llpin-invalid",
          severity: "fail",
          field: "llpin",
          title: "LLPIN format is invalid",
          detail: llpin.message!,
          citation: LLP_SECTION_21,
        });
      }
    }
  }

  // --- contact details ----------------------------------------------------
  if (isCompany && statutory && !brand.phone?.trim() && !brand.email?.trim()) {
    findings.push({
      id: "contact-missing",
      severity: "warn",
      field: "phone",
      title: "No telephone number or email address",
      detail:
        "s.12(3)(c) requires the telephone number and, where they exist, the email and website addresses to be printed alongside the registered office details.",
      citation: SECTION_12,
    });
  }

  // --- GSTIN --------------------------------------------------------------
  if (brand.gstin?.trim()) {
    const gstin = validateGstin(brand.gstin);
    if (!gstin.valid) {
      findings.push({
        id: "gstin-invalid",
        severity: docType === "invoice" ? "fail" : "warn",
        field: "gstin",
        title: "GSTIN format is invalid",
        detail: gstin.message!,
      });
    }
  } else if (docType === "invoice") {
    findings.push({
      id: "gstin-missing-invoice",
      severity: "info",
      field: "gstin",
      title: "No GSTIN on this invoice",
      detail:
        "If you are registered under GST, your GSTIN must appear on every tax invoice you issue. Ignore this if you are not registered.",
    });
  }

  // --- PAN ----------------------------------------------------------------
  if (brand.pan?.trim()) {
    const pan = validatePan(brand.pan);
    if (!pan.valid) {
      findings.push({
        id: "pan-invalid",
        severity: "warn",
        field: "pan",
        title: "PAN format is invalid",
        detail: pan.message!,
      });
    }
  }

  // --- non-statutory documents -------------------------------------------
  if (!applies) {
    findings.push({
      id: "not-statutory",
      severity: "info",
      field: "",
      title: "No statutory particulars required here",
      detail: `A ${docType.replace(/-/g, " ")} is not a business letter, billhead or official publication, so s.12(3)(c) does not apply to it. Your registered particulars are still available if you want to include them.`,
    });
  }

  const status: ComplianceResult["status"] = findings.some(
    (f) => f.severity === "fail",
  )
    ? "fail"
    : findings.some((f) => f.severity === "warn")
      ? "warn"
      : "pass";

  return { status, findings, disclaimer: COMPLIANCE_DISCLAIMER };
}

/**
 * Run every document type at once — powers the brand-level compliance report
 * and the free `letterhead-compliance-checker` tool.
 */
export function auditBrand(brand: ComplianceInput): {
  status: ComplianceResult["status"];
  byDoc: Record<string, ComplianceResult>;
  disclaimer: string;
} {
  const docs: DocType[] = ["letterhead", "invoice", "envelope", "business-card"];
  const byDoc: Record<string, ComplianceResult> = {};
  for (const doc of docs) byDoc[doc] = validateStationery(brand, doc);

  const statuses = Object.values(byDoc).map((r) => r.status);
  const status = statuses.includes("fail")
    ? "fail"
    : statuses.includes("warn")
      ? "warn"
      : "pass";

  return { status, byDoc, disclaimer: COMPLIANCE_DISCLAIMER };
}

/**
 * The statutory particulars block printed at the foot of a letterhead. Returns
 * the lines to render; the layout decides typography and placement.
 */
export function statutoryLines(brand: ComplianceInput): string[] {
  const lines: string[] = [];
  const isCompany = COMPANY_TYPES.includes(brand.entityType);
  const isLlp = brand.entityType === "llp";

  const name = (brand.legalName ?? brand.name)?.trim();
  if (name) lines.push(name);

  const addressParts = [
    brand.registeredAddress?.trim(),
    [brand.city?.trim(), brand.state?.trim()].filter(Boolean).join(", "),
    brand.pincode?.trim(),
  ].filter(Boolean);
  if (addressParts.length) {
    lines.push(
      `Registered office: ${addressParts.join(", ").replace(/\n/g, ", ")}`,
    );
  }

  const ids: string[] = [];
  if (isCompany && brand.cin?.trim()) ids.push(`CIN: ${brand.cin.trim().toUpperCase()}`);
  if (isLlp && brand.llpin?.trim()) {
    // Always print the canonical hyphenated MCA form, however it was typed.
    const parsed = validateLlpin(brand.llpin);
    ids.push(`LLPIN: ${parsed.parsed?.formatted ?? brand.llpin.trim().toUpperCase()}`);
  }
  if (brand.gstin?.trim()) ids.push(`GSTIN: ${brand.gstin.trim().toUpperCase()}`);
  if (ids.length) lines.push(ids.join("  ·  "));

  const contact = [
    brand.phone?.trim() && `T: ${brand.phone.trim()}`,
    brand.email?.trim() && `E: ${brand.email.trim()}`,
  ].filter(Boolean);
  if (contact.length) lines.push(contact.join("  ·  "));

  return lines;
}
