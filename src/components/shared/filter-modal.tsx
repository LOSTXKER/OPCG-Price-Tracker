"use client";

import { type ReactNode } from "react";
import { RotateCcw, X } from "lucide-react";

import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { t } from "@/lib/i18n";
import { useUIStore } from "@/stores/ui-store";

/**
 * The one canonical filter surface (เบส: CoinMarketCap-style). A modal that is a
 * centered card on desktop and full-screen on mobile, with a header, a scrollable
 * body of filter rows (`children`), and a Reset / Apply footer. The Dialog overlay
 * supplies the dark blur backdrop. Every page opens THIS from its "ตัวกรอง" button
 * instead of rolling its own filter row.
 */
export function FilterModal({
  open,
  onOpenChange,
  title,
  children,
  onReset,
  resetDisabled,
  onApply,
  applyLabel,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  /** Header title. Defaults to "ตัวกรอง". */
  title?: string;
  /** The filter controls (label + control rows). */
  children: ReactNode;
  /** Clears this modal's filters. Omit to hide the Reset button. */
  onReset?: () => void;
  resetDisabled?: boolean;
  /** Runs on Apply (before the modal closes). Applying always closes the modal. */
  onApply?: () => void;
  applyLabel?: string;
}) {
  const lang = useUIStore((s) => s.language);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="flex flex-col gap-0 overflow-hidden p-0 max-md:!inset-0 max-md:!max-h-none max-md:!max-w-none max-md:!translate-x-0 max-md:!translate-y-0 max-md:!rounded-none md:h-auto md:max-h-[85dvh] md:w-full md:max-w-[26rem]"
      >
        <div className="flex items-center justify-between border-b border-hair px-4 py-3">
          <DialogTitle className="text-h4">
            {title ?? t(lang, "filter")}
          </DialogTitle>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            aria-label={t(lang, "close")}
            className="tap-safe -mr-1 flex size-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* On mobile the panel is full-screen, so a short cluster of facets would
            leave an awkward void below (เบส). Centre the content vertically when it
            is shorter than the screen; on desktop (content-height card) it stays
            top-aligned. Taller-than-screen content still scrolls from the top. */}
        <div className="min-h-0 flex-1 overflow-y-auto">
          <div className="flex min-h-full flex-col justify-center gap-5 px-4 py-5 md:justify-start md:gap-4 md:py-4">
            {children}
          </div>
        </div>

        <div className="flex items-center gap-3 border-t border-hair p-3">
          {onReset && (
            <button
              type="button"
              onClick={onReset}
              disabled={resetDisabled}
              className="ease-chrome flex items-center gap-1.5 rounded-lg px-3 py-2.5 text-sm font-medium text-primary hover:bg-primary/5 disabled:opacity-40"
            >
              <RotateCcw className="size-3.5" />
              {t(lang, "reset")}
            </button>
          )}
          <button
            type="button"
            onClick={() => {
              onApply?.();
              onOpenChange(false);
            }}
            className="ease-chrome h-11 flex-1 rounded-xl bg-primary text-sm font-semibold text-primary-foreground hover:bg-primary/90"
          >
            {applyLabel ?? t(lang, "apply")}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
