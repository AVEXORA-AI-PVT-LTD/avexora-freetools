import type { FieldValues } from "@/types/tools";
import { JOB_EXPERIENCE_LEVELS, JOB_FIELD_LIMITS } from "@/tools/ai-constants";

/**
 * Server-side prompt registry for AI writer tools (spec §3.5): prompts are
 * defined here, never supplied by the client. Keyed by tool slug.
 */
interface PromptTemplate {
  system: string;
  build: (values: FieldValues) => string;
  validate?: (values: FieldValues) => string | null;
  maxTokens?: number;
}

const MARKETING_SYSTEM =
  "You are an expert marketing copywriter for small and medium businesses. " +
  "Write clear, useful, non-generic content. Output only the requested content " +
  "in plain text or simple markdown — no preamble, no closing remarks.";

const str = (v: unknown) => (typeof v === "string" ? v.trim() : "");

export const aiPrompts: Record<string, PromptTemplate> = {
  "ai-blog-outline-generator": {
    system: MARKETING_SYSTEM,
    build: (v) =>
      [
        `Create a complete SEO blog post outline for the topic: "${str(v.topic)}".`,
        str(v.audience) && `Target audience: ${str(v.audience)}.`,
        `Tone: ${str(v.tone) || "professional"}.`,
        "Structure: one H1 title, 4-8 H2 sections each with 2-4 H3 bullet points,",
        "a suggested introduction angle, and a conclusion with a call to action.",
        "Use markdown headings.",
      ]
        .filter(Boolean)
        .join("\n"),
  },
  "ai-blog-intro-generator": {
    system: MARKETING_SYSTEM,
    build: (v) =>
      [
        `Write 3 alternative opening paragraphs (80-120 words each) for a blog post titled: "${str(v.title)}".`,
        str(v.audience) && `Target audience: ${str(v.audience)}.`,
        `Angle: ${str(v.angle) || "hook with a relatable problem"}.`,
        "Each intro must hook the reader in the first sentence, set up the problem the post solves,",
        "and end with a promise of what the reader will learn. Number them 1-3.",
      ]
        .filter(Boolean)
        .join("\n"),
  },
  "ai-product-description-generator": {
    system: MARKETING_SYSTEM,
    build: (v) =>
      [
        `Write a persuasive product description for: "${str(v.product)}".`,
        str(v.features) && `Key features/details: ${str(v.features)}.`,
        str(v.audience) && `Target buyer: ${str(v.audience)}.`,
        `Length: ${str(v.length) === "short" ? "60-90 words" : "120-180 words"}.`,
        "Lead with the main benefit, weave features into outcomes the buyer cares about,",
        "and end with a subtle call to action. Then add a 5-bullet feature list.",
      ]
        .filter(Boolean)
        .join("\n"),
  },
  "ai-ad-copy-generator": {
    system: MARKETING_SYSTEM,
    build: (v) =>
      [
        `Write ad copy for: "${str(v.product)}".`,
        `Platform: ${str(v.platform) || "google"}.`,
        str(v.offer) && `Offer/promotion: ${str(v.offer)}.`,
        str(v.audience) && `Target audience: ${str(v.audience)}.`,
        "Produce 3 variants. For Google: headline (max 30 chars) + description (max 90 chars) per variant, with character counts.",
        "For Facebook/Instagram: primary text (60-120 words) + headline (max 40 chars) per variant.",
        "Each variant should test a different angle: benefit-led, urgency/offer-led, and social-proof-led.",
      ]
        .filter(Boolean)
        .join("\n"),
  },
  "ai-cold-email-writer": {
    system: MARKETING_SYSTEM,
    build: (v) =>
      [
        `Write a cold outreach email selling/pitching: "${str(v.pitch)}".`,
        str(v.recipient) && `Recipient: ${str(v.recipient)}.`,
        str(v.painPoint) && `Their likely pain point: ${str(v.painPoint)}.`,
        `Goal: ${str(v.goal) || "book a short call"}.`,
        "Rules: under 120 words, personalised opening line placeholder in [brackets], one clear value proposition,",
        "a single low-friction call to action, no buzzwords, no 'I hope this finds you well'.",
        "Provide: subject line (under 50 chars), the email body, and a 2-sentence follow-up email for 3 days later.",
      ]
        .filter(Boolean)
        .join("\n"),
  },
  "ai-social-media-post-generator": {
    system: MARKETING_SYSTEM,
    build: (v) =>
      [
        `Write ${str(v.platform) || "Instagram"} posts about: "${str(v.topic)}".`,
        `Tone: ${str(v.tone) || "engaging"}.`,
        str(v.cta) && `Call to action: ${str(v.cta)}.`,
        "Produce 3 variants sized for the platform, each with a scroll-stopping first line,",
        "line breaks for readability, and 5-8 relevant hashtags at the end.",
      ]
        .filter(Boolean)
        .join("\n"),
  },
  "ai-business-name-generator": {
    system: MARKETING_SYSTEM,
    build: (v) =>
      [
        `Suggest 15 business name ideas for: "${str(v.description)}".`,
        str(v.keywords) && `Words/themes to consider: ${str(v.keywords)}.`,
        `Style: ${str(v.style) || "mixed"} (modern/classic/playful/mixed).`,
        "Group them: 5 descriptive names, 5 invented/brandable names, 5 evocative names.",
        "For each, add a one-line rationale. Prefer names likely to have .com or .in domains available",
        "(short, no hyphens); note that availability must be checked separately.",
      ]
        .filter(Boolean)
        .join("\n"),
  },
  "ai-tagline-generator": {
    system: MARKETING_SYSTEM,
    build: (v) =>
      [
        `Write 12 tagline/slogan options for: "${str(v.business)}".`,
        str(v.value) && `Core value proposition: ${str(v.value)}.`,
        `Tone: ${str(v.tone) || "confident"}.`,
        "Mix lengths: 4 ultra-short (2-4 words), 4 medium (5-8 words), 4 with wordplay or rhythm.",
        "Avoid clichés like 'unlock', 'unleash', 'elevate', 'empower'. Number them.",
      ]
        .filter(Boolean)
        .join("\n"),
  },
  "ai-email-reply-generator": {
    system:
      "You are a professional business communication assistant. Write clear, courteous, effective emails. Output only the reply email, no preamble.",
    build: (v) =>
      [
        `Write a reply to this email:\n"""${str(v.email)}"""`,
        `The reply should: ${str(v.intent) || "respond helpfully"}.`,
        `Tone: ${str(v.tone) || "professional"}.`,
        "Keep it concise (under 150 words), address every question asked in the original,",
        "and end with an appropriate sign-off placeholder [Your name].",
      ]
        .filter(Boolean)
        .join("\n"),
  },
  "ai-linkedin-post-generator": {
    system: MARKETING_SYSTEM,
    build: (v) =>
      [
        `Write a LinkedIn post about: "${str(v.topic)}".`,
        `Angle: ${str(v.angle) || "lesson learned"}.`,
        str(v.audience) && `Audience: ${str(v.audience)}.`,
        "Structure: a strong one-line hook (this is what shows before 'see more'), short 1-2 sentence paragraphs",
        "with line breaks, a concrete story or insight in the middle, a takeaway, and a question to invite comments.",
        "150-250 words. 3-5 hashtags at the very end. No emoji walls — at most 2-3 total.",
      ]
        .filter(Boolean)
        .join("\n"),
  },
  "ai-seo-title-generator": {
    system: MARKETING_SYSTEM,
    build: (v) =>
      [
        `Generate 10 SEO title tag options for a page about: "${str(v.topic)}".`,
        str(v.keyword) && `Primary keyword (must appear, ideally near the start): ${str(v.keyword)}.`,
        `Intent: ${str(v.intent) || "informational"}.`,
        "Each title must be 50-60 characters (show the character count in parentheses after each),",
        "compelling enough to earn the click, and honest to the content. Mix formats: how-to, listicle,",
        "question, comparison, and plain descriptive. Then mark your top pick with a one-line reason.",
      ]
        .filter(Boolean)
        .join("\n"),
  },
  "ai-faq-generator": {
    system: MARKETING_SYSTEM,
    build: (v) =>
      [
        `Generate a FAQ section for: "${str(v.subject)}".`,
        str(v.details) && `Key details to draw from: ${str(v.details)}.`,
        `Number of questions: ${str(v.count) || "8"}.`,
        "Write the questions the way real customers phrase them (including one price/cost question and one",
        "comparison or alternative question), with clear 2-4 sentence answers. Format as markdown:",
        "**Q:** question / **A:** answer.",
      ]
        .filter(Boolean)
        .join("\n"),
  },
  "job-description-generator": {
    system:
      "You are an experienced HR and recruitment copywriter who writes clear, professional, " +
      "non-generic job descriptions for startups and small businesses. You write only from the " +
      "information the user provides. Never invent company details, benefits, salary, location, " +
      "team size, certifications, or a contact email, phone number, or application URL. Keep " +
      "responsibilities and requirements proportionate to the stated experience level. Avoid " +
      "discriminatory language, buzzword-soup requirements, and unrealistic or contradictory " +
      "expectations. Output clean markdown with concise headings and bullet points — no preamble, " +
      "no closing remarks.",
    maxTokens: 2048,
    validate: (v) => {
      const role = str(v.role);
      if (!role) return "Please enter the job role or title.";
      if (role.length > JOB_FIELD_LIMITS.role)
        return `The job role or title is too long (max ${JOB_FIELD_LIMITS.role} characters).`;
      const experience = str(v.experience);
      if (experience && !(JOB_EXPERIENCE_LEVELS as readonly string[]).includes(experience))
        return "Please select a valid experience level.";
      if (!experience) return "Please select an experience level.";
      const skills = str(v.skills);
      if (!skills) return "Please enter at least one required skill.";
      if (skills.length > JOB_FIELD_LIMITS.skills)
        return `The required skills list is too long (max ${JOB_FIELD_LIMITS.skills} characters).`;
      if (str(v.industry).length > JOB_FIELD_LIMITS.industry)
        return `The industry is too long (max ${JOB_FIELD_LIMITS.industry} characters).`;
      if (str(v.company).length > JOB_FIELD_LIMITS.company)
        return `The company information is too long (max ${JOB_FIELD_LIMITS.company} characters).`;
      if (str(v.responsibilities).length > JOB_FIELD_LIMITS.responsibilities)
        return `The additional requirements are too long (max ${JOB_FIELD_LIMITS.responsibilities} characters).`;
      return null;
    },
    build: (v) =>
      [
        `Create a professional, recruitment-ready job description for: "${str(v.role)}".`,
        `Experience level: ${str(v.experience)}.`,
        `Required skills: ${str(v.skills)}.`,
        str(v.industry) && `Industry: ${str(v.industry)}.`,
        str(v.company) && `Company context: ${str(v.company)}.`,
        str(v.responsibilities) &&
          `Additional responsibilities or requirements to cover: ${str(v.responsibilities)}.`,
        "Use the exact job title supplied, verbatim, as the heading and throughout.",
        "Structure the document with these markdown headings:",
        "## Job Title",
        "## Professional Summary",
        "## Job Overview",
        "## Key Responsibilities",
        "## Required Skills",
        "## Preferred Skills",
        "## Experience Requirements",
        "## Qualifications",
        "## Nice-to-Have Skills",
        "## How to Apply",
        "Write 5-8 concise, specific Key Responsibilities matched to the experience level.",
        "Group Required Skills sensibly and keep Preferred Skills and Nice-to-Have Skills short.",
        "Under How to Apply, include only a placeholder line like [Add application instructions or contact email].",
        "Never fabricate salary, benefits, location, company name, or contact details.",
        "If company context or industry was not provided, use neutral generic wording and do not invent a company.",
      ]
        .filter(Boolean)
        .join("\n"),
  },
};
