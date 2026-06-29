"use client";

import Image from "next/image";
import Link from "next/link";
import {
  ArrowDown,
  ArrowUp,
  CircleAlert,
  CircleCheck,
  Globe,
  Mail,
  MessageCircle,
  Pencil,
  RotateCcw,
  Trash2,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Surface } from "@/components/ui/surface";
import type { PriceAlertItem } from "@/components/alerts/alert-types";
import { useUIStore } from "@/stores/ui-store";
import { BLUR_DATA_URL } from "@/lib/constants/ui";
import { getCardName, getLocale, t, type Language } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { formatByCurrency } from "@/lib/utils/currency";

export type FeedbackKind = "saved" | "reactivated" | "error";

export function AlertRow({
  alert,
  feedback,
  busy,
  onEdit,
  onDelete,
  onReactivate,
}: {
  alert: PriceAlertItem;
  feedback: FeedbackKind | null;
  busy: boolean;
  onEdit?: () => void;
  onDelete: () => void;
  onReactivate?: () => void;
}) {
  const lang = useUIStore((s) => s.language);
  const currency = useUIStore((s) => s.currency);
  const cardName = getCardName(lang, alert.card);
  const target = formatByCurrency(alert.targetPrice, currency).primary;
  const current =
    alert.card.latestPriceJpy != null
      ? formatByCurrency(alert.card.latestPriceJpy, currency).primary
      : null;

  const dirIsAbove = alert.direction === "ABOVE";
  const directionTone = dirIsAbove ? "text-price-up" : "text-price-down";
  const directionBg = dirIsAbove ? "bg-price-up/10" : "bg-price-down/10";
  const operator = dirIsAbove ? "≥" : "≤";
  const DirectionIcon = dirIsAbove ? ArrowUp : ArrowDown;

  const channelEntries: Array<{
    key: string;
    label: string;
    Icon: LucideIcon;
  }> = (alert.channels.length > 0 ? alert.channels : ["EMAIL"]).map((c) => {
    if (c === "LINE") return { key: c, label: t(lang, "alertChannelLine"), Icon: MessageCircle };
    if (c === "PUSH") return { key: c, label: t(lang, "alertChannelWeb"), Icon: Globe };
    return { key: c, label: t(lang, "alertChannelEmail"), Icon: Mail };
  });

  return (
    <Surface
      variant="outline"
      className={cn(
        "p-4 motion-base",
        alert.isActive ? "" : "bg-muted/20",
      )}
    >
      <div className="flex gap-3 sm:gap-4">
        {/* Card image — preserves card aspect ratio (63:88 portrait) */}
        <Link
          href={`/cards/${alert.card.cardCode}`}
          className="relative aspect-[63/88] w-12 shrink-0 overflow-hidden rounded-md bg-muted sm:w-14"
        >
          {alert.card.imageUrl ? (
            <Image
              src={alert.card.imageUrl}
              alt={cardName}
              fill
              sizes="56px"
              className="object-contain"
              placeholder="blur"
              blurDataURL={BLUR_DATA_URL}
            />
          ) : null}
        </Link>

        <div className="min-w-0 flex-1">
          {/* Title + actions row */}
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <Link
                href={`/cards/${alert.card.cardCode}`}
                className="block truncate text-sm font-semibold hover:underline"
              >
                {cardName}
              </Link>
              <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-meta text-muted-foreground/70">
                <span>{alert.card.cardCode}</span>
                {!alert.isActive && (
                  <Badge variant="secondary" className="h-4 px-1.5 text-micro">
                    {t(lang, "alertTriggered")}
                  </Badge>
                )}
                <FeedbackPill feedback={feedback} />
              </div>
            </div>

            {/* Actions */}
            <div className="-mr-1 -mt-1 flex shrink-0 items-center">
              {onEdit && (
                <Button
                  size="icon-sm"
                  variant="ghost"
                  className="text-muted-foreground hover:text-foreground"
                  disabled={busy}
                  onClick={onEdit}
                  title={t(lang, "edit")}
                  aria-label={t(lang, "edit")}
                >
                  <Pencil className="size-3.5" />
                </Button>
              )}
              {onReactivate && (
                <Button
                  size="icon-sm"
                  variant="ghost"
                  className="text-muted-foreground hover:text-foreground"
                  disabled={busy}
                  onClick={onReactivate}
                  title={t(lang, "reactivate")}
                  aria-label={t(lang, "reactivate")}
                >
                  <RotateCcw className="size-3.5" />
                </Button>
              )}
              <Button
                size="icon-sm"
                variant="ghost"
                className="text-muted-foreground hover:text-destructive"
                disabled={busy}
                onClick={onDelete}
                title={t(lang, "delete")}
                aria-label={t(lang, "delete")}
              >
                <Trash2 className="size-3.5" />
              </Button>
            </div>
          </div>

          {/* Trigger condition — primary info */}
          <div className="mt-2 flex items-baseline gap-2">
            <span
              className={cn(
                "inline-flex size-5 shrink-0 items-center justify-center rounded-full",
                directionBg,
                directionTone,
              )}
              aria-hidden
            >
              <DirectionIcon className="size-3" strokeWidth={2.5} />
            </span>
            <span className="text-eyebrow shrink-0 text-muted-foreground">
              {t(lang, "alertTargetLabel")}
            </span>
            <span className="text-base font-semibold tabular-nums leading-none text-foreground">
              {operator} {target}
            </span>
          </div>

          {/* Supporting info — current price + channels */}
          <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-meta text-muted-foreground">
            {current != null && (
              <span>
                {t(lang, "alertNowLabel")}{" "}
                <span className="font-medium text-foreground tabular-nums">{current}</span>
              </span>
            )}
            {current != null && channelEntries.length > 0 && (
              <span aria-hidden className="text-muted-foreground/30">·</span>
            )}
            {channelEntries.map(({ key, label, Icon }) => (
              <span key={key} className="inline-flex items-center gap-1">
                <Icon className="size-3" />
                {label}
              </span>
            ))}
            {!alert.isActive && alert.triggeredAt && (
              <>
                <span aria-hidden className="text-muted-foreground/30">·</span>
                <span className="text-muted-foreground/70">
                  {t(lang, "alertTriggeredOn")}: {formatTriggeredAt(alert.triggeredAt, lang)}
                </span>
              </>
            )}
          </div>
        </div>
      </div>
    </Surface>
  );
}

function FeedbackPill({ feedback }: { feedback: FeedbackKind | null }) {
  const lang = useUIStore((s) => s.language);
  if (!feedback) return null;
  if (feedback === "error") {
    return (
      <span className="inline-flex animate-in fade-in zoom-in-95 items-center gap-1 rounded-full bg-destructive/10 px-2 py-0.5 text-micro text-destructive">
        <CircleAlert className="size-3" />
        {t(lang, "saveFailed")}
      </span>
    );
  }
  const label =
    feedback === "reactivated"
      ? t(lang, "alertReactivated")
      : t(lang, "alertUpdated");
  return (
    <span className="inline-flex animate-in fade-in zoom-in-95 items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-micro text-emerald-600 dark:text-emerald-400">
      <CircleCheck className="size-3" />
      {label}
    </span>
  );
}

function formatTriggeredAt(iso: string, lang: Language): string {
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleDateString(getLocale(lang), {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}
