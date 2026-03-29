"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft,
  Save,
  Loader2,
  Check,
  ImageIcon,
  History,
} from "lucide-react";
import { formatJpy } from "@/lib/utils/currency";

interface Price {
  id: number;
  source: string;
  type: string;
  priceJpy: number | null;
  scrapedAt: string;
}

interface CardData {
  id: number;
  cardCode: string;
  baseCode: string | null;
  parallelIndex: number | null;
  yuyuteiId: string | null;
  yuyuteiUrl: string | null;
  nameJp: string;
  nameEn: string | null;
  nameTh: string | null;
  rarity: string;
  cardType: string;
  color: string;
  colorEn: string | null;
  cost: number | null;
  power: number | null;
  counter: number | null;
  life: number | null;
  attribute: string | null;
  trait: string | null;
  artist: string | null;
  effectJp: string | null;
  effectEn: string | null;
  effectTh: string | null;
  triggerJp: string | null;
  triggerEn: string | null;
  imageUrl: string | null;
  isParallel: boolean;
  latestPriceJpy: number | null;
  set: { code: string; name: string; nameEn: string | null };
  prices: Price[];
  candidates: { pIndex: number; url: string }[];
}

const TEXT_FIELDS: { key: string; label: string; type?: string; official?: boolean }[] = [
  { key: "nameJp", label: "Name (JP)", official: true },
  { key: "nameEn", label: "Name (EN)", official: true },
  { key: "nameTh", label: "Name (TH)" },
  { key: "rarity", label: "Rarity", official: true },
  { key: "cardType", label: "Card Type", official: true },
  { key: "color", label: "Color (JP)", official: true },
  { key: "colorEn", label: "Color (EN)", official: true },
  { key: "cost", label: "Cost", type: "number", official: true },
  { key: "power", label: "Power", type: "number", official: true },
  { key: "counter", label: "Counter", type: "number", official: true },
  { key: "life", label: "Life", type: "number", official: true },
  { key: "attribute", label: "Attribute", official: true },
  { key: "trait", label: "Trait", official: true },
  { key: "artist", label: "Artist" },
  { key: "imageUrl", label: "Image URL" },
];

const TEXTAREA_FIELDS = [
  { key: "effectJp", label: "Effect (JP)" },
  { key: "effectEn", label: "Effect (EN)" },
  { key: "effectTh", label: "Effect (TH)" },
  { key: "triggerJp", label: "Trigger (JP)" },
  { key: "triggerEn", label: "Trigger (EN)" },
];

