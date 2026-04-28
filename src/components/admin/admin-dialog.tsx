"use client";

import type { ReactNode } from "react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

type DialogSize = "sm" | "md" | "lg" | "xl";

const SIZE_CLASS: Record<DialogSize, string> = {
  sm: "sm:max-w-sm",
  md: "sm:max-w-lg",
  lg: "sm:max-w-2xl",
  xl: "sm:max-w-4xl",
};

interface AdminDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: ReactNode;
  description?: ReactNode;
  /** Optional header right slot (e.g. close icon, status badge). */
  headerExtra?: ReactNode;
  children: ReactNode;
  /** Footer slot (rendered with right-aligned buttons by default). */
  footer?: ReactNode;
  size?: DialogSize;
  className?: string;
  /** Show base-ui's auto close (×) button. Defaults to `true`. */
  showCloseButton?: boolean;
  /** Override body padding. Defaults to no extra padding (`DialogContent` handles it). */
  bodyClassName?: string;
}

/**
 * Thin wrapper around the shadcn-style `Dialog` so admin features get a
 * consistent shell: title + description + body + footer with a size preset
 * (`sm`, `md`, `lg`, `xl`). Replaces ad-hoc `fixed inset-0` modal usages
 * in the matching/raffle screens.
 */
export function AdminDialog({
  open,
  onOpenChange,
  title,
  description,
  headerExtra,
  children,
  footer,
  size = "md",
  className,
  showCloseButton = true,
  bodyClassName,
}: AdminDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(SIZE_CLASS[size], className)}
        showCloseButton={showCloseButton}
      >
        {(title || description || headerExtra) && (
          <DialogHeader>
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                {title && <DialogTitle className="text-h4">{title}</DialogTitle>}
                {description && (
                  <DialogDescription className="mt-1 text-meta">
                    {description}
                  </DialogDescription>
                )}
              </div>
              {headerExtra}
            </div>
          </DialogHeader>
        )}
        <div className={cn("min-w-0", bodyClassName)}>{children}</div>
        {footer && <DialogFooter>{footer}</DialogFooter>}
      </DialogContent>
    </Dialog>
  );
}
