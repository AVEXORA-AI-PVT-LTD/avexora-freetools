import type { ComputeFn } from "@/types/tools";
import { formatNumber } from "../format";

const AVG_READING_WPM = 225;
const AVG_SPEAKING_WPM = 130;

export const computeWordCount: ComputeFn = (values) => {
  const text = typeof values.text === "string" ? values.text : "";
  const words = text.trim() === "" ? 0 : text.trim().split(/\s+/).length;
  const sentences = (text.match(/[.!?]+(?=\s|$)/g) ?? []).length;
  const paragraphs = text
    .split(/\n{2,}/)
    .filter((p) => p.trim() !== "").length;
  const readingMin = words / AVG_READING_WPM;
  const speakingMin = words / AVG_SPEAKING_WPM;

  const fmtMinutes = (min: number) =>
    words === 0 ? "0 min" : min < 1 ? "< 1 min" : `${formatNumber(Math.round(min))} min`;

  return {
    results: [
      { label: "Words", value: formatNumber(words), emphasis: true },
      { label: "Characters", value: formatNumber(text.length) },
      { label: "Characters (no spaces)", value: formatNumber(text.replace(/\s/g, "").length) },
      { label: "Sentences", value: formatNumber(sentences) },
      { label: "Paragraphs", value: formatNumber(paragraphs) },
      { label: "Reading time", value: fmtMinutes(readingMin) },
      { label: "Speaking time", value: fmtMinutes(speakingMin) },
    ],
  };
};
