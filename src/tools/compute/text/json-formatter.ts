import type { GenerateFn } from "@/types/tools";

export const formatJson: GenerateFn = (values) => {
  const text = typeof values.json === "string" ? values.json : "";
  const mode = typeof values.mode === "string" ? values.mode : "pretty2";
  if (text.trim() === "") return { error: "Paste some JSON to format." };

  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch (e) {
    const detail = e instanceof Error ? e.message : String(e);
    return { error: `Invalid JSON: ${detail}` };
  }

  const output =
    mode === "minify"
      ? JSON.stringify(parsed)
      : JSON.stringify(parsed, null, mode === "pretty4" ? 4 : 2);

  return { text: output, filename: "formatted.json" };
};
