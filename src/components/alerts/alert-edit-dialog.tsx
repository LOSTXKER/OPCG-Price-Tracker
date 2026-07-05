"use client";

import { useEffect, useState } from "react";

import { apiPatch } from "@/lib/api/client";
import { useAlertSubmit } from "@/hooks/use-alert-submit";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useUIStore } from "@/stores/ui-store";
import { t, getCardName } from "@/lib/i18n";
import {
  AlertFormBody,
  type AlertFormValue,
} from "@/components/alerts/alert-form";
import { jpyToDisplayValue } from "@/lib/utils/currency";
import type { PriceAlertItem } from "./alert-types";

export function AlertEditDialog({
  alert,
  open,
  onOpenChange,
  onSaved,
}: {
  alert: PriceAlertItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved?: (next: PriceAlertItem) => void;
}) {
  const lang = useUIStore((s) => s.language);
  const currency = useUIStore((s) => s.currency);
  const { submit, submitting, error, setError } = useAlertSubmit();

  const [value, setValue] = useState<AlertFormValue>({
    direction: "BELOW",
    channels: ["EMAIL"],
    target: "",
  });

  useEffect(() => {
    if (open && alert) {
      const channels =
        alert.channels.length > 0 ? [...alert.channels] : ["EMAIL" as const];
      setValue({
        direction: alert.direction,
        channels,
        target: Math.round(jpyToDisplayValue(alert.targetPrice, currency)).toString(),
      });
      setError(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- setError is a stable useState setter from useAlertSubmit
  }, [open, alert, currency]);

  if (!alert) return null;

  const cardName = getCardName(lang, alert.card);
  const currentPriceJpy = alert.card.latestPriceJpy;

  const alertId = alert.id;
  const handleSubmit = () =>
    submit({
      target: value.target,
      request: (targetJpy) =>
        apiPatch<{ alert: PriceAlertItem }>(`/api/alerts?id=${alertId}`, {
          targetPrice: targetJpy,
          direction: value.direction,
          channels: value.channels,
        }),
      onSuccess: (json) => {
        onSaved?.(json.alert);
        onOpenChange(false);
      },
      onGated: () => onOpenChange(false),
    });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{t(lang, "editAlert")}</DialogTitle>
          <DialogDescription className="truncate">{cardName}</DialogDescription>
        </DialogHeader>

        <AlertFormBody
          value={value}
          onChange={setValue}
          currentPriceJpy={currentPriceJpy}
          error={error}
          submitting={submitting}
          onSubmit={() => void handleSubmit()}
          submitLabel={t(lang, "saveChanges")}
        />
      </DialogContent>
    </Dialog>
  );
}
