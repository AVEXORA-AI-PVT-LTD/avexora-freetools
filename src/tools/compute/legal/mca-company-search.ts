import type { ComputeFn } from "@/types/tools";
import {
  validateCin,
  validateLlpin,
  CIN_OWNERSHIP,
  CIN_STATE_CODES,
  normalise,
} from "@/studio/compliance/validators";

export const ROC_OFFICES: Record<
  string,
  { stateName: string; rocOffice: string; addressSummary: string }
> = {
  AP: { stateName: "Andhra Pradesh", rocOffice: "RoC Vijayawada", addressSummary: "Vijayawada, Andhra Pradesh" },
  AR: { stateName: "Arunachal Pradesh", rocOffice: "RoC Shillong (NE)", addressSummary: "Shillong, Meghalaya" },
  AS: { stateName: "Assam", rocOffice: "RoC Guwahati / Shillong", addressSummary: "Guwahati, Assam" },
  BR: { stateName: "Bihar", rocOffice: "RoC Patna", addressSummary: "Maurya Lok Complex, Patna, Bihar" },
  CH: { stateName: "Chandigarh", rocOffice: "RoC Chandigarh", addressSummary: "Sector 17-A, Chandigarh" },
  CT: { stateName: "Chhattisgarh", rocOffice: "RoC Bilaspur / Chhattisgarh", addressSummary: "Bilaspur, Chhattisgarh" },
  DL: { stateName: "Delhi", rocOffice: "RoC Delhi & Haryana", addressSummary: "IFCI Tower, Nehru Place, New Delhi" },
  DN: { stateName: "Dadra and Nagar Haveli", rocOffice: "RoC Ahmedabad / Mumbai", addressSummary: "Ahmedabad / Mumbai" },
  GA: { stateName: "Goa", rocOffice: "RoC Goa", addressSummary: "Panaji, Goa" },
  GJ: { stateName: "Gujarat", rocOffice: "RoC Ahmedabad", addressSummary: "ROC Bhavan, Naranpura, Ahmedabad" },
  HP: { stateName: "Himachal Pradesh", rocOffice: "RoC Chandigarh", addressSummary: "Chandigarh" },
  HR: { stateName: "Haryana", rocOffice: "RoC Delhi & Haryana", addressSummary: "Manesar / New Delhi" },
  JH: { stateName: "Jharkhand", rocOffice: "RoC Ranchi", addressSummary: "Mangal Tower, Ranchi, Jharkhand" },
  JK: { stateName: "Jammu and Kashmir", rocOffice: "RoC Jammu & Kashmir", addressSummary: "Srinagar / Jammu" },
  KA: { stateName: "Karnataka", rocOffice: "RoC Bangalore", addressSummary: "Kendriya Sadan, Koramangala, Bengaluru" },
  KL: { stateName: "Kerala", rocOffice: "RoC Ernakulam / Kochi", addressSummary: "Company Law Bhavan, Kochi, Kerala" },
  LD: { stateName: "Lakshadweep", rocOffice: "RoC Ernakulam", addressSummary: "Kochi, Kerala" },
  MH: { stateName: "Maharashtra", rocOffice: "RoC Mumbai / Pune", addressSummary: "100 Everest, Marine Drive, Mumbai" },
  ML: { stateName: "Meghalaya", rocOffice: "RoC Shillong", addressSummary: "Morellow Compound, Shillong" },
  MN: { stateName: "Manipur", rocOffice: "RoC Shillong", addressSummary: "Shillong, Meghalaya" },
  MP: { stateName: "Madhya Pradesh", rocOffice: "RoC Gwalior", addressSummary: "Sanjay Complex, Gwalior, MP" },
  MZ: { stateName: "Mizoram", rocOffice: "RoC Shillong", addressSummary: "Shillong, Meghalaya" },
  NL: { stateName: "Nagaland", rocOffice: "RoC Shillong", addressSummary: "Shillong, Meghalaya" },
  OD: { stateName: "Odisha", rocOffice: "RoC Cuttack", addressSummary: "Chalchitra Bhawan, Cuttack, Odisha" },
  OR: { stateName: "Odisha", rocOffice: "RoC Cuttack", addressSummary: "Chalchitra Bhawan, Cuttack, Odisha" },
  PB: { stateName: "Punjab", rocOffice: "RoC Chandigarh (Punjab)", addressSummary: "Sector 17, Chandigarh" },
  PY: { stateName: "Puducherry", rocOffice: "RoC Chennai / Puducherry", addressSummary: "Shastri Bhavan, Chennai" },
  RJ: { stateName: "Rajasthan", rocOffice: "RoC Jaipur", addressSummary: "Corporate Bhawan, Jhalana Doongri, Jaipur" },
  SK: { stateName: "Sikkim", rocOffice: "RoC Shillong / Kolkata", addressSummary: "Shillong / Kolkata" },
  TG: { stateName: "Telangana", rocOffice: "RoC Hyderabad", addressSummary: "Kendriya Sadan, Sultan Bazar, Hyderabad" },
  TS: { stateName: "Telangana", rocOffice: "RoC Hyderabad", addressSummary: "Kendriya Sadan, Sultan Bazar, Hyderabad" },
  TN: { stateName: "Tamil Nadu", rocOffice: "RoC Chennai / Coimbatore", addressSummary: "Shastri Bhavan, Haddows Road, Chennai" },
  TR: { stateName: "Tripura", rocOffice: "RoC Shillong", addressSummary: "Shillong, Meghalaya" },
  CG: { stateName: "Chhattisgarh", rocOffice: "RoC Bilaspur / Chhattisgarh", addressSummary: "Bilaspur, Chhattisgarh" },
  LA: { stateName: "Ladakh", rocOffice: "RoC Jammu & Kashmir / Ladakh", addressSummary: "Jammu / Srinagar" },
  UP: { stateName: "Uttar Pradesh", rocOffice: "RoC Kanpur", addressSummary: "Westcott Building, MG Road, Kanpur, UP" },
  UR: { stateName: "Uttarakhand", rocOffice: "RoC Uttarakhand", addressSummary: "Mile Stone Building, Dehradun, Uttarakhand" },
  UT: { stateName: "Uttarakhand (Old code)", rocOffice: "RoC Uttarakhand", addressSummary: "Dehradun, Uttarakhand" },
  WB: { stateName: "West Bengal", rocOffice: "RoC Kolkata", addressSummary: "Nizam Palace, 234/4 AJC Bose Road, Kolkata" },
  AN: { stateName: "Andaman & Nicobar Islands", rocOffice: "RoC Kolkata", addressSummary: "Kolkata, West Bengal" },
};

