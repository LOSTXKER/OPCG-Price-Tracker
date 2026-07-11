"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { apiPost } from "@/lib/api/client";
import { Button } from "@/components/ui/button";
import { MakeOfferDialog } from "@/components/messages/make-offer-dialog";
import { ClipboardPlus, HandCoins } from "lucide-react";
import { t } from "@/lib/i18n";
import { useUIStore } from "@/stores/ui-store";
import { toast } from "sonner";

interface ListingActionButtonsProps {
  listingId: number;
  priceThb: number;
  marketPriceThb?: number | null;
}

export function ListingActionButtons({
  listingId,
  priceThb,
  marketPriceThb,
}: ListingActionButtonsProps) {
  const router = useRouter();
  const lang = useUIStore((s) => s.language);
  const [offerOpen, setOfferOpen] = useState(false);
  const [buying, setBuying] = useState(false);

  const handleBuyNow = async () => {
    setBuying(true);
    try {
      await apiPost("/api/orders", { listingId });
      router.push(`/messages/${listingId}`);
    } catch {
      toast.error(t(lang, "mktCreateGenericError"));
    } finally {
      setBuying(false);
    }
  };

  const handleMakeOffer = async (price: number, note: string): Promise<boolean> => {
    try {
      await apiPost("/api/offers", {
        listingId,
        priceThb: price,
        note: note || undefined,
      });
      router.push(`/messages/${listingId}`);
      return true;
    } catch {
      toast.error(t(lang, "offerFailed"));
      return false;
    }
  };

  return (
    <>
      <Button
        variant="outline"
        size="lg"
        className="gap-2"
        onClick={handleBuyNow}
        disabled={buying}
      >
        <ClipboardPlus className="size-4" />
        {buying ? t(lang, "mktActionsBuying") : t(lang, "mktActionsBuyNow")}
      </Button>
      <Button
        variant="secondary"
        size="lg"
        className="gap-2"
        onClick={() => setOfferOpen(true)}
      >
        <HandCoins className="size-4" />
        {t(lang, "mktActionsMakeOffer")}
      </Button>
      <MakeOfferDialog
        open={offerOpen}
        onOpenChange={setOfferOpen}
        listingPrice={priceThb}
        marketPrice={marketPriceThb ?? null}
        onSubmit={handleMakeOffer}
      />
      <p className="text-meta sm:col-span-2">
        {t(lang, "mktActionsBuyFlowHint")}
      </p>
    </>
  );
}
