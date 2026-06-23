"use client";

import { cn } from "@/lib/utils";
import { formatThb } from "@/lib/utils/currency";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, X, ArrowLeftRight } from "lucide-react";
import { t, type Language } from "@/lib/i18n";
import { useUIStore } from "@/stores/ui-store";
import type { ChatOffer } from "./types";

const statusVariant: Record<
  string,
  "default" | "secondary" | "destructive" | "outline"
> = {
  PENDING: "default",
  ACCEPTED: "default",
  REJECTED: "destructive",
  CANCELLED: "secondary",
  COUNTERED: "outline",
  EXPIRED: "secondary",
};

const statusLabelKey: Record<
  string,
  Parameters<typeof t>[1]
> = {
  PENDING: "msgOfferStatusPending",
  ACCEPTED: "msgOfferStatusAccepted",
  REJECTED: "msgOfferStatusRejected",
  CANCELLED: "msgOfferStatusCancelled",
  COUNTERED: "msgOfferStatusCountered",
  EXPIRED: "msgOfferStatusExpired",
};

function getStatusConfig(
  lang: Language,
  status: string
): { label: string; variant: "default" | "secondary" | "destructive" | "outline" } {
  const variant = statusVariant[status] ?? statusVariant.PENDING;
  const labelKey = statusLabelKey[status] ?? statusLabelKey.PENDING;
  return { label: t(lang, labelKey), variant };
}

interface OfferCardProps {
  offer: ChatOffer;
  currentUserId: string;
  onAccept?: (offerId: number) => void;
  onReject?: (offerId: number) => void;
  onCounter?: (offerId: number) => void;
}

export function OfferCard({
  offer,
  currentUserId,
  onAccept,
  onReject,
  onCounter,
}: OfferCardProps) {
  const lang = useUIStore((s) => s.language);
  const isSeller = offer.sellerId === currentUserId;
  const isBuyer = offer.buyerId === currentUserId;
  const isPending = offer.status === "PENDING";
  const config = getStatusConfig(lang, offer.status);

  return (
    <div
      className={cn(
        "rounded-lg border p-3 space-y-2",
        isPending
          ? "border-primary/30 bg-primary/5"
          : "border-border bg-muted/30"
      )}
    >
      <div className="flex items-center justify-between">
        <span className="text-meta">
          {isBuyer ? t(lang, "msgOfferYouOffered") : t(lang, "msgOfferReceived")}
        </span>
        <Badge variant={config.variant}>{config.label}</Badge>
      </div>

      <p className="text-lg font-bold tabular-nums">
        {formatThb(offer.priceThb)}
      </p>

      {offer.note && (
        <p className="text-meta">{offer.note}</p>
      )}

      {isPending && isSeller && (
        <div className="flex items-center gap-2 pt-1">
          <Button
            size="sm"
            className="flex-1 gap-1"
            onClick={() => onAccept?.(offer.id)}
          >
            <Check className="size-3.5" />
            {t(lang, "msgOfferAccept")}
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="gap-1"
            onClick={() => onCounter?.(offer.id)}
          >
            <ArrowLeftRight className="size-3.5" />
            {t(lang, "msgOfferCounter")}
          </Button>
          <Button
            size="sm"
            variant="destructive"
            className="gap-1"
            onClick={() => onReject?.(offer.id)}
          >
            <X className="size-3.5" />
          </Button>
        </div>
      )}
    </div>
  );
}
