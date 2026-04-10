"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface MakeOfferDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  listingPrice: number | null;
  marketPrice: number | null;
  onSubmit: (priceThb: number, note: string) => void;
  isCounter?: boolean;
  parentOfferId?: number;
}

export function MakeOfferDialog({
  open,
  onOpenChange,
  listingPrice,
  marketPrice,
  onSubmit,
  isCounter = false,
}: MakeOfferDialogProps) {
  const [price, setPrice] = useState("");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const priceNum = parseFloat(price);
  const isValid = !isNaN(priceNum) && priceNum > 0;

  const handleSubmit = async () => {
    if (!isValid) return;
    setSubmitting(true);
    try {
      await onSubmit(priceNum, note);
      setPrice("");
      setNote("");
      onOpenChange(false);
    } finally {
      setSubmitting(false);
    }
  };

  const quickPrices = marketPrice
    ? [
        { label: "-10%", value: Math.round(marketPrice * 0.9) },
        { label: "ราคาตลาด", value: Math.round(marketPrice) },
        { label: "-5%", value: Math.round(marketPrice * 0.95) },
      ]
    : listingPrice
      ? [
          { label: "-10%", value: Math.round(listingPrice * 0.9) },
          { label: "ราคาลง", value: Math.round(listingPrice) },
          { label: "-5%", value: Math.round(listingPrice * 0.95) },
        ]
      : [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>
            {isCounter ? "เสนอราคากลับ" : "เสนอราคา"}
          </DialogTitle>
          <DialogDescription>
            {listingPrice != null && (
              <>ราคาลงขาย: ฿{listingPrice.toLocaleString()}</>
            )}
            {marketPrice != null && (
              <> · ราคาตลาด: ฿{marketPrice.toLocaleString()}</>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-xs font-medium">
              ราคาที่ต้องการ (บาท)
            </label>
            <Input
              type="number"
              min="1"
              step="1"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="0"
              className="text-lg font-bold"
            />
          </div>

          {quickPrices.length > 0 && (
            <div className="flex gap-1.5">
              {quickPrices.map((qp) => (
                <Button
                  key={qp.label}
                  variant="outline"
                  size="xs"
                  onClick={() => setPrice(String(qp.value))}
                >
                  {qp.label}
                </Button>
              ))}
            </div>
          )}

          <div>
            <label className="mb-1 block text-xs font-medium">
              หมายเหตุ (ไม่บังคับ)
            </label>
            <Input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="เช่น สนใจซื้อ 2 ใบ ลดได้ไหม"
            />
          </div>
        </div>

        <DialogFooter>
          <Button onClick={handleSubmit} disabled={!isValid || submitting}>
            {submitting ? "กำลังส่ง..." : isCounter ? "เสนอราคากลับ" : "ส่งข้อเสนอ"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
