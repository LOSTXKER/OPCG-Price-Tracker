"use client";

import { type ReactNode } from "react";
import { RotateCcw, X } from "lucide-react";

import { Dialog, DialogTitle } from "@/components/ui/dialog";
import { ResponsiveDialogContent } from "@/components/ui/responsive-dialog-content";
import { Button } from "@/components/ui/button";
import { IconButton } from "@/components/ui/icon-button";
import { t } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { useUIStore } from "@/stores/ui-store";

/**
 * The one canonical filter surface (เบส: CoinMarketCap-style). A modal that is a
 * centered card on desktop and full-screen on mobile, with a header, a scrollable
 * body of filter rows (`children`), and a Reset / Apply footer. The Dialog overlay
 * supplies the dark backdrop. Every page opens THIS from its "ตัวกรอง" button
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
  blurBackdrop = false,
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
  /** Show a visible, blurred layer when this filter opens above another dialog. */
  blurBackdrop?: boolean;
}) {
  const lang = useUIStore((s) => s.language);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <ResponsiveDialogContent
        showCloseButton={false}
        overlayForceRender={blurBackdrop}
        overlayClassName={cn(
          blurBackdrop && "md:bg-black/20 md:backdrop-blur-sm",
        )}
        className="md:max-w-[26rem]"
      >
        <div className="flex items-center justify-between border-b border-hair px-4 py-3">
          <DialogTitle className="text-h4">
            {title ?? t(lang, "filter")}
          </DialogTitle>
          <IconButton
            onClick={() => onOpenChange(false)}
            aria-label={t(lang, "close")}
            className="-mr-1 md:size-8"
          >
            <X className="size-4" />
          </IconButton>
        </div>

        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-4 py-4">
          {children}
        </div>

        <div className="flex items-center gap-3 border-t border-hair p-3">
          {onReset && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onReset}
              disabled={resetDisabled}
              className="sm:min-h-11 md:min-h-0 text-primary hover:bg-primary/5 hover:text-primary"
            >
              <RotateCcw className="size-3.5" />
              {t(lang, "reset")}
            </Button>
          )}
          <Button
            onClick={() => {
              onApply?.();
              onOpenChange(false);
            }}
            className="flex-1 sm:min-h-11 md:min-h-0"
          >
            {applyLabel ?? t(lang, "apply")}
          </Button>
        </div>
      </ResponsiveDialogContent>
    </Dialog>
  );
}
