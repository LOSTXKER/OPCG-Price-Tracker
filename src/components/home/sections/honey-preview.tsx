"use client"

import Link from "next/link"
import { ChevronRight } from "lucide-react"
import { useCallback, useEffect, useState } from "react"

import { useAuthState } from "@/hooks/use-auth-state"
import { invalidateSettings } from "@/hooks/use-settings"
import { ApiError, apiGet, apiPost, apiTry } from "@/lib/api/client"
import { t } from "@/lib/i18n"
import { createClient } from "@/lib/supabase/client"
import { formatCount } from "@/lib/utils/currency"
import { useUIStore } from "@/stores/ui-store"

type HoneyData = {
  honeyPoints: number
  checkinStreak: number
  canCheckin: boolean
  level: { level: number; label: string; nextThreshold: number | null }
}

const METRIC_CLASS =
  "panel group flex flex-1 flex-col justify-between gap-1.5 p-4 transition-all hover:-translate-y-0.5 hover:shadow-md hover:[&_.metric-arrow]:translate-x-0.5 hover:[&_.metric-arrow]:text-primary hover:[&_.metric-value]:text-primary"

function MetricHeader({ children }: { children: React.ReactNode }) {
  return (
    <span className="flex items-center justify-between gap-2">
      <span className="flex items-center gap-1.5 text-eyebrow">
        <span aria-hidden className="leading-none">🍯</span>
        {children}
      </span>
      <ChevronRight
        aria-hidden
        className="metric-arrow size-4 shrink-0 text-muted-foreground/60 transition-all"
      />
    </span>
  )
}

export function HomeHoneyPreview() {
  const lang = useUIStore((s) => s.language)
  const { authed } = useAuthState()
  const [data, setData] = useState<HoneyData | null>(null)
  const [fetchDone, setFetchDone] = useState(false)
  const [checking, setChecking] = useState(false)

  useEffect(() => {
    if (authed !== true) return
    let cancelled = false
    ;(async () => {
      try {
        const json = await apiGet<HoneyData>("/api/honey")
        if (!cancelled) setData(json)
      } catch (err) {
        if (err instanceof ApiError && err.status === 401) {
          invalidateSettings()
          const supabase = createClient()
          await supabase.auth.signOut()
        }
        /* swallow other errors */
      } finally {
        if (!cancelled) setFetchDone(true)
      }
    })()
    return () => { cancelled = true }
  }, [authed])

  const loading = authed === null || (authed === true && !fetchDone)

  const doCheckin = useCallback(async () => {
    if (checking || !data?.canCheckin) return
    setChecking(true)
    const result = await apiTry(
      apiPost<{ total: number; streak: number }>("/api/honey", { action: "checkin" }),
    )
    if (result) {
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
    setChecking(false)
  }, [checking, data?.canCheckin])

  if (loading) {
    return (
      <div className={METRIC_CLASS}>
        <MetricHeader>{t(lang, "honeyPoints")}</MetricHeader>
        <div className="h-6 w-16 animate-pulse rounded bg-muted" />
        <div className="h-3 w-24 animate-pulse rounded bg-muted" />
      </div>
    )
  }

  if (authed === false) {
    return (
      <Link href="/honey" className={METRIC_CLASS}>
        <MetricHeader>{t(lang, "honeyPoints")}</MetricHeader>
        <span className="metric-value font-price text-xl font-bold leading-none">—</span>
        <span className="text-meta">{t(lang, "loginToEarn")}</span>
      </Link>
    )
  }

  if (!data) {
    return (
      <Link href="/honey" className={METRIC_CLASS}>
        <MetricHeader>{t(lang, "honeyPoints")}</MetricHeader>
        <span className="metric-value font-price text-xl font-bold leading-none">—</span>
        <span className="text-meta">&nbsp;</span>
      </Link>
    )
  }

  const checkinReward =
    data.checkinStreak >= 30 ? 30 : data.checkinStreak >= 7 ? 20 : 10

  return (
    <Link href="/honey" className={METRIC_CLASS}>
      <MetricHeader>{t(lang, "honeyPoints")}</MetricHeader>
      <span className="metric-value flex items-baseline gap-1.5 font-price text-xl font-bold leading-none tabular-nums">
        {formatCount(data.honeyPoints)}
        <span className="text-xs font-medium text-muted-foreground">Honey</span>
      </span>
      <span className="flex items-center gap-2 text-meta">
        {data.canCheckin ? (
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              doCheckin()
            }}
            disabled={checking}
            className="inline-flex items-center gap-1 rounded-full bg-primary px-2.5 py-1 text-xs font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
          >
            {checking ? "..." : `${t(lang, "dailyCheckin")} +${checkinReward} 🍯`}
          </button>
        ) : (
          <span className="text-price-up">✓ {t(lang, "checkinDone")}</span>
        )}
      </span>
    </Link>
  )
}
