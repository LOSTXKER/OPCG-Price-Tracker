"use client";

import { LayoutGrid, List } from "lucide-react";

import { SegmentedControl } from "@/components/ui/segmented-control";
import { t } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { useUIStore } from "@/stores/ui-store";

export type ViewMode = "table" | "grid" | "list";

const VIEW_MODE_META = {
  table: { icon: List, labelKey: "table" },
  grid: { icon: LayoutGrid, labelKey: "grid" },
  list: { icon: List, labelKey: "cardViewList" },
} as const;

/** Canonical table/list/grid switch with shared icons, labels, and keyboard behavior. */
export function ViewModeControl<T extends ViewMode>({
  value,
  onChange,
  modes,
  showLabels = false,
  className,
}: {
  value: T;
  onChange: (value: T) => void;
  modes: ReadonlyArray<T>;
  showLabels?: boolean;
  className?: string;
}) {
  const lang = useUIStore((state) => state.language);
  const labels = modes.map((mode) => t(lang, VIEW_MODE_META[mode].labelKey));

  return (
    <SegmentedControl<T>
      size="sm"
      compactVisual
      ariaLabel={labels.join(" / ")}
      className={cn(
        "shrink-0 gap-0 before:inset-x-1 md:gap-0.5 md:before:inset-x-0 [&_button]:before:inset-x-1 md:[&_button]:before:inset-x-0 [&_svg]:size-4",
        // Labelled view switches are a true two/three-way choice, so their
        // geometry must not change with the active translation. Icon-only
        // controls stay content-sized and square.
        showLabels && "[&_button]:w-20 [&_button]:min-w-20",
        className,
      )}
      options={modes.map((mode, index) => ({
        value: mode,
        icon: VIEW_MODE_META[mode].icon,
        ariaLabel: labels[index],
        label: showLabels ? labels[index] : null,
      }))}
      value={value}
      onChange={onChange}
    />
  );
}
