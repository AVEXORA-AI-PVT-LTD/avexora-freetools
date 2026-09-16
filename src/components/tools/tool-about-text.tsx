import Link from "next/link";
import type { ReactNode } from "react";

/** Matches authored `[Label](/category/slug)` tokens in About copy. */
const INTERNAL_LINK_RE = /\[([^\]]+)\]\(((?:\/[a-z0-9-]+){1,2})\)/g;

/**
 * Renders an About paragraph, converting trusted `[Label](/category/slug)`
 * tokens into internal links. Only internal absolute paths are allowed, so no
 * user-controlled value can produce an open redirect or external link.
 */
export function ToolAboutText({ text }: { text: string }) {
  const parts: ReactNode[] = [];
  let lastIndex = 0;
  let key = 0;
  for (const match of text.matchAll(INTERNAL_LINK_RE)) {
    const index = match.index ?? 0;
    if (index > lastIndex) parts.push(text.slice(lastIndex, index));
    const label = match[1];
    const href = match[2];
    parts.push(
      <Link
        key={key++}
        href={href}
        className="font-medium text-orange-700 underline decoration-orange-300 hover:text-orange-900"
      >
        {label}
      </Link>,
    );
    lastIndex = index + match[0].length;
  }
  if (lastIndex < text.length) parts.push(text.slice(lastIndex));
  return <>{parts}</>;
}