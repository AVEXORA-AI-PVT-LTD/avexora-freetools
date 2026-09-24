"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { panelCls, primaryBtn, secondaryBtn } from "../ui-tokens";
import type { BusinessCardInput, QrTarget } from "@/tools/compute/legal/business-card";

/**
 * "Save & share" for the Digital Business Card: a paid-plan feature that stores
 * the card on the account and gives it a public link at /card/<slug>.
 * Designing and downloading stay free; this panel only handles saved cards.
 */

export interface SavedCard {
  id: string;
  slug: string;
  url: string;
  name: string;
  company: string;
  qrTarget: QrTarget;
  views: number;
  updatedAt: string;
}

interface ApiError {
  error?: string;
  requiredPlan?: string;
}

const linkBtn = "text-xs font-medium text-orange-700 hover:text-orange-900";

export function SaveSharePanel({
  card,
  qrTarget,
  saved,
  onSaved,
  onLoad,
  onNew,
  requireAuth,
  validate,
}: {
  card: BusinessCardInput;
  qrTarget: QrTarget;
  saved: SavedCard | null;
  onSaved: (card: SavedCard) => void;
  onLoad: (card: SavedCard, data: BusinessCardInput) => void;
  onNew: () => void;
  requireAuth: (fn: () => void) => void;
  validate: () => string | null;
}) {
  const { status } = useSession();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [upgradeTo, setUpgradeTo] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [cards, setCards] = useState<SavedCard[] | null>(null);

  const refresh = useCallback(async () => {
    const res = await fetch("/api/cards", { cache: "no-store" });
    if (res.ok) setCards(((await res.json()) as { cards: SavedCard[] }).cards);
  }, []);

  useEffect(() => {
    if (status !== "authenticated") return;
    let alive = true;
    void fetch("/api/cards", { cache: "no-store" })
      .then((res) => (res.ok ? (res.json() as Promise<{ cards: SavedCard[] }>) : null))
      .then((body) => {
        if (alive && body) setCards(body.cards);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [status]);

  const flash = (message: string) => {
    setNotice(message);
    setTimeout(() => setNotice(null), 2500);
  };

  const handleError = async (res: Response) => {
    const body = (await res.json().catch(() => ({}))) as ApiError;
    if (res.status === 402) {
      setUpgradeTo(body.requiredPlan ?? "launch");
      setError(null);
      return;
    }
    setError(body.error ?? "Couldn't save the card — try again.");
  };

  const save = () => {
    const problem = validate();
    if (problem) {
      setError(problem);
      return;
    }
    requireAuth(() => {
      void (async () => {
        setBusy(true);
        setError(null);
        setUpgradeTo(null);
        try {
          const res = await fetch(saved ? `/api/cards/${saved.id}` : "/api/cards", {
            method: saved ? "PUT" : "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ card, qrTarget }),
          });
          if (!res.ok) return void (await handleError(res));
          const body = (await res.json()) as { card: SavedCard };
          onSaved(body.card);
          flash(saved ? "Card updated — the link stays the same." : "Card saved — your link is ready to share.");
          void refresh();
        } catch {
          setError("Couldn't reach the server — check your connection.");
        } finally {
          setBusy(false);
        }
      })();
    });
  };

  const copy = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      flash("Link copied.");
    } catch {
      flash(url);
    }
  };

  const share = async (url: string) => {
    if (navigator.share) {
      try {
        await navigator.share({ title: `${card.name} — digital business card`, url });
        return;
      } catch (e) {
        if (e instanceof DOMException && e.name === "AbortError") return;
      }
    }
    await copy(url);
  };

  const load = async (item: SavedCard) => {
    setError(null);
    const res = await fetch(`/api/cards/${item.id}`, { cache: "no-store" });
    if (!res.ok) return void (await handleError(res));
    const body = (await res.json()) as { card: SavedCard; data: BusinessCardInput | null };
    if (!body.data) {
      setError("That card couldn't be opened.");
      return;
    }
    onLoad(body.card, body.data);
    flash(`Editing "${body.card.name || "card"}".`);
  };

  const remove = async (item: SavedCard) => {
    if (!window.confirm(`Delete this card? Its link (${item.url}) will stop working.`)) return;
    const res = await fetch(`/api/cards/${item.id}`, { method: "DELETE" });
    if (!res.ok) return void (await handleError(res));
    if (saved?.id === item.id) onNew();
    void refresh();
  };

  const waHref = (url: string) => `https://wa.me/?text=${encodeURIComponent(`My digital business card: ${url}`)}`;

  return (
    <div className={`${panelCls} space-y-3 p-4`}>
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-semibold text-slate-900">Save &amp; share</p>
        <span className="rounded-full bg-orange-50 px-2 py-0.5 text-[11px] font-semibold text-orange-800">Paid plans</span>
      </div>
      <p className="text-xs text-slate-500">
        Save the card to your account to get a shareable link like <span className="font-mono">tools.avexora.in/card/your-name</span>.
        Edit it any time and the link stays the same.
      </p>

      <div className="flex flex-wrap gap-3">
        <button type="button" className={primaryBtn} onClick={save} disabled={busy}>
          {busy ? "Saving…" : saved ? "Update saved card" : "Save & get link"}
        </button>
        {saved && (
          <button type="button" className={secondaryBtn} onClick={onNew} disabled={busy}>
            Start a new card
          </button>
        )}
      </div>

      {upgradeTo && (
        <div role="alert" className="rounded-md border border-orange-200 bg-orange-50 px-3 py-2 text-sm text-orange-900">
          Saving and sharing cards is included in paid plans.{" "}
          <Link href={`/studio/pricing?plan=${encodeURIComponent(upgradeTo)}`} className="font-semibold underline">
            See plans
          </Link>
          . You can still download the card files for free.
        </div>
      )}
      {error && (
        <p role="alert" className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}
      {notice && (
        <p role="status" className="text-sm text-emerald-700">
          {notice}
        </p>
      )}

      {saved && (
        <div className="space-y-2 rounded-lg border border-slate-200 bg-slate-50 p-3">
          <p className="text-xs font-medium text-slate-500">Your card&apos;s link</p>
          <a href={saved.url} target="_blank" rel="noopener noreferrer" className="block break-all text-sm font-semibold text-orange-700 hover:underline">
            {saved.url}
          </a>
          <div className="flex flex-wrap gap-2">
            <button type="button" className={secondaryBtn} onClick={() => void copy(saved.url)}>
              Copy link
            </button>
            <button type="button" className={secondaryBtn} onClick={() => void share(saved.url)}>
              Share
            </button>
            <a className={secondaryBtn} href={waHref(saved.url)} target="_blank" rel="noopener noreferrer">
              Send on WhatsApp
            </a>
          </div>
        </div>
      )}

      {cards && cards.length > 0 && (
        <div className="space-y-2 pt-1">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">My saved cards</p>
          <ul className="divide-y divide-slate-200 rounded-lg border border-slate-200">
            {cards.map((item) => (
              <li key={item.id} className="flex flex-wrap items-center justify-between gap-2 px-3 py-2">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-slate-900">
                    {item.name || "Untitled card"}
                    {item.company ? <span className="text-slate-500"> · {item.company}</span> : null}
                    {saved?.id === item.id ? <span className="ml-2 text-xs text-orange-700">(editing)</span> : null}
                  </p>
                  <p className="text-xs text-slate-500">
                    {item.views} view{item.views === 1 ? "" : "s"} · updated {new Date(item.updatedAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex gap-3">
                  <a className={linkBtn} href={item.url} target="_blank" rel="noopener noreferrer">
                    Open
                  </a>
                  <button type="button" className={linkBtn} onClick={() => void load(item)}>
                    Edit
                  </button>
                  <button type="button" className="text-xs font-medium text-slate-500 hover:text-red-600" onClick={() => void remove(item)}>
                    Delete
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
