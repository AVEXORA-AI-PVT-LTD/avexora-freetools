import type { GenerateFn } from "@/types/tools";

function decodeSegment(segment: string): unknown {
  const b64 = segment.replace(/-/g, "+").replace(/_/g, "/");
  const padded = b64 + "=".repeat((4 - (b64.length % 4)) % 4);
  const binary = atob(padded);
  const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
  return JSON.parse(new TextDecoder().decode(bytes));
}

function describeTimestamp(value: unknown): string | null {
  if (typeof value !== "number") return null;
  const date = new Date(value * 1000);
  if (!Number.isFinite(date.getTime())) return null;
  return date.toISOString();
}

export const decodeJwt: GenerateFn = (values) => {
  const token = typeof values.token === "string" ? values.token.trim() : "";
  if (token === "") return { error: "Paste a JWT to decode." };

  const parts = token.split(".");
  if (parts.length !== 3) {
    return { error: "A JWT has three dot-separated parts (header.payload.signature) — this input doesn't." };
  }

  let header: unknown;
  let payload: unknown;
  try {
    header = decodeSegment(parts[0]);
    payload = decodeSegment(parts[1]);
  } catch {
    return { error: "The token's header or payload is not valid base64url-encoded JSON." };
  }

  const lines = [
    "HEADER",
    JSON.stringify(header, null, 2),
    "",
    "PAYLOAD",
    JSON.stringify(payload, null, 2),
  ];

  if (payload && typeof payload === "object") {
    const claims = payload as Record<string, unknown>;
    const notes: string[] = [];
    const iat = describeTimestamp(claims.iat);
    const exp = describeTimestamp(claims.exp);
    const nbf = describeTimestamp(claims.nbf);
    if (iat) notes.push(`iat (issued at):  ${iat}`);
    if (nbf) notes.push(`nbf (not before): ${nbf}`);
    if (exp) {
      const expired = (claims.exp as number) * 1000 < Date.now();
      notes.push(`exp (expires):    ${exp} — ${expired ? "EXPIRED" : "still valid"}`);
    }
    if (notes.length > 0) lines.push("", "TIMESTAMPS", ...notes);
  }

  lines.push("", "Note: the signature is NOT verified — decoding only proves what the token says, not that it's authentic.");
  return { text: lines.join("\n") };
};
