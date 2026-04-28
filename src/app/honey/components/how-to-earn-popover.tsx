"use client";

import {
  Calendar,
  ClipboardList,
  ShoppingBag,
  Star,
  Ticket,
  Users,
} from "lucide-react";
import { t, type Language } from "@/lib/i18n";

const EARN_METHODS = [
  { icon: Calendar, labelKey: "honeyEarnCheckin" as const, reward: "10–30 pt" },
  { icon: ClipboardList, labelKey: "honeyEarnMissions" as const, reward: "5–10 pt" },
  { icon: ShoppingBag, labelKey: "honeyEarnSell" as const, reward: "10 pt" },
  { icon: Star, labelKey: "honeyEarnReview" as const, reward: "15 pt" },
  { icon: Users, labelKey: "honeyEarnRefer" as const, reward: "50 pt" },
];

const USE_METHODS = [
  { icon: ShoppingBag, labelKey: "honeyUseShop" as const },
  { icon: Ticket, labelKey: "honeyUseBuyTicket" as const },
];

/**
 * Popup body for the Honey card guide. Rendered inside `Popover.Popup` by the
 * stat card itself — the trigger (entire card) and chrome (Root/Portal/Arrow)
 * live in the parent component.
 */
export function HowToEarnGuideContent({ lang }: { lang: Language }) {
  return (
    <>
      <p className="mb-2 text-xs font-semibold text-foreground">
        {t(lang, "howToEarn")}
      </p>
      <div className="space-y-1.5">
        {EARN_METHODS.map(({ icon: Icon, labelKey, reward }) => (
          <div
            key={labelKey}
            className="flex items-center gap-2 rounded-md px-2 py-1 text-meta"
          >
            <Icon className="size-3.5 shrink-0" />
            <span className="flex-1">{t(lang, labelKey)}</span>
            <span className="tabular-nums text-foreground">{reward}</span>
          </div>
        ))}
      </div>

      <p className="mb-2 mt-3 border-t pt-2 text-xs font-semibold text-foreground">
        {t(lang, "howToUseHoney")}
      </p>
      <div className="space-y-1.5">
        {USE_METHODS.map(({ icon: Icon, labelKey }) => (
          <div
            key={labelKey}
            className="flex items-center gap-2 rounded-md px-2 py-1 text-meta"
          >
            <Icon className="size-3.5 shrink-0" />
            <span className="flex-1">{t(lang, labelKey)}</span>
          </div>
        ))}
      </div>
    </>
  );
}
