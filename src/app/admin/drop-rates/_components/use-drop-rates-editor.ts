"use client";

import { useCallback, useMemo, useState } from "react";
import { toast } from "sonner";

import { adminFetch } from "@/lib/admin/admin-fetch";
import type { RateEdits, SetData } from "./types";

/**
 * The per-set rate-editing state machine: tracks the in-progress edits vs the
 * saved originals, dirty/saving status, and the single-row + whole-set saves.
 * Only one set is expanded at a time, so a single shared editor is reset via
 * `initEdit` whenever a set is opened.
 */
export function useDropRatesEditor() {
  const [editRates, setEditRates] = useState<RateEdits>({});
  const [originalRates, setOriginalRates] = useState<RateEdits>({});
  const [saving, setSaving] = useState<string | null>(null);
  const [saved, setSaved] = useState<Set<string>>(new Set());
  const [savingAll, setSavingAll] = useState(false);

  function initEdit(set: SetData) {
    const rates: RateEdits = {};
    for (const dr of set.dropRates) {
      rates[dr.rarity] = {
        avgPerBox: dr.avgPerBox?.toString() ?? "",
        ratePerPack: dr.ratePerPack?.toString() ?? "",
      };
    }
    setEditRates(rates);
    setOriginalRates(rates);
    setSaved(new Set());
  }

  const isDirty = useCallback(
    (rarity: string) => {
      const edit = editRates[rarity];
      const orig = originalRates[rarity];
      if (!edit || !orig) return false;
      return (
        edit.avgPerBox !== orig.avgPerBox ||
        edit.ratePerPack !== orig.ratePerPack
      );
    },
    [editRates, originalRates],
  );

  const hasAnyDirty = useMemo(() => {
    return Object.keys(editRates).some((rarity) => isDirty(rarity));
  }, [editRates, isDirty]);

  function resetRate(rarity: string) {
    const orig = originalRates[rarity];
    if (!orig) return;
    setEditRates((prev) => ({ ...prev, [rarity]: { ...orig } }));
  }

  function resetAll() {
    setEditRates({ ...originalRates });
  }

  async function saveRate(setId: number, rarity: string, setCode: string) {
    const key = `${setId}-${rarity}`;
    setSaving(key);
    const rate = editRates[rarity];
    if (!rate) return;

    try {
      await adminFetch("/api/admin/drop-rates", {
        method: "PATCH",
        body: {
          setId,
          rarity,
          avgPerBox: rate.avgPerBox ? parseFloat(rate.avgPerBox) : null,
          ratePerPack: rate.ratePerPack ? parseFloat(rate.ratePerPack) : null,
        },
      });
      setSaved((prev) => new Set(prev).add(key));
      setOriginalRates((prev) => ({
        ...prev,
        [rarity]: { ...rate },
      }));
      toast.success(`${setCode} — บันทึก ${rarity} สำเร็จ`);
    } catch {
      toast.error(`${setCode} — บันทึก ${rarity} ไม่สำเร็จ`);
    } finally {
      setSaving(null);
    }
  }

  async function saveAllRates(set: SetData) {
    setSavingAll(true);

    const batch = set.dropRates
      .map((dr) => {
        const rate = editRates[dr.rarity];
        if (!rate) return null;
        return {
          setId: set.id,
          rarity: dr.rarity,
          avgPerBox: rate.avgPerBox ? parseFloat(rate.avgPerBox) : null,
          ratePerPack: rate.ratePerPack ? parseFloat(rate.ratePerPack) : null,
        };
      })
      .filter(Boolean);

    try {
      await adminFetch("/api/admin/drop-rates", {
        method: "PATCH",
        body: { batch },
      });

      const newSaved = new Set(saved);
      const newOriginals = { ...originalRates };
      for (const dr of set.dropRates) {
        const key = `${set.id}-${dr.rarity}`;
        newSaved.add(key);
        if (editRates[dr.rarity]) {
          newOriginals[dr.rarity] = { ...editRates[dr.rarity] };
        }
      }
      setSaved(newSaved);
      setOriginalRates(newOriginals);
      toast.success(
        `${set.code} — บันทึกทั้งหมด ${batch.length} รายการสำเร็จ`,
      );
    } catch {
      toast.error(`${set.code} — บันทึกไม่สำเร็จ`);
    } finally {
      setSavingAll(false);
    }
  }

  return {
    editRates,
    setEditRates,
    saving,
    saved,
    savingAll,
    hasAnyDirty,
    isDirty,
    initEdit,
    resetRate,
    resetAll,
    saveRate,
    saveAllRates,
  };
}

export type DropRatesEditor = ReturnType<typeof useDropRatesEditor>;
