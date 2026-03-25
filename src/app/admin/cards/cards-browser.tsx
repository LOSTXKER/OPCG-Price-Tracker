"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  Search,
  ChevronLeft,
  ChevronRight,
  Pencil,
  Check,
  X,
  Loader2,
  AlertTriangle,
  ExternalLink,
} from "lucide-react";

interface CardRow {
  id: number;
  cardCode: string;
  baseCode: string | null;
  nameJp: string;
  nameEn: string | null;
  nameTh: string | null;
  rarity: string;
  cardType: string;
  color: string;
  colorEn: string | null;
  imageUrl: string | null;
  isParallel: boolean;
  parallelIndex: number | null;
  latestPriceJpy: number | null;
  set: { code: string; name: string };
}

interface FilterOptions {
  sets: { code: string; label: string }[];
  products: { code: string; label: string }[];
  rarities: string[];
}

interface ApiResponse {
  cards: CardRow[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export function CardsBrowser({
  filterOptions,
}: {
  filterOptions: FilterOptions;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [cards, setCards] = useState<CardRow[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState(searchParams.get("q") || "");
  const [setFilter, setSetFilter] = useState(searchParams.get("set") || "");
  const [productFilter, setProductFilter] = useState(
    searchParams.get("product") || ""
  );
  const [rarityFilter, setRarityFilter] = useState(
    searchParams.get("rarity") || ""
  );
  const [missingFilter, setMissingFilter] = useState(
    searchParams.get("missing") || ""
  );
  const [page, setPage] = useState(
    parseInt(searchParams.get("page") || "1")
  );

  const [editingId, setEditingId] = useState<number | null>(null);
  const [editData, setEditData] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const fetchCards = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    params.set("page", String(page));
    params.set("limit", "50");
    if (search) params.set("q", search);
    if (productFilter) {
      params.set("product", productFilter);
    } else if (setFilter) {
      params.set("set", setFilter);
    }
    if (rarityFilter) params.set("rarity", rarityFilter);
    if (missingFilter) params.set("missing", missingFilter);

    try {
      const res = await fetch(`/api/admin/cards?${params}`);
      const data: ApiResponse = await res.json();
      setCards(data.cards);
      setTotal(data.total);
      setTotalPages(data.totalPages);
    } finally {
      setLoading(false);
    }
  }, [page, search, setFilter, productFilter, rarityFilter, missingFilter]);

  useEffect(() => {
    fetchCards();
  }, [fetchCards]);

  useEffect(() => {
    const params = new URLSearchParams();
    if (search) params.set("q", search);
    if (setFilter) params.set("set", setFilter);
    if (productFilter) params.set("product", productFilter);
    if (rarityFilter) params.set("rarity", rarityFilter);
    if (missingFilter) params.set("missing", missingFilter);
    if (page > 1) params.set("page", String(page));
    router.replace(`/admin/cards?${params}`, { scroll: false });
  }, [search, setFilter, productFilter, rarityFilter, missingFilter, page, router]);

  function startEdit(card: CardRow) {
    setEditingId(card.id);
    setEditData({
      nameEn: card.nameEn || "",
      nameTh: card.nameTh || "",
      imageUrl: card.imageUrl || "",
    });
  }

  async function saveEdit(id: number) {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/cards", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, ...editData }),
      });
      if (res.ok) {
        setCards((prev) =>
          prev.map((c) =>
            c.id === id
              ? {
                  ...c,
                  nameEn: editData.nameEn || null,
                  nameTh: editData.nameTh || null,
                  imageUrl: editData.imageUrl || null,
                }
              : c
          )
        );
        setEditingId(null);
      }
    } finally {
      setSaving(false);
    }
  }

  const [searchInput, setSearchInput] = useState(search);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setSearch(searchInput);
    setPage(1);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-2xl font-bold">Cards</h1>
        <span className="text-sm text-muted-foreground">
          {total.toLocaleString()} total
        </span>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <form onSubmit={handleSearch} className="relative">
          <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search code or name..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="h-8 rounded-md border border-border bg-background pl-8 pr-3 text-sm"
          />
        </form>

        <select
          value={setFilter}
          onChange={(e) => {
            setSetFilter(e.target.value);
            if (e.target.value) setProductFilter("");
            setPage(1);
          }}
          className="h-8 rounded-md border border-border bg-background px-2 text-sm"
        >
          <option value="">All Sets</option>
          {filterOptions.sets.map((s) => (
            <option key={s.code} value={s.code}>
              {s.code.toUpperCase()}
            </option>
          ))}
        </select>

        <select
          value={productFilter}
          onChange={(e) => {
            setProductFilter(e.target.value);
            if (e.target.value) setSetFilter("");
            setPage(1);
          }}
          className="h-8 rounded-md border border-border bg-background px-2 text-sm"
        >
          <option value="">All Products</option>
          {filterOptions.products.map((p) => (
            <option key={p.code} value={p.code}>
              {p.code.toUpperCase()}
            </option>
          ))}
        </select>

        <select
          value={rarityFilter}
          onChange={(e) => {
            setRarityFilter(e.target.value);
            setPage(1);
          }}
          className="h-8 rounded-md border border-border bg-background px-2 text-sm"
        >
          <option value="">All Rarities</option>
          {filterOptions.rarities.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>

        <select
          value={missingFilter}
          onChange={(e) => {
            setMissingFilter(e.target.value);
            setPage(1);
          }}
          className="h-8 rounded-md border border-border bg-background px-2 text-sm"
        >
          <option value="">No Filter</option>
          <option value="en">Missing EN Name</option>
          <option value="th">Missing TH Name</option>
          <option value="image">Missing Image</option>
        </select>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-border/50">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border/50 bg-muted/50">
              <th className="w-12 px-2 py-2"></th>
              <th className="px-3 py-2 text-left font-medium">Code</th>
              <th className="px-3 py-2 text-left font-medium">Name (JP)</th>
              <th className="hidden px-3 py-2 text-left font-medium md:table-cell">
                Name (EN)
              </th>
              <th className="hidden px-3 py-2 text-center font-medium sm:table-cell">
                Rarity
              </th>
              <th className="hidden px-3 py-2 text-right font-medium lg:table-cell">
                Price
              </th>
              <th className="px-3 py-2 text-center font-medium">Status</th>
              <th className="w-20 px-2 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={8} className="py-12 text-center">
                  <Loader2 className="mx-auto h-6 w-6 animate-spin text-muted-foreground" />
                </td>
              </tr>
            ) : cards.length === 0 ? (
              <tr>
                <td
                  colSpan={8}
                  className="py-12 text-center text-muted-foreground"
                >
                  No cards found
                </td>
              </tr>
            ) : (
              cards.map((card) => (
                <CardTableRow
                  key={card.id}
                  card={card}
                  editing={editingId === card.id}
                  editData={editData}
                  saving={saving}
                  onStartEdit={() => startEdit(card)}
                  onCancelEdit={() => setEditingId(null)}
                  onSaveEdit={() => saveEdit(card.id)}
                  onEditChange={(field, value) =>
                    setEditData((p) => ({ ...p, [field]: value }))
                  }
                />
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="inline-flex items-center gap-1 rounded-md border border-border px-3 py-1 text-sm disabled:opacity-50"
          >
            <ChevronLeft className="h-4 w-4" />
            Prev
          </button>
          <span className="text-sm text-muted-foreground">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            className="inline-flex items-center gap-1 rounded-md border border-border px-3 py-1 text-sm disabled:opacity-50"
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}

function CardTableRow({
  card,
  editing,
  editData,
  saving,
  onStartEdit,
  onCancelEdit,
  onSaveEdit,
  onEditChange,
}: {
  card: CardRow;
  editing: boolean;
  editData: Record<string, string>;
  saving: boolean;
  onStartEdit: () => void;
  onCancelEdit: () => void;
  onSaveEdit: () => void;
  onEditChange: (field: string, value: string) => void;
}) {
  const hasIssue = !card.nameEn || !card.imageUrl;

  if (editing) {
    return (
      <tr className="border-b border-border/30 bg-primary/5">
        <td className="px-2 py-2">
          {card.imageUrl && (
            <Image
              src={card.imageUrl}
              alt=""
              width={32}
              height={44}
              className="rounded"
              unoptimized
            />
          )}
        </td>
        <td className="px-3 py-2 font-mono text-xs">{card.baseCode}</td>
        <td colSpan={4} className="px-3 py-2">
          <div className="space-y-1">
            <input
              type="text"
              placeholder="English name"
              value={editData.nameEn || ""}
              onChange={(e) => onEditChange("nameEn", e.target.value)}
              className="w-full rounded border border-border bg-background px-2 py-0.5 text-sm"
            />
            <input
              type="text"
              placeholder="Thai name"
              value={editData.nameTh || ""}
              onChange={(e) => onEditChange("nameTh", e.target.value)}
              className="w-full rounded border border-border bg-background px-2 py-0.5 text-sm"
            />
            <input
              type="text"
              placeholder="Image URL"
              value={editData.imageUrl || ""}
              onChange={(e) => onEditChange("imageUrl", e.target.value)}
              className="w-full rounded border border-border bg-background px-2 py-0.5 text-sm font-mono text-xs"
            />
          </div>
        </td>
        <td></td>
        <td className="px-2 py-2">
          <div className="flex gap-1">
            <button
              onClick={onSaveEdit}
              disabled={saving}
              className="rounded bg-primary p-1 text-primary-foreground"
            >
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Check className="h-4 w-4" />
              )}
            </button>
            <button
              onClick={onCancelEdit}
              className="rounded bg-muted p-1 text-muted-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </td>
      </tr>
    );
  }

  return (
    <tr className="border-b border-border/30 hover:bg-muted/20">
      <td className="px-2 py-1">
        {card.imageUrl ? (
          <Image
            src={card.imageUrl}
            alt=""
            width={32}
            height={44}
            className="rounded"
            unoptimized
          />
        ) : (
          <div className="flex h-11 w-8 items-center justify-center rounded bg-muted text-xs text-muted-foreground">
            ?
          </div>
        )}
      </td>
      <td className="px-3 py-1">
        <Link
          href={`/admin/cards/${card.id}`}
          className="font-mono text-xs font-bold hover:text-primary"
        >
          {card.baseCode}
        </Link>
        {card.isParallel && (
          <span className="ml-1 text-[10px] text-orange-500">P</span>
        )}
        <div className="text-[10px] text-muted-foreground">
          {card.set.code.toUpperCase()}
        </div>
      </td>
      <td className="max-w-[140px] truncate px-3 py-1 text-xs">
        {card.nameJp}
      </td>
      <td className="hidden max-w-[160px] truncate px-3 py-1 text-xs md:table-cell">
        {card.nameEn || (
          <span className="text-muted-foreground/50">—</span>
        )}
      </td>
      <td className="hidden px-3 py-1 text-center text-xs sm:table-cell">
        {card.rarity}
      </td>
      <td className="hidden px-3 py-1 text-right text-xs lg:table-cell">
        {card.latestPriceJpy != null
          ? `¥${card.latestPriceJpy.toLocaleString()}`
          : "—"}
      </td>
      <td className="px-3 py-1 text-center">
        {hasIssue ? (
          <AlertTriangle className="mx-auto h-4 w-4 text-amber-500" />
        ) : (
          <Check className="mx-auto h-4 w-4 text-green-500" />
        )}
      </td>
      <td className="px-2 py-1">
        <div className="flex gap-1">
          <button
            onClick={onStartEdit}
            className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
            title="Quick edit"
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
          <Link
            href={`/admin/cards/${card.id}`}
            className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
            title="Full editor"
          >
            <ExternalLink className="h-3.5 w-3.5" />
          </Link>
        </div>
      </td>
    </tr>
  );
}
