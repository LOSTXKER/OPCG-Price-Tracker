"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  Search,
  Pencil,
  Check,
  X,
  Loader2,
  AlertTriangle,
  ExternalLink,
  CreditCard,
} from "lucide-react";
import { toast } from "sonner";
import { opcgConfig } from "@/lib/game-config";
import { formatJpy } from "@/lib/utils/currency";
import type { PaginatedApiResponse } from "@/app/admin/admin-types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AdminPagination } from "@/components/admin/admin-pagination";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

const OFFICIAL_IMAGE_HOST = opcgConfig.officialCardImageBase
  ? new URL(opcgConfig.officialCardImageBase).hostname
  : "";

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
  rarities: string[];
}

interface ApiResponse extends PaginatedApiResponse {
  cards: CardRow[];
  limit: number;
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
  const [rarityFilter, setRarityFilter] = useState(
    searchParams.get("rarity") || ""
  );
  const [missingFilter, setMissingFilter] = useState(
    searchParams.get("missing") || ""
  );
  const [parallelFilter, setParallelFilter] = useState(
    searchParams.get("parallel") || ""
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
    if (setFilter) params.set("set", setFilter);
    if (rarityFilter) params.set("rarity", rarityFilter);
    if (missingFilter) params.set("missing", missingFilter);
    if (parallelFilter) params.set("parallel", parallelFilter);

    try {
      const res = await fetch(`/api/admin/cards?${params}`);
      if (!res.ok) throw new Error(`Failed to load cards: ${res.status}`);
      const data: ApiResponse = await res.json();
      setCards(data.cards);
      setTotal(data.total);
      setTotalPages(data.totalPages);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [page, search, setFilter, rarityFilter, missingFilter, parallelFilter]);

  useEffect(() => {
    fetchCards();
  }, [fetchCards]);

  useEffect(() => {
    const params = new URLSearchParams();
    if (search) params.set("q", search);
    if (setFilter) params.set("set", setFilter);
    if (rarityFilter) params.set("rarity", rarityFilter);
    if (missingFilter) params.set("missing", missingFilter);
    if (parallelFilter) params.set("parallel", parallelFilter);
    if (page > 1) params.set("page", String(page));
    router.replace(`/admin/cards?${params}`, { scroll: false });
  }, [search, setFilter, rarityFilter, missingFilter, parallelFilter, page, router]);

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
        toast.success("Card updated");
      } else {
        toast.error("Failed to save card");
      }
    } catch {
      toast.error("Network error");
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
    <div className="space-y-6">
      <AdminPageHeader
        title="Cards"
        icon={CreditCard}
        badge={
          <Badge variant="secondary">{total.toLocaleString()} total</Badge>
        }
      />

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <form onSubmit={handleSearch} className="relative">
          <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search code or name..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="h-8 w-52 pl-8"
          />
        </form>

        <Select
          value={setFilter || "_all"}
          onValueChange={(v) => {
            setSetFilter(v === "_all" ? "" : v ?? "");
            setPage(1);
          }}
        >
          <SelectTrigger className="h-8 w-36">
            <SelectValue placeholder="All Sets" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="_all">All Sets</SelectItem>
            {filterOptions.sets.map((s) => (
              <SelectItem key={s.code} value={s.code}>
                {s.code.toUpperCase()}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={rarityFilter || "_all"}
          onValueChange={(v) => {
            setRarityFilter(v === "_all" ? "" : v ?? "");
            setPage(1);
          }}
        >
          <SelectTrigger className="h-8 w-36">
            <SelectValue placeholder="All Rarities" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="_all">All Rarities</SelectItem>
            {filterOptions.rarities.map((r) => (
              <SelectItem key={r} value={r}>
                {r}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={missingFilter || "_none"}
          onValueChange={(v) => {
            setMissingFilter(v === "_none" ? "" : v ?? "");
            setPage(1);
          }}
        >
          <SelectTrigger className="h-8 w-36">
            <SelectValue placeholder="No Filter" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="_none">No Filter</SelectItem>
            <SelectItem value="price">Missing Price</SelectItem>
            <SelectItem value="en">Missing EN Name</SelectItem>
            <SelectItem value="th">Missing TH Name</SelectItem>
            <SelectItem value="image">Missing Image</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={parallelFilter || "_all"}
          onValueChange={(v) => {
            setParallelFilter(v === "_all" ? "" : v ?? "");
            setPage(1);
          }}
        >
          <SelectTrigger className="h-8 w-36">
            <SelectValue placeholder="All Variants" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="_all">All Variants</SelectItem>
            <SelectItem value="false">Regular Only</SelectItem>
            <SelectItem value="true">Parallel Only</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-border/50">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border/50 bg-muted/30">
              <th className="w-12 px-2 py-2.5 text-center text-xs font-medium text-muted-foreground">Image</th>
              <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">Code</th>
              <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">Name (JP)</th>
              <th className="hidden px-4 py-2.5 text-left text-xs font-medium text-muted-foreground md:table-cell">
                Name (EN)
              </th>
              <th className="hidden px-4 py-2.5 text-center text-xs font-medium text-muted-foreground sm:table-cell">
                Rarity
              </th>
              <th className="hidden px-4 py-2.5 text-right text-xs font-medium text-muted-foreground lg:table-cell">
                Price
              </th>
              <th className="px-4 py-2.5 text-center text-xs font-medium text-muted-foreground">Status</th>
              <th className="w-20 px-2 py-2.5"></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 8 }).map((_, i) => (
                <tr key={i} className="border-b border-border/20">
                  <td className="px-2 py-2"><Skeleton className="mx-auto h-11 w-8 rounded" /></td>
                  <td className="px-4 py-2"><Skeleton className="h-4 w-20" /></td>
                  <td className="px-4 py-2"><Skeleton className="h-4 w-28" /></td>
                  <td className="hidden px-4 py-2 md:table-cell"><Skeleton className="h-4 w-24" /></td>
                  <td className="hidden px-4 py-2 sm:table-cell"><Skeleton className="mx-auto h-4 w-8" /></td>
                  <td className="hidden px-4 py-2 lg:table-cell"><Skeleton className="ml-auto h-4 w-16" /></td>
                  <td className="px-4 py-2"><Skeleton className="mx-auto h-4 w-4" /></td>
                  <td className="px-2 py-2"><Skeleton className="h-4 w-12" /></td>
                </tr>
              ))
            ) : cards.length === 0 ? (
              <tr>
                <td
                  colSpan={8}
                  className="py-16 text-center text-muted-foreground"
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

      <AdminPagination
        page={page}
        totalPages={totalPages}
        total={total}
        onPageChange={setPage}
      />
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
      <tr className="border-b border-border/20 bg-primary/5">
        <td className="px-2 py-2">
          {card.imageUrl ? (
            <Image src={card.imageUrl} alt="" width={32} height={44} className="rounded" unoptimized />
          ) : (
            <div className="flex h-11 w-8 items-center justify-center rounded bg-muted text-xs text-muted-foreground">?</div>
          )}
        </td>
        <td className="px-4 py-2 font-mono text-xs">{card.baseCode}</td>
        <td colSpan={4} className="px-4 py-2">
          <div className="space-y-1.5">
            <Input
              placeholder="English name"
              value={editData.nameEn || ""}
              onChange={(e) => onEditChange("nameEn", e.target.value)}
              className="h-7"
            />
            <Input
              placeholder="Thai name"
              value={editData.nameTh || ""}
              onChange={(e) => onEditChange("nameTh", e.target.value)}
              className="h-7"
            />
            <Input
              placeholder="Image URL"
              value={editData.imageUrl || ""}
              onChange={(e) => onEditChange("imageUrl", e.target.value)}
              className="h-7 font-mono text-xs"
            />
          </div>
        </td>
        <td></td>
        <td className="px-2 py-2">
          <div className="flex gap-1">
            <Button
              size="icon-xs"
              onClick={onSaveEdit}
              disabled={saving}
            >
              {saving ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Check className="h-3.5 w-3.5" />
              )}
            </Button>
            <Button
              variant="outline"
              size="icon-xs"
              onClick={onCancelEdit}
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>
        </td>
      </tr>
    );
  }

  return (
    <tr className="border-b border-border/20 transition-colors hover:bg-muted/20">
      <td className="px-2 py-1.5">
        {card.imageUrl ? (
          <Image src={card.imageUrl} alt="" width={32} height={44} className="rounded" unoptimized />
        ) : (
          <div className="flex h-11 w-8 items-center justify-center rounded bg-muted text-xs text-muted-foreground">?</div>
        )}
      </td>
      <td className="px-4 py-1.5">
        <Link
          href={`/admin/cards/${card.id}`}
          className="font-mono text-xs font-bold hover:text-primary"
        >
          {card.baseCode}
        </Link>
        {card.isParallel && (
          <span className="ml-1 rounded bg-amber-500/20 px-1 text-xs font-medium text-amber-600 dark:text-amber-400">
            {card.rarity.startsWith("P-") ? card.rarity : "PA"}
          </span>
        )}
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <span>{card.set.code.toUpperCase()}</span>
          {card.imageUrl?.includes(OFFICIAL_IMAGE_HOST) ? (
            <span className="rounded bg-green-500/10 px-1 text-green-500">Official</span>
          ) : (
            <span className="rounded bg-neutral-500/10 px-1 text-neutral-400">Legacy</span>
          )}
        </div>
      </td>
      <td className="max-w-[140px] truncate px-4 py-1.5 text-xs">
        {card.nameJp}
      </td>
      <td className="hidden max-w-[160px] truncate px-4 py-1.5 text-xs md:table-cell">
        {card.nameEn || (
          <span className="text-muted-foreground/50">—</span>
        )}
      </td>
      <td className="hidden px-4 py-1.5 text-center text-xs sm:table-cell">
        {card.rarity}
      </td>
      <td className="hidden px-4 py-1.5 text-right text-xs tabular-nums lg:table-cell">
        {card.latestPriceJpy != null
          ? formatJpy(card.latestPriceJpy)
          : "—"}
      </td>
      <td className="px-4 py-1.5 text-center">
        {hasIssue ? (
          <AlertTriangle className="mx-auto h-4 w-4 text-amber-500" />
        ) : (
          <Check className="mx-auto h-4 w-4 text-green-500" />
        )}
      </td>
      <td className="px-2 py-1.5">
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={onStartEdit}
            title="Quick edit"
          >
            <Pencil className="h-3.5 w-3.5" />
          </Button>
          <Link
            href={`/admin/cards/${card.id}`}
            className="inline-flex size-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            title="Full editor"
          >
            <ExternalLink className="h-3.5 w-3.5" />
          </Link>
        </div>
      </td>
    </tr>
  );
}
