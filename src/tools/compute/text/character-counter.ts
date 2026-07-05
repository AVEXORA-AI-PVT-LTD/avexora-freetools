import type { ComputeFn } from "@/tools/types";
import { formatNumber } from "../format";

export const computeCharacterCount: ComputeFn = (values) => {
  const text = typeof values.text === "string" ? values.text : "";
  const characters = text.length;
  const charactersNoSpaces = text.replace(/\s/g, "").length;
  const words = text.trim() === "" ? 0 : text.trim().split(/\s+/).length;
  const lines = text === "" ? 0 : text.split("\n").length;

  return {
    results: [
      { label: "Characters", value: formatNumber(characters), emphasis: true },
      { label: "Characters (no spaces)", value: formatNumber(charactersNoSpaces) },
      { label: "Words", value: formatNumber(words) },
      { label: "Lines", value: formatNumber(lines) },
    ],
  };
};
