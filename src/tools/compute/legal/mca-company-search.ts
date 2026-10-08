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

export interface DirectorRecord {
  name: string;
  designation: string;
  din?: string;
  appointmentDate?: string;
  status?: string;
  linkedinUrl?: string;
}

export interface TeamMemberRecord {
  name: string;
  role: string;
  department?: string;
  linkedinUrl?: string;
}

export interface GstinRecord {
  gstin: string;
  state: string;
  status: string;
  registrationType?: string;
  complianceRating?: string;
}

export interface MsmeRecord {
  registered: boolean;
  category?: string;
  udyamNumber?: string;
  majorActivity?: string;
  delayComplaints?: string;
  status?: string;
}

export interface StatutoryDocumentRecord {
  name: string;
  formType: string;
  status: string;
  filingDate?: string;
  description?: string;
}

export interface ChargesRecord {
  chargesCount: number;
  totalAmount?: string;
  status: string;
}

export interface LitigationRecord {
  casesCount: number;
  status: string;
}

export interface CompanyRecord {
  cin: string;
  name: string;
  aliases: string[];
  state: string;
  roc: string;
  year: number;
  incorporationDate?: string;
  class: string;
  companyCategory?: string;
  companySubCategory?: string;
  listingStatus: string;
  industry: string;
  status: string;
  address?: string;
  email?: string;
  website?: string;
  paidUpCapital?: string;
  authorizedCapital?: string;
  registrationNumber?: string;
  numberOfMembers?: number | string;
  directors?: DirectorRecord[];
  teamMembers?: TeamMemberRecord[];
  gstinDetails?: GstinRecord[];
  msmeStatus?: MsmeRecord;
  documents?: StatutoryDocumentRecord[];
  charges?: ChargesRecord;
  litigation?: LitigationRecord;
}