export const NIC_DIVISIONS: Record<string, string> = {
  "01": "Crop & Animal Production, Agriculture",
  "10": "Manufacture of Food Products",
  "11": "Manufacture of Beverages",
  "13": "Manufacture of Textiles",
  "14": "Manufacture of Wearing Apparel & Garments",
  "15": "Manufacture of Leather & Related Products",
  "20": "Manufacture of Chemicals & Chemical Products",
  "21": "Pharmaceuticals, Medicines & Botanical Products",
  "25": "Manufacture of Fabricated Metal Products",
  "26": "Computer, Electronic & Optical Products",
  "27": "Manufacture of Electrical Equipment",
  "28": "Manufacture of Machinery & Equipment",
  "29": "Motor Vehicles, Trailers & Semi-trailers",
  "35": "Electricity, Gas, Steam & Renewable Energy",
  "41": "Construction of Buildings & Real Estate Development",
  "42": "Civil Engineering & Infrastructure Projects",
  "43": "Specialized Construction Activities",
  "45": "Trade & Repair of Motor Vehicles",
  "46": "Wholesale Trade (B2B Distribution)",
  "47": "Retail Trade (Consumer Goods, E-Commerce)",
  "49": "Land Transport & Freight Logistics",
  "50": "Water Transport & Shipping",
  "51": "Air Transport & Aviation",
  "52": "Warehousing & Supply Chain Support",
  "53": "Postal, Courier & Delivery Activities",
  "55": "Hospitality (Hotels, Resorts & Accommodation)",
  "56": "Food & Beverage Services (Restaurants & Cloud Kitchens)",
  "58": "Publishing Activities (Media, Software, Books)",
  "59": "Motion Picture, Video, OTT & Audio Production",
  "60": "Broadcasting & Programming Activities",
  "61": "Telecommunications & Network Services",
  "62": "Computer Programming, Software & IT Consultancy",
  "63": "Information Technology Services, Data Hosting & Web Portals",
  "64": "Financial Services (Banking, NBFC, Lending, Fintech)",
  "65": "Insurance, Reinsurance & Pension Funding",
  "66": "Auxiliary Financial & Investment Advisory Activities",
  "68": "Real Estate Activities (Leasing, Brokerage, Property Management)",
  "69": "Legal & Accounting Professional Activities",
  "70": "Head Offices & Management Consultancy Activities",
  "71": "Architecture, Engineering & Technical Testing",
  "72": "Scientific Research & Development / IT Services (Legacy NIC)",
  "73": "Advertising, Branding & Market Research",
  "74": "Other Professional, Scientific & Technical Activities",
  "77": "Rental & Equipment Leasing Activities",
  "78": "Employment Activities (Staffing, HR & Recruitment)",
  "79": "Travel Agency, Tour Operators & Tourism Services",
  "80": "Security, Facility Management & Investigation",
  "82": "BPO, KPO, Customer Support & Office Administration",
  "85": "Education, EdTech & Skill Development Institutes",
  "86": "Healthcare, Hospitals, Diagnostics & Clinics",
  "90": "Creative, Arts, Entertainment & Live Events",
  "93": "Sports, Fitness, Gaming & Amusement Activities",
  "96": "Other Personal Service Activities (Salons, Wellness)",
};

