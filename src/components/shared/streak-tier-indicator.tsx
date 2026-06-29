"use client"

import { Flame, HelpCircle, Ticket } from "lucide-react"
import { Popover } from "@base-ui/react/popover"
import { cn } from "@/lib/utils"
import { t, type Language } from "@/lib/i18n"

const STREAK_TIERS = [
  { min: 1, max: 6, mult: 1, pts: 10 },
  { min: 7, max: 29, mult: 2, pts: 20 },
  { min: 30, max: Infinity, mult: 3, pts: 30 },
] as const

const FREE_TICKET_THRESHOLD = 7

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

  const rewardText = `+${currentTier.pts} 🍯${t(lang, "streakPerDaySuffix")}`

  return (
    <div className={cn("flex items-center gap-1.5", className)}>
      <Flame className={cn("size-3.5 shrink-0", tierIdx >= 1 ? "text-orange-500" : "text-muted-foreground")} />
      <span className="text-xs font-bold tabular-nums">{streakText}</span>
      <span className="text-xs font-semibold text-muted-foreground">{rewardText}</span>
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

  const streakLabel = t(lang, "streakCheckInStreakLabel")

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
        <span className="hidden sm:inline">{t(lang, "streakEarningPrefix")} </span>+{currentTier.pts} 🍯{t(lang, "streakPerDaySuffix")}
      </span>
      <StreakInfoPopover lang={lang} />
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Info popover: explains streak system                               */
/* ------------------------------------------------------------------ */

function StreakInfoPopover({ lang }: { lang: Language }) {
  const title = t(lang, "streakInfoTitle3")

  const desc = t(lang, "streakInfoDesc2")

  const ticketTitle = t(lang, "streakFreeRaffleTicketTitle")

  const ticketDesc = lang === "TH"
    ? `เช็คอินครบ ${FREE_TICKET_THRESHOLD} วันติดต่อกัน รับตั๋วลุ้นรางวัลฟรี 1 ใบ/เดือน`
    : lang === "JP"
      ? `${FREE_TICKET_THRESHOLD}日連続チェックインで月1回の無料抽選チケットがもらえます`
      : `Reach a ${FREE_TICKET_THRESHOLD}-day streak to claim 1 free raffle ticket per month`

  return (
    <Popover.Root>
      <Popover.Trigger
        className="inline-flex size-5 items-center justify-center rounded-full text-muted-foreground motion-base hover:bg-muted hover:text-foreground"
      >
        <HelpCircle className="size-3.5" />
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Positioner side="bottom" sideOffset={6} align="center" className="z-50">
          <Popover.Popup className="w-64 rounded-lg border bg-background p-3 shadow-lg data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95">
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
                      ? t(lang, "streakTierDayOneLabel")
                      : `${dayLabel(lang, tier.min)}+`}
                  </span>
                  <span className="font-semibold tabular-nums text-foreground">
                    +{tier.pts} 🍯
                  </span>
                </div>
              ))}
            </div>
            <div className="mt-2 flex items-start gap-2 rounded-md border border-rose-500/20 bg-rose-500/5 p-2">
              <div className="flex size-6 shrink-0 items-center justify-center rounded-full bg-rose-500/15 text-rose-600 dark:text-rose-400">
                <Ticket className="size-3.5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-foreground">{ticketTitle}</p>
                <p className="mt-0.5 text-meta">{ticketDesc}</p>
              </div>
            </div>
            <p className="mt-2 border-t pt-2 text-meta">{desc}</p>
            <Popover.Arrow className="size-2.5 translate-y-[calc(-50%-2px)] rotate-45 rounded-[2px] border bg-background data-[side=bottom]:top-1 data-[side=top]:-bottom-2.5" />
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  )
}
