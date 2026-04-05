"use client"

import { Flame, HelpCircle, Lock } from "lucide-react"
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

function perDayLabel(lang: Language, pts: number) {
  if (lang === "TH") return `+${pts}/วัน`
  if (lang === "JP") return `+${pts}/日`
  return `+${pts}/day`
}

function perDayUnit(lang: Language) {
  if (lang === "TH") return "/วัน"
  if (lang === "JP") return "/日"
  return "/day"
}

function nextTierBadge(lang: Language, daysLeft: number | null, nextPts: number) {
  if (daysLeft === null) {
    if (lang === "TH") return `สูงสุด 🍯${nextPts}/วัน`
    if (lang === "JP") return `最大 🍯${nextPts}/日`
    return `Max 🍯${nextPts}/day`
  }
  if (lang === "TH") return `อีก ${daysLeft} วัน → 🍯${nextPts}`
  if (lang === "JP") return `あと${daysLeft}日 → 🍯${nextPts}`
  return `${daysLeft} days → 🍯${nextPts}`
}

function startingLabel(lang: Language) {
  if (lang === "TH") return "เริ่มต้น"
  if (lang === "JP") return "初日から"
  return "Day 1"
}

function consecutiveLabel(lang: Language, days: number) {
  if (lang === "TH") return `เช็คอินครบ ${days} วัน`
  if (lang === "JP") return `${days}日チェックイン`
  return `${days}-day streak`
}

