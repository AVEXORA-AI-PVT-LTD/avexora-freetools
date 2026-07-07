import type { ComputeFn } from "@/tools/types";

const SPAM_TRIGGERS = [
  "free!!!", "act now", "urgent", "winner", "guarantee",
  "click here", "buy now", "limited time", "100%",
];

export const testSubjectLine: ComputeFn = (values) => {
  const subject = typeof values.subject === "string" ? values.subject.trim() : "";
  if (!subject) return { error: "Enter a subject line to test." };

  const chars = subject.length;
  const words = subject.split(/\s+/);
  const wordCount = words.length;
  const lower = subject.toLowerCase();

  const spamCount = SPAM_TRIGGERS.filter((t) => lower.includes(t)).length;
  const allCapsCount = words.filter((w) => /^[A-Z]{2,}$/.test(w.replace(/[^A-Za-z]/g, ""))).length;
  const personalized = /\byou\b|\byour\b/i.test(subject);
  const emojiCount = [...subject.matchAll(/\p{Extended_Pictographic}/gu)].length;

  let score = 0;
  if (chars >= 30 && chars <= 50) score += 30;
  if (wordCount >= 3 && wordCount <= 9) score += 15;
  if (spamCount === 0) score += 25;
  if (allCapsCount === 0) score += 10;
  if (personalized) score += 15;
  if (emojiCount <= 1) score += 5;
  score = Math.min(score, 100);

  return {
    results: [
      { label: "Character count", value: `${chars} (ideal 30–50)` },
      { label: "Word count", value: `${wordCount}` },
      { label: "Spam trigger phrases", value: `${spamCount}` },
      { label: "ALL-CAPS words", value: `${allCapsCount}` },
      { label: "Personalization (you/your)", value: personalized ? "Yes" : "No" },
      { label: "Emoji count", value: `${emojiCount}` },
      { label: "Subject line score", value: `${score}/100`, emphasis: true },
    ],
  };
};
