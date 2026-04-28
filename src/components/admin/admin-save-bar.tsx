"use client";

import type { ReactNode } from "react";
import { Loader2, Save, RotateCcw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface AdminSaveBarProps {
  /** When true, the bar slides in. When false, it stays hidden. */
  dirty: boolean;
  saving?: boolean;
  onSave: () => void;
  /** Optional "discard changes" callback. Hides the reset button when omitted. */
  onReset?: () => void;
  /** Left-side description (e.g. "3 fields changed"). */
  description?: ReactNode;
  saveLabel?: string;
  resetLabel?: string;
  className?: string;
  /** Right-side custom action slot (rendered before save button). */
  actions?: ReactNode;
  disabled?: boolean;
}

/**
 * Sticky footer used by FormPage archetypes. Sits at the bottom of the
 * viewport (above the mobile bottom nav) and only animates in when `dirty`
 * is true. Pair with `AdminPage`'s `footer` slot.
 */
export function AdminSaveBar({
  dirty,
  saving = false,
  onSave,
  onReset,
  description,
  saveLabel = "บันทึก",
  resetLabel = "ยกเลิก",
  className,
  actions,
  disabled,
}: AdminSaveBarProps) {
  return (
    <div
      aria-hidden={!dirty}
      className={cn(
        "pointer-events-none sticky inset-x-0 bottom-0 z-30 mt-6 transition-all duration-200",
        dirty
          ? "translate-y-0 opacity-100"
          : "translate-y-4 opacity-0",
        className,
      )}
    >
      <div
        className={cn(
          "pointer-events-auto flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border/60 bg-card/95 px-4 py-3 shadow-lg backdrop-blur",
          dirty ? "panel-accent" : "",
        )}
      >
        <div className="flex min-w-0 items-center gap-2 text-sm">
          {description ?? (
            <span className="text-muted-foreground">มีการเปลี่ยนแปลงที่ยังไม่บันทึก</span>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {actions}
          {onReset && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onReset}
              disabled={!dirty || saving}
            >
              <RotateCcw className="size-4" />
              {resetLabel}
            </Button>
          )}
          <Button
            type="button"
            size="sm"
            onClick={onSave}
            disabled={!dirty || saving || disabled}
          >
            {saving ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Save className="size-4" />
            )}
            {saveLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
