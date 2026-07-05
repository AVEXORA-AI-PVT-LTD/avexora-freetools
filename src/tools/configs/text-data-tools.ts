import type { ToolConfig } from "../types";
import { computeWordCount } from "../compute/text/word-counter";

export const tools: ToolConfig[] = [
  {
    kind: "calculator",
    slug: "word-counter",
    category: "text-data-tools",
    name: "Word Counter",
    tagline:
      "Count words, characters, sentences and reading time as you type.",
    seoDescription:
      "Free online word counter. Instantly count words, characters (with and without spaces), sentences, paragraphs, reading time and speaking time for any text.",
    fields: [
      {
        name: "text",
        label: "Your text",
        type: "textarea",
        placeholder: "Paste or type your text here…",
        rows: 10,
        optional: true,
      },
    ],
    compute: computeWordCount,
    autoCompute: true,
    about: [
      "Whether you're writing a blog post with a target length, a meta description with a character limit, or a speech with a time slot, you need live counts while you write. Paste your text above and every metric updates instantly — nothing is uploaded or stored, the counting happens entirely in your browser.",
      "Word count is based on whitespace-separated words, the standard used by most editors and content platforms. Reading time assumes an average silent reading speed of 225 words per minute, and speaking time assumes 130 words per minute — the pace of a typical presentation.",
      "Common targets: SEO blog posts usually run 1,000–2,000 words, meta descriptions up to 160 characters, tweets 280 characters, and LinkedIn posts around 1,300 characters before truncation.",
    ],
    faq: [
      {
        question: "How is the word count calculated?",
        answer:
          "Text is split on spaces, tabs and line breaks, and each separated token counts as one word — the same method used by Google Docs and most writing tools.",
      },
      {
        question: "Is my text stored anywhere?",
        answer:
          "No. Counting runs entirely in your browser using JavaScript. Your text never leaves your device and is gone when you close the page.",
      },
      {
        question: "How accurate is the reading time estimate?",
        answer:
          "It uses the widely accepted average of 225 words per minute for silent reading. Actual speed varies by reader and content difficulty, so treat it as a good approximation.",
      },
    ],
    related: ["character-counter", "case-converter", "text-diff-checker", "ai-blog-outline-generator"],
  },
];
