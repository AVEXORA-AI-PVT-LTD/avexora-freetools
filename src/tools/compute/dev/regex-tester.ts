import type { GenerateFn } from "@/tools/types";

export const testRegex: GenerateFn = (values) => {
  const pattern = typeof values.pattern === "string" ? values.pattern : "";
  const flagsInput = typeof values.flags === "string" ? values.flags.trim() : "";
  const text = typeof values.text === "string" ? values.text : "";

  if (pattern === "") return { error: "Enter a regular expression pattern." };
  if (text === "") return { error: "Enter some test text to match against." };
  if (!/^[gimsuy]*$/.test(flagsInput) || new Set(flagsInput).size !== flagsInput.length) {
    return { error: "Flags may only contain g, i, m, s, u, y — each at most once." };
  }

  // Always search globally so every match is listed, regardless of the g flag.
  const flags = flagsInput.includes("g") ? flagsInput : flagsInput + "g";
  let regex: RegExp;
  try {
    regex = new RegExp(pattern, flags);
  } catch (e) {
    const detail = e instanceof Error ? e.message : String(e);
    return { error: `Invalid regular expression: ${detail}` };
  }

  const lines: string[] = [];
  let count = 0;
  for (const match of text.matchAll(regex)) {
    count++;
    lines.push(`Match ${count} at index ${match.index}: "${match[0]}"`);
    match.slice(1).forEach((group, i) => {
      lines.push(`  Group ${i + 1}: ${group === undefined ? "(no match)" : `"${group}"`}`);
    });
    if (count >= 500) {
      lines.push("… stopped after 500 matches.");
      break;
    }
    if (match[0] === "") regex.lastIndex++; // avoid infinite loop on empty matches
  }

  if (count === 0) return { text: "No matches." };
  return { text: `${count} match${count === 1 ? "" : "es"} found.\n\n${lines.join("\n")}` };
};
