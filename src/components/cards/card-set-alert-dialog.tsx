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
import { apiPost } from "@/lib/api/client"
import { useAlertSubmit } from "@/hooks/use-alert-submit"
import {
  AlertFormBody,
  type AlertFormValue,
  type AlertDirection,
} from "@/components/alerts/alert-form"
import { jpyToDisplayValue } from "@/lib/utils/currency"

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
  const { submit, submitting, error, setError } = useAlertSubmit()
  const [done, setDone] = useState(false)

  const reset = () => {
    setValue({
      direction: "BELOW" as AlertDirection,
      channels: ["EMAIL"],
      target:
        currentPriceJpy != null
          ? Math.round(jpyToDisplayValue(currentPriceJpy, currency)).toString()
          : "",
    })
    setDone(false)
    setError(null)
  }

  const handleSubmit = () =>
    submit({
      target: value.target,
      request: (targetJpy) =>
        apiPost("/api/alerts", {
          cardId,
          targetPrice: targetJpy,
          direction: value.direction,
          channels: value.channels,
        }),
      onSuccess: () => {
        setDone(true)
        onCreated?.()
        setTimeout(() => {
          setDone(false)
          setOpen(false)
        }, 1300)
      },
      onGated: () => setOpen(false),
    })

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
              <Check className="size-8 text-foreground" />
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