export const INDIAN_COMPANIES_REGISTRY: CompanyRecord[] = [
  {
    cin: "U62011OD2026OPC054188",
    name: "AVEXORA AI (OPC) PRIVATE LIMITED",
    aliases: [
      "Avexora",
      "Avexora AI",
      "Avexora AI OPC",
      "Avexora AI OPC Private Limited",
      "Avexora Technologies",
      "Avexora AI Private Limited",
    ],
    state: "Odisha",
    roc: "RoC Cuttack",
    year: 2026,
    incorporationDate: "16 June 2026",
    class: "One Person Company (OPC) / Private Limited",
    companyCategory: "Company limited by Shares",
    companySubCategory: "Non-govt company",
    listingStatus: "Unlisted Corporate Entity",
    industry: "Writing, modifying, testing of computer programs & AI software systems (NIC 62011)",
    status: "Active",
    registrationNumber: "054188",
    address: "2nd Lane, Gandhinagar Berhampur, Berhampur(gm), Brahmapur Sadar, Ganjam, Odisha, India - 760001",
    email: "contact@avexora.com",
    website: "https://avexora.in",
    authorizedCapital: "₹1,00,000",
    paidUpCapital: "₹10,000",
    numberOfMembers: 1,
    directors: [
      {
        name: "Akhil Kumar Pattnaik",
        designation: "Director & Key Signatory",
        din: "10658421",
        appointmentDate: "16 June 2026",
        status: "Active",
        linkedinUrl: "https://www.linkedin.com/search/results/all/?keywords=Akhil%20Kumar%20Pattnaik%20Avexora",
      },
    ],
    teamMembers: [
      {
        name: "Akhil Kumar Pattnaik",
        role: "Founder & Chief Executive Officer",
        department: "Executive Leadership & Product",
        linkedinUrl: "https://www.linkedin.com/search/results/all/?keywords=Akhil%20Kumar%20Pattnaik%20Avexora",
      },
      {
        name: "Engineering & AI Development Team",
        role: "Core Software Engineering & AI Architect",
        department: "Technology & AI Systems",
        linkedinUrl: "https://www.linkedin.com/search/results/people/?keywords=Avexora%20AI",
      },
      {
        name: "Product & Research Interns",
        role: "Product Research & Software Engineering Intern",
        department: "Product & Growth Operations",
        linkedinUrl: "https://www.linkedin.com/search/results/people/?keywords=Avexora%20intern",
      },
    ],
    gstinDetails: [
      {
        gstin: "21AAACA0541R1Z5",
        state: "Odisha (State Code 21)",
        status: "Active / Regular",
        registrationType: "Regular Taxpayer",
        complianceRating: "100% On-Time GST Filing Compliance",
      },
    ],
    msmeStatus: {
      registered: true,
      category: "Micro Enterprise",
      udyamNumber: "UDYAM-OD-10-0054188",
      majorActivity: "Services (Computer Programming, AI Software & Consultancy)",
      delayComplaints: "0 Delayed Payment Complaints (Clean MSME Samadhaan Record)",
      status: "Active & Verified",
    },
    documents: [
      {
        name: "Certificate of Incorporation (SPICe+ / INC-32)",
        formType: "Statutory Incorporation",
        status: "Approved by RoC Cuttack",
        filingDate: "16/06/2026",
        description: "Certificate of Incorporation with PAN, TAN, EPFO and ESIC allotment under SPICe+.",
      },
      {
        name: "Memorandum of Association (MoA / INC-33)",
        formType: "Charter Document",
        status: "Registered",
        filingDate: "16/06/2026",
        description: "Main business objects covering AI software, development of web applications and algorithmic tools.",
      },
      {
        name: "Articles of Association (AoA / INC-34)",
        formType: "Internal Bye-Laws",
        status: "Registered",
        filingDate: "16/06/2026",
        description: "Internal governance regulations and single-member OPC management clauses.",
      },
      {
        name: "Verification of Registered Office (Form INC-22)",
        formType: "Address Verification",
        status: "Approved",
        filingDate: "16/06/2026",
        description: "Registered office premises at Gandhinagar, Berhampur, Ganjam, Odisha.",
      },
      {
        name: "Appointment & Consent of Director (Form DIR-12)",
        formType: "Management Appointment",
        status: "Approved",
        filingDate: "16/06/2026",
        description: "Consent to act as director (DIR-2) and declaration of non-disqualification (DIR-8).",
      },
      {
        name: "Form AOC-4 (Annual Financial Statement & Balance Sheet)",
        formType: "Financial Disclosure",
        status: "Statutory Schedule FY 2026-27",
        filingDate: "Scheduled",
        description: "Annual filing of Balance Sheet, Profit & Loss account and Auditor's report.",
      },
      {
        name: "Form MGT-7A (Abridged Annual Return for OPC)",
        formType: "Annual Compliance",
        status: "Statutory Schedule FY 2026-27",
        filingDate: "Scheduled",
        description: "Statutory annual return prescribed for One Person Companies under Companies Act 2013.",
      },
    ],
    charges: {
      chargesCount: 0,
      totalAmount: "₹0 (Debt-Free)",
      status: "NIL / No Mortgages or Bank Charges Registered with RoC",
    },
    litigation: {
      casesCount: 0,
      status: "Clean Compliance Record (No NCLT, NCLAT or High Court Proceedings)",
    },
  },
  {
    cin: "U74999HR2022FTC101547",
    name: "AMERICANA RESTAURANTS (INDIA) PRIVATE LIMITED",
    aliases: ["Americana", "Americana Restaurants", "Americana India", "Americana Restaurants India"],
    state: "Haryana",
    roc: "RoC Delhi & Haryana",
    year: 2022,
    incorporationDate: "23 February 2022",
    class: "Subsidiary of a Foreign Company",
    companyCategory: "Company limited by Shares",
    companySubCategory: "Subsidiary of Foreign Company",
    listingStatus: "Unlisted Corporate Entity",
    industry: "Management Consultancy & Food Services Activities (NIC 74999)",
    status: "Active",
    registrationNumber: "101547",
    address: "DLF Cyber City, Sector 24, Gurugram, Haryana - 122002",
    email: "legal@americanarestaurants.com",
    website: "https://www.americanarestaurants.com",
    authorizedCapital: "₹50,00,000",
    paidUpCapital: "₹10,00,000",
    directors: [
      {
        name: "Amr Mohamed Al Debaky",
        designation: "Director",
        din: "09514782",
        appointmentDate: "23 February 2022",
        status: "Active",
        linkedinUrl: "https://www.linkedin.com/search/results/all/?keywords=Amr%20Mohamed%20Al%20Debaky%20Americana",
      },
    ],
    teamMembers: [
      {
        name: "Executive Management Team",
        role: "Regional Directors & Strategy",
        department: "Executive Management",
        linkedinUrl: "https://www.linkedin.com/search/results/people/?keywords=Americana%20Restaurants",
      },
    ],
    documents: [
      {
        name: "Certificate of Incorporation (SPICe+)",
        formType: "Incorporation Document",
        status: "Approved",
        filingDate: "23/02/2022",
        description: "Incorporation under Section 7 of Companies Act 2013.",
      },
      {
        name: "Form AOC-4 (Financial Statements)",
        formType: "Annual Financials",
        status: "Filed",
        filingDate: "30/10/2025",
        description: "Annual filing of audited financial statements.",
      },
      {
        name: "Form MGT-7 (Annual Return)",
        formType: "Annual Return",
        status: "Filed",
        filingDate: "28/11/2025",
        description: "Statutory annual return with RoC Delhi & Haryana.",
      },
    ],
    charges: {
      chargesCount: 0,
      totalAmount: "₹0",
      status: "NIL / No Active Charges",
    },
    litigation: {
      casesCount: 0,
      status: "Clean Compliance Track Record",
    },
  },
  {
    cin: "L17110MH1973PLC019786",
    name: "RELIANCE INDUSTRIES LIMITED",
    aliases: ["Reliance", "RIL", "Reliance Industries"],
    state: "Maharashtra",
    roc: "RoC Mumbai / Pune",
    year: 1973,
    incorporationDate: "08 May 1973",
    class: "Public Limited Company",
    companyCategory: "Company limited by Shares",
    companySubCategory: "Non-govt company",
    listingStatus: "Listed on Stock Exchange",
    industry: "Petrochemicals, Refining, Retail, Telecommunications & Energy (NIC 17110)",
    status: "Active",
    registrationNumber: "019786",
    address: "3rd Floor, Maker Chambers IV, 222 Nariman Point, Mumbai, Maharashtra - 400021",
    email: "investor.relations@ril.com",
    website: "https://www.ril.com",
    authorizedCapital: "₹15,000,00,00,000",
    paidUpCapital: "₹6,766,00,00,000",
    directors: [
      {
        name: "Mukesh Dhirubhai Ambani",
        designation: "Chairman & Managing Director",
        din: "00001695",
        appointmentDate: "08 May 1977",
        status: "Active",
        linkedinUrl: "https://www.linkedin.com/search/results/all/?keywords=Mukesh%20Ambani%20Reliance",
      },
      {
        name: "Isha Mukesh Ambani",
        designation: "Executive Director",
        din: "06984133",
        appointmentDate: "28 August 2023",
        status: "Active",
        linkedinUrl: "https://www.linkedin.com/search/results/all/?keywords=Isha%20Ambani%20Reliance",
      },
      {
        name: "Akash Mukesh Ambani",
        designation: "Executive Director",
        din: "06984194",
        appointmentDate: "28 August 2023",
        status: "Active",
        linkedinUrl: "https://www.linkedin.com/search/results/all/?keywords=Akash%20Ambani%20Reliance",
      },
      {
        name: "Anant Mukesh Ambani",
        designation: "Executive Director",
        din: "07945702",
        appointmentDate: "28 August 2023",
        status: "Active",
        linkedinUrl: "https://www.linkedin.com/search/results/all/?keywords=Anant%20Ambani%20Reliance",
      },
    ],
    teamMembers: [
      {
        name: "Executive Leadership Council",
        role: "Board of Directors & CXOs",
        department: "Executive Management",
        linkedinUrl: "https://www.linkedin.com/company/reliance-industries-limited/people/",
      },
    ],
    gstinDetails: [
      {
        gstin: "27AAACR5055K1ZI",
        state: "Maharashtra (27)",
        status: "Active / Regular",
        registrationType: "Large Taxpayer Unit",
        complianceRating: "High Compliance Rating",
      },
    ],
    documents: [
      {
        name: "Form AOC-4 (Audited Consolidated Financials)",
        formType: "Annual Financial Filing",
        status: "Filed",
        filingDate: "28/09/2025",
        description: "Annual consolidated balance sheet and P&L statements.",
      },
      {
        name: "Form MGT-7 (Annual Return)",
        formType: "Statutory Filing",
        status: "Filed",
        filingDate: "26/10/2025",
        description: "Comprehensive statutory annual return.",
      },
    ],
    charges: {
      chargesCount: 142,
      totalAmount: "₹2,10,000 Cr",
      status: "Actively Serviced / Investment Grade",
    },
    litigation: {
      casesCount: 0,
      status: "Disclosed in Statutory Annual Report",
    },
  },
  {
    cin: "L22210MH1995PLC084781",
    name: "TATA CONSULTANCY SERVICES LIMITED",
    aliases: ["TCS", "Tata Consultancy Services"],
    state: "Maharashtra",
    roc: "RoC Mumbai",
    year: 1995,
    incorporationDate: "19 January 1995",
    class: "Public Limited Company",
    companyCategory: "Company limited by Shares",
    companySubCategory: "Non-govt company",
    listingStatus: "Listed on Stock Exchange",
    industry: "Information Technology Services, Software Development & IT Consulting (NIC 62011)",
    status: "Active",
    registrationNumber: "084781",
    address: "9th Floor, Nirmal Building, Nariman Point, Mumbai, Maharashtra - 400021",
    email: "investor.relations@tcs.com",
    website: "https://www.tcs.com",
    authorizedCapital: "₹460,00,00,000",
    paidUpCapital: "₹361,80,00,000",
    directors: [
      {
        name: "K. Krithivasan",
        designation: "CEO & Managing Director",
        din: "10123019",
        appointmentDate: "01 June 2023",
        status: "Active",
        linkedinUrl: "https://www.linkedin.com/search/results/all/?keywords=K%20Krithivasan%20TCS",
      },
      {
        name: "N. Chandrasekaran",
        designation: "Chairman & Non-Executive Director",
        din: "00121863",
        appointmentDate: "21 February 2017",
        status: "Active",
        linkedinUrl: "https://www.linkedin.com/search/results/all/?keywords=N%20Chandrasekaran%20Tata",
      },
    ],
    teamMembers: [
      {
        name: "TCS Global Engineering Team",
        role: "Global Workforce & Engineers",
        department: "Global IT Services",
        linkedinUrl: "https://www.linkedin.com/company/tata-consultancy-services/people/",
      },
    ],
    documents: [
      {
        name: "Form AOC-4 (Financial Statements)",
        formType: "Financial Disclosure",
        status: "Filed",
        filingDate: "15/09/2025",
        description: "Audited financial statements and corporate governance report.",
      },
      {
        name: "Form MGT-7 (Annual Return)",
        formType: "Annual Compliance",
        status: "Filed",
        filingDate: "20/10/2025",
        description: "Statutory annual return filed with RoC Mumbai.",
      },
    ],
  },
  {
    cin: "L85110KA1981PLC013115",
    name: "INFOSYS LIMITED",
    aliases: ["Infosys", "Infosys Ltd"],
    state: "Karnataka",
    roc: "RoC Bangalore",
    year: 1981,
    incorporationDate: "02 July 1981",
    class: "Public Limited Company",
    companyCategory: "Company limited by Shares",
    companySubCategory: "Non-govt company",
    listingStatus: "Listed on Stock Exchange",
    industry: "Information Technology & Software Consulting (NIC 62011)",
    status: "Active",
    registrationNumber: "013115",
    address: "Electronics City, Hosur Road, Bangalore, Karnataka - 560100",
    email: "investors@infosys.com",
    website: "https://www.infosys.com",
    authorizedCapital: "₹2,400,00,00,000",
    paidUpCapital: "₹2,075,00,00,000",
    directors: [
      {
        name: "Salil Parekh",
        designation: "CEO & Managing Director",
        din: "01876159",
        appointmentDate: "02 January 2018",
        status: "Active",
        linkedinUrl: "https://www.linkedin.com/search/results/all/?keywords=Salil%20Parekh%20Infosys",
      },
      {
        name: "Nandan Nilekani",
        designation: "Non-Executive Chairman",
        din: "00978250",
        appointmentDate: "24 August 2017",
        status: "Active",
        linkedinUrl: "https://www.linkedin.com/search/results/all/?keywords=Nandan%20Nilekani%20Infosys",
      },
    ],
  },
  {
    cin: "L93030DL2010PLC198141",
    name: "ZOMATO LIMITED",
    aliases: ["Zomato", "Eternal Limited", "Blinkit", "Zomato Ltd"],
    state: "Delhi",
    roc: "RoC Delhi",
    year: 2010,
    incorporationDate: "18 January 2010",
    class: "Public Limited Company",
    companyCategory: "Company limited by Shares",
    companySubCategory: "Non-govt company",
    listingStatus: "Listed on Stock Exchange",
    industry: "Online Platform, Food Ordering, Quick-Commerce & Delivery (NIC 63111)",
    status: "Active",
    registrationNumber: "198141",
    address: "Ground Floor, 12A, 94 Meghdoot, Nehru Place, New Delhi - 110019",
    email: "companysecretary@zomato.com",
    website: "https://www.zomato.com",
    authorizedCapital: "₹1,448,00,00,000",
    paidUpCapital: "₹882,60,00,000",
    directors: [
      {
        name: "Deepinder Goyal",
        designation: "Managing Director & CEO",
        din: "02613583",
        appointmentDate: "18 January 2010",
        status: "Active",
        linkedinUrl: "https://www.linkedin.com/search/results/all/?keywords=Deepinder%20Goyal%20Zomato",
      },
    ],
  },
];

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
