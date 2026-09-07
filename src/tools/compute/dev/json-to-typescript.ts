import type { GenerateFn } from "@/types/tools";

export const MAX_INPUT_LENGTH = 2_000_000;
export const MAX_DECLARATIONS = 500;

const IDENT = /^[A-Za-z_$][A-Za-z0-9_$]*$/;

type Shape = "interface" | "type";

interface Ctx {
  shape: Shape;
  declarations: string[];
  usedNames: Set<string>;
  byBody: Map<string, string>;
}

export const generateJsonToTypescript: GenerateFn = (values) => {
  const jsonText = typeof values.json === "string" ? values.json : "";
  const shape: Shape = values.format === "type" ? "type" : "interface";
  const rootName = sanitizeTypeName(typeof values.rootName === "string" ? values.rootName.trim() : "");

  if (jsonText.trim() === "") return { error: "Paste some JSON to convert to TypeScript." };
  if (jsonText.length > MAX_INPUT_LENGTH)
    return {
      error: `JSON is too large — the maximum is ${MAX_INPUT_LENGTH.toLocaleString("en-IN")} characters.`,
    };

  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonText);
  } catch (e) {
    const detail = e instanceof Error ? e.message : String(e);
    return { error: `Invalid JSON: ${detail}` };
  }

  const ctx: Ctx = { shape, declarations: [], usedNames: new Set(), byBody: new Map() };

  if (Array.isArray(parsed)) {
    if (parsed.length === 0) {
      ctx.declarations.push(`type ${rootName} = unknown[];`);
    } else {
      const parts: string[] = [];
      for (const item of parsed) {
        const t = tsTypeOf(item, `${rootName}Item`, ctx);
        if (!parts.includes(t)) parts.push(t);
      }
      const inner = parts.length === 1 ? parts[0] : `(${parts.join(" | ")})`;
      ctx.declarations.push(`type ${rootName} = ${inner}[];`);
    }
  } else if (parsed !== null && typeof parsed === "object") {
    objectType(parsed as Record<string, unknown>, rootName, ctx, { inlineEmpty: false });
  } else {
    ctx.declarations.push(`type ${rootName} = ${literalType(parsed)};`);
  }

  if (ctx.declarations.length > MAX_DECLARATIONS)
    return {
      error:
        "Too many object definitions to generate — simplify the JSON or split it into smaller, more representative parts.",
    };

  ctx.declarations.reverse();
  return { text: `${ctx.declarations.join("\n\n")}\n`, filename: `${rootName}.ts` };
};

function tsTypeOf(value: unknown, hint: string, ctx: Ctx): string {
  if (value === null) return "null";
  if (typeof value === "string") return "string";
  if (typeof value === "number") return "number";
  if (typeof value === "boolean") return "boolean";
  if (Array.isArray(value)) return arrayType(value, hint, ctx);
  if (typeof value === "object") return objectType(value as Record<string, unknown>, hint, ctx, { inlineEmpty: true });
  return "unknown";
}

function literalType(value: unknown): string {
  if (value === null) return "null";
  if (typeof value === "string") return "string";
  if (typeof value === "number") return "number";
  if (typeof value === "boolean") return "boolean";
  return "unknown";
}

function arrayType(value: unknown[], hint: string, ctx: Ctx): string {
  if (value.length === 0) return "unknown[]";
  const parts: string[] = [];
  for (const item of value) {
    const t = tsTypeOf(item, hint, ctx);
    if (!parts.includes(t)) parts.push(t);
  }
  const inner = parts.length === 1 ? parts[0] : `(${parts.join(" | ")})`;
  return `${inner}[]`;
}

function objectType(
  value: Record<string, unknown>,
  hint: string,
  ctx: Ctx,
  { inlineEmpty }: { inlineEmpty: boolean },
): string {
  const body = objectBody(value, hint, ctx);
  if (body === "") {
    if (inlineEmpty) return "Record<string, unknown>";
    const name = claimName(hint, ctx);
    ctx.declarations.push(renderDecl(name, body, ctx.shape));
    return name;
  }
  const existing = ctx.byBody.get(body);
  if (existing) return existing;
  const name = claimName(hint, ctx);
  ctx.byBody.set(body, name);
  ctx.declarations.push(renderDecl(name, body, ctx.shape));
  return name;
}

function objectBody(value: Record<string, unknown>, parentName: string, ctx: Ctx): string {
  const lines: string[] = [];
  for (const key of Object.keys(value)) {
    const childType = tsTypeOf(value[key], `${parentName}${pascalFromKey(key)}`, ctx);
    lines.push(`  ${propName(key)}: ${childType};`);
  }
  return lines.join("\n");
}

function renderDecl(name: string, body: string, shape: Shape): string {
  const inner = body === "" ? "{}" : `{\n${body}\n}`;
  return shape === "interface" ? `interface ${name} ${inner}` : `type ${name} = ${inner};`;
}

function claimName(hint: string, ctx: Ctx): string {
  const base = sanitizeTypeName(hint);
  let name = base;
  let n = 2;
  while (ctx.usedNames.has(name)) {
    name = `${base}${n}`;
    n += 1;
  }
  ctx.usedNames.add(name);
  return name;
}

function sanitizeTypeName(raw: string): string {
  const cleaned = raw.replace(/[^A-Za-z0-9_$]/g, "");
  if (cleaned === "") return "Root";
  if (!/^[A-Za-z_$]/.test(cleaned)) return `_${cleaned}`;
  return cleaned;
}

function toPascal(key: string): string {
  const tokens = key.split(/[^A-Za-z0-9]+/).filter(Boolean);
  return tokens.map((t) => t[0].toUpperCase() + t.slice(1)).join("");
}

function pascalFromKey(key: string): string {
  const pascal = toPascal(key);
  return pascal === "" ? "Prop" : pascal;
}

function propName(key: string): string {
  return IDENT.test(key) ? key : JSON.stringify(key);
}