"use client"

import { Flame, HelpCircle } from "lucide-react"
import { Popover } from "@base-ui/react/popover"
import { cn } from "@/lib/utils"
import type { Language } from "@/lib/i18n"

const STREAK_TIERS = [
  { min: 1, max: 6, mult: 1, pts: 10 },
  { min: 7, max: 29, mult: 2, pts: 20 },
  { min: 30, max: Infinity, mult: 3, pts: 30 },
] as const

function getStreakTier(streak: number) {
  if (streak >= 30) return 2
  if (streak >= 7) return 1
  return 0
}

function dayLabel(lang: Language, n: number) {
  if (lang === "TH") return `${n} วัน`
  if (lang === "JP") return `${n}日`
  return n === 1 ? `${n} day` : `${n} days`
}

function perDayUnit(lang: Language) {
  if (lang === "TH") return "/วัน"
  if (lang === "JP") return "/日"
  return "/day"
}

type Props = {
  streak: number
  lang: Language
  variant: "compact" | "expanded"
  className?: string
}

export function StreakTierIndicator({ streak, lang, variant, className }: Props) {
  const tierIdx = getStreakTier(streak)
  const currentTier = STREAK_TIERS[tierIdx]

  if (variant === "compact") {
    return <CompactStreak streak={streak} lang={lang} tierIdx={tierIdx} currentTier={currentTier} className={className} />
  }
  return <ExpandedStreak streak={streak} lang={lang} tierIdx={tierIdx} className={className} />
}

/* ------------------------------------------------------------------ */
/*  Compact: home page bar                                             */
/* ------------------------------------------------------------------ */

function CompactStreak({
  streak, lang, tierIdx, currentTier, className,
}: {
  streak: number
  lang: Language
  tierIdx: number
  currentTier: typeof STREAK_TIERS[number]
  className?: string
}) {
  const streakText = lang === "TH"
    ? `${streak} วัน`
    : lang === "JP"
      ? `${streak}日`
      : streak === 1 ? `${streak} day` : `${streak} days`

  const rewardText = `+${currentTier.pts} 🍯${perDayUnit(lang)}`

  return (
    <div className={cn("flex items-center gap-1.5", className)}>
      <Flame className={cn("size-3.5 shrink-0", tierIdx >= 1 ? "text-orange-500" : "text-muted-foreground")} />
      <span className="text-[11px] font-bold tabular-nums">{streakText}</span>
      <span className="text-[11px] font-semibold text-muted-foreground">{rewardText}</span>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Expanded: honey page — compact streak display                      */
/* ------------------------------------------------------------------ */

function ExpandedStreak({
  streak, lang, tierIdx, className,
}: {
  streak: number
  lang: Language
  tierIdx: number
  className?: string
}) {
  const currentTier = STREAK_TIERS[tierIdx]

  const streakLabel = lang === "TH"
    ? "เช็คอินติดต่อกัน"
    : lang === "JP"
      ? "連続チェックイン"
      : "Check-in streak"

  return (
    <div className={cn("flex flex-wrap items-center gap-x-2 gap-y-1", className)}>
      <Flame className={cn("size-4 shrink-0", tierIdx >= 1 ? "text-orange-500" : "text-muted-foreground")} />
      <span className="text-xs font-medium text-muted-foreground">{streakLabel}</span>
      <span className="text-lg font-black tabular-nums leading-none">{streak}</span>
      <span className="text-xs font-semibold text-muted-foreground">
        {lang === "TH" ? "วัน" : lang === "JP" ? "日" : streak === 1 ? "day" : "days"}
      </span>
      <span className={cn(
        "ml-auto rounded px-1.5 py-0.5 text-xs font-bold tabular-nums whitespace-nowrap",
        tierIdx >= 2 ? "bg-amber-500/15 text-amber-600 dark:text-amber-400"
          : tierIdx >= 1 ? "bg-primary/10 text-primary"
          : "bg-muted text-muted-foreground",
      )}>
        <span className="hidden sm:inline">{lang === "TH" ? "ขณะนี้ได้รับ " : lang === "JP" ? "現在の獲得 " : "Earning "}</span>+{currentTier.pts} 🍯{perDayUnit(lang)}
      </span>
      <StreakInfoPopover lang={lang} />
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Info popover: explains streak system                               */
/* ------------------------------------------------------------------ */

function StreakInfoPopover({ lang }: { lang: Language }) {
  const title = lang === "TH" ? "สตรีคคืออะไร?"
    : lang === "JP" ? "ストリークとは？"
    : "What is a streak?"

  const desc = lang === "TH"
    ? "เช็คอินทุกวันติดต่อกันเพื่อรับ Honey เพิ่มขึ้น หยุด 1 วันสตรีคจะรีเซ็ต"
    : lang === "JP"
      ? "毎日連続チェックインでボーナスが増えます。1日休むとリセットされます"
      : "Check in daily to earn more Honey. Missing a day resets your streak."

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
            <p className="mb-2 text-xs font-semibold text-foreground">{title}</p>
            <div className="space-y-1.5">
              {STREAK_TIERS.map((tier, i) => (
                <div key={i} className="flex items-center gap-2 rounded-md px-2 py-1 text-xs">
                  <span className={cn(
                    "flex size-5 shrink-0 items-center justify-center rounded-full text-xs font-black",
                    i === 0 ? "bg-muted text-muted-foreground" : i === 1 ? "bg-primary/10 text-primary" : "bg-amber-500/15 text-amber-600 dark:text-amber-400",
                  )}>
                    {tier.mult}x
                  </span>
                  <span className="flex-1 text-muted-foreground">
                    {i === 0
                      ? (lang === "TH" ? "เริ่มต้น" : lang === "JP" ? "初日から" : "Day 1+")
                      : `${dayLabel(lang, tier.min)}+`}
                  </span>
                  <span className="font-semibold tabular-nums text-foreground">
                    +{tier.pts} 🍯
                  </span>
                </div>
              ))}
            </div>
            <p className="mt-2 border-t pt-2 text-xs text-muted-foreground">{desc}</p>
            <Popover.Arrow className="size-2.5 translate-y-[calc(-50%-2px)] rotate-45 rounded-[2px] border bg-background data-[side=bottom]:top-1 data-[side=top]:-bottom-2.5" />
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  )
}