export const COMMON_NIC_CODES: Record<string, string> = {
  "72200": "Software publishing, consultancy and supply",
  "72900": "Other computer related activities (IT & Software Services)",
  "62011": "Writing, modifying, testing of computer program to meet the needs of a particular client",
  "62013": "Providing software support and maintenance to the clients",
  "62020": "Computer consultancy and computer facilities management activities",
  "62099": "Other information technology and computer service activities",
  "63111": "Data processing activities including hosting",
  "74140": "Business and management consultancy activities",
  "70200": "Management consultancy activities",
  "51909": "Wholesale of other machinery, equipment and supplies",
  "46900": "Non-specialized wholesale trade",
  "47912": "Retail sale of any kind of product ordered via internet (E-commerce)",
  "74300": "Advertising (Agency, creative campaigns, media planning)",
  "74909": "Other professional, scientific and technical activities n.e.c.",
};

export interface CompanyRecord {
  cin: string;
  name: string;
  aliases: string[];
  state: string;
  roc: string;
  year: number;
  class: string;
  listingStatus: string;
  industry: string;
  status: string;
  address?: string;
  paidUpCapital?: string;
  authorizedCapital?: string;
}

export const INDIAN_COMPANIES_REGISTRY: CompanyRecord[] = [];

/**
 * Searches the registry of companies by name or alias
 */
export function searchCompaniesByName(query: string): CompanyRecord[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];

  const tokens = q.split(/\s+/).filter(Boolean);

  return INDIAN_COMPANIES_REGISTRY.filter((comp) => {
    const fullName = comp.name.toLowerCase();
    const allAliases = comp.aliases.map((a) => a.toLowerCase());

    // Exact or direct substring match
    if (fullName.includes(q)) return true;
    if (allAliases.some((a) => a.includes(q) || q.includes(a))) return true;

    // Token matching: all tokens match somewhere in name or aliases
    const matchesAllTokens = tokens.every((token) =>
      fullName.includes(token) || allAliases.some((a) => a.includes(token))
    );
    if (matchesAllTokens) return true;

    return false;
  }).sort((a, b) => {
    // Exact prefix ranking
    const aStartsWith = a.name.toLowerCase().startsWith(q);
    const bStartsWith = b.name.toLowerCase().startsWith(q);
    if (aStartsWith && !bStartsWith) return -1;
    if (!aStartsWith && bStartsWith) return 1;
    return a.name.localeCompare(b.name);
  });
}

/**
 * Looks up a company in the registry by its exact 21-digit CIN
 */
export function lookupCompanyByCin(cin: string): CompanyRecord | undefined {
  const clean = normalise(cin);
  return INDIAN_COMPANIES_REGISTRY.find((comp) => comp.cin === clean);
}

