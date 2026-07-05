import type { ToolConfig } from "../types";

export const tools: ToolConfig[] = [
  {
    kind: "ai-writer",
    slug: "ai-blog-outline-generator",
    category: "ai-writers",
    name: "AI Blog Outline Generator",
    tagline:
      "Turn a topic into a complete, SEO-ready blog post outline in seconds.",
    seoDescription:
      "Free AI blog outline generator. Enter your topic and audience and get a structured outline with headings, subheadings and key points — powered by AI, no sign-up.",
    fields: [
      {
        name: "topic",
        label: "Blog topic",
        type: "text",
        placeholder: "e.g. How small businesses can automate GST filing",
      },
      {
        name: "audience",
        label: "Target audience",
        type: "text",
        placeholder: "e.g. Indian small business owners",
        optional: true,
      },
      {
        name: "tone",
        label: "Tone",
        type: "select",
        defaultValue: "professional",
        options: [
          { value: "professional", label: "Professional" },
          { value: "conversational", label: "Conversational" },
          { value: "authoritative", label: "Authoritative" },
        ],
      },
    ],
    submitLabel: "Generate outline",
    about: [
      "Staring at a blank page is the slowest part of writing. This generator gives you a working skeleton in seconds: enter your topic (and optionally who you're writing for), and the AI produces a structured outline with an H1, logical H2 sections, supporting H3 points, and suggestions for the introduction and conclusion.",
      "A good outline is the difference between a rambling post and one that ranks. Search engines reward content that covers a topic thoroughly and is organised under clear headings — exactly what an outline enforces. Readers benefit too: most people scan a post's headings before deciding whether to read it, so a logical heading structure keeps them on the page. Use the generated structure as-is or rearrange sections to fit your angle, then write section by section — filling in a skeleton is far faster than composing from nothing, and it keeps every section focused on answering one question.",
      "A practical workflow: generate the outline, delete any section you don't have something original to say about, add one section from your own experience that the AI couldn't know, and then draft. That combination — solid structure plus first-hand insight — is what separates content that ranks from content that reads like everyone else's.",
      "The tool is free and requires no account. For end-to-end content workflows — briefs, AI drafting, scheduling and performance tracking — the EBOS Marketing module includes a full AI writing assistant.",
    ],
    faq: [
      {
        question: "Is the generated outline unique?",
        answer:
          "Yes. Each outline is generated fresh by AI from your specific topic, audience and tone — it isn't pulled from a template library.",
      },
      {
        question: "Can I use the outline for commercial content?",
        answer:
          "Yes, the output is yours to use freely for blog posts, client work or any other content.",
      },
      {
        question: "What makes a good blog outline?",
        answer:
          "A clear H1 with the primary keyword, 4–8 H2 sections that each answer one reader question, H3 subpoints for detail, and a conclusion with a call to action. The generator follows this structure automatically.",
      },
    ],
    related: ["ai-blog-intro-generator", "ai-seo-title-generator", "ai-faq-generator", "word-counter"],
  },
];
