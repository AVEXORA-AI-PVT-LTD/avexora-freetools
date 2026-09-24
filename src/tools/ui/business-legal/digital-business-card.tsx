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
  MAX_PHOTOS,
  SOCIAL_META,
  SOCIAL_NETWORKS,
  validateBusinessCard,
  type BusinessCardInput,
  type CardTheme,
  type QrTarget,
  type SocialNetwork,
} from "@/tools/compute/legal/business-card";
import { ACCEPTED_IMAGE, readLogo, readPhoto } from "./business-card-images";
import { SaveSharePanel, type SavedCard } from "./business-card-save-panel";

/**
 * Digital Business Card Generator.
 *
 * The live preview is the exported HTML itself, rendered in a sandboxed
 * iframe, so what you see is exactly the file you download or the page a
 * saved card serves. Designing and downloading run entirely in the browser;
 * saving and sharing a link (paid plans) goes through /api/cards. The form is
 * kept as a local draft so the sign-in round trip never loses what was typed.
 */

const DRAFT_KEY = "avexora:digital-business-card:draft";
const PREVIEW_DEBOUNCE_MS = 350;

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
  logo: undefined,
  photoMotion: true,
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

interface Draft {
  input: BusinessCardInput;
  qrTarget: QrTarget;
  whatsappSame: boolean;
  saved: SavedCard | null;
}

const EMPTY_DRAFT: Draft = { input: EMPTY, qrTarget: "contact", whatsappSame: false, saved: null };

function loadDraft(): Draft {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (!raw) return EMPTY_DRAFT;
    const parsed = JSON.parse(raw) as Partial<Draft> & Partial<BusinessCardInput>;
    // Drafts from the first release stored the card fields at the top level.
    const input = (parsed.input ?? parsed) as Partial<BusinessCardInput>;
    return {
      input: { ...EMPTY, ...input, socials: { ...input.socials } },
      qrTarget: parsed.qrTarget ?? "contact",
      whatsappSame: parsed.whatsappSame ?? false,
      saved: parsed.saved ?? null,
    };
  } catch {
    return EMPTY_DRAFT;
  }
}

function saveDraft(draft: Draft) {
  try {
    localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
  } catch {
    // Storage full or blocked (private mode): the draft is a convenience only.
  }
}

/** What the QR code encodes; null when it can't be built yet. */
function qrText(input: BusinessCardInput, target: QrTarget, savedUrl: string | undefined): string | null {
  if (target === "website") return normalizeUrl(input.website);
  if (target === "card") return savedUrl ?? null;
  // The photo would make the code too dense to scan; the .vcf download keeps it.
  return buildVCard(input, { includePhoto: false });
}

/** Width ÷ height of an image data URL (to size the header from the main photo). */
function ratioOf(dataUrl: string): Promise<number> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img.naturalWidth / img.naturalHeight || 0.8);
    img.onerror = () => resolve(0.8);
    img.src = dataUrl;
  });
}

/** A button that opens the file picker (the input itself stays visually hidden). */
function FileButton({
  id,
  label,
  multiple,
  onFiles,
}: {
  id: string;
  label: string;
  multiple: boolean;
  onFiles: (files: FileList | null) => void;
}) {
  return (
    <>
      <label className={secondaryBtn + " cursor-pointer"} htmlFor={id}>
        {label}
      </label>
      <input
        id={id}
        type="file"
        multiple={multiple}
        accept="image/png,image/jpeg,image/webp"
        className="sr-only"
        onChange={(e) => {
          onFiles(e.target.files);
          e.target.value = "";
        }}
      />
    </>
  );
}

const sectionTitle = "text-sm font-semibold text-slate-900";
const hintCls = "mt-1 text-xs text-slate-500";
const smallLink = "block text-xs font-medium text-slate-500 hover:text-red-600";

