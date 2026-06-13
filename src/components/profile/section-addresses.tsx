"use client";

import { useEffect, useState } from "react";
import {
  Check,
  Loader2,
  MapPin,
  Pencil,
  Plus,
  Star,
  Trash2,
  X,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ApiError, apiDelete, apiGet, apiPatch, apiPost, apiTry } from "@/lib/api/client";
import { useUIStore } from "@/stores/ui-store";
import { t } from "@/lib/i18n";

type Address = {
  id: string;
  label: string | null;
  fullName: string;
  phone: string | null;
  addressLine: string;
  district: string | null;
  province: string;
  postalCode: string;
  country: string;
  isDefault: boolean;
};

const EMPTY_FORM = {
  label: "",
  fullName: "",
  phone: "",
  addressLine: "",
  district: "",
  province: "",
  postalCode: "",
  country: "TH",
  isDefault: false,
};

export function SectionAddresses() {
  const lang = useUIStore((s) => s.language);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAddresses = async () => {
    const j = await apiTry(apiGet<{ addresses: Address[] }>("/api/me/addresses"));
    if (j) setAddresses(j.addresses);
  };

  useEffect(() => {
    void fetchAddresses().finally(() => setLoading(false));
  }, []);

  const resetForm = () => {
    setForm(EMPTY_FORM);
    setShowForm(false);
    setEditingId(null);
    setError(null);
  };

  const handleSave = async () => {
    if (!form.fullName.trim() || !form.addressLine.trim() || !form.province.trim() || !form.postalCode.trim()) {
      setError(t(lang, "requiredFields"));
      return;
    }

    setSaving(true);
    setError(null);
    try {
      if (editingId) {
        await apiPatch(`/api/me/addresses/${editingId}`, form);
      } else {
        await apiPost("/api/me/addresses", form);
      }
      await fetchAddresses();
      resetForm();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    const ok = await apiTry(apiDelete(`/api/me/addresses/${id}`));
    if (ok !== null) {
      setAddresses((prev) => prev.filter((a) => a.id !== id));
    }
  };

  const handleSetDefault = async (id: string) => {
    const ok = await apiTry(apiPatch(`/api/me/addresses/${id}`, { isDefault: true }));
    if (ok !== null) await fetchAddresses();
  };

  const startEdit = (addr: Address) => {
    setEditingId(addr.id);
    setForm({
      label: addr.label ?? "",
      fullName: addr.fullName,
      phone: addr.phone ?? "",
      addressLine: addr.addressLine,
      district: addr.district ?? "",
      province: addr.province,
      postalCode: addr.postalCode,
      country: addr.country,
      isDefault: addr.isDefault,
    });
    setShowForm(true);
  };

  const formFields = [
    { key: "label", labelKey: "addressLabel" as const, required: false },
    { key: "fullName", labelKey: "fullName" as const, required: true },
    { key: "phone", labelKey: "phone" as const, required: false },
    { key: "addressLine", labelKey: "addressLine" as const, required: true },
    { key: "district", labelKey: "district" as const, required: false },
    { key: "province", labelKey: "province" as const, required: true },
    { key: "postalCode", labelKey: "postalCode" as const, required: true },
    { key: "country", labelKey: "country" as const, required: false },
  ] as const;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-h2">{t(lang, "addresses")}</h2>
        {!showForm && (
          <Button
            size="sm"
            onClick={() => { resetForm(); setShowForm(true); }}
            className="gap-1.5"
          >
            <Plus className="size-3.5" />
            {t(lang, "addAddress")}
          </Button>
        )}
      </div>

      {/* Add/Edit form */}
      {showForm && (
        <div className="rounded-xl border border-border/40 bg-card p-5 space-y-4">
          <h3 className="text-h5">
            {editingId ? t(lang, "editAddress") : t(lang, "addAddress")}
          </h3>
          <div className="grid gap-3 sm:grid-cols-2">
            {formFields.map(({ key, labelKey, required }) => (
              <div key={key} className="space-y-1.5">
                <label className="text-eyebrow">
                  {t(lang, labelKey)}{required && " *"}
                </label>
                <Input
                  value={form[key]}
                  onChange={(e) => setForm((prev) => ({ ...prev, [key]: e.target.value }))}
                  placeholder={t(lang, labelKey)}
                />
              </div>
            ))}
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.isDefault}
              onChange={(e) => setForm((prev) => ({ ...prev, isDefault: e.target.checked }))}
              className="size-4 rounded border-border"
            />
            {t(lang, "setDefault")}
          </label>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <div className="flex gap-2">
            <Button size="sm" onClick={() => void handleSave()} disabled={saving}>
              {saving ? <Loader2 className="mr-1.5 size-3.5 animate-spin" /> : <Check className="mr-1.5 size-3.5" />}
              {t(lang, "save")}
            </Button>
            <Button size="sm" variant="ghost" onClick={resetForm} disabled={saving}>
              <X className="mr-1.5 size-3.5" />
              {t(lang, "cancel")}
            </Button>
          </div>
        </div>
      )}

      {/* Address list */}
      {loading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="size-5 animate-spin text-muted-foreground" />
        </div>
      ) : addresses.length === 0 && !showForm ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-border/40 bg-card py-10 text-center">
          <div className="flex size-12 items-center justify-center rounded-xl bg-muted">
            <MapPin className="size-6 text-muted-foreground/50" />
          </div>
          <p className="text-sm text-muted-foreground">{t(lang, "noAddresses")}</p>
          <Button
            size="sm"
            variant="outline"
            onClick={() => { resetForm(); setShowForm(true); }}
            className="gap-1.5"
          >
            <Plus className="size-3.5" />
            {t(lang, "addAddress")}
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {addresses.map((addr) => (
            <div key={addr.id} className="rounded-xl border border-border/40 bg-card p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-h5">{addr.label || addr.fullName}</span>
                    {addr.isDefault && (
                      <Badge variant="secondary" className="text-xs text-emerald-600 dark:text-emerald-400">
                        {t(lang, "defaultAddress")}
                      </Badge>
                    )}
                  </div>
                  {addr.label && (
                    <p className="text-sm text-foreground">{addr.fullName}</p>
                  )}
                  {addr.phone && <p className="text-meta">{addr.phone}</p>}
                  <p className="mt-1 text-meta">
                    {addr.addressLine}
                    {addr.district ? `, ${addr.district}` : ""}
                    {`, ${addr.province} ${addr.postalCode}`}
                  </p>
                </div>
                <div className="flex shrink-0 gap-1">
                  {!addr.isDefault && (
                    <Button
                      size="icon-sm"
                      variant="ghost"
                      onClick={() => void handleSetDefault(addr.id)}
                      title={t(lang, "setDefault")}
                    >
                      <Star className="size-3.5" />
                    </Button>
                  )}
                  <Button
                    size="icon-sm"
                    variant="ghost"
                    onClick={() => startEdit(addr)}
                    title={t(lang, "editAddress")}
                  >
                    <Pencil className="size-3.5" />
                  </Button>
                  <Button
                    size="icon-sm"
                    variant="ghost"
                    onClick={() => void handleDelete(addr.id)}
                    className="text-destructive hover:text-destructive"
                    title={t(lang, "deleteAddress")}
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
