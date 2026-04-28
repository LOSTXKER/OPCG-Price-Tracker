"use client"

import Link from "next/link"
import { useCallback, useEffect, useState } from "react"

import { StreakTierIndicator } from "@/components/shared/streak-tier-indicator"
import { useAuthState } from "@/hooks/use-auth-state"
import { invalidateSettings } from "@/hooks/use-settings"
import { t } from "@/lib/i18n"
import { createClient } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"
import { formatCount } from "@/lib/utils/currency"
import { useUIStore } from "@/stores/ui-store"

type HoneyData = {
  honeyPoints: number
  checkinStreak: number
  canCheckin: boolean
  level: { level: number; label: string; nextThreshold: number | null }
}

const CARD_BASE = "group flex flex-col rounded-xl border p-4 transition-colors"
const CARD_STYLE = cn(
  CARD_BASE,
  "border-border/40 bg-gradient-to-br from-card to-muted/20 hover:border-border",
)

export function HomeHoneyPreview() {
  const lang = useUIStore((s) => s.language)
  const { authed } = useAuthState()
  const [data, setData] = useState<HoneyData | null>(null)
  const [loading, setLoading] = useState(true)
  const [checking, setChecking] = useState(false)

  useEffect(() => {
    if (authed !== true) {
      setLoading(false)
      return
    }
    fetch("/api/honey")
      .then(async (r) => {
        if (r.status === 401) {
          invalidateSettings()
          const supabase = createClient()
          await supabase.auth.signOut()
          return null
        }
        return r.ok ? r.json() : null
      })
      .then((json) => {
        if (json) setData(json)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [authed])

  const doCheckin = useCallback(async () => {
    if (checking || !data?.canCheckin) return
    setChecking(true)
    try {
      const res = await fetch("/api/honey", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "checkin" }),
      })
      if (res.ok) {
        const result = await res.json()
        setData((prev) =>
          prev
            ? {
                ...prev,
                honeyPoints: result.total,
                checkinStreak: result.streak,
                canCheckin: false,
              }
            : prev,
        )
      }
    } catch {
      /* silent */
    }
    setChecking(false)
  }, [checking, data?.canCheckin])

  if (authed === null || loading) {
    return (
      <div className={CARD_STYLE}>
        <div className="flex items-center gap-2">
          <span className="text-sm leading-none">🍯</span>
          <span className="text-xs font-semibold">{t(lang, "honeyPoints")}</span>
        </div>
        <div className="mt-3 h-7 w-16 animate-pulse rounded bg-muted" />
        <div className="mt-2 h-4 w-32 animate-pulse rounded bg-muted" />
      </div>
    )
  }

  if (authed === false) {
    return (
      <Link href="/honey" className={CARD_STYLE}>
        <div className="flex items-center gap-2">
          <span className="text-sm leading-none">🍯</span>
          <span className="text-xs font-semibold">{t(lang, "honeyPoints")}</span>
        </div>
        <p className="mt-3 text-sm text-muted-foreground">{t(lang, "loginToEarn")}</p>
      </Link>
    )
  }

  if (!data) {
    return (
      <Link href="/honey" className={CARD_STYLE}>
        <div className="flex items-center gap-2">
          <span className="text-sm leading-none">🍯</span>
          <span className="text-xs font-semibold">{t(lang, "honeyPoints")}</span>
        </div>
      </Link>
    )
  }

  const streak = data.checkinStreak
  const checkinReward = streak >= 30 ? 30 : streak >= 7 ? 20 : 10

  return (
    <Link href="/honey" className={CARD_STYLE}>
      <div className="flex items-center gap-2">
        <span className="text-sm leading-none">🍯</span>
        <span className="text-xs font-semibold">{t(lang, "honeyPoints")}</span>
      </div>
      <p className="mt-2 font-price text-xl font-bold leading-none">
        {formatCount(data.honeyPoints)}{" "}
        <span className="text-xs font-semibold text-muted-foreground">Honey</span>
      </p>
      <div className="mt-auto flex flex-wrap items-center gap-2 pt-1.5">
        <StreakTierIndicator streak={streak} lang={lang} variant="compact" />
        <div className="ml-auto shrink-0">
          {data.canCheckin ? (
            <button
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                doCheckin()
              }}
              disabled={checking}
              className="relative rounded-full bg-primary px-2.5 py-1.5 text-xs font-bold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
            >
              <span className="absolute -right-0.5 -top-0.5 flex size-2">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-danger/75 opacity-75" />
                <span className="relative inline-flex size-2 rounded-full bg-danger" />
              </span>
              {checking ? "..." : `${t(lang, "dailyCheckin")} +${checkinReward} 🍯`}
            </button>
          ) : (
            <span className="text-xs font-medium text-price-up">
              ✓ {t(lang, "checkinDone")}
            </span>
          )}
        </div>
      </div>
    </Link>
  )
}