export default function DigitalBusinessCard() {
  const id = useId();
  const [initial] = useState(loadDraft);
  const [input, setInput] = useState<BusinessCardInput>(initial.input);
  const [qrTarget, setQrTarget] = useState<QrTarget>(initial.qrTarget);
  const [whatsappSame, setWhatsappSame] = useState(initial.whatsappSame);
  const [saved, setSaved] = useState<SavedCard | null>(initial.saved);
  const [previewHtml, setPreviewHtml] = useState("");
  const [replayKey, setReplayKey] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const firstPreview = useRef(true);
  const { download, downloadOne, requireAuth } = useAuthDownload();
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
    saveDraft({ input, qrTarget, whatsappSame, saved });
  }, [input, qrTarget, whatsappSame, saved]);

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
      const text = qrText(shown, qrTarget, saved?.url);
      if (text) {
        try {
          const QRCode = (await import("qrcode")).default;
          qrSvg = await QRCode.toString(text, { type: "svg", margin: 1, errorCorrectionLevel: "M" });
        } catch {
          qrSvg = undefined;
        }
      }
      if (!alive) return;
      setPreviewHtml(buildCardHtml(shown, { qrSvg, qrTarget, shareUrl: saved?.url, entrance: firstPreview.current }));
      firstPreview.current = false;
    }, firstPreview.current ? 0 : PREVIEW_DEBOUNCE_MS);
    return () => {
      alive = false;
      clearTimeout(timer);
    };
  }, [card, qrTarget, saved, replayKey]);

  const replay = () => {
    firstPreview.current = true;
    setReplayKey((k) => k + 1);
  };

  const photos = [input.photo, ...(input.morePhotos ?? [])].filter((p): p is string => Boolean(p));

  /** Store the photo list; the first is the main photo and sets the header's shape. */
  const setPhotos = (list: string[], mainRatio?: number) =>
    setInput((prev) => ({
      ...prev,
      photo: list[0],
      morePhotos: list.slice(1),
      photoRatio: list.length ? (mainRatio ?? prev.photoRatio) : undefined,
    }));

  const onPhotos = async (files: FileList | null) => {
    if (!files?.length) return;
    const room = MAX_PHOTOS - photos.length;
    if (room <= 0) {
      setError(`You can add up to ${MAX_PHOTOS} photos — remove one first.`);
      return;
    }
    // Copy now: the input is reset right after this handler starts, which empties the live FileList.
    const all = Array.from(files);
    const picked = all.slice(0, room);
    const added: { dataUrl: string; ratio: number }[] = [];
    for (const file of picked) {
      if (!ACCEPTED_IMAGE.test(file.type)) {
        setError("Choose PNG, JPEG or WebP images.");
        return;
      }
      try {
        const photo = await readPhoto(file);
        if (photo.dataUrl.length > LIMITS.photoBytes) {
          setError("One of the photos is too detailed to embed — try a smaller image.");
          return;
        }
        added.push(photo);
      } catch {
        setError("One of the images couldn't be read — try another file.");
        return;
      }
    }
    const list = [...photos, ...added.map((a) => a.dataUrl)];
    setPhotos(list, photos.length ? undefined : added[0]?.ratio);
    setError(all.length > room ? `Only ${MAX_PHOTOS} photos fit — the extra ones were skipped.` : null);
    replay();
  };

  const removePhoto = async (index: number) => {
    const list = photos.filter((_, i) => i !== index);
    setPhotos(list, index === 0 && list[0] ? await ratioOf(list[0]) : undefined);
    replay();
  };

  const makeMain = async (index: number) => {
    const list = [photos[index]!, ...photos.filter((_, i) => i !== index)];
    setPhotos(list, await ratioOf(list[0]!));
    replay();
  };

  const onLogo = async (file: File | undefined) => {
    if (!file) return;
    if (!ACCEPTED_IMAGE.test(file.type)) {
      setError("Choose a PNG, JPEG or WebP image.");
      return;
    }
    try {
      const dataUrl = await readLogo(file);
      if (dataUrl.length > LIMITS.logoBytes) {
        setError("That logo is too detailed to embed — try a smaller or simpler image.");
        return;
      }
      set("logo", dataUrl);
      setError(null);
    } catch {
      setError("That image couldn't be read — try another file.");
    }
  };

  const check = (): string | null => {
    const problem = validateBusinessCard(card);
    if (problem) return problem;
    if (qrTarget === "website" && !normalizeUrl(card.website)) {
      return "Add your website, or set the QR code to save your contact instead.";
    }
    return null;
  };

  /** Validates, then builds every export; null (with the error shown) if the card isn't ready. */
  const buildExports = async () => {
    const problem = check();
    if (problem) {
      setError(problem);
      return null;
    }
    const text = qrText(card, qrTarget, saved?.url);
    if (!text) {
      setError("Save the card first to put its link in the QR code, or choose another QR option.");
      return null;
    }
    setError(null);
    const QRCode = (await import("qrcode")).default;
    const qrSvg = await QRCode.toString(text, { type: "svg", margin: 1, errorCorrectionLevel: "M" });
    const qrPng = await (await fetch(await QRCode.toDataURL(text, { width: 1024, margin: 2 }))).blob();
    return {
      html: {
        blob: new Blob([buildCardHtml(card, { qrSvg, qrTarget, shareUrl: saved?.url })], { type: "text/html" }),
        filename: cardFilename(card.name, "html"),
      },
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

  const startNew = () => {
    setInput(EMPTY);
    setWhatsappSame(false);
    setQrTarget("contact");
    setSaved(null);
    setError(null);
    replay();
  };

  const loadSaved = (summary: SavedCard, data: BusinessCardInput) => {
    setInput({ ...EMPTY, ...data, socials: { ...data.socials } });
    setWhatsappSame(false);
    setQrTarget(summary.qrTarget);
    setSaved(summary);
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
          <fieldset className="min-w-0 space-y-4">
            <legend className={sectionTitle}>Photo &amp; logo</legend>

            <div className="space-y-3 rounded-lg border border-slate-200 p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-slate-800">Your photos</p>
                  <p className={hintCls}>
                    Add up to {MAX_PHOTOS} photos in the same outfit — different poses or expressions. The card plays them
                    as a motion picture across the top, each shown whole.
                  </p>
                </div>
                {photos.length < MAX_PHOTOS && (
                  <FileButton
                    id={`${id}-photos`}
                    label={photos.length ? "Add more photos" : "Add photos"}
                    multiple
                    onFiles={(files) => void onPhotos(files)}
                  />
                )}
              </div>

              {photos.length > 0 && (
                <>
                  <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4" aria-label="Your photos, in the order they play">
                    {photos.map((p, i) => (
                      <li key={i} className="space-y-1.5">
                        <div className="relative aspect-[4/5] overflow-hidden rounded-md border border-slate-200 bg-slate-100">
                          {/* A local data URL; next/image adds nothing here. */}
                          <img src={p} alt={`Photo ${i + 1}`} className="h-full w-full object-cover object-top" />
                          {i === 0 && (
                            <span className="absolute left-1.5 top-1.5 rounded bg-orange-600 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                              Main
                            </span>
                          )}
                        </div>
                        <div className="flex flex-wrap justify-between gap-x-2 gap-y-1 whitespace-nowrap text-xs">
                          {i === 0 ? (
                            <span className="text-slate-400">Plays first</span>
                          ) : (
                            <button type="button" className="font-medium text-orange-700 hover:text-orange-900" onClick={() => void makeMain(i)}>
                              Make main
                            </button>
                          )}
                          <button type="button" className="font-medium text-slate-500 hover:text-red-600" onClick={() => void removePhoto(i)}>
                            Remove
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                  <p className={hintCls}>The main photo is also used in the contact file and in link previews.</p>
                  <label className="flex items-center gap-2 text-sm text-slate-700">
                    <input
                      type="checkbox"
                      className="accent-orange-600"
                      checked={input.photoMotion !== false}
                      onChange={(e) => set("photoMotion", e.target.checked)}
                    />
                    {photos.length > 1
                      ? "Animate: crossfade through the photos with a slow zoom"
                      : "Animate: a slow zoom (add more photos for a motion picture)"}
                  </label>
                </>
              )}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200 p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-24 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-slate-200 bg-white text-[10px] text-slate-400">
                  {input.logo ? <img src={input.logo} alt="" className="h-full w-full object-contain p-1.5" /> : "Logo"}
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-800">Company logo</p>
                  <p className={hintCls}>Shown large on a white panel under the photos. Wide wordmarks and square marks both fit.</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <FileButton
                  id={`${id}-logo`}
                  label={input.logo ? "Change logo" : "Add logo"}
                  multiple={false}
                  onFiles={(files) => void onLogo(files?.[0])}
                />
                {input.logo && (
                  <button type="button" className={smallLink} onClick={() => set("logo", undefined)}>
                    Remove
                  </button>
                )}
              </div>
            </div>
          </fieldset>

          <fieldset className="min-w-0 space-y-4">
            <legend className={sectionTitle}>Profile</legend>
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

          <fieldset className="min-w-0 space-y-4">
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

          <fieldset className="min-w-0 space-y-4">
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

          <fieldset className="min-w-0 space-y-4">
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
                <option value="card" disabled={!saved}>
                  {saved ? "This card's link" : "This card's link (save the card first)"}
                </option>
              </select>
            </div>
          </fieldset>

          {error && (
            <p role="alert" className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          )}

          <SaveSharePanel
            card={card}
            qrTarget={qrTarget}
            saved={saved}
            onSaved={setSaved}
            onLoad={loadSaved}
            onNew={startNew}
            requireAuth={requireAuth}
            validate={check}
          />

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
              Free on every plan. The .html file is your complete card in one file — host it anywhere. The .vcf imports
              straight into phone contacts.
            </p>
            <button type="button" className={smallLink} onClick={startNew}>
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
          <p className={hintCls}>Tap the rows and buttons to try them. Links open for real on the saved or downloaded card.</p>
        </aside>
      </div>
    </div>
  );
}
