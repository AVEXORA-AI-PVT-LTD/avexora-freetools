"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { useAuthDownload, useRestoredDownload } from "@/components/account/use-auth-download";
import { RestoredDownload } from "@/components/account/restored-download";
import { inputCls, labelCls, panelCls, primaryBtn, secondaryBtn } from "../ui-tokens";
import {
  buildCardHtml,
  buildVCard,
  cardFilename,
  DEFAULT_CARD_COLORS,
  LIMITS,
  normalizeUrl,
  SOCIAL_META,
  SOCIAL_NETWORKS,
  validateBusinessCard,
  type BusinessCardInput,
  type CardTheme,
  type QrTarget,
  type SocialNetwork,
} from "@/tools/compute/legal/business-card";

/**
 * Digital Business Card Generator.
 *
 * The live preview is the exported HTML itself, rendered in a sandboxed
 * iframe, so what you see is exactly the file you download. Everything runs in
 * the browser; the form is kept as a local draft so the sign-in round trip for
 * downloads never loses what was typed.
 */

const DRAFT_KEY = "avexora:digital-business-card:draft";
const PREVIEW_DEBOUNCE_MS = 350;
const PHOTO_SIZE = 320;

const EMPTY: BusinessCardInput = {
  name: "",
  title: "",
  company: "",
  tagline: "",
  phone: "",
  whatsapp: "",
  email: "",
  website: "",
  address: "",
  socials: {},
  ...DEFAULT_CARD_COLORS,
  theme: "light",
  photo: undefined,
};

/** Brand palettes to start from; the colour pickers override them freely. */
const PRESETS: { name: string; primaryColor: string; accentColor: string }[] = [
  { name: "Avexora", primaryColor: "#EA580C", accentColor: "#7C3AED" },
  { name: "Ocean", primaryColor: "#0369A1", accentColor: "#14B8A6" },
  { name: "Forest", primaryColor: "#15803D", accentColor: "#CA8A04" },
  { name: "Berry", primaryColor: "#BE185D", accentColor: "#6D28D9" },
  { name: "Graphite", primaryColor: "#334155", accentColor: "#0EA5E9" },
];

const PREVIEW_SAMPLE = { name: "Your Name", title: "Your Title", company: "Company Name" };

function loadDraft(): BusinessCardInput {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (!raw) return EMPTY;
    const parsed = JSON.parse(raw) as Partial<BusinessCardInput>;
    return { ...EMPTY, ...parsed, socials: { ...parsed.socials } };
  } catch {
    return EMPTY;
  }
}

function saveDraft(input: BusinessCardInput) {
  try {
    localStorage.setItem(DRAFT_KEY, JSON.stringify(input));
  } catch {
    // Storage full or blocked (private mode): the draft is a convenience only.
  }
}

/** Centre-crop and downscale a photo to a small JPEG data URL. */
function readPhoto(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const side = Math.min(img.naturalWidth, img.naturalHeight);
      const canvas = document.createElement("canvas");
      canvas.width = PHOTO_SIZE;
      canvas.height = PHOTO_SIZE;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        URL.revokeObjectURL(url);
        reject(new Error("canvas"));
        return;
      }
      ctx.drawImage(
        img,
        (img.naturalWidth - side) / 2,
        (img.naturalHeight - side) / 2,
        side,
        side,
        0,
        0,
        PHOTO_SIZE,
        PHOTO_SIZE,
      );
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL("image/jpeg", 0.85));
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("decode"));
    };
    img.src = url;
  });
}

function qrText(input: BusinessCardInput, target: QrTarget): string | null {
  if (target === "website") return normalizeUrl(input.website);
  // The photo would make the code too dense to scan; the .vcf download keeps it.
  return buildVCard(input, { includePhoto: false });
}

const sectionTitle = "text-sm font-semibold text-slate-900";
const hintCls = "mt-1 text-xs text-slate-500";

