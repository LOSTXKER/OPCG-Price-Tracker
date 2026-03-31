"use client";

import { useCallback, useState } from "react";
import {
  Plus,
  Pencil,
  Trash2,
  Save,
  X,
  ShoppingBag,
  ToggleLeft,
  ToggleRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";

type ShopItem = {
  id: number;
  name: string;
  nameEn: string | null;
  nameTh: string | null;
  description: string | null;
  cost: number;
  type: string;
  value: unknown;
  isActive: boolean;
  stock: number | null;
  createdAt: string;
};

const ITEM_TYPES = ["TRIAL_PRO", "TRIAL_PRO_PLUS", "BADGE", "CUSTOM"] as const;

const TYPE_LABELS: Record<string, string> = {
  TRIAL_PRO: "Trial Pro",
  TRIAL_PRO_PLUS: "Trial Pro+",
  BADGE: "Badge",
  CUSTOM: "Custom",
};

const TYPE_COLORS: Record<string, string> = {
  TRIAL_PRO: "bg-blue-500/10 text-blue-500",
  TRIAL_PRO_PLUS: "bg-purple-500/10 text-purple-500",
  BADGE: "bg-amber-100 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400",
  CUSTOM: "bg-emerald-500/10 text-emerald-500",
};

type FormData = {
  name: string;
  nameEn: string;
  nameTh: string;
  description: string;
  cost: string;
  type: string;
  value: string;
  isActive: boolean;
  stock: string;
};

const emptyForm: FormData = {
  name: "",
  nameEn: "",
  nameTh: "",
  description: "",
  cost: "",
  type: "BADGE",
  value: "{}",
  isActive: true,
  stock: "",
};

export function HoneyShopManager({ initialItems }: { initialItems: ShopItem[] }) {
  const [items, setItems] = useState<ShopItem[]>(initialItems);
  const [editing, setEditing] = useState<number | "new" | null>(null);
  const [form, setForm] = useState<FormData>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    const res = await fetch("/api/admin/honey/shop");
    if (res.ok) {
      const data = await res.json();
      setItems(data.items);
    }
  }, []);

  const startCreate = () => {
    setEditing("new");
    setForm(emptyForm);
    setError(null);
  };

  const startEdit = (item: ShopItem) => {
    setEditing(item.id);
    setForm({
      name: item.name,
      nameEn: item.nameEn ?? "",
      nameTh: item.nameTh ?? "",
      description: item.description ?? "",
      cost: item.cost.toString(),
      type: item.type,
      value: item.value ? JSON.stringify(item.value, null, 2) : "{}",
      isActive: item.isActive,
      stock: item.stock?.toString() ?? "",
    });
    setError(null);
  };

  const cancel = () => {
    setEditing(null);
    setError(null);
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);

    let parsedValue: unknown;
    try {
      parsedValue = form.value.trim() ? JSON.parse(form.value) : null;
    } catch {
      setError("Invalid JSON in value field");
      setSaving(false);
      return;
    }

    const payload = {
      name: form.name,
      nameEn: form.nameEn || null,
      nameTh: form.nameTh || null,
      description: form.description || null,
      cost: Number(form.cost),
      type: form.type,
      value: parsedValue,
      isActive: form.isActive,
      stock: form.stock ? Number(form.stock) : null,
    };

    try {
      const url = editing === "new" ? "/api/admin/honey/shop" : `/api/admin/honey/shop/${editing}`;
      const method = editing === "new" ? "POST" : "PATCH";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to save");
      } else {
        setEditing(null);
        await reload();
      }
    } catch {
      setError("Network error");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Deactivate this item?")) return;
    await fetch(`/api/admin/honey/shop/${id}`, { method: "DELETE" });
    await reload();
  };

  const handleToggleActive = async (item: ShopItem) => {
    await fetch(`/api/admin/honey/shop/${item.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !item.isActive }),
    });
    await reload();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Honey Shop Items</h1>
        <Button onClick={startCreate} size="sm" className="gap-1.5">
          <Plus className="h-4 w-4" /> Add Item
        </Button>
      </div>

      {/* Create / Edit Form */}
      {editing !== null && (
        <div className="panel space-y-4 p-4">
          <h2 className="font-semibold">
            {editing === "new" ? "Create Item" : "Edit Item"}
          </h2>
          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">
                Name (JP/Default)
              </label>
              <input
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">
                Name (EN)
              </label>
              <input
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                value={form.nameEn}
                onChange={(e) => setForm({ ...form, nameEn: e.target.value })}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">
                Name (TH)
              </label>
              <input
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                value={form.nameTh}
                onChange={(e) => setForm({ ...form, nameTh: e.target.value })}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">
                Description
              </label>
              <input
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">
                Cost (Honey)
              </label>
              <input
                type="number"
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                value={form.cost}
                onChange={(e) => setForm({ ...form, cost: e.target.value })}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">
                Type
              </label>
              <select
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })}
              >
                {ITEM_TYPES.map((t) => (
                  <option key={t} value={t}>{TYPE_LABELS[t]}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">
                Stock (empty = unlimited)
              </label>
              <input
                type="number"
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                value={form.stock}
                onChange={(e) => setForm({ ...form, stock: e.target.value })}
                placeholder="Unlimited"
              />
            </div>
            <div className="flex items-end">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                />
                Active
              </label>
            </div>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">
              Value (JSON)
            </label>
            <textarea
              className="w-full rounded-lg border border-border bg-background px-3 py-2 font-mono text-xs"
              rows={3}
              value={form.value}
              onChange={(e) => setForm({ ...form, value: e.target.value })}
            />
          </div>
          <div className="flex gap-2">
            <Button onClick={handleSave} disabled={saving} size="sm" className="gap-1.5">
              <Save className="h-4 w-4" /> {saving ? "Saving..." : "Save"}
            </Button>
            <Button onClick={cancel} variant="outline" size="sm" className="gap-1.5">
              <X className="h-4 w-4" /> Cancel
            </Button>
          </div>
        </div>
      )}

      {/* Items Table */}
      <div className="panel overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border/50 bg-muted/30">
              <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">Item</th>
              <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">Type</th>
              <th className="px-4 py-2.5 text-right font-medium text-muted-foreground">Cost</th>
              <th className="px-4 py-2.5 text-right font-medium text-muted-foreground">Stock</th>
              <th className="px-4 py-2.5 text-center font-medium text-muted-foreground">Status</th>
              <th className="px-4 py-2.5 text-right font-medium text-muted-foreground">Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id} className="border-b border-border/30 transition-colors hover:bg-muted/20">
                <td className="px-4 py-3">
                  <div>
                    <p className="font-medium">{item.nameEn ?? item.name}</p>
                    {item.description && (
                      <p className="mt-0.5 text-xs text-muted-foreground">{item.description}</p>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium ${TYPE_COLORS[item.type] ?? "bg-muted"}`}>
                    {TYPE_LABELS[item.type] ?? item.type}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <span className="font-bold tabular-nums text-amber-600 dark:text-amber-400">{item.cost}</span>
                </td>
                <td className="px-4 py-3 text-right text-muted-foreground">
                  {item.stock ?? "∞"}
                </td>
                <td className="px-4 py-3 text-center">
                  <button onClick={() => handleToggleActive(item)} title={item.isActive ? "Active" : "Inactive"}>
                    {item.isActive ? (
                      <ToggleRight className="mx-auto h-5 w-5 text-green-500" />
                    ) : (
                      <ToggleLeft className="mx-auto h-5 w-5 text-muted-foreground" />
                    )}
                  </button>
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex justify-end gap-1">
                    <button
                      onClick={() => startEdit(item)}
                      className="rounded p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="rounded p-1.5 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-muted-foreground">
                  <ShoppingBag className="mx-auto mb-2 h-8 w-8 text-muted-foreground/30" />
                  No shop items yet
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
