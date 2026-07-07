"use client";

import { useState } from "react";
import { Loader2, Plus, Search } from "lucide-react";

import { CardThumb } from "@/components/admin/matching-ui";
import { AdminDialog } from "@/components/admin/admin-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { adminFetch } from "@/lib/admin/admin-fetch";
import { PriceTag } from "./match-ui";

export function AddCardDialog({
  open,
  onClose,
  onAdded,
}: {
  open: boolean;
  onClose: () => void;
  onAdded: () => void;
}) {
  const [idInput, setIdInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [preview, setPreview] = useState<{
    name: string;
    productNumber: string;
    psa10MinPriceUsd: number | null;
    psa10LastSoldUsd: number | null;
    lastSoldUsd: number | null;
    thumbnailUrl: string | null;
  } | null>(null);

  const handleLookup = async () => {
    const id = parseInt(idInput.trim(), 10);
    if (!id) return;
    setBusy(true);
    setError("");
    setPreview(null);
    try {
      const json = await adminFetch<{
        data: {
          summary: {
            name: string;
            productNumber: string;
            thumbnailUrl: string | null;
          };
          psa10MinPriceUsd: number | null;
          psa10LastSoldUsd: number | null;
          lastSoldUsd: number | null;
        };
      }>(`/api/admin/snkrdunk-matching?lookup=${id}`);
      setPreview({
        name: json.data.summary.name,
        productNumber: json.data.summary.productNumber,
        psa10MinPriceUsd: json.data.psa10MinPriceUsd,
        psa10LastSoldUsd: json.data.psa10LastSoldUsd,
        lastSoldUsd: json.data.lastSoldUsd,
        thumbnailUrl: json.data.summary.thumbnailUrl,
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "ไม่สำเร็จ");
    }
    setBusy(false);
  };

  const handleAdd = async () => {
    const id = parseInt(idInput.trim(), 10);
    if (!id) return;
    setBusy(true);
    setError("");
    try {
      await adminFetch("/api/admin/snkrdunk-matching", {
        method: "POST",
        body: { snkrdunkId: id },
      });
      onAdded();
      onClose();
      setIdInput("");
      setPreview(null);
    } catch (e) {
      // A 409 ("Already exists") is treated as success — the mapping is already present.
      if (e instanceof Error && e.message === "Already exists") {
        onAdded();
        onClose();
        setIdInput("");
        setPreview(null);
      } else {
        setError(e instanceof Error ? e.message : "ไม่สำเร็จ");
      }
    }
    setBusy(false);
  };

  return (
    <AdminDialog
      open={open}
      onOpenChange={(v) => {
        if (!v) onClose();
      }}
      size="md"
      title="เพิ่มการ์ดจาก SNKRDUNK"
      description={
        <>
          ใส่ SNKRDUNK ID (เลขตอนท้าย URL เช่น{" "}
          <code className="rounded-sm bg-muted px-1">94915</code> จาก{" "}
          <code className="rounded-sm bg-muted px-1">
            snkrdunk.com/en/trading-cards/94915
          </code>
          )
        </>
      }
    >
      <div className="space-y-4">
        <div className="flex gap-2">
          <Input
            type="text"
            value={idInput}
            onChange={(e) => setIdInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleLookup()}
            placeholder="SNKRDUNK ID เช่น 94915"
            className="flex-1"
          />
          <Button
            type="button"
            onClick={handleLookup}
            disabled={busy || !idInput.trim()}
          >
            {busy ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Search className="size-4" />
            )}
            ค้นหา
          </Button>
        </div>

        {error && <p className="text-xs text-danger">{error}</p>}

        {preview && (
          <div className="rounded-xl border border-transparent dark:border-hair bg-muted/20 p-4">
            <div className="flex gap-3">
              <CardThumb src={preview.thumbnailUrl} size="md" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold leading-tight">
                  {preview.name}
                </p>
                <p className="mt-1 font-mono text-xs text-muted-foreground">
                  {preview.productNumber}
                </p>
                <div className="mt-2 flex flex-wrap gap-3">
                  <PriceTag
                    label="PSA10 ราคาขาย"
                    value={preview.psa10MinPriceUsd}
                    highlight
                  />
                  <PriceTag
                    label="PSA10 ขายแล้ว"
                    value={preview.psa10LastSoldUsd}
                  />
                  <PriceTag
                    label="ขายล่าสุด"
                    value={preview.lastSoldUsd}
                  />
                </div>
              </div>
            </div>

            <Button
              type="button"
              onClick={handleAdd}
              disabled={busy}
              className="mt-4 w-full"
            >
              {busy ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Plus className="size-4" />
              )}
              เพิ่มเข้ารายการจับคู่
            </Button>
          </div>
        )}
      </div>
    </AdminDialog>
  );
}
