"use client";

import { useEffect, useState } from "react";

import { ApiError, apiPatch } from "@/lib/api/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useUIStore } from "@/stores/ui-store";
import { useUpgradeDialog } from "@/components/shared/upgrade-dialog";
import { t, getCardName } from "@/lib/i18n";
import {
  AlertFormBody,
  type AlertFormValue,
} from "@/components/alerts/alert-form";
import {
  displayValueToJpy,
  jpyToDisplayValue,
} from "@/lib/utils/currency";
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
  const { openUpgradeDialog } = useUpgradeDialog();

  const [value, setValue] = useState<AlertFormValue>({
    direction: "BELOW",
    channels: ["EMAIL"],
    target: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      setSubmitting(false);
    }
  }, [open, alert, currency]);

  if (!alert) return null;

  const cardName = getCardName(lang, alert.card);
  const currentPriceJpy = alert.card.latestPriceJpy;

  const handleSubmit = async () => {
    setError(null);
    const raw = value.target.trim() ? Number(value.target) : NaN;
    if (!Number.isFinite(raw) || raw <= 0) {
      setError(t(lang, "targetPrice"));
      return;
    }
    const targetJpy = Math.round(displayValueToJpy(raw, currency));

    setSubmitting(true);
    try {
      const json = await apiPatch<{ alert: PriceAlertItem }>(
        `/api/alerts?id=${alert.id}`,
        {
          targetPrice: targetJpy,
          direction: value.direction,
          channels: value.channels,
        },
      );

      onSaved?.(json.alert);
      onOpenChange(false);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        window.location.href = `/login?redirect=${encodeURIComponent(window.location.pathname)}`;
        return;
      }
      if (err instanceof ApiError && err.status === 403) {
        if (err.message.toLowerCase().includes("line")) {
          openUpgradeDialog({ featureKey: "lineAlerts" });
        } else {
          openUpgradeDialog({ featureKey: "priceAlerts" });
        }
        onOpenChange(false);
        return;
      }
      setError(err instanceof ApiError ? err.message : t(lang, "priceAlertFailed"));
    } finally {
      setSubmitting(false);
    }
  };

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
