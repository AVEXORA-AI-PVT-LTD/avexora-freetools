import type { ToolConfig } from "../../types/tools";
import LetterheadComplianceChecker from "../ui/business-legal/letterhead-compliance-checker";
import IfscCodeFinder from "../ui/business-legal/ifsc-code-finder";
import DigitalBusinessCard from "../ui/business-legal/digital-business-card";
import { computeGstinVerification } from "../compute/legal/gstin-verification";
import { generateNda } from "../compute/legal/nda";
import { generatePrivacyPolicy } from "../compute/legal/privacy-policy";
import { generateTerms } from "../compute/legal/terms";
import { generateRefundPolicy } from "../compute/legal/refund-policy";
import { generateDisclaimer } from "../compute/legal/disclaimer";
import { generateRentAgreement } from "../compute/legal/rent-agreement";
import { generateFreelanceContract } from "../compute/legal/freelance-contract";
import { generateEmploymentContract } from "../compute/legal/employment-contract";
import { generateLoanAgreement } from "../compute/legal/loan-agreement";
import { generatePartnershipDeed } from "../compute/legal/partnership-deed";

export const tools: ToolConfig[] = [
  {
    kind: "generator",
    slug: "letterhead-compliance-checker",
    category: "business-legal",
    name: "Letterhead Compliance Checker",
    tagline: "Check whether your company letterhead carries the particulars the law requires.",
    seoDescription:
      "Free letterhead compliance checker for Indian companies and LLPs. Check CIN, LLPIN, GSTIN and registered office details against Companies Act 2013 rules.",
    seoTitle: "Free Letterhead Compliance Checker: CIN, GSTIN & LLPIN",
    keywords: [
      "letterhead compliance checker",
      "letterhead requirements india",
      "company letterhead format as per companies act 2013",
      "section 12(3)(c) companies act",
      "CIN on letterhead",
      "is CIN mandatory on letterhead",
      "LLPIN on letterhead",
      "LLP letterhead requirements",
      "GSTIN on invoice",
      "letterhead particulars for private limited company",
    ],
    directAnswer:
      "A letterhead compliance checker tests your company's legal name, CIN or LLPIN, GSTIN, registered office address, phone and email against Indian rules like Companies Act 2013 s.12(3)(c). It lists must-fix and should-fix gaps for your letterhead, invoice, envelope and visiting card.",
    component: LetterheadComplianceChecker,
    about: [
      "Section 12(3)(c) of the Companies Act 2013 requires every company registered in India to print its name, the address of its registered office and its Corporate Identity Number \u2014 along with its telephone number and, where they exist, its email and website addresses \u2014 on all its business letters, billheads, letter papers, notices and other official publications. It is one of the most routinely missed compliance requirements in Indian corporate practice, precisely because it looks like a design decision rather than a statutory one. A founder orders letterheads from a printer or builds one in a design tool, nobody involved knows the section exists, and the company operates for years on stationery that is technically in default.",
      "The consequences are not theoretical. Failure to comply attracts a penalty of one thousand rupees for every day the default continues, subject to a maximum of one lakh rupees. Because the penalty accrues daily rather than as a one-time fine, a letterhead printed without a CIN and used for two years represents meaningful exposure. The same obligation extends to invoices and billheads, which is why a GST invoice issued on non-compliant letterhead compounds the problem across every customer you have billed.",
      "Limited liability partnerships carry a parallel duty. Section 21 of the Limited Liability Partnership Act 2008 requires an LLP to ensure that its invoices, correspondence and official publications bear its name, the address of its registered office and its LLP Identification Number. Partnership firms and sole proprietorships have no CIN or LLPIN and therefore no equivalent obligation, though a business registered under GST must still display its GSTIN on every tax invoice it issues.",
      "This checker runs your entity type and identifiers against those rules and tells you, document by document, what is present and what is missing. It validates the structure of your CIN, verifies your GSTIN against its mod-36 check digit so a typo is caught rather than trusted, and cross-checks that the company class encoded in your CIN matches the entity type you selected. Each finding cites the provision it comes from so you can take the report to your company secretary or chartered accountant rather than take our word for it. Nothing you enter is transmitted or stored \u2014 the entire check runs in your browser.",
    ],
    faq: [
      {
        question: "What exactly has to appear on a company letterhead in India?",
        answer:
          "For a company: its registered name, the address of its registered office, its CIN, and its telephone number, plus its email and website addresses if it has them. The requirement covers business letters, billheads, letter papers, notices and other official publications \u2014 not just the letterhead itself.",
      },
      {
        question: "What is the penalty for not printing the CIN?",
        answer:
          "One thousand rupees for every day the default continues, up to a maximum of one lakh rupees. Because it accrues daily, the exposure grows for as long as non-compliant stationery remains in use.",
      },
      {
        question: "Does this apply to a visiting card or a social media post?",
        answer:
          "No. A visiting card is not a business letter, billhead or official publication, and neither is a social post. The obligation attaches to correspondence and official documents. This checker deliberately does not flag those, so a pass on your letterhead means something.",
      },
      {
        question: "Do LLPs and proprietorships have the same requirement?",
        answer:
          "An LLP has a parallel duty under section 21 of the LLP Act 2008 to show its name, registered office address and LLPIN on invoices, correspondence and official publications. Partnership firms and sole proprietorships have no CIN or LLPIN and no equivalent obligation, though GST-registered businesses must show their GSTIN on tax invoices.",
      },
      {
        question: "Is my data sent anywhere?",
        answer:
          "No. The rules and validators run entirely in your browser. Your CIN, GSTIN and address never leave your device.",
      },
    ],
    related: ["nda-generator", "privacy-policy-generator", "invoice-generator", "gstin-verification"],
  },
  {
    kind: "generator",
    slug: "nda-generator",
    category: "business-legal",
    name: "NDA Generator",
    tagline: "Create a mutual or one-way non-disclosure agreement in minutes.",
    seoDescription:
      "Free NDA generator. Create a mutual or one-way non-disclosure agreement with standard confidentiality clauses — ready to review and sign.",
    seoTitle: "Free NDA Generator: Mutual & One-Way NDA Under Indian Law",
    keywords: [
      "nda generator",
      "non-disclosure agreement template",
      "nda format india",
      "mutual nda",
      "one-way nda",
      "confidentiality agreement format",
      "free nda template",
      "non-disclosure agreement for business",
      "how to write an nda",
    ],
    directAnswer:
      "An NDA generator creates a mutual or one-way non-disclosure agreement from the party names, effective date, purpose and term. It includes clauses on confidential information, obligations, exclusions, term and Indian governing law, as plain text to copy or download.",
    fields: [
      { name: "partyA", label: "First party (name)", type: "text", placeholder: "Acme Technologies Pvt Ltd" },
      { name: "partyB", label: "Second party (name)", type: "text", placeholder: "Priya Sharma" },
      { name: "effectiveDate", label: "Effective date", type: "date" },
      { name: "purpose", label: "Purpose of disclosure", type: "textarea", rows: 2, placeholder: "e.g. evaluating a potential business partnership" },
      { name: "termYears", label: "Term (years)", type: "number", defaultValue: 2, min: 1, max: 20 },
      { name: "mutual", label: "Mutual (both parties may disclose confidential information)", type: "checkbox", defaultValue: true },
    ],
    generate: generateNda,
    submitLabel: "Generate NDA",
    emailGate: true,
    howTo: {
      name: "How to create an NDA",
      steps: [
        { name: "Enter both parties' details", text: "Add both parties' names, the effective date and whether the NDA is mutual or one-way." },
        { name: "Describe the purpose", text: "State the reason confidential information is being shared and the term of confidentiality." },
        { name: "Generate and sign", text: "Copy or download the finished NDA and have both parties sign it." },
      ],
    },
    about: [
      "A non-disclosure agreement (NDA) is a contract that legally binds whoever receives confidential information to keep it secret and use it only for the stated purpose — typically signed before two parties share anything sensitive, such as a business idea before a partnership discussion, financial data before a due-diligence process, or source code before a contractor starts work. Without one, information shared in good faith has no formal protection if the relationship sours or a counterpart talks to a competitor. This generator produces a complete NDA in the format that lawyers and business partners immediately recognise.",
      "Choose mutual (both parties may share confidential information and both are bound to protect what they receive — the standard choice for partnership and collaboration discussions) or one-way (only one party discloses, the other simply receives and protects — typical when a company shares information with a contractor or vendor). The generated document covers what counts as confidential information, the receiving party's obligations, standard carve-outs (information already known, publicly available, independently developed, or required to be disclosed by law), the term of the agreement, and governing law.",
      "An NDA is meant to be signed before the sensitive conversation happens, not after — its protective value depends on being in place before anything confidential changes hands. Have a lawyer review the term length and confidentiality scope against your specific situation, particularly for high-stakes discussions like M&A or significant IP disclosure, where a generic template may need sharper language.",
    ],
    faq: [
      {
        question: "Mutual or one-way NDA — which do I need?",
        answer:
          "Mutual, if both sides will share confidential information (e.g. two companies exploring a partnership). One-way, if only one party is disclosing and the other is merely receiving (e.g. sharing your business plan with a potential contractor).",
      },
      {
        question: "Is a generated NDA legally binding?",
        answer:
          "Yes, once properly signed by both parties, an NDA is a binding contract enforceable like any other agreement. Have a lawyer review the specific terms for high-value or sensitive disclosures.",
      },
      {
        question: "Does an NDA protect information shared before it's signed?",
        answer:
          "Generally no — an NDA only protects information disclosed after it takes effect, unless it explicitly states otherwise. Sign the NDA before sharing anything sensitive.",
      },
    ],
    related: ["freelance-contract-generator", "employment-contract-generator", "terms-and-conditions-generator", "privacy-policy-generator"],
  },
  {
    kind: "generator",
    slug: "privacy-policy-generator",
    category: "business-legal",
    name: "Privacy Policy Generator",
    tagline: "Generate a complete privacy policy for your website or app.",
    seoDescription:
      "Free privacy policy generator. Create a complete privacy policy for your website covering data collection, cookies, analytics and user rights.",
    seoTitle: "Free Privacy Policy Generator for Your Website or App",
    keywords: [
      "privacy policy generator",
      "privacy policy template",
      "privacy policy for website",
      "privacy policy for app",
      "free privacy policy",
      "privacy policy for ecommerce website",
      "privacy policy with cookies clause",
      "privacy policy for website india",
      "how to write a privacy policy",
    ],
    directAnswer:
      "A privacy policy generator writes a ready-to-edit privacy policy from your company name, website URL and contact email. It covers information collected, how it is used and shared, data security, user rights and children's privacy, with optional cookie, analytics and payment clauses.",
    fields: [
      { name: "companyName", label: "Company/website name", type: "text", placeholder: "Avexora Technologies" },
      { name: "websiteUrl", label: "Website URL", type: "text", placeholder: "https://example.com" },
      { name: "contactEmail", label: "Contact email", type: "text", placeholder: "privacy@example.com" },
      { name: "collectsPayments", label: "We collect payment information", type: "checkbox" },
      { name: "usesCookies", label: "We use cookies", type: "checkbox", defaultValue: true },
      { name: "usesAnalytics", label: "We use analytics tools (e.g. Google Analytics)", type: "checkbox", defaultValue: true },
    ],
    generate: generatePrivacyPolicy,
    submitLabel: "Generate privacy policy",
    emailGate: true,
    about: [
      "A privacy policy is legally required in most jurisdictions the moment a website collects any personal information, and app stores, payment gateways and ad platforms all check for one before letting you use their services. Writing one from scratch means researching what clauses are actually required and phrasing them correctly; this generator produces a complete policy from a handful of checkboxes describing what your site actually does.",
      "The generated policy adapts to your answers: it includes a payments clause only if you collect payment information, a cookies section only if you use cookies, and an analytics mention only if you run analytics tools — so the document matches your site instead of listing irrelevant boilerplate. It covers what data you collect, how you use it, who you share it with, data security, user rights (access, correction, deletion), children's privacy, and how you'll communicate policy changes.",
      "Treat this as a strong starting draft, not a finished legal document: fill in the \"[Date]\" placeholder, review every clause against what your business actually does (a policy that promises something you don't deliver, or omits something you do, creates real legal risk), and if you operate internationally or handle sensitive data (health, financial, biometric), have a privacy lawyer review it against the specific regimes that apply — India's DPDP Act, GDPR for EU visitors, or others depending on your audience.",
    ],
    faq: [
      {
        question: "Do I legally need a privacy policy?",
        answer:
          "In almost every case, yes — if your website collects any personal information (even just an email via a contact form), most jurisdictions require a privacy policy, and platforms like Google Analytics, payment gateways and app stores mandate one as a condition of use.",
      },
      {
        question: "Does this cover GDPR or India's DPDP Act?",
        answer:
          "It includes the standard elements common to most privacy regimes (what's collected, how it's used, user rights), but full compliance with a specific law like GDPR or the DPDP Act often requires additional clauses tailored to that regime. Have a lawyer review it if you handle EU or large-scale Indian user data.",
      },
      {
        question: "What should I do with the \"[Date]\" placeholder?",
        answer:
          "Replace it with the date you publish the policy, and update it again whenever you make material changes to your data practices.",
      },
    ],
    related: ["terms-and-conditions-generator", "disclaimer-generator", "refund-policy-generator", "meta-tag-generator"],
  },
  {
    kind: "generator",
    slug: "terms-and-conditions-generator",
    category: "business-legal",
    name: "Terms and Conditions Generator",
    tagline: "Generate complete terms and conditions for your website or online business.",
    seoDescription:
      "Free terms and conditions generator. Create complete T&Cs covering usage rules, accounts, intellectual property, liability and governing law.",
    seoTitle: "Free Terms and Conditions Generator for Websites",
    keywords: [
      "terms and conditions generator",
      "terms and conditions template",
      "terms of service generator",
      "terms of use for website",
      "terms and conditions for ecommerce website",
      "terms and conditions for website india",
      "free terms and conditions",
      "how to write terms and conditions",
    ],
    directAnswer:
      "A terms and conditions generator drafts website T&Cs from your business name, URL, contact email and city. It covers website use, accounts, intellectual property, orders and payment, prohibited uses, warranties, liability, indemnity, termination and Indian governing law.",
    fields: [
      { name: "companyName", label: "Company name", type: "text", placeholder: "Avexora Technologies Pvt Ltd" },
      { name: "websiteUrl", label: "Website URL", type: "text", placeholder: "https://example.com" },
      { name: "contactEmail", label: "Contact email", type: "text", placeholder: "legal@example.com" },
      { name: "businessType", label: "What does your business do?", type: "text", placeholder: "e.g. e-commerce, SaaS, online courses", optional: true },
      { name: "governingCity", label: "Governing jurisdiction (city)", type: "text", placeholder: "Bengaluru", optional: true },
    ],
    generate: generateTerms,
    submitLabel: "Generate terms and conditions",
    emailGate: true,
    about: [
      "Terms and conditions are the rulebook that governs the relationship between your website and everyone who uses it — what they're allowed to do, what you're not responsible for, and what happens if something goes wrong. Without clear terms, disputes default to general consumer law with no contractual protection tailored to your specific business; with them, you have a documented, agreed basis for handling account misuse, refund disagreements, and liability questions.",
      "This generator produces a complete T&Cs document covering the clauses every online business needs: acceptable use of the site, account responsibilities, intellectual property ownership, order and payment terms, prohibited conduct, disclaimer of warranties, limitation of liability, indemnification, termination rights, and governing law — customisable to your business type and jurisdiction.",
      "The limitation-of-liability and indemnification clauses are doing real legal work here, so this document deserves more scrutiny before publishing than a simple template swap: have it reviewed by a lawyer if your business handles significant transaction volume, sells regulated products, or operates across multiple countries with different consumer protection regimes. For a smaller business or early-stage site, this gives you a solid, standard-form foundation to launch with.",
      "Publish the terms at a stable, linkable URL (most sites use /terms) and reference that link from your footer, checkout flow and signup form — a document nobody can actually find when they need it offers little real protection, however well it's worded.",
    ],
    faq: [
      {
        question: "What's the difference between Terms and Conditions and a Privacy Policy?",
        answer:
          "Terms and Conditions govern the rules of using your website or service (conduct, payments, liability). A Privacy Policy specifically covers how you collect and handle personal data. Most sites need both, and they're separate documents.",
      },
      {
        question: "Can I use these terms for an e-commerce store and a SaaS product the same way?",
        answer:
          "The core structure applies to both, but each has specific needs — e-commerce needs stronger order/shipping/return language, while SaaS needs subscription, uptime and API-usage clauses. Adjust the generated draft to reflect your specific business model.",
      },
      {
        question: "Is a limitation of liability clause actually enforceable?",
        answer:
          "Generally yes in commercial contexts, though enforceability varies by jurisdiction and can be limited for certain types of harm (e.g. gross negligence, statutory consumer rights). Have a lawyer confirm this clause holds up under the laws that apply to your business.",
      },
    ],
    related: ["privacy-policy-generator", "refund-policy-generator", "disclaimer-generator", "freelance-contract-generator"],
  },
  {
    kind: "generator",
    slug: "refund-policy-generator",
    category: "business-legal",
    name: "Refund Policy Generator",
    tagline: "Generate a clear refund and return policy for your store.",
    seoDescription:
      "Free refund policy generator. Create a clear refund and return policy covering eligibility, process and timelines — for physical or digital products.",
    seoTitle: "Free Refund Policy Generator: Return & Refund Policy",
    keywords: [
      "refund policy generator",
      "return and refund policy template",
      "refund policy for ecommerce website",
      "return policy generator",
      "refund policy for digital products",
      "cancellation and refund policy",
      "refund policy for payment gateway",
      "free refund policy template",
    ],
    directAnswer:
      "A refund policy generator creates a return and refund policy for physical or digital products from your company name, contact email and return window. It covers eligibility, how to request a refund, processing time, non-refundable items, return shipping and late refunds.",
    fields: [
      { name: "companyName", label: "Company name", type: "text", placeholder: "Avexora Retail Pvt Ltd" },
      { name: "contactEmail", label: "Contact email", type: "text", placeholder: "support@example.com" },
      { name: "productType", label: "What do you sell?", type: "text", placeholder: "e.g. handmade jewellery, online courses", optional: true },
      { name: "returnWindowDays", label: "Return/refund window (days)", type: "number", defaultValue: 7, min: 1, max: 90 },
      { name: "digitalGoods", label: "We sell digital goods (courses, software, downloads)", type: "checkbox" },
    ],
    generate: generateRefundPolicy,
    submitLabel: "Generate refund policy",
    emailGate: true,
    about: [
      "A clear refund policy does double duty: it sets honest expectations that reduce disputes before they happen, and it's required by most payment gateways and marketplaces before they'll process transactions for your store. Customers specifically look for it before an unfamiliar purchase — its absence is itself a small red flag that costs conversions.",
      "This generator builds a policy around your specific return window and product type, with the framing adjusted for physical versus digital goods — digital products (courses, software, downloads) typically warrant a narrower refund scope since delivery is instant and \"unused\" isn't a meaningful condition, while physical products get the standard unused-and-original-packaging eligibility language. The policy covers the return window, eligibility conditions, how to request a refund, the refund process and timeline, non-refundable exceptions, and who bears shipping costs.",
      "Set a return window you can genuinely honour — a generous window builds trust and rarely gets abused in practice, while a policy that looks generous on paper but is enforced stingily damages your reputation faster than a shorter, honestly-enforced window would. Review the final document against your actual operational process (who processes refunds, how fast) before publishing.",
      "Place a link to this policy near your checkout button and on every product page, not just buried in a footer — most payment gateways require it to be genuinely discoverable, not merely present somewhere on the site, and customers who can see the policy before buying are measurably more likely to complete the purchase.",
    ],
    faq: [
      {
        question: "What return window should I set?",
        answer:
          "7-30 days is standard for most e-commerce; digital products often use a shorter window (or none, beyond a defect guarantee) since delivery is instant. Match the window to what you can operationally support.",
      },
      {
        question: "Do digital products need a different refund policy?",
        answer:
          "Yes — since digital delivery is instant and \"unused\" isn't meaningful, most digital-goods policies limit refunds to cases of technical failure, non-delivery, or material defects, rather than open-ended change-of-mind returns.",
      },
      {
        question: "Is a no-refunds policy legal?",
        answer:
          "It depends on your jurisdiction and product type — many consumer protection laws mandate some refund rights regardless of your stated policy, particularly for defective goods. A blanket \"no refunds\" policy carries legal risk; consult a lawyer before adopting one.",
      },
    ],
    related: ["terms-and-conditions-generator", "invoice-generator", "payment-reminder-generator", "discount-calculator"],
  },
  {
    kind: "generator",
    slug: "disclaimer-generator",
    category: "business-legal",
    name: "Disclaimer Generator",
    tagline: "Generate a website disclaimer covering liability, advice and external links.",
    seoDescription:
      "Free disclaimer generator. Create a website disclaimer covering no-professional-advice, liability limitation, external links and affiliate disclosure.",
    seoTitle: "Free Disclaimer Generator for Websites & Blogs",
    keywords: [
      "disclaimer generator",
      "website disclaimer template",
      "blog disclaimer",
      "affiliate disclaimer",
      "no professional advice disclaimer",
      "legal disclaimer for website",
      "external links disclaimer",
      "free disclaimer template",
      "how to write a disclaimer for a website",
    ],
    directAnswer:
      "A disclaimer generator writes a website disclaimer from your site name, URL, niche and contact email. It covers general information, limitation of liability, external links, and errors and omissions, with optional professional-advice and affiliate-link clauses.",
    fields: [
      { name: "companyName", label: "Company/website name", type: "text", placeholder: "Avexora Blog" },
      { name: "websiteUrl", label: "Website URL", type: "text", placeholder: "https://example.com" },
      { name: "contactEmail", label: "Contact email", type: "text", placeholder: "hello@example.com" },
      { name: "niche", label: "Website niche/topic", type: "text", placeholder: "e.g. personal finance, health and wellness", optional: true },
      { name: "professionalAdviceNotice", label: "Content touches on financial, legal, medical or other professional topics", type: "checkbox" },
      { name: "affiliateLinks", label: "We use affiliate links", type: "checkbox" },
    ],
    generate: generateDisclaimer,
    submitLabel: "Generate disclaimer",
    emailGate: true,
    about: [
      "A disclaimer sets the legal boundary around what your content promises — it clarifies that your blog post, guide or resource is informational, not professional advice, and that you're not liable for decisions readers make based on it. This matters most for sites touching finance, health, legal or other advice-adjacent topics, where a reader could reasonably (but incorrectly) treat your content as personalised professional guidance.",
      "This generator adjusts its language based on your topic: sites that explicitly touch financial, legal or medical subjects get a stronger \"not a substitute for professional advice\" clause; general content sites get a lighter no-liability framing. It also includes an external-links disclaimer (you're not responsible for third-party sites you link to) and, if relevant, an affiliate disclosure — a legally required disclosure in most jurisdictions (including under FTC-style rules that many countries' consumer protection frameworks mirror) whenever you earn commission from links you share.",
      "A disclaimer reduces risk but doesn't eliminate it — genuinely harmful or negligent advice isn't shielded just because a disclaimer exists below it. Place this prominently (a footer link, or directly above advice-heavy content) rather than burying it, and if your site gives specific financial, legal or medical guidance rather than general information, that's a signal to have a professional review your content approach more broadly, not just the disclaimer wording.",
    ],
    faq: [
      {
        question: "Do I need an affiliate disclosure?",
        answer:
          "Yes, if you earn any commission from links you share — most consumer protection frameworks require clear disclosure of affiliate relationships, and it's also simply good practice for reader trust.",
      },
      {
        question: "Where should I put my disclaimer?",
        answer:
          "A general disclaimer link in your footer covers site-wide use; for content that gives specific financial, health or legal guidance, place a shorter version directly on or near that content for maximum visibility.",
      },
      {
        question: "Does a disclaimer protect me from all liability?",
        answer:
          "No — a disclaimer reduces risk by setting expectations, but it doesn't excuse genuinely negligent, false or harmful advice. It's a risk-reduction tool, not a liability shield.",
      },
    ],
    related: ["privacy-policy-generator", "terms-and-conditions-generator", "ai-blog-outline-generator", "refund-policy-generator"],
  },
  {
    kind: "generator",
    slug: "rent-agreement-generator",
    category: "business-legal",
    name: "Rent Agreement Generator",
    tagline: "Create a residential leave-and-license rent agreement.",
    seoDescription:
      "Free rent agreement generator for India. Create a residential leave-and-license agreement with rent, deposit, term and standard clauses.",
    seoTitle: "Free Rent Agreement Generator India: Leave & License Format",
    keywords: [
      "rent agreement generator",
      "rent agreement format",
      "11 month rent agreement",
      "leave and license agreement",
      "rental agreement format india",
      "house rent agreement",
      "rent agreement online",
      "tenancy agreement template",
      "how to make a rent agreement",
    ],
    directAnswer:
      "A rent agreement generator drafts a residential leave-and-license agreement for India from the landlord and tenant names, property address, monthly rent in ₹, security deposit, start date and term (11 months by default). It covers rent, deposit refund, use, maintenance, termination and inspection.",
    fields: [
      { name: "landlordName", label: "Landlord's name", type: "text", placeholder: "Suresh Kumar" },
      { name: "tenantName", label: "Tenant's name", type: "text", placeholder: "Ananya Rao" },
      { name: "propertyAddress", label: "Property address", type: "textarea", rows: 2, placeholder: "Flat 4B, Green Meadows, Whitefield, Bengaluru" },
      { name: "monthlyRent", label: "Monthly rent", type: "number", placeholder: "25000", min: 0, unit: "₹" },
      { name: "securityDeposit", label: "Security deposit", type: "number", placeholder: "100000", min: 0, unit: "₹" },
      { name: "startDate", label: "Tenancy start date", type: "date" },
      { name: "durationMonths", label: "Duration (months)", type: "number", defaultValue: 11, min: 1, max: 60 },
    ],
    generate: generateRentAgreement,
    submitLabel: "Generate rent agreement",
    emailGate: true,
    howTo: {
      name: "How to create a rent agreement",
      steps: [
        { name: "Enter landlord and tenant details", text: "Add both parties' names, the property address and the agreement duration." },
        { name: "Set the rent terms", text: "Enter monthly rent, security deposit and the notice period for termination." },
        { name: "Generate and sign", text: "Copy or download the finished agreement, then have both parties sign it (and notarise/register where your state requires it)." },
      ],
    },
    about: [
      "The 11-month leave-and-license agreement is the standard rental arrangement across most Indian cities — chosen deliberately at under a year to avoid the compulsory registration and stamp duty that longer leases trigger under the Registration Act. This generator produces exactly that document, with the rent, deposit and duration you specify, in the format landlords and tenants across India already recognise.",
      "The agreement covers what actually causes disputes when left unwritten: the exact rent and due date, the security deposit amount and refund timeline (30 days after vacating, net of damages and dues), who handles maintenance versus major repairs, utility responsibility, subletting restrictions, notice period for termination, and the landlord's inspection rights. Setting these expectations in writing upfront resolves most disagreements before they start.",
      "Two things vary meaningfully by state and are worth checking locally: some states require even 11-month agreements to be notarised or e-registered (a fast, low-cost online process in several states now), and rent control laws differ significantly by state in ways that can override contractual terms. Have the agreement reviewed against your specific state's requirements before signing, and register it where local law requires.",
      "Both landlord and tenant should keep a signed copy, along with photographs of the property's condition at move-in — a simple habit that prevents most deposit-refund disputes at the end of the tenancy, since it gives an objective baseline for what counts as normal wear and tear versus actual damage.",
    ],
    faq: [
      {
        question: "Why are rent agreements typically 11 months, not 12?",
        answer:
          "An 11-month term avoids the compulsory registration requirement that leases of 12 months or more trigger under the Registration Act, 1908, saving the time and cost of formal registration. Many states still require notarisation even at 11 months.",
      },
      {
        question: "Do I need to register an 11-month rent agreement?",
        answer:
          "Not always mandatory, but recommended and increasingly required by some states even for shorter terms — check your specific state's rules, as several now offer fast online e-registration.",
      },
      {
        question: "When must the security deposit be refunded?",
        answer:
          "Standard practice (and reflected in this template) is within 30 days of the tenant vacating, after deducting any damages beyond normal wear and tear and unpaid utility bills. Some states have specific statutory timelines — check local tenancy law.",
      },
    ],
    related: ["hra-exemption-calculator", "invoice-due-date-calculator", "nda-generator", "loan-agreement-generator"],
  },
  {
    kind: "generator",
    slug: "freelance-contract-generator",
    category: "business-legal",
    name: "Freelance Contract Generator",
    tagline: "Create a freelance services agreement covering scope, fee and IP.",
    seoDescription:
      "Free freelance contract generator. Create a complete freelance services agreement with scope of work, payment terms, IP transfer and confidentiality.",
    seoTitle: "Free Freelance Contract Generator: Scope, Fee & IP Terms",
    keywords: [
      "freelance contract generator",
      "freelance contract template",
      "freelancer agreement format",
      "service agreement for freelancers",
      "independent contractor agreement",
      "freelance contract india",
      "client agreement for freelancers",
      "how to write a freelance contract",
    ],
    directAnswer:
      "A freelance contract generator drafts a services agreement between a client and a freelancer from the project scope, fee in ₹, payment terms and start and delivery dates. It covers timeline, payment, contractor status, IP transfer, confidentiality, revisions, termination, liability and Indian law.",
    fields: [
      { name: "clientName", label: "Client name", type: "text", placeholder: "Acme Retail Pvt Ltd" },
      { name: "freelancerName", label: "Freelancer name", type: "text", placeholder: "Rohan Mehta" },
      { name: "projectDescription", label: "Project scope", type: "textarea", rows: 3, placeholder: "e.g. design and development of a 5-page marketing website" },
      { name: "fee", label: "Total project fee", type: "number", placeholder: "75000", min: 0, unit: "₹" },
      { name: "paymentTerms", label: "Payment terms", type: "text", placeholder: "50% upfront, 50% on completion", optional: true },
      { name: "startDate", label: "Start date", type: "date" },
      { name: "deliveryDate", label: "Expected delivery date", type: "date" },
    ],
    generate: generateFreelanceContract,
    submitLabel: "Generate freelance contract",
    emailGate: true,
    about: [
      "A freelance contract fixes scope, payment and IP ownership in writing before work starts, which prevents most freelance disputes — these normally trace back to one root cause: terms were never written down clearly, so each side remembers the verbal agreement differently once money or deadlines are at stake. This generator produces one covering exactly the terms that matter: scope of work, timeline, fee and payment schedule, IP ownership, confidentiality, revision limits, and termination.",
      "The intellectual-property clause deserves particular attention because it's the one freelancers and clients most often assume differently: this template transfers IP to the client only upon full payment, and explicitly preserves the freelancer's right to reuse general skills and pre-existing tools and to showcase the work in a portfolio (unless the client requests confidentiality) — a fair, standard default that protects both sides. The revision clause (two rounds included in the quoted fee, more billed separately) heads off the classic scope-creep spiral where \"one more small tweak\" repeats indefinitely.",
      "Whether you're the freelancer or the client, send this before work begins, not after a dispute starts — a signed contract is a prevention tool, not a repair tool. For larger engagements or anything involving significant IP value, have a lawyer review the specific fee structure, IP terms and liability cap against your situation.",
    ],
    faq: [
      {
        question: "When does IP transfer to the client?",
        answer:
          "Upon full payment of all fees due, per this template — a common and fair standard that protects the freelancer from doing IP-transferring work that never gets paid for, while giving the client full ownership once they've paid.",
      },
      {
        question: "How many revisions are included?",
        answer:
          "Two rounds are included in the quoted fee by default in this template; further revisions are billed separately at a rate to be agreed. Adjust this in the generated text if your project needs a different number.",
      },
      {
        question: "Is the freelancer an employee under this contract?",
        answer:
          "No — the contract explicitly establishes an independent contractor relationship, meaning the freelancer handles their own taxes and isn't entitled to employee benefits. Misclassifying an actual employee as a freelancer carries legal risk regardless of what the contract says.",
      },
    ],
    related: ["invoice-generator", "nda-generator", "payment-reminder-generator", "gst-calculator"],
  },
  {
    kind: "generator",
    slug: "employment-contract-generator",
    category: "business-legal",
    name: "Employment Contract Generator",
    tagline: "Create a full employment contract with compensation and termination terms.",
    seoDescription:
      "Free employment contract generator. Create a complete employment contract covering compensation, probation, confidentiality and notice period.",
    seoTitle: "Free Employment Contract Generator for Indian Employers",
    keywords: [
      "employment contract generator",
      "employment contract template",
      "employment agreement format india",
      "employment contract with probation",
      "employment contract with notice period",
      "job contract format",
      "employment agreement for startups",
      "non-solicitation clause employment contract",
    ],
    directAnswer:
      "An employment contract generator drafts an employment contract from the company, employee, designation, annual CTC in ₹, start date, work location and notice period. It covers duties, pay, probation, working hours, leave, confidentiality, non-solicitation, termination and Indian governing law.",
    fields: [
      { name: "companyName", label: "Company name", type: "text", placeholder: "Avexora Technologies Pvt Ltd" },
      { name: "employeeName", label: "Employee name", type: "text", placeholder: "Kavya Reddy" },
      { name: "designation", label: "Designation", type: "text", placeholder: "Software Engineer" },
      { name: "annualCtc", label: "Annual CTC", type: "number", placeholder: "1000000", min: 0, unit: "₹" },
      { name: "startDate", label: "Start date", type: "date" },
      { name: "workLocation", label: "Work location", type: "text", placeholder: "Hyderabad" },
      { name: "noticePeriodDays", label: "Notice period (days)", type: "number", defaultValue: 30, min: 1, max: 180 },
    ],
    generate: generateEmploymentContract,
    submitLabel: "Generate employment contract",
    emailGate: true,
    about: [
      "An employment contract is the formal legal document underlying the employment relationship — distinct from (though often confused with) the appointment letter, and in many companies the two are combined into one. This generator produces a standalone contract covering position and duties, compensation, probation, working hours, leave, confidentiality, non-solicitation and termination terms.",
      "Two clauses here do more legal work than they might appear to: the confidentiality clause protects company information both during and after employment, and the non-solicitation clause (restricting the employee from poaching colleagues or clients for 12 months after leaving) is a common protective term, though its enforceability varies — Indian courts are generally cautious about restraints on trade, so keep such clauses reasonable in scope and duration rather than sweeping.",
      "If your company already issues a combined offer-and-appointment letter (see the HR & Payroll category for both), you may not need this as a separate document — use whichever single, clear document your company's process calls for, rather than issuing overlapping paperwork that could contradict itself. Have your legal team confirm this aligns with your state's specific Shops & Establishments Act requirements before using it at scale.",
      "Keep a signed copy on file for every employee for the full duration of their employment and beyond — it's the document referenced in almost every employment dispute, PF/ESI inspection, or background verification request, and a missing or unsigned contract weakens your position considerably if a disagreement ever needs to be resolved formally.",
    ],
    faq: [
      {
        question: "How is this different from an appointment letter?",
        answer:
          "They serve a similar purpose and many companies combine them. This generator produces a standalone employment contract with fuller legal-style clauses (non-solicitation, detailed confidentiality); the appointment letter generator (in HR & Payroll) uses a slightly different conventional format. Use whichever fits your company's existing process.",
      },
      {
        question: "Is the non-solicitation clause enforceable in India?",
        answer:
          "Enforceability varies — Indian courts generally view broad restraints on trade with caution, though reasonable, narrowly-scoped non-solicitation clauses (as opposed to non-compete clauses restricting where someone can work) are more often upheld. Keep the clause specific and proportionate.",
      },
      {
        question: "What notice period should I use?",
        answer:
          "30 days is common for junior-to-mid roles, 60-90 for senior roles. Match it to what your company will actually enforce — use the notice period recovery calculator to model the buyout implications of your chosen period.",
      },
    ],
    related: ["offer-letter-generator", "appointment-letter-generator", "nda-generator", "salary-calculator"],
  },
  {
    kind: "generator",
    slug: "loan-agreement-generator",
    category: "business-legal",
    name: "Loan Agreement Generator",
    tagline: "Create a personal or business loan agreement with repayment terms.",
    seoDescription:
      "Free loan agreement generator. Create a loan agreement with principal, interest rate and repayment schedule — for personal or business loans.",
    seoTitle: "Free Loan Agreement Generator: Personal & Business Loans",
    keywords: [
      "loan agreement generator",
      "loan agreement format",
      "personal loan agreement",
      "loan agreement between friends",
      "family loan agreement",
      "business loan agreement template",
      "interest-free loan agreement",
      "loan agreement format india",
      "money lending agreement",
    ],
    directAnswer:
      "A loan agreement generator drafts a personal or business loan agreement from the lender and borrower names, loan amount in ₹, annual interest rate (0% allowed), repayment months and loan date. It estimates the monthly instalment and covers interest, repayment, prepayment, default and security.",
    fields: [
      { name: "lenderName", label: "Lender's name", type: "text", placeholder: "Vikram Singh" },
      { name: "borrowerName", label: "Borrower's name", type: "text", placeholder: "Arjun Nair" },
      { name: "principal", label: "Loan amount", type: "number", placeholder: "200000", min: 0, unit: "₹" },
      { name: "interestRate", label: "Annual interest rate", type: "number", defaultValue: 0, min: 0, max: 36, step: 0.5, unit: "%" },
      { name: "repaymentMonths", label: "Repayment period (months)", type: "number", placeholder: "12", min: 1, max: 120 },
      { name: "loanDate", label: "Loan date", type: "date" },
    ],
    generate: generateLoanAgreement,
    submitLabel: "Generate loan agreement",
    emailGate: true,
    about: [
      "A loan agreement is a signed document that fixes a loan's terms in writing — the amount, the interest rate (zero is fine, and common between family), and the repayment schedule — before any disagreement can start. Money lent between friends, family or business acquaintances without paperwork is a common source of both financial loss and damaged relationships, since memories of \"how much\" and \"by when\" diverge remarkably fast once a repayment is late.",
      "This generator produces exactly that: principal amount, annual interest rate (set to 0% for an interest-free family loan, or a market rate for a formal arrangement), repayment period in months with an estimated monthly instalment, prepayment rights, and what happens on default — the lender's right to demand the full outstanding balance after 15 days' notice following a missed payment.",
      "One practical note for India: loan agreements above certain thresholds may attract stamp duty and, in some states, require registration to be fully enforceable in court — the requirements vary by state and loan size, so check locally before relying on an unregistered agreement for a significant amount. For smaller, informal loans between individuals, a signed (even if unregistered) agreement is still far better evidence than no paperwork at all.",
      "Both lender and borrower should keep a signed copy, and settling repayments through a traceable channel like bank transfer (rather than cash) creates a cleaner paper trail alongside the agreement itself — useful if either party ever needs to demonstrate the loan and its repayment history to a bank, an auditor, or in a dispute.",
    ],
    faq: [
      {
        question: "Can I set the interest rate to 0%?",
        answer:
          "Yes — many personal loans between family or friends are interest-free, and the generator supports this. Note that under Indian tax law, interest-free loans above certain thresholds between related parties can occasionally have tax implications; consult a tax advisor for large amounts.",
      },
      {
        question: "Does this loan agreement need to be registered?",
        answer:
          "It depends on the amount and your state — some states require stamp duty and registration for enforceability above certain thresholds. For significant loan amounts, check your state's specific requirements or consult a lawyer.",
      },
      {
        question: "What happens if the borrower doesn't repay?",
        answer:
          "Per this template, if a payment is missed and remains unpaid 15 days after written notice, the lender may declare the entire outstanding balance immediately due. Recovering the amount may still require legal proceedings if the borrower doesn't pay voluntarily.",
      },
    ],
    related: ["simple-interest-calculator", "compound-interest-calculator", "emi-calculator", "partnership-deed-generator"],
  },
  {
    kind: "generator",
    slug: "partnership-deed-generator",
    category: "business-legal",
    name: "Partnership Deed Generator",
    tagline: "Create a partnership deed with capital and profit-sharing terms.",
    seoDescription:
      "Free partnership deed generator for India. Create a deed with capital contribution, profit-sharing ratio and standard clauses under the Partnership Act.",
    seoTitle: "Free Partnership Deed Generator: Indian Partnership Act",
    keywords: [
      "partnership deed generator",
      "partnership deed format",
      "partnership deed format india",
      "partnership agreement template",
      "partnership deed for two partners",
      "profit sharing ratio in partnership deed",
      "partnership deed for firm registration",
      "indian partnership act 1932",
      "how to make a partnership deed",
    ],
    directAnswer:
      "A partnership deed generator drafts a deed for a two-partner firm from the firm name, partner names and profit shares (totalling 100%), address, capital in ₹ and start date. It covers capital, profit sharing, duties, books, retirement, dissolution and disputes under the Partnership Act, 1932.",
    fields: [
      { name: "firmName", label: "Firm name", type: "text", placeholder: "Sharma & Rao Enterprises" },
      { name: "partner1Name", label: "First partner's name", type: "text", placeholder: "Rajesh Sharma" },
      { name: "partner1Share", label: "First partner's profit share (%)", type: "number", defaultValue: 50, min: 0, max: 100 },
      { name: "partner2Name", label: "Second partner's name", type: "text", placeholder: "Deepa Rao" },
      { name: "partner2Share", label: "Second partner's profit share (%)", type: "number", defaultValue: 50, min: 0, max: 100 },
      { name: "businessAddress", label: "Business address", type: "textarea", rows: 2, placeholder: "123 MG Road, Bengaluru" },
      { name: "capitalContribution", label: "Total initial capital", type: "number", placeholder: "500000", min: 0, unit: "₹" },
      { name: "startDate", label: "Commencement date", type: "date" },
    ],
    generate: generatePartnershipDeed,
    submitLabel: "Generate partnership deed",
    emailGate: true,
    about: [
      "A partnership deed replaces the default rules of the Indian Partnership Act, 1932 with the partners' actual terms in writing. Without one, two people starting a business together are relying entirely on those defaults — which assume equal profit-sharing and equal say regardless of what was actually agreed verbally, and which won't reflect any of the specific arrangements partners actually intend.",
      "This generator produces a deed for a two-partner firm covering the firm name and business address, the capital each partner contributes, the profit-and-loss sharing ratio (which the tool validates sums to 100%), duties and decision-making, banking arrangements, and the process for admitting or retiring partners and for dissolution. These are exactly the questions that cause partnership disputes when left unwritten — especially profit-sharing once the business is actually making money.",
      "For a firm intending to operate formally (open a current bank account, take business loans, sign leases as a firm), register this deed with the Registrar of Firms in your state — registration isn't mandatory to form a valid partnership, but an unregistered firm can't sue third parties to enforce a contract, which is a serious practical limitation. Have a chartered accountant or lawyer review the capital and profit-sharing structure against your actual tax planning before finalising.",
    ],
    faq: [
      {
        question: "Is registering a partnership deed mandatory?",
        answer:
          "Not to form a valid partnership, but an unregistered firm loses the right to sue third parties to enforce contracts (Section 69 of the Partnership Act) — a serious limitation for any firm doing real business. Registering with the Registrar of Firms in your state is strongly recommended.",
      },
      {
        question: "What if partners' capital contribution doesn't match their profit share?",
        answer:
          "That's common and legally fine — partners can contribute unequal capital while sharing profits in whatever ratio they agree (e.g. one partner contributes more capital, another contributes more time/expertise, and they split profits 50/50). Adjust the generated document if your arrangement differs from proportional sharing.",
      },
      {
        question: "Can this deed support more than two partners?",
        answer:
          "This generator is built for a two-partner firm. For three or more partners, use the generated text as a starting structure and add each additional partner's details and profit share manually, ensuring all shares still sum to 100%.",
      },
    ],
    related: ["loan-agreement-generator", "gst-calculator", "working-capital-calculator", "nda-generator"],
  },
  {
    kind: "calculator",
    slug: "gstin-verification",
    category: "business-legal",
    name: "GSTIN Verification Tool",
    tagline: "Check whether a GSTIN is correctly formatted, with a valid checksum.",
    seoDescription:
      "Free GSTIN verification tool. Check a GST number's format and mod-36 check digit instantly, and decode its state code, embedded PAN and registration number.",
    seoTitle: "Free GSTIN Verification: Validate GST Number Format & PAN",
    keywords: [
      "gstin verification",
      "gst number check",
      "gstin validator",
      "gstin format",
      "gstin checksum",
      "gst number validation",
      "gstin state code",
      "find pan from gstin",
      "how to check if a gstin is valid",
    ],
    directAnswer:
      "A GSTIN verification tool checks that a 15-character GST number has the right format and a valid mod-36 check digit, then decodes its state and state code, embedded PAN and registration number. It runs in your browser and does not confirm live registration on the GST portal.",
    fields: [
      { name: "gstin", label: "GSTIN", type: "text", placeholder: "29AABCU9603R1ZM", maxLength: 15 },
    ],
    compute: computeGstinVerification,
    autoCompute: true,
    about: [
      "A GSTIN is 15 characters long and self-describing: the first two digits are a state code, the next ten are the taxpayer's PAN, the thirteenth is a registration/entity number, the fourteenth is always \"Z\", and the fifteenth is a checksum digit computed from the other fourteen using a mod-36 algorithm. This tool decodes all of that and verifies the checksum in one pass, catching a mistyped or fabricated GSTIN before it ends up on an invoice.",
      "This is a format and checksum check, not a live lookup against the GST portal — it can prove a GSTIN is malformed (wrong length, invalid state code, checksum mismatch), but only the government's own GSTN system can confirm that a well-formed GSTIN belongs to a real, currently-registered taxpayer. For that final confirmation, verify on the official GST portal (services.gst.gov.in) before relying on it for input tax credit.",
      "Typing errors are the single most common GSTIN problem — a transposed digit or a misread character — and the checksum catches almost all of them instantly, before a wrong GSTIN gets printed on a real invoice or claimed against ITC. Paired with the Letterhead Compliance Checker, this covers the two places a wrong GSTIN causes the most damage: your own stationery, and a vendor's invoice you're about to accept.",
    ],
    faq: [
      {
        question: "Does this confirm a GSTIN is actually registered with the government?",
        answer:
          "No — it verifies that the format and check digit are mathematically valid, which catches typos and fabricated numbers. Only the official GST portal (services.gst.gov.in) can confirm a GSTIN belongs to an active, real registration.",
      },
      {
        question: "What does each part of a GSTIN mean?",
        answer:
          "State code (2 digits) + PAN (10 characters) + entity/registration number (1 character, for taxpayers with multiple registrations on the same PAN in a state) + a fixed \"Z\" + a checksum digit (1 character) computed from the first 14 characters.",
      },
      {
        question: "Is my GSTIN sent anywhere when I check it here?",
        answer: "No — the entire check runs in your browser using a fixed formula. Nothing you type is transmitted or stored.",
      },
      {
        question: "Why did a real-looking GSTIN fail the check?",
        answer:
          "The most common reason is a single mistyped or transposed character — the checksum is extremely sensitive to that. Re-check the source document carefully; a genuine GSTIN issued by the GST department will always pass this format check.",
      },
    ],
    related: ["letterhead-compliance-checker", "invoice-generator", "gst-calculator", "ifsc-code-finder"],
  },
  {
    kind: "generator",
    slug: "digital-business-card-generator",
    category: "business-legal",
    name: "Digital Business Card Generator",
    tagline: "Design an animated digital business card with your photo, logo, tap-to-call, WhatsApp, Save Contact and a QR code.",
    seoTitle: "Free Digital Business Card Generator: Animated vCard & QR",
    seoDescription:
      "Free digital business card generator: make an animated digital visiting card with your photo, logo, WhatsApp button, Save Contact vCard and QR code.",
    keywords: [
      "digital business card generator",
      "free digital business card",
      "digital visiting card maker",
      "online visiting card",
      "vCard QR code",
      "QR code business card",
      "business card with WhatsApp button",
      "animated business card",
      "virtual business card",
      "electronic business card",
      ".vcf file generator",
      "shareable business card link",
    ],
    directAnswer:
      "A digital business card generator turns your name, contact details, photo and logo into a mobile card page with tap-to-call, WhatsApp and a Save Contact button, plus a .vcf vCard file and a QR code. This one is free to design and download; a shareable link is included in paid plans.",
    example:
      "Example: Enter \"Priya Sharma\", \"Founder & CEO\", \"Northwind Labs\", a phone number and your website, pick the Ocean palette, and download a single HTML card page, priya-sharma.vcf and a QR code that saves Priya to any phone's contacts.",
    steps: [
      "Upload up to four photos in the same outfit — they play as a motion picture across the top of the card — and your company logo.",
      "Add your name, designation, company and a one-line tagline.",
      "Fill in the ways to reach you: phone, WhatsApp, email, website and address. Leave any field blank to hide it.",
      "Paste your social profile links or usernames for LinkedIn, Instagram, Facebook, X, YouTube or GitHub.",
      "Choose a colour palette or your own brand colours, a light or dark default theme, and what the QR code opens.",
      "Check the live preview, then download the card page (.html), the contact file (.vcf) and the QR code (.png) for free.",
      "On a paid plan, save the card to get a shareable link, then copy it, share it or send it on WhatsApp. Edit it any time and the link stays the same.",
    ],
    component: DigitalBusinessCard,
    about: [
      "A digital business card, also called a digital visiting card, virtual business card or e-business card, is a small web page that does everything a paper visiting card does, and more: one tap calls you, opens a WhatsApp chat, starts an email or shows your office on Google Maps, and a Save Contact button adds you to the other person's phone in one step. This generator builds that page from a short form. Upload up to four photos in the same outfit, with different poses or expressions, and the top of the card turns them into a motion picture: each photo is shown whole, never cropped, and crossfades into the next with a slow zoom. Your company logo sits large on a clean white panel just beneath the photos, where it is easy to see. Contact rows, social icons and a QR code follow, all in your brand colours and previewed live as you type.",
      "Designing and downloading are free. Three files come out of it. The card page is a single self-contained HTML file with its styles, animations and the Share button built in and no external requests, so it loads fast and can be hosted anywhere: on your own website, a company intranet or a free static host. The .vcf file is a standard vCard 3.0 that iPhone, Android, Gmail and Outlook contacts import directly, with your photo embedded. The QR code can either save your contact straight into the phone that scans it or open your website. Print it on the back of a paper card, a standee at your counter or the footer of your [invoices](/invoicing-billing/invoice-generator). For a plain QR code for any other link, use the [QR code generator](/developer-web/qr-code-generator).",
      "On a paid plan you can also save the card to your account and get a shareable link, such as tools.avexora.in/card/your-name. Copy it, share it from your phone or send it on WhatsApp; the link shows a proper preview with your photo, and the QR code can point to it. Edit the card whenever your details change and the link stays the same. If you only download the files, everything happens in your browser: your details and photo are not uploaded, and the form is saved only on your own device so you don't lose your work between visits. The card respects each visitor's reduced-motion setting and has light and dark modes, so it stays readable and accessible on any phone. If you need company stationery that meets the Companies Act's disclosure rules as well, check your letterhead with the [letterhead compliance checker](/business-legal/letterhead-compliance-checker).",
    ],
    faq: [
      {
        question: "How do I make a digital business card for free?",
        answer:
          "Open this generator, upload a photo and your logo, fill in your name, designation, phone, WhatsApp, email and website, and pick your brand colours. The preview updates as you type. When it looks right, download the card page (.html), the vCard (.vcf) and the QR code (.png). Designing and downloading are free and need no sign-up.",
      },
      {
        question: "What is a vCard, and why does my card need one?",
        answer:
          "A vCard (.vcf file) is the standard contact file every phone and email app understands. The card's Save Contact button and its contact QR code both use it, so one tap or one scan adds your name, number, email, company and photo to the other person's contacts, with no retyping.",
      },
      {
        question: "Digital business card or paper visiting card: which is better?",
        answer:
          "A digital card never runs out, costs nothing to update when your number or title changes, and lets people call, WhatsApp or save you in one tap. Paper still helps at events and counters. Many people use both: print the card's QR code on the back of a paper visiting card so it leads to the digital one.",
      },
      {
        question: "How do I share my digital business card?",
        answer:
          "On a paid plan, click Save & get link to publish the card at its own address, then copy the link, use your phone's share sheet or send it on WhatsApp. On the free plan, upload the downloaded .html file to your own website or any static host and share that link. Either way, people can also scan the QR code.",
      },
      {
        question: "What does the QR code do when someone scans it?",
        answer:
          "You choose. \"Save contact\" encodes your vCard, so scanning offers to add you to the phone's contacts with no internet needed. \"Your website\" opens your site. The contact QR leaves out the photo to keep the code easy to scan; the .vcf download includes it.",
      },
      {
        question: "How does the motion picture work?",
        answer:
          "Add two to four photos taken in the same outfit, with different poses or expressions. The card shows each one whole across the top and crossfades from one to the next with a slow zoom, like a short motion picture, in the order you choose; the main photo plays first. With a single photo the card uses a gentle zoom. Turn the animation off, or view it with reduced motion, and only the main photo shows.",
      },
      {
        question: "Will the Save Contact button work on iPhone and Android?",
        answer:
          "Yes. It downloads a standard vCard 3.0 file, which both iOS and Android open in the Contacts app, pre-filled with your name, company, title, phone numbers, email, website, address, social profiles and photo.",
      },
      {
        question: "Is my information uploaded anywhere?",
        answer:
          "Only if you save the card. Downloads are built in your browser and your photo is resized on your device, so nothing is sent to our servers. Saving stores the card on your account so its link can show it, and deleting the card takes the link down straight away. The form draft stays in your browser's local storage until you clear it.",
      },
      {
        question: "Can I use my own brand colours and logo?",
        answer:
          "Yes. Pick one of the palettes or set any primary and accent colour with the colour pickers. Upload your company logo separately from your photos: it appears large on a white panel under them, and both wide wordmarks and square marks fit. Without a photo or logo, your initials are shown in your brand gradient.",
      },
      {
        question: "Does the card work offline or without JavaScript?",
        answer:
          "The card is one file with no external requests, so it opens even on a slow connection. With JavaScript turned off, the contact links and Save Contact still work; only the animated particles, the theme toggle and the Share button need it.",
      },
    ],
    related: ["qr-code-generator", "letterhead-compliance-checker", "invoice-generator", "resume-builder"],
  },
  {
    kind: "generator",
    slug: "ifsc-code-finder",
    category: "business-legal",
    name: "IFSC Code Finder",
    tagline: "Look up any Indian bank branch's IFSC, MICR code and address.",
    seoDescription:
      "Free IFSC code finder. Enter any Indian bank's IFSC code to instantly get the branch name, address, MICR code and NEFT/RTGS/IMPS/UPI availability.",
    seoTitle: "Free IFSC Code Finder: Bank Branch, Address & MICR Code",
    keywords: [
      "ifsc code finder",
      "ifsc code details",
      "bank ifsc code",
      "ifsc code lookup",
      "micr code finder",
      "bank branch address by ifsc",
      "ifsc to bank name",
      "neft rtgs imps upi by ifsc",
      "what is ifsc code",
    ],
    directAnswer:
      "An IFSC code finder looks up an 11-character Indian bank IFSC code and shows the bank, branch name, address, MICR code and whether NEFT, RTGS, IMPS and UPI are supported. It queries a public bank-branch dataset directly from your browser.",
    component: IfscCodeFinder,
    about: [
      "An IFSC (Indian Financial System Code) is an 11-character code that uniquely identifies a bank branch for electronic payments — the first four letters name the bank, a fixed zero comes next, and the last six characters identify the specific branch. Every NEFT, RTGS, IMPS and UPI transfer routes through this code, which is why bank forms, cheque books and payment apps all ask for it.",
      "Enter any IFSC code and this tool looks up the exact branch it belongs to — bank name, branch name, full address, city, state, MICR code, and which payment networks (NEFT/RTGS/IMPS/UPI) that branch supports — against a public bank-branch directory. It's the fastest way to confirm a code before adding a beneficiary for a bank transfer, without hunting through a cheque leaf or calling the bank.",
      "Getting an IFSC wrong when adding a payee is a common source of failed or misdirected transfers, so a quick check here before submitting a bank form is worth the ten seconds it takes. If you have the branch's cheque book or passbook, the IFSC is printed on it directly — this tool is most useful when you only have the bank and branch name and need the code itself, or want to double-check one before using it.",
    ],
    faq: [
      {
        question: "What does an IFSC code look like?",
        answer:
          "11 characters: four letters identifying the bank (e.g. HDFC, ICIC, SBIN), a fixed zero as the fifth character, then six characters identifying the specific branch — for example HDFC0000001.",
      },
      {
        question: "Where does this lookup data come from?",
        answer:
          "It queries a free, public bank-branch API (originally sourced from RBI data) directly from your browser. Nothing you type is stored by this site.",
      },
      {
        question: "Do I need the IFSC for UPI payments?",
        answer:
          "Not for a UPI ID or QR code payment, but you do need it when adding a bank account as a beneficiary for NEFT/RTGS/IMPS, or when someone needs to transfer money directly to your account number.",
      },
      {
        question: "What if my IFSC code isn't found?",
        answer:
          "Double-check for typos — a single wrong character will return no match. If it still doesn't resolve, the code may be for a branch that has since merged or been renumbered; check your bank's cheque book or passbook for the current code.",
      },
    ],
    related: ["gstin-verification", "invoice-generator", "letterhead-compliance-checker", "rent-agreement-generator"],
  },
];
