import type { GenerateFn } from "@/tools/types";

function escapeRegex(literal: string): string {
  return literal.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export const findAndReplace: GenerateFn = (values) => {
  const text = typeof values.text === "string" ? values.text : "";
  const find = typeof values.find === "string" ? values.find : "";
  const replace = typeof values.replace === "string" ? values.replace : "";
  const caseSensitive = values.caseSensitive === true;
  const wholeWord = values.wholeWord === true;
  const regexMode = values.regexMode === true;

  if (text === "") return { error: "Paste some text to search in." };
  if (find === "") return { error: "Enter the text (or pattern) to find." };

  const flags = caseSensitive ? "g" : "gi";
  let pattern: RegExp;
  try {
    let source = regexMode ? find : escapeRegex(find);
    if (wholeWord) source = `\\b(?:${source})\\b`;
    pattern = new RegExp(source, flags);
  } catch (e) {
    const detail = e instanceof Error ? e.message : String(e);
    return { error: `Invalid regular expression: ${detail}` };
  }

  // In plain-text mode replace literally (no $& / $1 interpretation);
  // in regex mode keep capture-group references like $1 working.
  const result = regexMode
    ? text.replace(pattern, replace)
    : text.replace(pattern, () => replace);

  return { text: result };
};
