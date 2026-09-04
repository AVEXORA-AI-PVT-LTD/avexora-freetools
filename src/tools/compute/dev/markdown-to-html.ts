import type { GenerateFn } from "@/types/tools";

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Inline markdown: code, bold, italic, links. Input is already HTML-escaped. */
function inline(text: string): string {
  return text
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/\*([^*]+)\*/g, "<em>$1</em>")
    .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, '<a href="$2">$1</a>');
}

export function markdownToHtml(md: string): string {
  const lines = md.replace(/\r\n/g, "\n").split("\n");
  const out: string[] = [];
  let i = 0;

  const listItems = (marker: RegExp): string[] => {
    const items: string[] = [];
    while (i < lines.length && marker.test(lines[i])) {
      items.push(`<li>${inline(escapeHtml(lines[i].replace(marker, "")))}</li>`);
      i++;
    }
    return items;
  };

  while (i < lines.length) {
    const line = lines[i];

    if (line.trim() === "") {
      i++;
      continue;
    }

    if (line.startsWith("```")) {
      const code: string[] = [];
      i++;
      while (i < lines.length && !lines[i].startsWith("```")) {
        code.push(escapeHtml(lines[i]));
        i++;
      }
      i++; // closing fence
      out.push(`<pre><code>${code.join("\n")}</code></pre>`);
      continue;
    }

    const heading = line.match(/^(#{1,6})\s+(.*)$/);
    if (heading) {
      const level = heading[1].length;
      out.push(`<h${level}>${inline(escapeHtml(heading[2].trim()))}</h${level}>`);
      i++;
      continue;
    }

    if (line.startsWith(">")) {
      const quoted: string[] = [];
      while (i < lines.length && lines[i].startsWith(">")) {
        quoted.push(inline(escapeHtml(lines[i].replace(/^>\s?/, ""))));
        i++;
      }
      out.push(`<blockquote><p>${quoted.join(" ")}</p></blockquote>`);
      continue;
    }

    if (/^[-*]\s+/.test(line)) {
      out.push(`<ul>\n${listItems(/^[-*]\s+/).join("\n")}\n</ul>`);
      continue;
    }

    if (/^\d+\.\s+/.test(line)) {
      out.push(`<ol>\n${listItems(/^\d+\.\s+/).join("\n")}\n</ol>`);
      continue;
    }

    // Paragraph: gather consecutive non-empty, non-block lines.
    const para: string[] = [];
    while (
      i < lines.length &&
      lines[i].trim() !== "" &&
      !/^(#{1,6}\s|>|[-*]\s|\d+\.\s|```)/.test(lines[i])
    ) {
      para.push(lines[i]);
      i++;
    }
    out.push(`<p>${inline(escapeHtml(para.join(" ")))}</p>`);
  }

  return out.join("\n");
}

export const generateMarkdownHtml: GenerateFn = (values) => {
  const md = typeof values.markdown === "string" ? values.markdown : "";
  if (md.trim() === "") return { error: "Enter some markdown to convert." };
  return { text: markdownToHtml(md), filename: "converted.html" };
};
