const ALLOWED_TAGS = new Set([
  "p", "br", "b", "strong", "i", "em", "u", "s", "strike", "sub", "sup",
  "small", "h2", "h3", "h4", "h5", "ul", "ol", "li", "blockquote", "code",
  "pre", "a", "span",
]);

const VOID_TAGS = new Set(["br"]);

const BLOCKED_ATTRS = new Set([
  "style",
  "srcdoc",
  "formaction",
  "autoplay",
  "onerror", "onclick", "onload", "onsubmit", "ondblclick", "onchange",
  "oninput", "onfocus", "onblur", "onkeydown", "onkeyup", "onkeypress",
  "onmousedown", "onmouseup", "onmouseover", "onmouseout", "onmouseenter",
  "onmousemove", "ondrag", "ondrop", "onpaste", "oncopy", "oncut",
]);

function isSafeUrl(value: string): boolean {
  const trimmed = value.trim().toLowerCase();
  if (/^(https?|mailto|tel):/.test(trimmed)) return true;
  if (trimmed.startsWith("/") || trimmed.startsWith("./") || trimmed.startsWith("../")) return true;
  if (trimmed.startsWith("#")) return true;
  return false;
}

function safeAttributes(attrsRaw: string): string {
  const out: string[] = [];
  const attrRe = /([a-zA-Z_:][a-zA-Z0-9_.:-]*)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+))/g;
  let m: RegExpExecArray | null;
  while ((m = attrRe.exec(attrsRaw)) !== null) {
    const name = m[1].toLowerCase();
    if (BLOCKED_ATTRS.has(name)) continue;
    if (name.startsWith("on")) continue;
    const value = m[2] ?? m[3] ?? m[4] ?? "";
    if ((name === "href" || name === "src") && !isSafeUrl(value)) continue;
    if (!(name === "href" || name === "src" || name === "title" || name === "target" || name === "rel" || name === "id" || name === "class")) continue;
    if (name === "target" && value !== "_blank") continue;
    if (name === "rel" && !/^(noopener|noreferrer|noopener\s+noreferrer)$/i.test(value)) continue;
    out.push(` ${name}="${value.replace(/\"/g, "&quot;")}"`);
  }
  return out.join("");
}

/**
 * Strict allowlist HTML sanitizer for admin-authored rich-text that is later
 * rendered with dangerouslySetInnerHTML on the public site. Strips scripts,
 * event handlers, javascript: URLs, styles and every non-whitelisted element.
 */
export function sanitizeHtml(input: string): string {
  if (!input) return "";
  let source = input.replace(/<!--[\s\S]*?-->/g, "");

  // Drop known-dangerous elements along with their content.
  source = source.replace(
    /<\s*(script|style|iframe|object|embed|form|input|button|textarea|select|option|meta|link|frame|frameset|applet|svg|math)[^>]*>[\s\S]*?<\s*\/\s*\1\s*>/gi,
    "",
  );
  source = source.replace(
    /<\s*(script|style|iframe|object|embed|form|input|button|textarea|select|option|meta|link|frame|frameset|applet|svg|math)\b[^>]*>/gi,
    "",
  );

  let result = "";
  let lastIndex = 0;
  const tagRe = /<\s*(\/?)([a-zA-Z][a-zA-Z0-9]*)((?:\s+[a-zA-Z_:][a-zA-Z0-9_.:-]*\s*=\s*(?:"[^"]*"|'[^']*'|[^\s"'=<>`]+))*?)\s*(\/?)>/g;
  let m: RegExpExecArray | null;

  while ((m = tagRe.exec(source)) !== null) {
    result += source.slice(lastIndex, m.index);
    const closing = m[1] === "/";
    const tag = m[2].toLowerCase();
    const attrsRaw = m[3] ?? "";
    const selfClosing = m[4] === "/";

    if (closing) {
      if (ALLOWED_TAGS.has(tag)) result += `</${tag}>`;
    } else if (ALLOWED_TAGS.has(tag)) {
      const attrs = safeAttributes(attrsRaw);
      if (VOID_TAGS.has(tag)) {
        result += `<${tag}${attrs}>`;
      } else if (selfClosing) {
        result += `<${tag}${attrs}></${tag}>`;
      } else {
        result += `<${tag}${attrs}>`;
      }
    }
    lastIndex = m.index + m[0].length;
  }

  result += source.slice(lastIndex);
  return result;
}