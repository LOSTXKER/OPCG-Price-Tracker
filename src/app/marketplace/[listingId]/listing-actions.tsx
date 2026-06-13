"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { apiPost, apiTry } from "@/lib/api/client";
import { Button } from "@/components/ui/button";
import { MakeOfferDialog } from "@/components/messages/make-offer-dialog";
import { ShoppingCart, HandCoins } from "lucide-react";

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
  const [offerOpen, setOfferOpen] = useState(false);
  const [buying, setBuying] = useState(false);

  const handleBuyNow = async () => {
    setBuying(true);
    try {
      const ok = await apiTry(apiPost("/api/orders", { listingId }));
      if (ok !== null) {
        router.push(`/messages/${listingId}`);
      }
    } finally {
      setBuying(false);
    }
  };

  const handleMakeOffer = async (price: number, note: string) => {
    const ok = await apiTry(
      apiPost("/api/offers", { listingId, priceThb: price, note: note || undefined }),
    );
    if (ok !== null) {
      router.push(`/messages/${listingId}`);
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
        <ShoppingCart className="size-4" />
        {buying ? "กำลังสั่งซื้อ..." : "ซื้อตามราคา"}
      </Button>
      <Button
        variant="secondary"
        size="lg"
        className="gap-2"
        onClick={() => setOfferOpen(true)}
      >
        <HandCoins className="size-4" />
        เสนอราคา
      </Button>
      <MakeOfferDialog
        open={offerOpen}
        onOpenChange={setOfferOpen}
        listingPrice={priceThb}
        marketPrice={marketPriceThb ?? null}
        onSubmit={handleMakeOffer}
      />
    </>
  );
}
