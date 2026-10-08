"use client";

import { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";

interface ToolItem {
  slug: string;
  name: string;
  cat: string;
  icon: string;
  desc: string;
  keywords: string[];
}

const ALL_TOOLS: ToolItem[] = [
  { slug: "json-formatter", icon: "json", name: "JSON Formatter", cat: "Developer & Web", desc: "Format and validate JSON instantly.", keywords: ["json", "format", "validate", "minify", "pretty"] },
  { slug: "image-compressor", icon: "image", name: "Image Compressor", cat: "Image Tools", desc: "Shrink file size with no visible quality loss.", keywords: ["image", "compress", "shrink", "optimize", "photo"] },
  { slug: "emi-calculator", icon: "rupee", name: "EMI Calculator", cat: "Finance Calculators", desc: "Monthly instalment and interest breakdown.", keywords: ["emi", "loan", "instalment", "interest", "calculator"] },
  { slug: "utm-builder", icon: "link", name: "UTM Link Builder", cat: "Marketing & SEO", desc: "Build tagged campaign URLs in seconds.", keywords: ["utm", "link", "campaign", "tracking", "url"] },
  { slug: "merge-pdf", icon: "pdf", name: "Merge PDF", cat: "PDF Tools", desc: "Combine several PDFs into one document.", keywords: ["pdf", "merge", "combine", "join"] },
  { slug: "word-counter", icon: "text", name: "Word Counter", cat: "Text & Data", desc: "Words, characters, reading time and more.", keywords: ["word", "counter", "character", "text", "reading"] },
  { slug: "qr-generator", icon: "qr", name: "QR Code Generator", cat: "Developer & Web", desc: "Create scannable codes for any text or link.", keywords: ["qr", "code", "generator", "scan"] },
  { slug: "gst-calculator", icon: "percent", name: "GST Calculator", cat: "Finance Calculators", desc: "Add, remove and split GST on any amount.", keywords: ["gst", "tax", "calculator", "india"] },
  { slug: "sip-calculator", icon: "calc", name: "SIP Calculator", cat: "Finance Calculators", desc: "Systematic investment plan returns.", keywords: ["sip", "investment", "mutual", "fund", "returns"] },
  { slug: "percentage-calculator", icon: "percent", name: "Percentage Calculator", cat: "Finance Calculators", desc: "Calculate percentages, increases and decreases.", keywords: ["percentage", "percent", "calculate", "increase"] },
  { slug: "age-calculator", icon: "calc", name: "Age Calculator", cat: "Finance Calculators", desc: "Calculate age between two dates.", keywords: ["age", "date", "birthday", "calculate"] },
  { slug: "date-calculator", icon: "calc", name: "Date Calculator", cat: "Finance Calculators", desc: "Add or subtract days from a date.", keywords: ["date", "add", "subtract", "days"] },
  { slug: "unit-converter", icon: "layers", name: "Unit Converter", cat: "Text & Data", desc: "Convert between units of measurement.", keywords: ["unit", "convert", "measurement", "length", "weight"] },
  { slug: "case-converter", icon: "text", name: "Case Converter", cat: "Text & Data", desc: "Convert text between cases.", keywords: ["case", "convert", "upper", "lower", "title"] },
  { slug: "lorem-ipsum", icon: "text", name: "Lorem Ipsum Generator", cat: "Text & Data", desc: "Generate placeholder text.", keywords: ["lorem", "ipsum", "placeholder", "text", "generator"] },
  { slug: "password-generator", icon: "shield", name: "Password Generator", cat: "Developer & Web", desc: "Generate secure random passwords.", keywords: ["password", "generator", "secure", "random"] },
  { slug: "hash-generator", icon: "code", name: "Hash Generator", cat: "Developer & Web", desc: "Generate MD5, SHA1, SHA256 hashes.", keywords: ["hash", "md5", "sha", "generate", "checksum"] },
  { slug: "base64-encoder", icon: "code", name: "Base64 Encoder", cat: "Developer & Web", desc: "Encode and decode Base64 strings.", keywords: ["base64", "encode", "decode", "string"] },
  { slug: "url-encoder", icon: "link", name: "URL Encoder", cat: "Developer & Web", desc: "Encode and decode URLs.", keywords: ["url", "encode", "decode", "percent"] },
  { slug: "color-picker", icon: "image", name: "Color Picker", cat: "Image Tools", desc: "Pick and convert colors.", keywords: ["color", "picker", "hex", "rgb", "hsl"] },
  { slug: "image-resizer", icon: "image", name: "Image Resizer", cat: "Image Tools", desc: "Resize images to specific dimensions.", keywords: ["image", "resize", "dimensions", "scale"] },
  { slug: "image-cropper", icon: "image", name: "Image Cropper", cat: "Image Tools", desc: "Crop images to any aspect ratio.", keywords: ["image", "crop", "aspect", "ratio"] },
  { slug: "pdf-to-word", icon: "pdf", name: "PDF to Word", cat: "PDF Tools", desc: "Convert PDF files to Word documents.", keywords: ["pdf", "word", "convert", "doc"] },
  { slug: "word-to-pdf", icon: "pdf", name: "Word to PDF", cat: "PDF Tools", desc: "Convert Word documents to PDF.", keywords: ["word", "pdf", "convert", "doc"] },
  { slug: "pdf-compressor", icon: "pdf", name: "PDF Compressor", cat: "PDF Tools", desc: "Reduce PDF file size.", keywords: ["pdf", "compress", "reduce", "size"] },
  { slug: "pdf-splitter", icon: "pdf", name: "PDF Splitter", cat: "PDF Tools", desc: "Split PDF into separate pages.", keywords: ["pdf", "split", "separate", "pages"] },
  { slug: "meta-tag-generator", icon: "chart", name: "Meta Tag Generator", cat: "Marketing & SEO", desc: "Generate meta tags for your website.", keywords: ["meta", "tag", "generator", "seo", "html"] },
  { slug: "serp-preview", icon: "chart", name: "SERP Preview", cat: "Marketing & SEO", desc: "Preview how your page appears in search results.", keywords: ["serp", "preview", "search", "google", "snippet"] },
  { slug: "invoice-generator", icon: "invoice", name: "Invoice Generator", cat: "Invoicing & Billing", desc: "Create professional invoices.", keywords: ["invoice", "generator", "billing", "payment"] },
  { slug: "receipt-generator", icon: "invoice", name: "Receipt Generator", cat: "Invoicing & Billing", desc: "Generate payment receipts.", keywords: ["receipt", "generator", "payment", "bill"] },
  { slug: "salary-calculator", icon: "users", name: "Salary Calculator", cat: "HR & Payroll", desc: "Calculate take-home salary.", keywords: ["salary", "calculator", "payroll", "take", "home"] },
  { slug: "pf-calculator", icon: "users", name: "PF Calculator", cat: "HR & Payroll", desc: "Calculate provident fund.", keywords: ["pf", "provident", "fund", "calculator", "epf"] },
  { slug: "gratuity-calculator", icon: "users", name: "Gratuity Calculator", cat: "HR & Payroll", desc: "Calculate gratuity amount.", keywords: ["gratuity", "calculator", "retirement", "bonus"] },
  { slug: "hra-calculator", icon: "users", name: "HRA Calculator", cat: "HR & Payroll", desc: "Calculate house rent allowance.", keywords: ["hra", "house", "rent", "allowance", "calculator"] },
  { slug: "ai-rewriter", icon: "spark", name: "AI Rewriter", cat: "AI Writing", desc: "Rewrite text with AI.", keywords: ["ai", "rewrite", "paraphrase", "text"] },
  { slug: "ai-summarizer", icon: "spark", name: "AI Summarizer", cat: "AI Writing", desc: "Summarize long text with AI.", keywords: ["ai", "summarize", "summary", "text", "shorten"] },
  { slug: "ai-grammar", icon: "spark", name: "AI Grammar Checker", cat: "AI Writing", desc: "Check grammar and spelling.", keywords: ["ai", "grammar", "check", "spelling", "correction"] },
  { slug: "ai-translator", icon: "spark", name: "AI Translator", cat: "AI Writing", desc: "Translate text between languages.", keywords: ["ai", "translate", "language", "text"] },
];

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
}

