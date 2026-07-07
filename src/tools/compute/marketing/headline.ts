import type { ComputeFn } from "@/tools/types";

const POWER_WORDS = [
  "free", "proven", "easy", "ultimate", "essential", "complete", "best",
  "new", "now", "save", "boost", "grow", "secret", "simple",
];

const POSITIVE_WORDS = [
  "amazing", "awesome", "brilliant", "delightful", "effective", "exciting",
  "great", "happy", "love", "perfect", "powerful", "success", "win", "wonderful",
];

export const analyzeHeadline: ComputeFn = (values) => {
  const headline = typeof values.headline === "string" ? values.headline.trim() : "";
  if (!headline) return { error: "Enter a headline to analyze." };

  const chars = headline.length;
  const words = headline.split(/\s+/);
  const wordCount = words.length;
  const lower = headline.toLowerCase();

  const hasNumber = /\d/.test(headline);
  const hasPowerWord = POWER_WORDS.some((w) => new RegExp(`\\b${w}\\b`).test(lower));
  const sentimentCount = POSITIVE_WORDS.filter((w) => new RegExp(`\\b${w}\\b`).test(lower)).length;
  const startsStrong = /^\d/.test(headline) || headline.endsWith("?");

  let score = 0;
  if (chars >= 40 && chars <= 70) score += 30;
  if (wordCount >= 6 && wordCount <= 12) score += 20;
  if (hasNumber) score += 15;
  if (hasPowerWord) score += 20;
  if (startsStrong) score += 15;
  score = Math.min(score, 100);

  return {
    results: [
      { label: "Character count", value: `${chars} (ideal 50–60)` },
      { label: "Word count", value: `${wordCount}` },
      { label: "Contains a number", value: hasNumber ? "Yes" : "No" },
      { label: "Contains a power word", value: hasPowerWord ? "Yes" : "No" },
      { label: "Positive sentiment words", value: `${sentimentCount}` },
      { label: "Headline score", value: `${score}/100`, emphasis: true },
    ],
  };
};