export interface DecodedCinResult {
  cin: string;
  isValid: boolean;
  message?: string;
  companyName?: string;
  companyStatus?: string;
  listingStatus?: string;
  industryCode?: string;
  industryName?: string;
  stateCode?: string;
  stateName?: string;
  rocOffice?: string;
  rocAddress?: string;
  yearOfIncorporation?: string;
  companyAge?: number;
  companyClass?: string;
  classCode?: string;
  registrationNumber?: string;
  panHolderType?: string;
  registeredAddress?: string;
  authorizedCapital?: string;
  paidUpCapital?: string;
  complianceDueDates?: { form: string; purpose: string; deadline: string }[];
  statutoryNotice?: string;
  mcaMasterDataUrl: string;
}

export function decodeCin(input: string): DecodedCinResult {
  const cin = normalise(input);
  const mcaMasterDataUrl = `https://www.mca.gov.in/content/mca/global/en/mca/master-data/MDS.html`;

  if (cin.length !== 21) {
    return {
      cin,
      isValid: false,
      message: `A Corporate Identification Number (CIN) must be exactly 21 alphanumeric characters. Entered length: ${cin.length}.`,
      mcaMasterDataUrl,
    };
  }

  const result = validateCin(cin);
  if (!result.valid || !result.parsed) {
    return {
      cin,
      isValid: false,
      message: result.message ?? "The entered CIN does not match the statutory MCA format.",
      mcaMasterDataUrl,
    };
  }

  const { listing, industryCode, state, year, ownership, ownershipCode, registrationNumber } =
    result.parsed;

  const roc = ROC_OFFICES[state] ?? {
    stateName: state,
    rocOffice: `RoC ${state}`,
    addressSummary: state,
  };

  const divCode = industryCode.slice(0, 2);
  const industryName =
    COMMON_NIC_CODES[industryCode] ??
    NIC_DIVISIONS[divCode] ??
    `Division ${divCode} Industrial Activities`;

  const currentYear = new Date().getFullYear();
  const incYear = parseInt(year, 10);
  const companyAge = currentYear - incYear;

  const isPvt = ownershipCode === "PTC" || ownershipCode === "OPC";
  const isSection8 = ownershipCode === "NPL";

  const complianceDueDates = [
    {
      form: isPvt ? "AOC-4 / AOC-4 XBRL" : "AOC-4 XBRL",
      purpose: "Filing of Audited Balance Sheet & Profit and Loss Statement with RoC",
      deadline: "Within 30 days of Annual General Meeting (typically 29 October)",
    },
    {
      form: ownershipCode === "OPC" ? "MGT-7A (Small/OPC)" : "MGT-7 (Annual Return)",
      purpose: "Filing of Company Annual Return with RoC",
      deadline: "Within 60 days of Annual General Meeting (typically 29 November)",
    },
    {
      form: "DIR-3 KYC / DIR-3 KYC-WEB",
      purpose: "Annual Director KYC for all directors holding approved DIN",
      deadline: "30 September of every financial year (₹5,000 late fee if missed)",
    },
    {
      form: "DPT-3",
      purpose: "Return of Deposits and outstanding loans/receipts not treated as deposits",
      deadline: "30 June of every financial year",
    },
    {
      form: "MSME-1",
      purpose: "Half-yearly return for outstanding dues to Micro & Small enterprises >45 days",
      deadline: "30 April (for Oct-Mar) & 31 October (for Apr-Sep)",
    },
  ];

  const matched = lookupCompanyByCin(cin);

  return {
    cin,
    isValid: true,
    companyName: matched?.name,
    companyStatus: matched?.status ?? "Active (Presumed)",
    listingStatus: listing === "Listed" ? "Listed on Stock Exchange" : "Unlisted Corporate Entity",
    industryCode,
    industryName: matched ? matched.industry : industryName,
    stateCode: state,
    stateName: roc.stateName,
    rocOffice: roc.rocOffice,
    rocAddress: roc.addressSummary,
    yearOfIncorporation: year,
    companyAge: companyAge >= 0 ? companyAge : 0,
    companyClass: matched?.class ?? ownership,
    classCode: ownershipCode,
    registrationNumber,
    panHolderType: "Company (4th letter 'C' in Income Tax PAN)",
    registeredAddress: matched?.address,
    authorizedCapital: matched?.authorizedCapital,
    paidUpCapital: matched?.paidUpCapital,
    complianceDueDates,
    statutoryNotice:
      "Section 12(3)(c) of the Companies Act 2013 mandates printing this CIN, company name, registered office, phone and email on all letterheads, invoices and official billheads. Default attracts ₹1,000/day up to ₹1,00,000 penalty.",
    mcaMasterDataUrl,
  };
}