function fuzzyMatch(query: string, text: string): number {
  const q = query.toLowerCase();
  const t = text.toLowerCase();
  if (t.includes(q)) return 100 - t.indexOf(q);
  let qi = 0;
  let score = 0;
  for (let ti = 0; ti < t.length && qi < q.length; ti++) {
    if (t[ti] === q[qi]) {
      score++;
      qi++;
    }
  }
  return qi === q.length ? score * 10 : 0;
}

export function CommandPalette({ isOpen, onClose }: CommandPaletteProps) {
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const router = useRouter();

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return ALL_TOOLS.slice(0, 8);

    return ALL_TOOLS
      .map((tool) => {
        const nameScore = fuzzyMatch(needle, tool.name);
        const catScore = fuzzyMatch(needle, tool.cat) * 0.5;
        const descScore = fuzzyMatch(needle, tool.desc) * 0.3;
        const keywordScore = tool.keywords.reduce(
          (acc, kw) => acc + fuzzyMatch(needle, kw) * 0.8,
          0
        );
        return { tool, score: nameScore + catScore + descScore + keywordScore };
      })
      .filter((r) => r.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 8)
      .map((r) => r.tool);
  }, [query]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        if (isOpen) {
          onClose();
        } else {
          setQuery("");
          setSelectedIndex(0);
        }
      }
      if (e.key === "/" && !isOpen) {
        const target = e.target as HTMLElement;
        if (target.tagName !== "INPUT" && target.tagName !== "TEXTAREA") {
          e.preventDefault();
          setQuery("");
          setSelectedIndex(0);
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  useEffect(() => {
    if (listRef.current && filtered.length > 0) {
      const selected = listRef.current.children[selectedIndex] as HTMLElement;
      if (selected) {
        selected.scrollIntoView({ block: "nearest" });
      }
    }
  }, [selectedIndex, filtered.length]);

  const handleSelect = useCallback(
    (tool: ToolItem) => {
      const catSlug = tool.cat.toLowerCase().replace(/[^a-z]+/g, "-");
      router.push(`/${catSlug}/${tool.slug}`);
      onClose();
    },
    [router, onClose]
  );

  const handleKeyDownInput = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % (filtered.length || 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + filtered.length) % (filtered.length || 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const selected = filtered[selectedIndex];
      if (selected) {
        handleSelect(selected);
      }
    } else if (e.key === "Escape") {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal" id="commandPalette" role="dialog" aria-modal="true" aria-label="Command palette">
      <div className="modal-scrim" onClick={onClose} />
      <div className="command-palette">
        <div className="command-palette-input">
          <svg className="ico" viewBox="0 0 24 24" aria-hidden="true">
            <use href="#ic-search" />
          </svg>
          <input
            ref={inputRef}
            type="text"
            className="w-full bg-transparent px-3 py-4 text-sm text-[var(--text)] outline-none placeholder:text-[var(--text-3)]"
            placeholder="Search 130+ tools or categories..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDownInput}
            aria-label="Search tools"
            aria-expanded={filtered.length > 0}
            aria-controls="commandPaletteList"
            aria-activedescendant={filtered[selectedIndex] ? `cmd-${filtered[selectedIndex].slug}` : undefined}
            role="combobox"
          />
          <kbd className="text-[11px] font-mono text-[var(--text-3)] border border-[var(--border)] rounded px-1.5 py-0.5">
            ESC
          </kbd>
        </div>

        <div className="command-palette-list" id="commandPaletteList" role="listbox" aria-label="Search results">
          {filtered.length === 0 ? (
            <div className="p-4 text-center text-xs text-[var(--text-3)]">
              No tools match &ldquo;{query}&rdquo;
            </div>
          ) : (
            <ul ref={listRef}>
              {filtered.map((tool, idx) => (
                <li
                  key={tool.slug}
                  id={`cmd-${tool.slug}`}
                  role="option"
                  aria-selected={idx === selectedIndex}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs transition-colors cursor-pointer ${
                    idx === selectedIndex
                      ? "bg-[var(--surface-3)] text-[var(--text)]"
                      : "text-[var(--text-2)] hover:bg-[var(--surface-3)]"
                  }`}
                  onClick={() => handleSelect(tool)}
                  onMouseEnter={() => setSelectedIndex(idx)}
                >
                  <span className="flex h-7 w-7 items-center justify-center rounded border border-[var(--border)] bg-[var(--surface)] text-[var(--accent)]">
                    <svg className="ico ico--sm" viewBox="0 0 24 24" aria-hidden="true">
                      <use href={`#ic-${tool.icon}`} />
                    </svg>
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-[var(--text)] truncate">{tool.name}</div>
                    <div className="text-[11px] text-[var(--text-3)] truncate">{tool.desc}</div>
                  </div>
                  <span className="text-[10px] font-mono text-[var(--text-3)] border border-[var(--border)] rounded px-2 py-0.5">
                    {tool.cat}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="flex items-center justify-between border-t border-[var(--border)] bg-[var(--surface)] px-4 py-2 text-[11px] text-[var(--text-3)]">
          <div className="flex items-center gap-3">
            <span><kbd className="font-mono">↑</kbd><kbd className="font-mono">↓</kbd> navigate</span>
            <span><kbd className="font-mono">↵</kbd> select</span>
          </div>
          <span>Avexora Utilities</span>
        </div>
      </div>
    </div>
  );
}
