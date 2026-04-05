"use client";

import {
  Calendar,
  ClipboardList,
  HelpCircle,
  ShoppingBag,
  Star,
  Users,
} from "lucide-react";
import { Popover } from "@base-ui/react/popover";
import { t, type Language } from "@/lib/i18n";

const EARN_METHODS = [
  { icon: Calendar, labelKey: "honeyEarnCheckin" as const, reward: "10–30 pt" },
  { icon: ClipboardList, labelKey: "honeyEarnMissions" as const, reward: "5–10 pt" },
  { icon: ShoppingBag, labelKey: "honeyEarnSell" as const, reward: "10 pt" },
  { icon: Star, labelKey: "honeyEarnReview" as const, reward: "15 pt" },
  { icon: Users, labelKey: "honeyEarnRefer" as const, reward: "50 pt" },
];

export function HowToEarnPopover({ lang }: { lang: Language }) {
  return (
    <Popover.Root>
      <Popover.Trigger
        className="inline-flex size-5 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
      >
        <HelpCircle className="size-3.5" />
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Positioner side="bottom" sideOffset={6} align="center" className="z-50">
          <Popover.Popup className="w-56 rounded-lg border bg-background p-3 shadow-lg data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95">
            <p className="mb-2 text-xs font-semibold text-foreground">
              {t(lang, "howToEarn")}
            </p>
            <div className="space-y-1.5">
              {EARN_METHODS.map(({ icon: Icon, labelKey, reward }) => (
                <div
                  key={labelKey}
                  className="flex items-center gap-2 rounded-md px-2 py-1 text-xs text-muted-foreground"
                >
                  <Icon className="size-3.5 shrink-0" />
                  <span className="flex-1">{t(lang, labelKey)}</span>
                  <span className="tabular-nums text-foreground">{reward}</span>
                </div>
              ))}
            </div>
            <Popover.Arrow className="size-2.5 translate-y-[calc(-50%-2px)] rotate-45 rounded-[2px] border bg-background data-[side=bottom]:top-1 data-[side=top]:-bottom-2.5" />
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  );
}