export interface DecodedLlpinResult {
  llpin: string;
  isValid: boolean;
  formatted?: string;
  message?: string;
  mcaMasterDataUrl: string;
  complianceDueDates?: { form: string; purpose: string; deadline: string }[];
  statutoryNotice?: string;
}

export function decodeLlpin(input: string): DecodedLlpinResult {
  const llpin = normalise(input);
  const mcaMasterDataUrl = `https://www.mca.gov.in/content/mca/global/en/mca/master-data/MDS.html`;

  const result = validateLlpin(llpin);
  if (!result.valid) {
    return {
      llpin,
      isValid: false,
      message: result.message ?? "An LLPIN must look like AAB-1234 (three letters and four digits).",
      mcaMasterDataUrl,
    };
  }

  const formatted = result.parsed?.formatted ?? `${llpin.slice(0, 3)}-${llpin.slice(3)}`;

  return {
    llpin,
    isValid: true,
    formatted,
    complianceDueDates: [
      {
        form: "LLP Form 11",
        purpose: "Annual Return of Limited Liability Partnership",
        deadline: "On or before 30 May (within 60 days of FY close)",
      },
      {
        form: "LLP Form 8",
        purpose: "Statement of Account & Solvency",
        deadline: "On or before 30 October (within 30 days from 6 months of FY close)",
      },
      {
        form: "DIR-3 KYC",
        purpose: "Annual KYC of all Designated Partners holding DIN/DPIN",
        deadline: "On or before 30 September of every financial year",
      },
    ],
    statutoryNotice:
      "Section 21 of the LLP Act 2008 mandates printing the registered name, registered office address, and LLPIN on all invoices, letters, and official publications.",
    mcaMasterDataUrl,
  };
}

export function validateDinNumber(input: string): {
  din: string;
  isValid: boolean;
  message?: string;
  explanation?: string;
} {
  const clean = input.trim();
  if (!/^\d{8}$/.test(clean)) {
    return {
      din: clean,
      isValid: false,
      message: "A Director Identification Number (DIN) must be exactly 8 numerical digits (e.g. 01234567).",
    };
  }

  return {
    din: clean,
    isValid: true,
    explanation:
      "Valid 8-digit DIN format. DIN is a lifetime unique identification number assigned by the Ministry of Corporate Affairs under Sections 153 & 154 of the Companies Act 2013. The director must complete annual DIR-3 KYC by 30 September each year to keep the DIN active.",
  };
}

export const RESTRICTED_MCA_WORDS = [
  { word: "NATIONAL", reason: "Requires prior approval from Central Government under Companies (Incorporation) Rules 2014." },
  { word: "FEDERAL", reason: "Suggests patronage of the Central or State Government." },
  { word: "UNION", reason: "Suggests government affiliation unless genuinely authorized." },
  { word: "REPUBLIC", reason: "Suggests association with sovereign government organs." },
  { word: "PRIME MINISTER", reason: "Prohibited under Emblems and Names (Prevention of Improper Use) Act, 1950." },
  { word: "PRESIDENT", reason: "Prohibited under Emblems and Names Act." },
  { word: "BHARAT", reason: "Often scrutinized for national connotation; requires distinctiveness." },
  { word: "BANK", reason: "Requires prior No Objection Certificate (NOC) from Reserve Bank of India (RBI)." },
  { word: "BANKING", reason: "Restricted without RBI banking license / NOC." },
  { word: "INSURANCE", reason: "Requires prior approval/NOC from IRDAI." },
  { word: "ASSURANCE", reason: "Requires prior approval/NOC from IRDAI." },
  { word: "STOCK EXCHANGE", reason: "Requires prior approval from SEBI." },
  { word: "MUTUAL FUND", reason: "Requires prior registration with SEBI." },
  { word: "CHARTERED ACCOUNTANT", reason: "Restricted under Chartered Accountants Act, 1949." },
  { word: "ADVOCATE", reason: "Restricted by Bar Council of India regulations." },
  { word: "COMMISSION", reason: "Suggests government commission or statutory tribunal." },
  { word: "AUTHORITY", reason: "Suggests government or statutory regulatory authority." },
  { word: "BUREAU", reason: "Suggests government investigatory or administrative body." },
];

