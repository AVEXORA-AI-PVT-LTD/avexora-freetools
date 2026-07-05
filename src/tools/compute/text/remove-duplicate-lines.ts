import type { GenerateFn } from "@/tools/types";

export const removeDuplicateLines: GenerateFn = (values) => {
  const text = typeof values.text === "string" ? values.text : "";
  const caseInsensitive = values.caseInsensitive === true;
  const trim = values.trim === true;

  if (text === "") return { error: "Paste some lines to de-duplicate." };

  const seen = new Set<string>();
  const output: string[] = [];
  for (const rawLine of text.split("\n")) {
    const line = trim ? rawLine.trim() : rawLine;
    const key = caseInsensitive ? line.toLowerCase() : line;
    if (!seen.has(key)) {
      seen.add(key);
      output.push(line);
    }
  }

  return { text: output.join("\n"), filename: "deduped.txt" };
};
