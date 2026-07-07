import type { GenerateFn } from "@/tools/types";

/** Unicode-safe base64 that works in browsers and Node. */
function encodeBase64(text: string): string {
  const bytes = new TextEncoder().encode(text);
  let binary = "";
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary);
}

function decodeBase64(b64: string): string {
  const binary = atob(b64);
  const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

export const generateBase64: GenerateFn = (values) => {
  const text = typeof values.text === "string" ? values.text : "";
  const mode = values.mode === "decode" ? "decode" : "encode";
  if (text === "") return { error: `Enter some text to ${mode}.` };

  try {
    return { text: mode === "encode" ? encodeBase64(text) : decodeBase64(text.trim()) };
  } catch {
    return { error: "The input is not valid base64 — check for missing padding or stray characters." };
  }
};