export interface NameAnalysisResult {
  name: string;
  isValid: boolean;
  findings: { type: "success" | "warning" | "error"; message: string }[];
  suggestedSuffix?: string;
}

export function analyzeCompanyName(
  nameInput: string,
  entityType: "pvt-ltd" | "public-ltd" | "opc" | "llp" = "pvt-ltd"
): NameAnalysisResult {
  const name = nameInput.trim();
  const findings: { type: "success" | "warning" | "error"; message: string }[] = [];

  if (name.length < 3) {
    findings.push({
      type: "error",
      message: "Company name is too short. It must be at least 3 characters long.",
    });
    return { name, isValid: false, findings };
  }

  const upper = name.toUpperCase();

  // Check suffix
  const requiredSuffixes: Record<typeof entityType, string[]> = {
    "pvt-ltd": ["PVT LTD", "PVT. LTD.", "PRIVATE LIMITED", "PRIVATE LIMITED COMPANY"],
    "public-ltd": ["LIMITED", "LTD", "LTD."],
    opc: ["(OPC) PRIVATE LIMITED", "OPC PRIVATE LIMITED", "(OPC) PVT LTD", "ONE PERSON COMPANY"],
    llp: ["LLP", "LIMITED LIABILITY PARTNERSHIP"],
  };

  const hasSuffix = requiredSuffixes[entityType].some((s) => upper.endsWith(s));
  const recommendedSuffix =
    entityType === "pvt-ltd"
      ? "Private Limited"
      : entityType === "opc"
      ? "(OPC) Private Limited"
      : entityType === "llp"
      ? "LLP"
      : "Limited";

  if (!hasSuffix) {
    findings.push({
      type: "warning",
      message: `Statutory suffix missing: For a ${entityType.toUpperCase().replace("-", " ")}, the name filed in SPICe+ Part A must conclude with "${recommendedSuffix}".`,
    });
  } else {
    findings.push({
      type: "success",
      message: `Proper statutory suffix detected ("${recommendedSuffix}").`,
    });
  }

  // Check restricted words
  let hasRestricted = false;
  for (const item of RESTRICTED_MCA_WORDS) {
    const regex = new RegExp(`\\b${item.word}\\b`, "i");
    if (regex.test(upper)) {
      findings.push({
        type: "error",
        message: `Restricted Word Detected: "${item.word}" — ${item.reason}`,
      });
      hasRestricted = true;
    }
  }

  if (!hasRestricted) {
    findings.push({
      type: "success",
      message: "No prohibited or restricted words from the Emblems & Names Act or sectoral regulators detected.",
    });
  }

  // Check distinctiveness
  const words = name.split(/\s+/).filter(Boolean);
  if (words.length < 2) {
    findings.push({
      type: "warning",
      message: "MCA Rule 8 recommends at least two components: a distinctive brand/coined prefix and an activity/object descriptive word (e.g. 'Avexora Technologies Private Limited').",
    });
  } else {
    findings.push({
      type: "success",
      message: "Name features both distinctive and descriptive noun components.",
    });
  }

  const isValid = !findings.some((f) => f.type === "error");

  return {
    name,
    isValid,
    findings,
    suggestedSuffix: recommendedSuffix,
  };
}

/**
 * Pure compute function conforming to ComputeFn for generic calculator engine
 */
