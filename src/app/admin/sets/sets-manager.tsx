"use client";

import { useState } from "react";
import {
  Download,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Pencil,
  Check,
  X,
  Loader2,
} from "lucide-react";

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
  const [messages, setMessages] = useState<Record<number, string>>({});

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
      }
    } finally {
      setLoading((p) => ({ ...p, [`edit-${id}`]: false }));
    }
  }

  async function importPunkRecords(setCode: string, setId: number) {
    const key = `import-${setId}`;
    setLoading((p) => ({ ...p, [key]: true }));
    setMessages((p) => ({ ...p, [setId]: "Importing from punk-records..." }));
    try {
      const res = await fetch("/api/admin/sets/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ setCode }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessages((p) => ({
          ...p,
          [setId]: `Imported: ${data.updated} updated, ${data.noMatch} no match`,
        }));
      } else {
        setMessages((p) => ({
          ...p,
          [setId]: `Error: ${data.error}`,
        }));
      }
    } catch (e) {
      setMessages((p) => ({
        ...p,
        [setId]: `Error: ${e instanceof Error ? e.message : "Unknown"}`,
      }));
    } finally {
      setLoading((p) => ({ ...p, [key]: false }));
    }
  }

  async function scrapePrices(setCode: string, setId: number) {
    const key = `scrape-${setId}`;
    setLoading((p) => ({ ...p, [key]: true }));
    setMessages((p) => ({ ...p, [setId]: "Scraping prices from Yuyu-tei..." }));
    try {
      const res = await fetch("/api/admin/sets/scrape-prices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ setCode }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessages((p) => ({
          ...p,
          [setId]: `Scraped: ${data.upserted} cards, ${data.newCards} new`,
        }));
      } else {
        setMessages((p) => ({
          ...p,
          [setId]: `Error: ${data.error}`,
        }));
      }
    } catch (e) {
      setMessages((p) => ({
        ...p,
        [setId]: `Error: ${e instanceof Error ? e.message : "Unknown"}`,
      }));
    } finally {
      setLoading((p) => ({ ...p, [key]: false }));
    }
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Set Management</h1>

      <div className="overflow-hidden rounded-xl border border-border/50">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border/50 bg-muted/50">
              <th className="px-3 py-2 text-left font-medium">Code</th>
              <th className="hidden px-3 py-2 text-left font-medium sm:table-cell">
                Name
              </th>
              <th className="px-3 py-2 text-center font-medium" title="Cards by identity (code prefix)">Cards</th>
              <th className="hidden px-3 py-2 text-center font-medium md:table-cell" title="Cards in physical product/box">In Box</th>
              <th className="hidden px-3 py-2 text-center font-medium md:table-cell">
                EN %
              </th>
              <th className="px-3 py-2 text-center font-medium">Actions</th>
              <th className="w-8 px-2"></th>
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
                  message={messages[set.id]}
                  onToggle={() => toggleExpand(set.id)}
                  onStartEdit={() => startEdit(set)}
                  onCancelEdit={() => setEditingId(null)}
                  onSaveEdit={() => saveEdit(set.id)}
                  onEditChange={(field, value) =>
                    setEditData((p) => ({ ...p, [field]: value }))
                  }
                  onImport={() => importPunkRecords(set.code, set.id)}
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
  message,
  onToggle,
  onStartEdit,
  onCancelEdit,
  onSaveEdit,
  onEditChange,
  onImport,
  onScrape,
}: {
  set: SetRow;
  expanded: boolean;
  editing: boolean;
  editData: Partial<SetRow>;
  loading: Record<string, boolean>;
  message?: string;
  onToggle: () => void;
  onStartEdit: () => void;
  onCancelEdit: () => void;
  onSaveEdit: () => void;
  onEditChange: (field: string, value: unknown) => void;
  onImport: () => void;
  onScrape: () => void;
}) {
  const importLoading = loading[`import-${set.id}`];
  const scrapeLoading = loading[`scrape-${set.id}`];
  const editLoading = loading[`edit-${set.id}`];

  return (
    <>
      <tr className="border-b border-border/30 hover:bg-muted/20">
        <td className="px-3 py-2 font-mono text-xs font-bold uppercase">
          {set.code}
        </td>
        <td className="hidden px-3 py-2 sm:table-cell">
          <div>{set.nameEn || set.name}</div>
          <div className="text-xs text-muted-foreground">{set.name}</div>
        </td>
        <td className="px-3 py-2 text-center">{set.actualCardCount}</td>
        <td className="hidden px-3 py-2 text-center md:table-cell">
          {set.productCardCount > 0 ? (
            <span className="text-muted-foreground">{set.productCardCount}</span>
          ) : (
            <span className="text-muted-foreground/40">—</span>
          )}
        </td>
        <td className="hidden px-3 py-2 text-center md:table-cell">
          <span
            className={
              set.completeness >= 90
                ? "text-green-500"
                : set.completeness >= 50
                  ? "text-amber-500"
                  : "text-red-500"
            }
          >
            {set.completeness}%
          </span>
        </td>
        <td className="px-3 py-2">
          <div className="flex items-center justify-center gap-1">
            <button
              onClick={onImport}
              disabled={importLoading}
              className="inline-flex items-center gap-1 rounded-md bg-blue-500/10 px-2 py-1 text-xs font-medium text-blue-500 hover:bg-blue-500/20 disabled:opacity-50"
              title="Import from punk-records"
            >
              {importLoading ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <Download className="h-3 w-3" />
              )}
              Import
            </button>
            <button
              onClick={onScrape}
              disabled={scrapeLoading}
              className="inline-flex items-center gap-1 rounded-md bg-green-500/10 px-2 py-1 text-xs font-medium text-green-500 hover:bg-green-500/20 disabled:opacity-50"
              title="Scrape prices from Yuyu-tei"
            >
              {scrapeLoading ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <RefreshCw className="h-3 w-3" />
              )}
              Prices
            </button>
          </div>
        </td>
        <td className="px-2">
          <button
            onClick={onToggle}
            className="rounded p-1 text-muted-foreground hover:bg-muted"
          >
            {expanded ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </button>
        </td>
      </tr>

      {expanded && (
        <tr className="border-b border-border/30 bg-muted/10">
          <td colSpan={7} className="px-4 py-3">
            {message && (
              <div className="mb-3 rounded-lg bg-muted/50 px-3 py-2 text-xs">
                {message}
              </div>
            )}

            {editing ? (
              <div className="space-y-3">
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="space-y-1">
                    <span className="text-xs text-muted-foreground">
                      English Name
                    </span>
                    <input
                      type="text"
                      value={(editData.nameEn as string) ?? ""}
                      onChange={(e) => onEditChange("nameEn", e.target.value)}
                      className="w-full rounded-md border border-border bg-background px-2 py-1 text-sm"
                    />
                  </label>
                  <label className="space-y-1">
                    <span className="text-xs text-muted-foreground">
                      Thai Name
                    </span>
                    <input
                      type="text"
                      value={(editData.nameTh as string) ?? ""}
                      onChange={(e) => onEditChange("nameTh", e.target.value)}
                      className="w-full rounded-md border border-border bg-background px-2 py-1 text-sm"
                    />
                  </label>
                  <label className="space-y-1">
                    <span className="text-xs text-muted-foreground">
                      Packs/Box
                    </span>
                    <input
                      type="number"
                      value={editData.packsPerBox ?? ""}
                      onChange={(e) =>
                        onEditChange(
                          "packsPerBox",
                          e.target.value ? parseInt(e.target.value) : null
                        )
                      }
                      className="w-full rounded-md border border-border bg-background px-2 py-1 text-sm"
                    />
                  </label>
                  <label className="space-y-1">
                    <span className="text-xs text-muted-foreground">
                      Cards/Pack
                    </span>
                    <input
                      type="number"
                      value={editData.cardsPerPack ?? ""}
                      onChange={(e) =>
                        onEditChange(
                          "cardsPerPack",
                          e.target.value ? parseInt(e.target.value) : null
                        )
                      }
                      className="w-full rounded-md border border-border bg-background px-2 py-1 text-sm"
                    />
                  </label>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={onSaveEdit}
                    disabled={editLoading}
                    className="inline-flex items-center gap-1 rounded-md bg-primary px-3 py-1 text-xs font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                  >
                    {editLoading ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <Check className="h-3 w-3" />
                    )}
                    Save
                  </button>
                  <button
                    onClick={onCancelEdit}
                    className="inline-flex items-center gap-1 rounded-md bg-muted px-3 py-1 text-xs font-medium text-muted-foreground hover:bg-muted/80"
                  >
                    <X className="h-3 w-3" />
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="grid gap-x-8 gap-y-1 text-xs sm:grid-cols-2">
                  <div>
                    <span className="text-muted-foreground">EN: </span>
                    {set.nameEn || "—"}
                  </div>
                  <div>
                    <span className="text-muted-foreground">TH: </span>
                    {set.nameTh || "—"}
                  </div>
                  <div>
                    <span className="text-muted-foreground">Type: </span>
                    {set.type}
                  </div>
                  <div>
                    <span className="text-muted-foreground">Packs/Box: </span>
                    {set.packsPerBox ?? "—"}
                  </div>
                  <div>
                    <span className="text-muted-foreground">Cards/Pack: </span>
                    {set.cardsPerPack ?? "—"}
                  </div>
                  <div>
                    <span className="text-muted-foreground">
                      Missing EN Names:{" "}
                    </span>
                    <span
                      className={
                        set.missingEn > 0
                          ? "text-amber-500"
                          : "text-green-500"
                      }
                    >
                      {set.missingEn}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">
                      Missing Images:{" "}
                    </span>
                    <span
                      className={
                        set.missingImage > 0
                          ? "text-amber-500"
                          : "text-green-500"
                      }
                    >
                      {set.missingImage}
                    </span>
                  </div>
                </div>
                <button
                  onClick={onStartEdit}
                  className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-1 text-xs font-medium text-muted-foreground hover:bg-muted/80"
                >
                  <Pencil className="h-3 w-3" />
                  Edit Metadata
                </button>
              </div>
            )}
          </td>
        </tr>
      )}
    </>
  );
}
