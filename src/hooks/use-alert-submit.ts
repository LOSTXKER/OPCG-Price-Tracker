"use client"

import { useCallback, useState } from "react"

import { ApiError } from "@/lib/api/client"
import { t } from "@/lib/i18n"
import { displayValueToJpy } from "@/lib/utils/currency"
import { useUpgradeDialog } from "@/components/shared/upgrade-dialog"
import { useUIStore } from "@/stores/ui-store"

/**
 * The one price-alert submit engine (TRACK-04). Owns the bits every alert dialog
 * duplicated line-for-line: validate the target field, convert the display-currency
 * value to JPY, run the create/update request, and map 401 → sign-in redirect /
 * 403 → the right upgrade dialog. Each caller passes only what actually differs —
 * the `request` (POST vs PATCH) and what to do on success / after a tier gate — so
 * per-dialog behaviour (prefill, checkmark, close) stays intact.
 */
export function useAlertSubmit() {
  const lang = useUIStore((s) => s.language)
  const currency = useUIStore((s) => s.currency)
  const { openUpgradeDialog } = useUpgradeDialog()
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const submit = useCallback(
    async <T,>({
      target,
      request,
      onSuccess,
      onGated,
    }: {
      /** Raw string from the target-price field (in the user's display currency). */
      target: string
      /** The create/update call — receives the validated target price in JPY. */
      request: (targetJpy: number) => Promise<T>
      onSuccess: (result: T) => void
      /** Called after a 403 (tier gate) so the caller can close its own dialog. */
      onGated?: () => void
    }) => {
      setError(null)
      const raw = target.trim() ? Number(target) : NaN
      if (!Number.isFinite(raw) || raw <= 0) {
        setError(t(lang, "targetPrice"))
        return
      }
      const targetJpy = Math.round(displayValueToJpy(raw, currency))

      setSubmitting(true)
      try {
        const result = await request(targetJpy)
        onSuccess(result)
      } catch (err) {
        if (err instanceof ApiError && err.status === 401) {
          window.location.href = `/login?redirect=${encodeURIComponent(window.location.pathname)}`
          return
        }
        if (err instanceof ApiError && err.status === 403) {
          openUpgradeDialog({
            featureKey: err.message.toLowerCase().includes("line") ? "lineAlerts" : "priceAlerts",
          })
          onGated?.()
          return
        }
        setError(err instanceof ApiError ? err.message : t(lang, "priceAlertFailed"))
      } finally {
        setSubmitting(false)
      }
    },
    [lang, currency, openUpgradeDialog],
  )

  return { submit, submitting, error, setError }
}
