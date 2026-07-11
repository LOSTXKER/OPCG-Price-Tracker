"use client";

import { useId, useState } from "react";
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
import { formatThb } from "@/lib/utils/currency";
import { t } from "@/lib/i18n";
import { useUIStore } from "@/stores/ui-store";

interface MakeOfferDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  listingPrice: number | null;
  marketPrice: number | null;
  onSubmit: (priceThb: number, note: string) => Promise<boolean>;
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
  const lang = useUIStore((s) => s.language);
  const [price, setPrice] = useState("");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const priceId = useId();
  const noteId = useId();

  const priceNum = parseFloat(price);
  const isValid = !isNaN(priceNum) && priceNum > 0;

  const handleSubmit = async () => {
    if (!isValid) return;
    setSubmitting(true);
    try {
      const submitted = await onSubmit(priceNum, note);
      if (!submitted) return;
      setPrice("");
      setNote("");
      onOpenChange(false);
    } finally {
      setSubmitting(false);
    }
  };

  const quickPrices = marketPrice
    ? [
        { key: "-10%", label: "-10%", value: Math.round(marketPrice * 0.9) },
        { key: "market", label: t(lang, "msgOfferQuickMarket"), value: Math.round(marketPrice) },
        { key: "-5%", label: "-5%", value: Math.round(marketPrice * 0.95) },
      ]
    : listingPrice
      ? [
          { key: "-10%", label: "-10%", value: Math.round(listingPrice * 0.9) },
          { key: "listing", label: t(lang, "msgOfferQuickListing"), value: Math.round(listingPrice) },
          { key: "-5%", label: "-5%", value: Math.round(listingPrice * 0.95) },
        ]
      : [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>
            {isCounter ? t(lang, "msgOfferTitleCounter") : t(lang, "msgOfferTitle")}
          </DialogTitle>
          <DialogDescription>
            {listingPrice != null && (
              <>{t(lang, "msgOfferListingPrice").replace("{n}", formatThb(listingPrice))}</>
            )}
            {marketPrice != null && (
              <>{t(lang, "msgOfferMarketPrice").replace("{n}", formatThb(marketPrice))}</>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div>
            <label htmlFor={priceId} className="mb-1 block text-label">
              {t(lang, "msgOfferPriceLabel")}
            </label>
            <Input
              id={priceId}
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
                  key={qp.key}
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
            <label htmlFor={noteId} className="mb-1 block text-label">
              {t(lang, "msgOfferNoteLabel")}
            </label>
            <Input
              id={noteId}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={t(lang, "msgOfferNotePlaceholder")}
            />
          </div>
        </div>

        <DialogFooter>
          <Button onClick={handleSubmit} disabled={!isValid || submitting}>
            {submitting ? t(lang, "msgOfferSubmitting") : isCounter ? t(lang, "msgOfferTitleCounter") : t(lang, "msgOfferSubmit")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
