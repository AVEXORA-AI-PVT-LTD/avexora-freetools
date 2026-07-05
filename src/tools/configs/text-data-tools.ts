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
      "Whether you're writing a blog post with a target length, a meta description with a character limit, a college essay with a word requirement, or a speech that has to fit a time slot, you need live counts while you write. Paste or type your text above and every metric updates instantly as you edit — words, characters with and without spaces, sentences, paragraphs, reading time and speaking time. Nothing is uploaded or stored; the counting happens entirely in your browser, so it's safe for confidential drafts and works even on a flaky connection.",
      "Word count is based on whitespace-separated words, the same standard used by Google Docs, Microsoft Word and most content platforms, so the number you see here will match what your editor reports. Sentence count looks for terminal punctuation, and paragraph count treats blank lines as separators. Reading time assumes an average silent reading speed of 225 words per minute, and speaking time assumes 130 words per minute — the comfortable pace of a typical presentation, which is useful when you're preparing a talk, a webinar script or a wedding speech.",
      "Some common targets to write against: SEO blog posts usually run 1,000–2,000 words, meta descriptions should stay under 160 characters, tweets cap at 280 characters, LinkedIn posts truncate around 1,300 characters, and a 5-minute talk is roughly 650 spoken words. Keep this page open in a tab and paste as you go.",
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