export const computeMcaSearch: ComputeFn = (values) => {
  const query = typeof values.query === "string" ? values.query.trim().toUpperCase() : "";
  if (!query) {
    return { error: "Enter a 21-digit Company CIN, 7-character LLPIN, or 8-digit Director DIN." };
  }

  // Check if it's a CIN (21 chars and matches CIN pattern or structure)
  if (query.length === 21 && /^[UL]\d{5}[A-Z]{2}\d{4}[A-Z]{3}\d{6}$/.test(query)) {
    const decoded = decodeCin(query);
    if (!decoded.isValid) {
      return { error: decoded.message ?? "Invalid CIN structure." };
    }

    return {
      results: [
        { label: "CIN", value: decoded.cin, emphasis: true },
        { label: "Status & Structure", value: "Valid MCA Corporate Identity Number" },
        { label: "Listing Category", value: decoded.listingStatus ?? "Unlisted" },
        { label: "Company Class", value: `${decoded.companyClass ?? "Corporate"} (${decoded.classCode ?? ""})` },
        { label: "State & RoC Jurisdiction", value: `${decoded.stateName ?? ""} — ${decoded.rocOffice ?? ""}` },
        { label: "RoC Office Address", value: decoded.rocAddress ?? "" },
        { label: "Year of Incorporation", value: `${decoded.yearOfIncorporation ?? ""} (~${decoded.companyAge ?? 0} years old)` },
        { label: "Industry Classification", value: `${decoded.industryCode ?? ""} — ${decoded.industryName ?? ""}` },
        { label: "RoC Registration No.", value: decoded.registrationNumber ?? "" },
        { label: "Statutory Letterhead Mandate", value: "CIN & Office address must be printed on all letterheads under Section 12(3)(c)." },
      ],
    };
  }

  // Check if it's an LLPIN (looks like AAB1234 or AAB-1234)
  const cleanLlpin = query.replace("-", "");
  if (cleanLlpin.length === 7 && /^[A-Z]{3}\d{4}$/.test(cleanLlpin)) {
    const decoded = decodeLlpin(query);
    if (!decoded.isValid) return { error: decoded.message ?? "Invalid LLPIN." };

    return {
      results: [
        { label: "LLPIN", value: decoded.formatted ?? query, emphasis: true },
        { label: "Entity Type", value: "Limited Liability Partnership (LLP)" },
        { label: "Status", value: "Valid MCA LLP Identification Number" },
        { label: "Annual Filings", value: "LLP Form 11 (by 30 May) and LLP Form 8 (by 30 October)" },
        { label: "Statutory Rule", value: "Must print LLPIN on letterhead & invoices under Section 21 LLP Act 2008." },
      ],
    };
  }

  // Check if it's a DIN (8 digits)
  if (/^\d{8}$/.test(query)) {
    const res = validateDinNumber(query);
    return {
      results: [
        { label: "DIN", value: res.din, emphasis: true },
        { label: "Format Status", value: "Valid 8-digit Director Identification Number" },
        { label: "MCA Requirement", value: "Annual DIR-3 KYC filing required by 30 September each year" },
      ],
    };
  }

  // Company Name Search
  const matchingCompanies = searchCompaniesByName(query);
  if (matchingCompanies.length > 0) {
    const primary = matchingCompanies[0];
    const results: { label: string; value: string; emphasis?: boolean }[] = [
      { label: "Company Name", value: primary.name, emphasis: true },
      { label: "CIN", value: primary.cin, emphasis: true },
      { label: "Status", value: primary.status },
      { label: "Company Class", value: primary.class },
      { label: "Listing Status", value: primary.listingStatus },
      { label: "RoC Office & State", value: `${primary.roc} (${primary.state})` },
      { label: "Incorporation Year", value: `${primary.year}` },
      { label: "Industry Classification", value: primary.industry },
    ];
    if (primary.address) {
      results.push({ label: "Registered Office", value: primary.address });
    }
    return { results };
  }

  // Not matched in registry -> Analyze as prospective company name under Rule 8
  const analysis = analyzeCompanyName(query, "pvt-ltd");
  return {
    results: [
      { label: "Search Result", value: `No registered company found matching "${query}" in active directory.`, emphasis: true },
      { label: "Rule 8 Availability", value: analysis.isValid ? "Eligible for registration" : "Requires modifications under MCA guidelines" },
      { label: "Recommended Suffix", value: analysis.suggestedSuffix ?? "Private Limited" },
      { label: "Guidelines Assessment", value: analysis.findings.map((f) => f.message).join(" | ") },
    ],
  };
};
