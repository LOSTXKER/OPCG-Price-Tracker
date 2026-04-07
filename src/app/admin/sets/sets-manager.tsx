"use client";

import { useState } from "react";
import {
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Pencil,
  Check,
  X,
  Loader2,
  Library,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { Badge } from "@/components/ui/badge";

interface SetRow {
  id: number;
  code: string;
  name: string;
  nameEn: string | null;
  nameTh: string | null;
  type: string;
  releaseDate: string | null;
  cardCount: number;
  packsPerBox: number | null;
  cardsPerPack: number | null;
  actualCardCount: number;
  productCardCount: number;
  missingEn: number;
  missingImage: number;
  completeness: number;
}

export function SetsManager({ initialSets }: { initialSets: SetRow[] }) {
  const [sets, setSets] = useState(initialSets);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editData, setEditData] = useState<Partial<SetRow>>({});
  const [loading, setLoading] = useState<Record<string, boolean>>({});

  function toggleExpand(id: number) {
    setExpandedId((prev) => (prev === id ? null : id));
  }

  function startEdit(set: SetRow) {
    setEditingId(set.id);
    setEditData({
      nameEn: set.nameEn,
      nameTh: set.nameTh,
      packsPerBox: set.packsPerBox,
      cardsPerPack: set.cardsPerPack,
    });
  }

  async function saveEdit(id: number) {
    setLoading((p) => ({ ...p, [`edit-${id}`]: true }));
    try {
      const res = await fetch("/api/admin/sets", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, ...editData }),
      });
      if (res.ok) {
        setSets((prev) =>
          prev.map((s) => (s.id === id ? { ...s, ...editData } : s))
        );
        setEditingId(null);
        toast.success("Set updated");
      } else {
        toast.error(`Failed to save: ${res.status}`);
      }
    } catch {
      toast.error("Network error");
    } finally {
      setLoading((p) => ({ ...p, [`edit-${id}`]: false }));
    }
  }

  async function scrapePrices(setCode: string, setId: number) {
    const key = `scrape-${setId}`;
    setLoading((p) => ({ ...p, [key]: true }));
    const toastId = toast.loading(`Scraping prices for ${setCode.toUpperCase()}...`);
    try {
      const res = await fetch("/api/admin/sets/scrape-prices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ setCode }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(`Scraped: ${data.upserted} cards, ${data.newCards} new`, { id: toastId });
      } else {
        toast.error(data.error || "Scrape failed", { id: toastId });
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Unknown error", { id: toastId });
    } finally {
      setLoading((p) => ({ ...p, [key]: false }));
    }
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Set Management"
        icon={Library}
        badge={<Badge variant="secondary">{sets.length} sets</Badge>}
      />

      <div className="overflow-x-auto rounded-xl border border-border/50">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border/50 bg-muted/30">
              <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">Code</th>
              <th className="hidden px-4 py-2.5 text-left text-xs font-medium text-muted-foreground sm:table-cell">
                Name
              </th>
              <th className="px-4 py-2.5 text-center text-xs font-medium text-muted-foreground" title="Cards by identity (code prefix)">Cards</th>
              <th className="hidden px-4 py-2.5 text-center text-xs font-medium text-muted-foreground md:table-cell" title="Cards in physical product/box">In Box</th>
              <th className="hidden px-4 py-2.5 text-center text-xs font-medium text-muted-foreground md:table-cell">
                EN %
              </th>
              <th className="px-4 py-2.5 text-center text-xs font-medium text-muted-foreground">Actions</th>
              <th className="w-10 px-2"></th>
            </tr>
          </thead>
          <tbody>
            {sets.map((set) => {
              const expanded = expandedId === set.id;
              const editing = editingId === set.id;
              return (
                <SetTableRow
                  key={set.id}
                  set={set}
                  expanded={expanded}
                  editing={editing}
                  editData={editData}
                  loading={loading}
                  onToggle={() => toggleExpand(set.id)}
                  onStartEdit={() => startEdit(set)}
                  onCancelEdit={() => setEditingId(null)}
                  onSaveEdit={() => saveEdit(set.id)}
                  onEditChange={(field, value) =>
                    setEditData((p) => ({ ...p, [field]: value }))
                  }
                  onScrape={() => scrapePrices(set.code, set.id)}
                />
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function SetTableRow({
  set,
  expanded,
  editing,
  editData,
  loading,
  onToggle,
  onStartEdit,
  onCancelEdit,
  onSaveEdit,
  onEditChange,
  onScrape,
}: {
  set: SetRow;
  expanded: boolean;
  editing: boolean;
  editData: Partial<SetRow>;
  loading: Record<string, boolean>;
  onToggle: () => void;
  onStartEdit: () => void;
  onCancelEdit: () => void;
  onSaveEdit: () => void;
  onEditChange: (field: string, value: unknown) => void;
  onScrape: () => void;
}) {
  const scrapeLoading = loading[`scrape-${set.id}`];
  const editLoading = loading[`edit-${set.id}`];

  return (
    <>
      <tr className="border-b border-border/20 transition-colors hover:bg-muted/20">
        <td className="px-4 py-2.5 font-mono text-xs font-bold uppercase">
          {set.code}
        </td>
        <td className="hidden px-4 py-2.5 sm:table-cell">
          <div className="text-sm">{set.nameEn || set.name}</div>
          <div className="text-xs text-muted-foreground">{set.name}</div>
        </td>
        <td className="px-4 py-2.5 text-center tabular-nums">{set.actualCardCount}</td>
        <td className="hidden px-4 py-2.5 text-center tabular-nums md:table-cell">
          {set.productCardCount > 0 ? (
            <span className="text-muted-foreground">{set.productCardCount}</span>
          ) : (
            <span className="text-muted-foreground/40">—</span>
          )}
        </td>
        <td className="hidden px-4 py-2.5 text-center md:table-cell">
          <span
            className={`text-xs font-medium ${
              set.completeness >= 90
                ? "text-green-500"
                : set.completeness >= 50
                  ? "text-amber-500"
                  : "text-red-500"
            }`}
          >
            {set.completeness}%
          </span>
        </td>
        <td className="px-4 py-2.5">
          <div className="flex items-center justify-center gap-1">
            <Button
              variant="ghost"
              size="xs"
              onClick={onScrape}
              disabled={scrapeLoading}
              className="text-green-600 hover:text-green-700 dark:text-green-500"
            >
              {scrapeLoading ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <RefreshCw className="h-3 w-3" />
              )}
              Prices
            </Button>
          </div>
        </td>
        <td className="px-2">
          <Button variant="ghost" size="icon-xs" onClick={onToggle}>
            {expanded ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </Button>
        </td>
      </tr>

      {expanded && (
        <tr className="border-b border-border/20 bg-muted/10">
          <td colSpan={7} className="px-4 py-4">
            {editing ? (
              <div className="space-y-4">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground">
                      English Name
                    </label>
                    <Input
                      value={(editData.nameEn as string) ?? ""}
                      onChange={(e) => onEditChange("nameEn", e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground">
                      Thai Name
                    </label>
                    <Input
                      value={(editData.nameTh as string) ?? ""}
                      onChange={(e) => onEditChange("nameTh", e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground">
                      Packs/Box
                    </label>
                    <Input
                      type="number"
                      value={editData.packsPerBox ?? ""}
                      onChange={(e) =>
                        onEditChange(
                          "packsPerBox",
                          e.target.value ? parseInt(e.target.value) : null
                        )
                      }
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground">
                      Cards/Pack
                    </label>
                    <Input
                      type="number"
                      value={editData.cardsPerPack ?? ""}
                      onChange={(e) =>
                        onEditChange(
                          "cardsPerPack",
                          e.target.value ? parseInt(e.target.value) : null
                        )
                      }
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={onSaveEdit}
                    disabled={editLoading}
                  >
                    {editLoading ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Check className="h-3.5 w-3.5" />
                    )}
                    Save
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onCancelEdit}
                  >
                    <X className="h-3.5 w-3.5" />
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="grid gap-x-8 gap-y-1.5 text-sm sm:grid-cols-2">
                  <div>
                    <span className="text-muted-foreground">EN: </span>
                    {set.nameEn || <span className="text-muted-foreground/50">—</span>}
                  </div>
                  <div>
                    <span className="text-muted-foreground">TH: </span>
                    {set.nameTh || <span className="text-muted-foreground/50">—</span>}
                  </div>
                  <div>
                    <span className="text-muted-foreground">Type: </span>
                    {set.type}
                  </div>
                  <div>
                    <span className="text-muted-foreground">Packs/Box: </span>
                    {set.packsPerBox ?? <span className="text-muted-foreground/50">—</span>}
                  </div>
                  <div>
                    <span className="text-muted-foreground">Cards/Pack: </span>
                    {set.cardsPerPack ?? <span className="text-muted-foreground/50">—</span>}
                  </div>
                  <div>
                    <span className="text-muted-foreground">Missing EN: </span>
                    <span className={set.missingEn > 0 ? "text-amber-500" : "text-green-500"}>
                      {set.missingEn}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Missing Images: </span>
                    <span className={set.missingImage > 0 ? "text-amber-500" : "text-green-500"}>
                      {set.missingImage}
                    </span>
                  </div>
                </div>
                <Button variant="outline" size="sm" onClick={onStartEdit}>
                  <Pencil className="h-3.5 w-3.5" />
                  Edit Metadata
                </Button>
              </div>
            )}
          </td>
        </tr>
      )}
    </>
  );
}
