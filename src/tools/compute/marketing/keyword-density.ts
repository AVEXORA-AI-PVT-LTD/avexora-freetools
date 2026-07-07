import type { ComputeFn } from "@/tools/types";
import { formatNumber } from "../format";

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export const computeKeywordDensity: ComputeFn = (values) => {
  const content = typeof values.content === "string" ? values.content.trim() : "";
  const keyword = typeof values.keyword === "string" ? values.keyword.trim() : "";

  if (!content) return { error: "Paste the content you want to check." };
  if (!keyword) return { error: "Enter the keyword or phrase to count." };

  const totalWords = content.split(/\s+/).length;
  const keywordWords = keyword.split(/\s+/);
  const pattern = new RegExp(`\\b${keywordWords.map(escapeRegex).join("\\s+")}\\b`, "gi");
  const occurrences = [...content.matchAll(pattern)].length;
  const density = ((occurrences * keywordWords.length) / totalWords) * 100;

  let verdict: string;
  if (density < 0.5) verdict = "Low — the keyword barely appears; work it in naturally a few more times.";
  else if (density <= 2.5) verdict = "Good — within the commonly recommended 0.5–2.5% range.";
  else verdict = "Risk of keyword stuffing — above 2.5%; reduce repetition and use synonyms.";

  return {
    results: [
      { label: "Total words", value: formatNumber(totalWords) },
      { label: "Keyword occurrences", value: formatNumber(occurrences) },
      { label: "Keyword density", value: `${density.toFixed(2)}%`, emphasis: true },
      { label: "Verdict", value: verdict },
    ],
  };
};