export default function DigitalBusinessCard() {
  const id = useId();
  const [input, setInput] = useState<BusinessCardInput>(loadDraft);
  const [qrTarget, setQrTarget] = useState<QrTarget>("contact");
  const [whatsappSame, setWhatsappSame] = useState(false);
  const [previewHtml, setPreviewHtml] = useState("");
  const [replayKey, setReplayKey] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const firstPreview = useRef(true);
  const { download, downloadOne } = useAuthDownload();
  const { restored } = useRestoredDownload();

  const card = useMemo<BusinessCardInput>(
    () => (whatsappSame ? { ...input, whatsapp: input.phone } : input),
    [input, whatsappSame],
  );

  const set = <K extends keyof BusinessCardInput>(key: K, value: BusinessCardInput[K]) =>
    setInput((prev) => ({ ...prev, [key]: value }));
  const setSocial = (network: SocialNetwork, value: string) =>
    setInput((prev) => ({ ...prev, socials: { ...prev.socials, [network]: value } }));

  useEffect(() => {
    saveDraft(input);
  }, [input]);

  // Rebuild the preview shortly after typing stops. The entrance animation only
  // plays on the first render and on "Replay" so every keystroke doesn't restart it.
  useEffect(() => {
    let alive = true;
    const timer = setTimeout(async () => {
      const shown: BusinessCardInput = {
        ...card,
        name: card.name.trim() || PREVIEW_SAMPLE.name,
        title: card.name.trim() ? card.title : card.title || PREVIEW_SAMPLE.title,
        company: card.name.trim() ? card.company : card.company || PREVIEW_SAMPLE.company,
      };
      let qrSvg: string | undefined;
      const text = qrText(shown, qrTarget);
      if (text) {
        try {
          const QRCode = (await import("qrcode")).default;
          qrSvg = await QRCode.toString(text, { type: "svg", margin: 1, errorCorrectionLevel: "M" });
        } catch {
          qrSvg = undefined;
        }
      }
      if (!alive) return;
      setPreviewHtml(buildCardHtml(shown, { qrSvg, qrTarget, entrance: firstPreview.current }));
      firstPreview.current = false;
    }, firstPreview.current ? 0 : PREVIEW_DEBOUNCE_MS);
    return () => {
      alive = false;
      clearTimeout(timer);
    };
  }, [card, qrTarget, replayKey]);

  const replay = () => {
    firstPreview.current = true;
    setReplayKey((k) => k + 1);
  };

  const onPhoto = async (file: File | undefined) => {
    if (!file) return;
    if (!/^image\/(png|jpeg|webp)$/.test(file.type)) {
      setError("Choose a PNG, JPEG or WebP image.");
      return;
    }
    try {
      set("photo", await readPhoto(file));
      setError(null);
    } catch {
      setError("That image couldn't be read — try another file.");
    }
  };

  /** Validates, then builds every export; null (with the error shown) if the card isn't ready. */
  const buildExports = async () => {
    const problem = validateBusinessCard(card);
    if (problem) {
      setError(problem);
      return null;
    }
    if (qrTarget === "website" && !normalizeUrl(card.website)) {
      setError("Add your website, or set the QR code to save your contact instead.");
      return null;
    }
    setError(null);
    const QRCode = (await import("qrcode")).default;
    const text = qrText(card, qrTarget)!;
    const qrSvg = await QRCode.toString(text, { type: "svg", margin: 1, errorCorrectionLevel: "M" });
    const qrPng = await (await fetch(await QRCode.toDataURL(text, { width: 1024, margin: 2 }))).blob();
    return {
      html: { blob: new Blob([buildCardHtml(card, { qrSvg, qrTarget })], { type: "text/html" }), filename: cardFilename(card.name, "html") },
      vcf: { blob: new Blob([buildVCard(card)], { type: "text/vcard" }), filename: cardFilename(card.name, "vcf") },
      png: { blob: qrPng, filename: cardFilename(card.name, "png") },
    };
  };

  const run = async (pick: (files: NonNullable<Awaited<ReturnType<typeof buildExports>>>) => void) => {
    setBusy(true);
    try {
      const files = await buildExports();
      if (files) pick(files);
    } catch {
      setError("Something went wrong building your card — check the details and try again.");
    } finally {
      setBusy(false);
    }
  };

  const reset = () => {
    setInput(EMPTY);
    setWhatsappSame(false);
    setQrTarget("contact");
    setError(null);
    replay();
  };

  const field = (
    key: "name" | "title" | "company" | "phone" | "email" | "website",
    label: string,
    placeholder: string,
    extra: { type?: string; maxLength?: number; hint?: string; autoComplete?: string } = {},
  ) => (
    <div>
      <label className={labelCls} htmlFor={`${id}-${key}`}>{label}</label>
      <input
        id={`${id}-${key}`}
        type={extra.type ?? "text"}
        className={inputCls}
        value={input[key]}
        maxLength={extra.maxLength}
        autoComplete={extra.autoComplete}
        placeholder={placeholder}
        onChange={(e) => set(key, e.target.value)}
      />
      {extra.hint && <p className={hintCls}>{extra.hint}</p>}
    </div>
  );

  return (
    <div className="space-y-6">
      <RestoredDownload restored={restored} />

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_380px]">
        <form className="space-y-8" onSubmit={(e) => e.preventDefault()} noValidate>
          <fieldset className="space-y-4">
            <legend className={sectionTitle}>Profile</legend>
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full border border-slate-200 bg-slate-50 text-xs text-slate-400">
                {input.photo ? (
                  <img src={input.photo} alt="" className="h-full w-full object-cover" />
                ) : (
                  "Photo"
                )}
              </div>
              <div className="space-y-1">
                <label className={secondaryBtn + " cursor-pointer"} htmlFor={`${id}-photo`}>
                  {input.photo ? "Change photo or logo" : "Add photo or logo"}
                </label>
                <input
                  id={`${id}-photo`}
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  className="sr-only"
                  onChange={(e) => {
                    void onPhoto(e.target.files?.[0]);
                    e.target.value = "";
                  }}
                />
                {input.photo ? (
                  <button type="button" className="block text-xs font-medium text-slate-500 hover:text-red-600" onClick={() => set("photo", undefined)}>
                    Remove photo
                  </button>
                ) : (
                  <p className={hintCls}>Optional. Cropped to a square; without one your initials are shown.</p>
                )}
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {field("name", "Full name", "Priya Sharma", { maxLength: LIMITS.name, autoComplete: "name" })}
              {field("title", "Designation", "Founder & CEO", { maxLength: LIMITS.title, autoComplete: "organization-title" })}
              {field("company", "Company", "Northwind Labs", { maxLength: LIMITS.company, autoComplete: "organization" })}
            </div>
            <div>
              <label className={labelCls} htmlFor={`${id}-tagline`}>Tagline</label>
              <input
                id={`${id}-tagline`}
                className={inputCls}
                value={input.tagline}
                maxLength={LIMITS.tagline}
                placeholder="Helping small businesses go digital"
                onChange={(e) => set("tagline", e.target.value)}
              />
            </div>
          </fieldset>

          <fieldset className="space-y-4">
            <legend className={sectionTitle}>Contact</legend>
            <div className="grid gap-4 sm:grid-cols-2">
              {field("phone", "Phone", "+91 98765 43210", { type: "tel", autoComplete: "tel" })}
              <div>
                <label className={labelCls} htmlFor={`${id}-whatsapp`}>WhatsApp</label>
                <input
                  id={`${id}-whatsapp`}
                  type="tel"
                  className={inputCls}
                  value={whatsappSame ? input.phone : input.whatsapp}
                  disabled={whatsappSame}
                  placeholder="+91 98765 43210"
                  onChange={(e) => set("whatsapp", e.target.value)}
                />
                <label className="mt-1.5 flex items-center gap-2 text-xs text-slate-600">
                  <input type="checkbox" checked={whatsappSame} onChange={(e) => setWhatsappSame(e.target.checked)} className="accent-orange-600" />
                  Same as phone
                </label>
              </div>
              {field("email", "Email", "priya@northwind.in", { type: "email", autoComplete: "email" })}
              {field("website", "Website", "northwind.in", { type: "url", autoComplete: "url" })}
            </div>
            <div>
              <label className={labelCls} htmlFor={`${id}-address`}>Address</label>
              <textarea
                id={`${id}-address`}
                rows={2}
                className={inputCls}
                value={input.address}
                maxLength={LIMITS.address}
                placeholder="4th Floor, Prestige Tower, MG Road, Bengaluru 560001"
                onChange={(e) => set("address", e.target.value)}
              />
              <p className={hintCls}>Tapping it on the card opens Google Maps.</p>
            </div>
          </fieldset>

          <fieldset className="space-y-4">
            <legend className={sectionTitle}>Social profiles</legend>
            <p className="-mt-2 text-xs text-slate-500">Paste a full link or just the username. Leave any blank to hide it.</p>
            <div className="grid gap-4 sm:grid-cols-2">
              {SOCIAL_NETWORKS.map((network) => (
                <div key={network}>
                  <label className={labelCls} htmlFor={`${id}-${network}`}>{SOCIAL_META[network].label}</label>
                  <input
                    id={`${id}-${network}`}
                    className={inputCls}
                    value={input.socials[network] ?? ""}
                    placeholder={network === "linkedin" ? "linkedin.com/in/priyasharma" : "@priyasharma"}
                    onChange={(e) => setSocial(network, e.target.value)}
                  />
                </div>
              ))}
            </div>
          </fieldset>

          <fieldset className="space-y-4">
            <legend className={sectionTitle}>Style</legend>
            <div className="flex flex-wrap gap-2">
              {PRESETS.map((p) => {
                const active = p.primaryColor === input.primaryColor && p.accentColor === input.accentColor;
                return (
                  <button
                    key={p.name}
                    type="button"
                    aria-pressed={active}
                    onClick={() => setInput((prev) => ({ ...prev, primaryColor: p.primaryColor, accentColor: p.accentColor }))}
                    className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                      active ? "border-orange-500 bg-orange-50 text-orange-800" : "border-slate-300 text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    <span className="h-3.5 w-3.5 rounded-full" style={{ background: `linear-gradient(135deg, ${p.primaryColor}, ${p.accentColor})` }} />
                    {p.name}
                  </button>
                );
              })}
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              {(["primaryColor", "accentColor"] as const).map((key) => (
                <div key={key}>
                  <label className={labelCls} htmlFor={`${id}-${key}`}>{key === "primaryColor" ? "Primary colour" : "Accent colour"}</label>
                  <div className="flex items-center gap-2">
                    <input
                      id={`${id}-${key}`}
                      type="color"
                      className="h-10 w-12 cursor-pointer rounded-md border border-slate-300 bg-white p-1"
                      value={input[key]}
                      onChange={(e) => set(key, e.target.value.toUpperCase())}
                    />
                    <span className="font-mono text-xs text-slate-500">{input[key]}</span>
                  </div>
                </div>
              ))}
              <div>
                <label className={labelCls} htmlFor={`${id}-theme`}>Default theme</label>
                <select id={`${id}-theme`} className={inputCls} value={input.theme} onChange={(e) => set("theme", e.target.value as CardTheme)}>
                  <option value="light">Light</option>
                  <option value="dark">Dark</option>
                </select>
              </div>
            </div>
            <div>
              <label className={labelCls} htmlFor={`${id}-qr`}>QR code opens</label>
              <select id={`${id}-qr`} className={inputCls} value={qrTarget} onChange={(e) => setQrTarget(e.target.value as QrTarget)}>
                <option value="contact">Save contact — adds you to their phone</option>
                <option value="website">Your website</option>
              </select>
            </div>
          </fieldset>

          {error && (
            <p role="alert" className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          )}

          <div className={`${panelCls} space-y-3 p-4`}>
            <p className="text-sm font-semibold text-slate-900">Download your card</p>
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                className={primaryBtn}
                disabled={busy}
                data-lead-action="download"
                onClick={() => run((f) => void download([f.html, f.vcf, f.png]))}
              >
                {busy ? "Preparing…" : "Download all files"}
              </button>
              <button type="button" className={secondaryBtn} disabled={busy} onClick={() => run((f) => downloadOne(f.html.blob, f.html.filename))}>
                Card page (.html)
              </button>
              <button type="button" className={secondaryBtn} disabled={busy} onClick={() => run((f) => downloadOne(f.vcf.blob, f.vcf.filename))}>
                Contact (.vcf)
              </button>
              <button type="button" className={secondaryBtn} disabled={busy} onClick={() => run((f) => downloadOne(f.png.blob, f.png.filename))}>
                QR code (.png)
              </button>
            </div>
            <p className={hintCls}>
              The .html file is your complete card in one file — upload it to your website or any static host to get a
              shareable link. The .vcf imports straight into phone contacts.
            </p>
            <button type="button" className="text-xs font-medium text-slate-500 hover:text-red-600" onClick={reset}>
              Clear the form
            </button>
          </div>
        </form>

        <aside className="lg:sticky lg:top-6 lg:self-start">
          <div className="mb-2 flex items-center justify-between">
            <p className={sectionTitle}>Live preview</p>
            <button type="button" className="text-xs font-medium text-orange-700 hover:text-orange-900" onClick={replay}>
              Replay animation
            </button>
          </div>
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-100">
            {previewHtml ? (
              <iframe
                title="Business card preview"
                srcDoc={previewHtml}
                sandbox="allow-scripts"
                className="block h-[760px] w-full"
              />
            ) : (
              <div className="h-[760px] animate-pulse bg-slate-100" />
            )}
          </div>
          <p className={hintCls}>Tap the rows and buttons to try them. Links open for real in the downloaded card.</p>
        </aside>
      </div>
    </div>
  );
}
