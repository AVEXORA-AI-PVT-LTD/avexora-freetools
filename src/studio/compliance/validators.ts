/**
 * Format validators for Indian statutory identifiers (spec 22 §4.2).
 *
 * These are *format and checksum* checks, not registry lookups — we can prove
 * an identifier is malformed, but only the MCA/GST portal can prove a
 * well-formed one is real. Every message says which of the two it is, because
 * telling a founder their valid CIN is "invalid" would be worse than useless.
 */

export interface ValidationResult {
  valid: boolean;
  /** Present when invalid — a plain-English reason. */
  message?: string;
  /** Structured detail parsed out of a valid identifier. */
  parsed?: Record<string, string>;
}

const ok = (parsed?: Record<string, string>): ValidationResult => ({
  valid: true,
  parsed,
});
const fail = (message: string): ValidationResult => ({ valid: false, message });

export function normalise(value: string): string {
  return value.replace(/[\s-]/g, "").toUpperCase();
}

// --- PAN --------------------------------------------------------------------

const PAN_RE = /^[A-Z]{5}[0-9]{4}[A-Z]$/;

/** 4th character encodes the holder type. */
const PAN_HOLDER: Record<string, string> = {
  C: "Company",
  P: "Individual",
  H: "Hindu Undivided Family",
  F: "Firm / LLP",
  A: "Association of Persons",
  T: "Trust",
  B: "Body of Individuals",
  L: "Local Authority",
  J: "Artificial Juridical Person",
  G: "Government",
};

export function validatePan(input: string): ValidationResult {
  const pan = normalise(input);
  if (pan.length !== 10) return fail("A PAN is 10 characters long.");
  if (!PAN_RE.test(pan)) {
    return fail("A PAN looks like AAAAA0000A — five letters, four digits, one letter.");
  }
  const holder = PAN_HOLDER[pan[3]];
  if (!holder) {
    return fail(`"${pan[3]}" is not a valid holder-type character in a PAN.`);
  }
  return ok({ holderType: holder });
}

// --- GSTIN ------------------------------------------------------------------

const GST_ALPHABET = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";

export const GST_STATE_CODES: Record<string, string> = {
  "01": "Jammu & Kashmir",
  "02": "Himachal Pradesh",
  "03": "Punjab",
  "04": "Chandigarh",
  "05": "Uttarakhand",
  "06": "Haryana",
  "07": "Delhi",
  "08": "Rajasthan",
  "09": "Uttar Pradesh",
  "10": "Bihar",
  "11": "Sikkim",
  "12": "Arunachal Pradesh",
  "13": "Nagaland",
  "14": "Manipur",
  "15": "Mizoram",
  "16": "Tripura",
  "17": "Meghalaya",
  "18": "Assam",
  "19": "West Bengal",
  "20": "Jharkhand",
  "21": "Odisha",
  "22": "Chhattisgarh",
  "23": "Madhya Pradesh",
  "24": "Gujarat",
  "25": "Daman & Diu",
  "26": "Dadra & Nagar Haveli and Daman & Diu",
  "27": "Maharashtra",
  "28": "Andhra Pradesh (old)",
  "29": "Karnataka",
  "30": "Goa",
  "31": "Lakshadweep",
  "32": "Kerala",
  "33": "Tamil Nadu",
  "34": "Puducherry",
  "35": "Andaman & Nicobar Islands",
  "36": "Telangana",
  "37": "Andhra Pradesh",
  "38": "Ladakh",
  "97": "Other Territory",
  "99": "Centre Jurisdiction",
};

/**
 * GSTIN check digit: mod-36 with alternating weights 1,2 over the first 14
 * characters. Sum of (quotient + remainder) of each weighted value, then the
 * complement to the next multiple of 36.
 */
export function gstinCheckDigit(first14: string): string {
  let sum = 0;
  for (let i = 0; i < 14; i++) {
    const value = GST_ALPHABET.indexOf(first14[i]);
    if (value < 0) throw new Error(`Invalid GSTIN character: ${first14[i]}`);
    const product = value * (i % 2 === 0 ? 1 : 2);
    sum += Math.floor(product / 36) + (product % 36);
  }
  return GST_ALPHABET[(36 - (sum % 36)) % 36];
}