function dayRangeLabel(lang: Language, from: number, to: number | null) {
  if (lang === "TH") return to ? `${from}-${to} วัน` : `${from}+ วัน`
  if (lang === "JP") return to ? `${from}-${to}日` : `${from}日+`
  return to ? `${from}-${to} days` : `${from}+ days`
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
  const isMax = tierIdx >= 2
  const target = isMax ? 30 : STREAK_TIERS[tierIdx + 1].min
  const fillPct = isMax ? 100 : Math.min(streak / target * 100, 100)

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
      <span className="text-[9px] font-semibold text-muted-foreground">{rewardText}</span>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Expanded: honey page / profile page — progress bar design          */
/* ------------------------------------------------------------------ */

const MAX_STREAK_DAYS = 30

function ExpandedStreak({
  streak, lang, tierIdx, className,
}: {
  streak: number
  lang: Language
  tierIdx: number
  className?: string
}) {
  const fillPct = Math.min(Math.max(streak, 0), MAX_STREAK_DAYS) / MAX_STREAK_DAYS * 100
  const currentTier = STREAK_TIERS[tierIdx]

  const streakLabel = lang === "TH"
    ? "เช็คอินติดต่อกัน"
    : lang === "JP"
      ? "連続チェックイン"
      : "Check-in streak"

  const T1_PCT = (7 / MAX_STREAK_DAYS) * 100

  return (
    <div className={cn("space-y-2.5", className)}>
      {/* Header */}
      <div className="flex items-center gap-2">
        <Flame className={cn("size-4 shrink-0", tierIdx >= 1 ? "text-orange-500" : "text-muted-foreground")} />
        <span className="text-xs font-medium text-muted-foreground">{streakLabel}</span>
        <span className="text-lg font-black tabular-nums leading-none">{streak}</span>
        <span className="text-xs font-semibold text-muted-foreground">
          {lang === "TH" ? "วัน" : lang === "JP" ? "日" : streak === 1 ? "day" : "days"}
        </span>
        {/* Badge: current honey rate */}
        <span className={cn(
          "ml-auto rounded px-1.5 py-0.5 text-[10px] font-bold tabular-nums",
          tierIdx >= 2 ? "bg-amber-500/15 text-amber-600 dark:text-amber-400"
            : tierIdx >= 1 ? "bg-primary/10 text-primary"
            : "bg-muted text-muted-foreground",
        )}>
          {lang === "TH" ? "ขณะนี้ได้รับ" : lang === "JP" ? "現在の獲得" : "Earning"} +{currentTier.pts} 🍯{perDayUnit(lang)}
        </span>
        <StreakInfoPopover lang={lang} />
      </div>

      {/* EXP-style progress bar — full 0→30 scale */}
      {(() => {
        const fillPctBar = Math.min(streak / MAX_STREAK_DAYS * 100, 100)
        const isMax = tierIdx >= 2
        const target = isMax ? MAX_STREAK_DAYS : STREAK_TIERS[tierIdx + 1].min
        const progressText = isMax ? "MAX" : `${streak}/${target}`
        return (
          <div className="relative h-6 overflow-hidden rounded-full bg-muted/50">
            {/* Fill */}
            <div
              className={cn(
                "absolute inset-y-0 left-0 rounded-full transition-all",
                isMax
                  ? "bg-gradient-to-r from-orange-500 to-amber-400"
                  : "bg-gradient-to-r from-orange-500 to-orange-400",
              )}
              style={{ width: `${fillPctBar}%` }}
            />
            {/* Tick mark at day 7 */}
            <div
              className="absolute top-1 bottom-1 w-px bg-foreground/20"
              style={{ left: `${T1_PCT}%` }}
            />
            {/* Progress text overlay */}
            <span className="absolute inset-0 flex items-center justify-center text-[11px] font-bold tabular-nums text-foreground drop-shadow-sm">
              {progressText}
            </span>
          </div>
        )
      })()}

      {/* Tier milestone labels — aligned to bar scale */}
      <div className="relative flex tabular-nums">
        {/* Tier 1: left-aligned (day 1) */}
        <div className={cn("flex flex-col", tierIdx === 0 ? "text-foreground" : "text-muted-foreground")}>
          <span className="text-[11px] font-bold leading-none">{startingLabel(lang)}</span>
          <span className="mt-0.5 text-[10px] font-semibold text-orange-500/80">🍯 {STREAK_TIERS[0].pts}{perDayUnit(lang)}</span>
        </div>
        {/* Tier 2: positioned at day 7 mark */}
        <div
          className={cn(
            "absolute flex flex-col items-center",
            tierIdx === 1 ? "text-foreground" : tierIdx > 1 ? "text-muted-foreground" : "text-muted-foreground/40",
          )}
          style={{ left: `${T1_PCT}%`, transform: "translateX(-50%)" }}
        >
          <span className="flex items-center gap-0.5 text-[11px] font-bold leading-none">
            <Lock className={cn("size-2.5 shrink-0", tierIdx >= 1 ? "text-green-500" : "text-muted-foreground/40")} />
            {lang === "TH" ? "7 วัน" : lang === "JP" ? "7日" : "7 days"}
          </span>
          <span className="mt-0.5 text-[10px] font-semibold text-orange-500/80">🍯 {STREAK_TIERS[1].pts}{perDayUnit(lang)}</span>
        </div>
        {/* Tier 3: right-aligned (day 30) */}
        <div
          className={cn(
            "ml-auto flex flex-col items-end text-right",
            tierIdx === 2 ? "text-foreground" : "text-muted-foreground/40",
          )}
        >
          <span className="flex items-center gap-0.5 text-[11px] font-bold leading-none">
            <Lock className={cn("size-2.5 shrink-0", tierIdx >= 2 ? "text-green-500" : "text-muted-foreground/40")} />
            {lang === "TH" ? "30 วัน" : lang === "JP" ? "30日" : "30 days"}
          </span>
          <span className="mt-0.5 text-[10px] font-semibold text-orange-500/80">🍯 {STREAK_TIERS[2].pts}{perDayUnit(lang)}</span>
        </div>
      </div>
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
                    "flex size-5 shrink-0 items-center justify-center rounded-full text-[9px] font-black",
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
            <p className="mt-2 border-t pt-2 text-[10px] text-muted-foreground">{desc}</p>
            <Popover.Arrow className="size-2.5 translate-y-[calc(-50%-2px)] rotate-45 rounded-[2px] border bg-background data-[side=bottom]:top-1 data-[side=top]:-bottom-2.5" />
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  )
}
