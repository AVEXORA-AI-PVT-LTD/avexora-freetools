import type { GenerateFn } from "@/types/tools";

function styleWords(words: string[], style: string): string {
  const cap = (w: string) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase();
  if (style === "lowercase") return words.join("").toLowerCase();
  if (style === "capitalized") return words.map(cap).join("");
  // camelCase (default)
  return words.map((w, i) => (i === 0 ? w.toLowerCase() : cap(w))).join("");
}

export const generateHashtags: GenerateFn = (values) => {
  const raw = typeof values.keywords === "string" ? values.keywords : "";
  const style = typeof values.style === "string" ? values.style : "camelCase";

  const tags: string[] = [];
  const seen = new Set<string>();
  for (const part of raw.split(/[,\n]/)) {
    const words = part
      .trim()
      .split(/\s+/)
      .map((w) => w.replace(/[^a-zA-Z0-9]/g, ""))
      .filter((w) => w.length > 0);
    if (words.length === 0) continue;
    const tag = `#${styleWords(words, style)}`;
    const key = tag.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    tags.push(tag);
  }

  if (tags.length === 0) {
    return { error: "Enter at least one keyword (separate keywords with commas or new lines)." };
  }

  return { text: `${tags.join("\n")}\n\n${tags.join(" ")}` };
};