export function CardEditor({ card }: { card: CardData }) {
  const [form, setForm] = useState<Record<string, unknown>>(() => {
    const init: Record<string, unknown> = {};
    for (const f of [...TEXT_FIELDS, ...TEXTAREA_FIELDS]) {
      init[f.key] = (card as unknown as Record<string, unknown>)[f.key] ?? "";
    }
    return init;
  });

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleChange(key: string, value: string, type?: string) {
    let parsed: unknown = value;
    if (type === "number") {
      parsed = value === "" ? null : parseInt(value);
    }
    setForm((p) => ({ ...p, [key]: parsed }));
    setSaved(false);
  }

  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      const payload: Record<string, unknown> = {};
      for (const f of [...TEXT_FIELDS, ...TEXTAREA_FIELDS]) {
        const val = form[f.key];
        if (val !== ((card as unknown as Record<string, unknown>)[f.key] ?? "")) {
          payload[f.key] = val === "" ? null : val;
        }
      }
      if (Object.keys(payload).length === 0) {
        setSaved(true);
        return;
      }
      const res = await fetch(`/api/admin/cards/${card.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Save failed");
      } else {
        setSaved(true);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function selectCandidate(pIndex: number, url: string) {
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/cards/${card.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageUrl: url, parallelIndex: pIndex }),
      });
      if (res.ok) {
        setForm((p) => ({ ...p, imageUrl: url }));
        setSaved(true);
      } else {
        setError(`Failed to update image: ${res.status}`);
      }
    } finally {
      setSaving(false);
    }
  }

  const currentImage = (form.imageUrl as string) || card.imageUrl;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/admin/cards"
          className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div className="flex-1">
          <h1 className="text-xl font-bold">
            {card.baseCode}
            {card.isParallel && (
              <span className="ml-2 text-sm text-orange-500">Parallel</span>
            )}
          </h1>
          <p className="text-sm text-muted-foreground">
            {card.set.code.toUpperCase()} &middot; {card.cardCode}
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          {saving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : saved ? (
            <Check className="h-4 w-4" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          {saved ? "Saved" : "Save"}
        </button>
      </div>

      {error && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-2 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        {/* Image Preview */}
        <div className="space-y-4">
          <div className="overflow-hidden rounded-xl border border-border/50 bg-muted/20">
            {currentImage ? (
              <Image
                src={currentImage}
                alt={card.nameEn || card.nameJp}
                width={280}
                height={392}
                className="w-full object-contain"
                unoptimized
              />
            ) : (
              <div className="flex aspect-[5/7] w-full items-center justify-center text-muted-foreground">
                <ImageIcon className="h-12 w-12" />
              </div>
            )}
          </div>

          {card.isParallel && card.candidates.length > 0 && (
            <div>
              <h3 className="mb-2 text-sm font-semibold">
                Parallel Candidates
              </h3>
              <div className="grid grid-cols-4 gap-1">
                {card.candidates.map((c) => (
                  <button
                    key={c.pIndex}
                    onClick={() => selectCandidate(c.pIndex, c.url)}
                    className={`overflow-hidden rounded border transition-all ${
                      currentImage === c.url
                        ? "border-primary ring-2 ring-primary/30"
                        : "border-border/50 hover:border-primary/50"
                    }`}
                    title={`_p${c.pIndex}`}
                  >
                    <Image
                      src={c.url}
                      alt={`p${c.pIndex}`}
                      width={60}
                      height={84}
                      className="w-full object-contain"
                      unoptimized
                    />
                    <div className="bg-muted/50 py-0.5 text-center text-[10px]">
                      _p{c.pIndex}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="text-xs text-muted-foreground">
            <p>
              Yuyu-tei ID: {card.yuyuteiId || "—"}
            </p>
            <p>
              Parallel Index: {card.parallelIndex ?? "—"}
            </p>
            <p>
              Price: {card.latestPriceJpy != null ? formatJpy(card.latestPriceJpy) : "—"}
            </p>
          </div>
        </div>

        {/* Form Fields */}
        <div className="space-y-6">
          <div className="rounded-xl border border-border/50 p-4">
            <h2 className="mb-4 text-sm font-semibold">Card Details</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {TEXT_FIELDS.map((f) => (
                <label key={f.key} className="space-y-1">
                  <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    {f.label}
                    {f.official && (
                      <span className="rounded bg-green-500/10 px-1 py-px text-[9px] font-medium text-green-600 dark:text-green-400">
                        Official
                      </span>
                    )}
                  </span>
                  <input
                    type={f.type === "number" ? "number" : "text"}
                    value={String(form[f.key] ?? "")}
                    onChange={(e) =>
                      handleChange(f.key, e.target.value, f.type)
                    }
                    className={`w-full rounded-md border bg-background px-2 py-1.5 text-sm ${f.official ? "border-green-500/20" : "border-border"}`}
                  />
                </label>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-border/50 p-4">
            <h2 className="mb-4 text-sm font-semibold">Text Content</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {TEXTAREA_FIELDS.map((f) => (
                <label key={f.key} className="space-y-1">
                  <span className="text-xs text-muted-foreground">
                    {f.label}
                  </span>
                  <textarea
                    rows={3}
                    value={String(form[f.key] ?? "")}
                    onChange={(e) => handleChange(f.key, e.target.value)}
                    className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-sm"
                  />
                </label>
              ))}
            </div>
          </div>

          {/* Price History */}
          {card.prices.length > 0 && (
            <div className="rounded-xl border border-border/50 p-4">
              <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold">
                <History className="h-4 w-4" />
                Price History (last {card.prices.length})
              </h2>
              <div className="max-h-60 overflow-y-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b text-muted-foreground">
                      <th className="pb-1 text-left">Date</th>
                      <th className="pb-1 text-left">Source</th>
                      <th className="pb-1 text-right">Price</th>
                    </tr>
                  </thead>
                  <tbody>
                    {card.prices.map((p) => (
                      <tr
                        key={p.id}
                        className="border-b border-border/20"
                      >
                        <td className="py-1">
                          {new Date(p.scrapedAt).toLocaleDateString()}
                        </td>
                        <td className="py-1">{p.source}</td>
                        <td className="py-1 text-right">
                          {p.priceJpy != null
                            ? formatJpy(p.priceJpy)
                            : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