export function validateGstin(input: string): ValidationResult {
  const gstin = normalise(input);
  if (gstin.length !== 15) return fail("A GSTIN is 15 characters long.");
  if (!/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][0-9A-Z][Z][0-9A-Z]$/.test(gstin)) {
    return fail(
      "A GSTIN looks like 22AAAAA0000A1Z5 — state code, PAN, entity number, 'Z', check digit.",
    );
  }

  const state = GST_STATE_CODES[gstin.slice(0, 2)];
  if (!state) return fail(`"${gstin.slice(0, 2)}" is not a valid GST state code.`);

  const pan = validatePan(gstin.slice(2, 12));
  if (!pan.valid) return fail(`The PAN embedded in this GSTIN is invalid — ${pan.message}`);

  const expected = gstinCheckDigit(gstin.slice(0, 14));
  if (expected !== gstin[14]) {
    return fail(
      `Check digit mismatch — this GSTIN should end in "${expected}". Check for a typo.`,
    );
  }

  return ok({
    state,
    stateCode: gstin.slice(0, 2),
    pan: gstin.slice(2, 12),
    entityNumber: gstin[12],
  });
}

// --- CIN --------------------------------------------------------------------

/** 3-letter ownership/class segment of a CIN. */
export const CIN_OWNERSHIP: Record<string, string> = {
  PLC: "Public Limited Company",
  PTC: "Private Limited Company",
  OPC: "One Person Company",
  FLC: "Financial Lease Company (Public)",
  FTC: "Subsidiary of a Foreign Company",
  GAP: "General Association Public",
  GAT: "General Association Private",
  SGC: "State Government Company",
  GOI: "Union Government Company",
  NPL: "Not-for-Profit (Section 8)",
  ULL: "Unlimited Liability (Public)",
  ULT: "Unlimited Liability (Private)",
};

export const CIN_STATE_CODES = new Set([
  "AP", "AR", "AS", "BR", "CH", "CT", "DL", "DN", "GA", "GJ", "HP", "HR",
  "JH", "JK", "KA", "KL", "LD", "MH", "ML", "MN", "MP", "MZ", "NL", "OR",
  "PB", "PY", "RJ", "SK", "TG", "TN", "TR", "UP", "UR", "UT", "WB", "AN",
]);

const CIN_RE = /^([LU])(\d{5})([A-Z]{2})(\d{4})([A-Z]{3})(\d{6})$/;

export function validateCin(input: string): ValidationResult {
  const cin = normalise(input);
  if (cin.length !== 21) return fail("A CIN is 21 characters long.");

  const m = CIN_RE.exec(cin);
  if (!m) {
    return fail(
      "A CIN looks like U72900KA2020PTC123456 — listing status, 5-digit industry code, state, year, company class, registration number.",
    );
  }

  const [, listing, industry, state, year, ownership, regNo] = m;

  if (!CIN_STATE_CODES.has(state)) {
    return fail(`"${state}" is not a recognised state code in a CIN.`);
  }

  const yearNum = Number(year);
  const thisYear = new Date().getFullYear();
  if (yearNum < 1857 || yearNum > thisYear) {
    return fail(`"${year}" is not a plausible incorporation year.`);
  }

  const ownershipName = CIN_OWNERSHIP[ownership];
  if (!ownershipName) {
    return fail(`"${ownership}" is not a recognised company class in a CIN.`);
  }

  return ok({
    listing: listing === "L" ? "Listed" : "Unlisted",
    industryCode: industry,
    state,
    year,
    ownership: ownershipName,
    ownershipCode: ownership,
    registrationNumber: regNo,
  });
}

// --- LLPIN ------------------------------------------------------------------

const LLPIN_RE = /^[A-Z]{3}\d{4}$/;

export function validateLlpin(input: string): ValidationResult {
  const llpin = normalise(input);
  if (!LLPIN_RE.test(llpin)) {
    return fail("An LLPIN looks like AAB-1234 — three letters and four digits.");
  }
  return ok({ formatted: `${llpin.slice(0, 3)}-${llpin.slice(3)}` });
}

// --- shared -----------------------------------------------------------------

export function validatePincode(input: string): ValidationResult {
  const pin = normalise(input);
  if (!/^[1-9]\d{5}$/.test(pin)) {
    return fail("An Indian PIN code is 6 digits and cannot start with 0.");
  }
  return ok();
}
