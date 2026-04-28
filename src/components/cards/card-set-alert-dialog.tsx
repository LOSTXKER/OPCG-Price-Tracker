"use client"

import { useState } from "react"
import { Bell, Check } from "lucide-react"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { useUIStore } from "@/stores/ui-store"
import { t } from "@/lib/i18n"
import { useUpgradeDialog } from "@/components/shared/upgrade-dialog"
import {
  AlertFormBody,
  type AlertFormValue,
  type AlertDirection,
} from "@/components/alerts/alert-form"
import {
  displayValueToJpy,
  jpyToDisplayValue,
} from "@/lib/utils/currency"

export function CardSetAlertDialog({
  cardId,
  cardName,
  currentPriceJpy,
  open: controlledOpen,
  onOpenChange,
  hideTrigger = false,
  onCreated,
}: {
  cardId: number
  cardName: string
  currentPriceJpy: number | null | undefined
  /** Optional controlled open state. When provided, `hideTrigger` is implicit unless explicitly false. */
  open?: boolean
  onOpenChange?: (open: boolean) => void
  hideTrigger?: boolean
  onCreated?: () => void
}) {
  const lang = useUIStore((s) => s.language)
  const currency = useUIStore((s) => s.currency)
  const { openUpgradeDialog } = useUpgradeDialog()

  const isControlled = controlledOpen !== undefined
  const [internalOpen, setInternalOpen] = useState(false)
  const open = isControlled ? controlledOpen : internalOpen
  const setOpen = (next: boolean) => {
    if (isControlled) {
      onOpenChange?.(next)
    } else {
      setInternalOpen(next)
      onOpenChange?.(next)
    }
  }
  const initialTarget =
    currentPriceJpy != null
      ? Math.round(jpyToDisplayValue(currentPriceJpy, currency)).toString()
      : ""
  const [value, setValue] = useState<AlertFormValue>({
    direction: "BELOW",
    channels: ["EMAIL"],
    target: initialTarget,
  })
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const reset = () => {
    setValue({
      direction: "BELOW" as AlertDirection,
      channels: ["EMAIL"],
      target:
        currentPriceJpy != null
          ? Math.round(jpyToDisplayValue(currentPriceJpy, currency)).toString()
          : "",
    })
    setSubmitting(false)
    setDone(false)
    setError(null)
  }

  const handleSubmit = async () => {
    setError(null)
    const raw = value.target.trim() ? Number(value.target) : NaN
    if (!Number.isFinite(raw) || raw <= 0) {
      setError(t(lang, "targetPrice"))
      return
    }
    const targetJpy = Math.round(displayValueToJpy(raw, currency))

    setSubmitting(true)
    try {
      const res = await fetch("/api/alerts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cardId,
          targetPrice: targetJpy,
          direction: value.direction,
          channels: value.channels,
        }),
      })

      if (res.status === 401) {
        window.location.href = `/login?redirect=${encodeURIComponent(window.location.pathname)}`
        return
      }

      const json = await res.json().catch(() => ({}))
      if (!res.ok) {
        if (res.status === 403) {
          const msg: string = typeof json?.error === "string" ? json.error : ""
          if (msg.toLowerCase().includes("line")) {
            openUpgradeDialog({ featureKey: "lineAlerts" })
          } else {
            openUpgradeDialog({ featureKey: "priceAlerts" })
          }
          setOpen(false)
          return
        }
        setError(json?.error ?? t(lang, "priceAlertFailed"))
        return
      }

      setDone(true)
      onCreated?.()
      setTimeout(() => {
        setDone(false)
        setOpen(false)
      }, 1300)
    } catch {
      setError(t(lang, "priceAlertFailed"))
    } finally {
      setSubmitting(false)
    }
  }

  const showTrigger = !hideTrigger && !isControlled

  return (
    <>
      {showTrigger && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setOpen(true)
            reset()
          }}
          className="gap-1.5"
        >
          <Bell className="size-3.5" />
          {t(lang, "setPriceAlertShort")}
        </Button>
      )}

      <Dialog
        open={open}
        onOpenChange={(next) => {
          setOpen(next)
          if (next) reset()
        }}
      >
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>{t(lang, "setPriceAlert")}</DialogTitle>
            <DialogDescription className="truncate">{cardName}</DialogDescription>
          </DialogHeader>

          {done ? (
            <div className="flex flex-col items-center gap-2 py-4">
              <Check className="size-8 text-price-up" />
              <p className="text-sm font-medium">{t(lang, "priceAlertCreated")}</p>
            </div>
          ) : (
            <AlertFormBody
              value={value}
              onChange={setValue}
              currentPriceJpy={currentPriceJpy}
              error={error}
              submitting={submitting}
              onSubmit={() => void handleSubmit()}
              submitLabel={t(lang, "createAlert")}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
