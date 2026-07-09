"use client";

import {
  ArrowDownUp,
  Bell,
  Check,
  ChevronDown,
  LayoutGrid,
  List,
  Pencil,
  Pin,
  RotateCcw,
  Search,
  SlidersHorizontal,
  TrendingDown,
  TrendingUp,
  TrendingUpDown,
  X,
} from "lucide-react";
import { useMemo, useState } from "react";

import { Button, buttonVariants } from "@/components/ui/button";
import { FilterModal } from "@/components/shared/filter-modal";
import { SegmentedControl } from "@/components/ui/segmented-control";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { UpgradeBadge } from "@/components/shared/upgrade-badge";
import { t, type Language } from "@/lib/i18n";
import { useUIStore } from "@/stores/ui-store";
import { cn } from "@/lib/utils";

import {
  DEFAULT_FILTERS,
  type ChangePeriod,
  type SortKey,
  type WatchView,
  type WatchlistFilters,
} from "./watchlist-types";

const PERIODS: ChangePeriod[] = ["24h", "7d", "30d"];

export function WatchlistToolbar({
  view,
  onViewChange,
  period,
  onPeriodChange,
  sortKey,
  onSortChange,
  filters,
  onFiltersChange,
  search,
  onSearchChange,
  setOptions,
  itemCount,
  limit,
  editMode,
  onToggleEditMode,
  selectedCount,
  onClearSelection,
  onBulkRemove,
}: {
  view: WatchView;
  onViewChange: (v: WatchView) => void;
  period: ChangePeriod;
  onPeriodChange: (p: ChangePeriod) => void;
  sortKey: SortKey;
  onSortChange: (k: SortKey) => void;
  filters: WatchlistFilters;
  onFiltersChange: (next: WatchlistFilters) => void;
  search: string;
  onSearchChange: (s: string) => void;
  setOptions: { code: string; label: string }[];
  itemCount: number;
  limit: number;
  editMode: boolean;
  onToggleEditMode: () => void;
  selectedCount: number;
  onClearSelection: () => void;
  onBulkRemove: () => void;
}) {
  const lang = useUIStore((s) => s.language);
  const [refineOpen, setRefineOpen] = useState(false);

  const sortOptions: { key: SortKey; label: string }[] = useMemo(
    () => [
      { key: "default", label: t(lang, "watchlistSortDefault") },
      { key: "recent", label: t(lang, "watchlistSortRecent") },
      { key: "gain", label: t(lang, "watchlistSortGain") },
      { key: "loss", label: t(lang, "watchlistSortLoss") },
      { key: "priceHigh", label: t(lang, "watchlistSortPriceHigh") },
      { key: "priceLow", label: t(lang, "watchlistSortPriceLow") },
      { key: "nameAz", label: t(lang, "watchlistSortNameAz") },
    ],
    [lang]
  );

  const isFinite = Number.isFinite(limit);
  const usagePct = isFinite ? Math.min(100, Math.round((itemCount / limit) * 100)) : 0;
  const isFull = isFinite && itemCount >= limit;
  const isHigh = isFinite && !isFull && usagePct >= 80;

  const activeFilterCount =
    (filters.setCodes.length > 0 ? 1 : 0) +
    (filters.direction ? 1 : 0) +
    (filters.hasAlert ? 1 : 0) +
    (filters.pinnedOnly ? 1 : 0);

  return (
    <div className="space-y-3">
      {/* Bulk action bar — only in edit mode with a selection */}
      {editMode && selectedCount > 0 && (
        <div className="flex items-center gap-2 rounded-full border border-primary/40 bg-primary/15 px-3 py-1.5">
          <span className="text-meta tabular-nums text-primary">
            {selectedCount} {t(lang, "watchlistSelected")}
          </span>
          <Button
            type="button"
            size="sm"
            variant="destructive"
            className="h-7 gap-1 px-2.5"
            onClick={onBulkRemove}
          >
            <X className="size-3" />
            {t(lang, "watchlistRemoveSelected")}
          </Button>
          <button
            type="button"
            onClick={onClearSelection}
            className="text-meta text-muted-foreground hover:text-foreground"
          >
            {t(lang, "watchlistClearSelection")}
          </button>
        </div>
      )}

      {/* Single control row — search left, controls right (wraps on mobile) */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative w-full sm:w-64">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <input
            type="search"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={t(lang, "watchlistSearchPlaceholder")}
            className="h-9 w-full rounded-lg border border-transparent bg-muted pl-8 pr-2.5 text-sm placeholder:text-muted-foreground/60 focus:border-ring focus:outline-none dark:border-hair"
          />
        </div>

        <div className="flex flex-1 flex-wrap items-center gap-2 sm:justify-end">
          {/* Period */}
          <SegmentedControl<ChangePeriod>
            options={PERIODS.map((p) => ({ value: p, label: p }))}
            value={period}
            onChange={onPeriodChange}
            size="sm"
            variant="pill"
            leadingIcon={TrendingUpDown}
            ariaLabel={t(lang, "change")}
          />

          {/* Unified sort + filter — "ปรับ": dropdown on desktop, full-screen
              modal on mobile (เบส: anchored dropdown UX ไม่ดีบนมือถือ). */}
          <div className="hidden md:block">
          <DropdownMenu>
            <DropdownMenuTrigger
              className={cn(
                buttonVariants({ variant: "ghost", size: "sm" }),
                "h-9 gap-1.5 px-2.5",
                activeFilterCount > 0
                  ? "text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <SlidersHorizontal className="size-3.5 opacity-70" />
              <span>{t(lang, "watchlistRefine")}</span>
              {activeFilterCount > 0 && (
                <span className="inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-primary/15 px-1 text-overlay tabular-nums text-primary ring-1 ring-primary/30">
                  {activeFilterCount}
                </span>
              )}
              <ChevronDown className="size-3 opacity-70" />
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              sideOffset={4}
              className="max-h-[28rem] w-64 overflow-y-auto p-2"
            >
              {/* Sort */}
              <DropdownMenuGroup>
                <DropdownMenuLabel className="text-eyebrow flex items-center gap-1.5 px-1 pb-1">
                  <ArrowDownUp className="size-3 opacity-70" />
                  {t(lang, "watchlistSortBy")}
                </DropdownMenuLabel>
                {sortOptions.map((opt) => (
                  <DropdownMenuItem
                    key={opt.key}
                    onClick={() => onSortChange(opt.key)}
                    className={cn(
                      "justify-between",
                      sortKey === opt.key && "font-semibold text-primary"
                    )}
                  >
                    {opt.label}
                    {sortKey === opt.key && <Check className="size-3.5" />}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuGroup>

              <DropdownMenuSeparator />

              {/* Movement */}
              <DropdownMenuGroup>
                <DropdownMenuLabel className="text-eyebrow px-1 pb-1">
                  {t(lang, "watchlistFilterMovement")}
                </DropdownMenuLabel>
                <div className="grid grid-cols-3 gap-1 p-1">
                  <SegButton
                    active={filters.direction === null}
                    onClick={() => onFiltersChange({ ...filters, direction: null })}
                    label={t(lang, "watchlistFilterMovementAll")}
                  />
                  <SegButton
                    active={filters.direction === "up"}
                    onClick={() => onFiltersChange({ ...filters, direction: "up" })}
                    label={t(lang, "watchlistFilterMovementUp")}
                    icon={<TrendingUp className="size-3" />}
                    tone="up"
                  />
                  <SegButton
                    active={filters.direction === "down"}
                    onClick={() => onFiltersChange({ ...filters, direction: "down" })}
                    label={t(lang, "watchlistFilterMovementDown")}
                    icon={<TrendingDown className="size-3" />}
                    tone="down"
                  />
                </div>
              </DropdownMenuGroup>

              <DropdownMenuSeparator />

              {/* Status */}
              <DropdownMenuGroup>
                <DropdownMenuLabel className="text-eyebrow px-1 pb-0">
                  {t(lang, "watchlistFilterStatus")}
                </DropdownMenuLabel>
                <DropdownMenuCheckboxItem
                  checked={filters.hasAlert}
                  onCheckedChange={(next) =>
                    onFiltersChange({ ...filters, hasAlert: !!next })
                  }
                >
                  <Bell className="mr-2 size-3 text-muted-foreground" />
                  {t(lang, "watchlistFilterAlerts")}
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  checked={filters.pinnedOnly}
                  onCheckedChange={(next) =>
                    onFiltersChange({ ...filters, pinnedOnly: !!next })
                  }
                >
                  <Pin className="mr-2 size-3 text-muted-foreground" />
                  {t(lang, "watchlistFilterPinned")}
                </DropdownMenuCheckboxItem>
              </DropdownMenuGroup>

              {/* Set */}
              {setOptions.length > 0 && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuGroup>
                    <DropdownMenuLabel className="text-eyebrow px-1 pb-0">
                      {t(lang, "set")}
                    </DropdownMenuLabel>
                    <div className="max-h-40 overflow-y-auto">
                      {setOptions.map((opt) => {
                        const checked = filters.setCodes.includes(opt.code);
                        return (
                          <DropdownMenuCheckboxItem
                            key={opt.code}
                            checked={checked}
                            onCheckedChange={(next) => {
                              if (next) {
                                onFiltersChange({
                                  ...filters,
                                  setCodes: [...filters.setCodes, opt.code],
                                });
                              } else {
                                onFiltersChange({
                                  ...filters,
                                  setCodes: filters.setCodes.filter(
                                    (c) => c !== opt.code
                                  ),
                                });
                              }
                            }}
                          >
                            {opt.label}
                          </DropdownMenuCheckboxItem>
                        );
                      })}
                    </div>
                  </DropdownMenuGroup>
                </>
              )}

              {activeFilterCount > 0 && (
                <>
                  <DropdownMenuSeparator />
                  <button
                    type="button"
                    onClick={() => onFiltersChange(DEFAULT_FILTERS)}
                    className="ease-chrome flex w-full items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
                  >
                    <RotateCcw className="size-3" />
                    {t(lang, "watchlistResetFilters")}
                  </button>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
          </div>

          {/* Mobile: same "ปรับ" as a full-screen FilterModal */}
          <button
            type="button"
            onClick={() => setRefineOpen(true)}
            className={cn(
              buttonVariants({ variant: "ghost", size: "sm" }),
              "h-9 gap-1.5 px-2.5 md:hidden",
              activeFilterCount > 0
                ? "text-foreground"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <SlidersHorizontal className="size-3.5 opacity-70" />
            <span>{t(lang, "watchlistRefine")}</span>
            {activeFilterCount > 0 && (
              <span className="inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-primary/15 px-1 text-overlay tabular-nums text-primary ring-1 ring-primary/30">
                {activeFilterCount}
              </span>
            )}
          </button>
          <FilterModal
            open={refineOpen}
            onOpenChange={setRefineOpen}
            title={t(lang, "watchlistRefine")}
            onReset={() => onFiltersChange(DEFAULT_FILTERS)}
            resetDisabled={activeFilterCount === 0}
            applyLabel={t(lang, "viewResults")}
          >
            <RefinePanel
              lang={lang}
              sortOptions={sortOptions}
              sortKey={sortKey}
              onSortChange={onSortChange}
              filters={filters}
              onFiltersChange={onFiltersChange}
              setOptions={setOptions}
            />
          </FilterModal>

          {/* View toggle */}
          <div className="inline-flex h-9 shrink-0 items-center rounded-lg border border-transparent bg-muted p-0.5 dark:border-hair">
            <button
              type="button"
              onClick={() => onViewChange("list")}
              className={cn(
                "ease-chrome inline-flex h-8 items-center justify-center rounded-lg px-2 text-xs font-medium",
                view === "list"
                  ? "bg-primary/15 text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
              title={t(lang, "watchlistViewList")}
              aria-label={t(lang, "watchlistViewList")}
            >
              <List className="size-4" />
            </button>
            <button
              type="button"
              onClick={() => onViewChange("grid")}
              className={cn(
                "ease-chrome inline-flex h-8 items-center justify-center rounded-lg px-2 text-xs font-medium",
                view === "grid"
                  ? "bg-primary/15 text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
              title={t(lang, "watchlistViewGrid")}
              aria-label={t(lang, "watchlistViewGrid")}
            >
              <LayoutGrid className="size-4" />
            </button>
          </div>

          {/* Edit toggle — enters/exits multi-select mode */}
          <button
            type="button"
            onClick={onToggleEditMode}
            aria-pressed={editMode}
            className={cn(
              buttonVariants({ variant: "ghost", size: "sm" }),
              "h-9 gap-1.5 px-2.5",
              editMode
                ? "bg-primary/15 text-primary hover:bg-primary/20"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {editMode ? <Check className="size-3.5" /> : <Pencil className="size-3.5" />}
            {editMode ? t(lang, "watchlistEditDone") : t(lang, "watchlistEditMode")}
          </button>
        </div>
      </div>

      {/* Limit pill — only surfaces near/at cap (no redundant count otherwise) */}
      {isFinite && (isFull || isHigh) && (
        <div className="flex justify-end">
          <div
            className={cn(
              "flex items-center gap-1.5 rounded-md border px-2 py-1",
              isFull ? "border-destructive/30 bg-destructive/5" : "border-warning/30 bg-warning/5"
            )}
            title={`${itemCount}/${limit}`}
          >
            <div className="hidden h-1 w-10 overflow-hidden rounded-full bg-muted sm:flex">
              <div
                className={cn(
                  "h-full rounded-full motion-base",
                  isFull ? "bg-destructive" : "bg-warning"
                )}
                style={{ width: `${usagePct}%` }}
              />
            </div>
            <span
              className={cn(
                "text-meta tabular-nums",
                isFull ? "text-destructive" : "text-warning"
              )}
            >
              {itemCount}/{limit}
            </span>
            <UpgradeBadge featureKey="watchlistCards" />
          </div>
        </div>
      )}
    </div>
  );
}

function SegButton({
  active,
  onClick,
  label,
  icon,
  tone,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  icon?: React.ReactNode;
  tone?: "up" | "down";
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "ease-chrome inline-flex h-8 items-center justify-center gap-1 rounded-lg border px-2 text-xs font-medium",
        active
          ? tone === "up"
            ? "border-price-up/40 bg-price-up/10 text-price-up"
            : tone === "down"
              ? "border-price-down/40 bg-price-down/10 text-price-down"
              : "border-primary/40 bg-primary/15 text-primary"
          : "border-transparent bg-muted/40 text-muted-foreground hover:bg-muted hover:text-foreground"
      )}
    >
      {icon}
      {label}
    </button>
  );
}

/** The "ปรับ" content (sort + movement + status + set) as plain elements, so it
 *  renders inside the mobile full-screen FilterModal (the desktop DropdownMenu keeps
 *  its own primitives). Sort/filters apply on tap; the modal's ใช้ button closes it. */
function RefinePanel({
  lang,
  sortOptions,
  sortKey,
  onSortChange,
  filters,
  onFiltersChange,
  setOptions,
}: {
  lang: Language;
  sortOptions: { key: SortKey; label: string }[];
  sortKey: SortKey;
  onSortChange: (k: SortKey) => void;
  filters: WatchlistFilters;
  onFiltersChange: (next: WatchlistFilters) => void;
  setOptions: { code: string; label: string }[];
}) {
  return (
    <>
      <div>
        <span className="text-eyebrow mb-2 flex items-center gap-1.5">
          <ArrowDownUp className="size-3 opacity-70" />
          {t(lang, "watchlistSortBy")}
        </span>
        <div className="space-y-0.5">
          {sortOptions.map((opt) => (
            <button
              key={opt.key}
              type="button"
              onClick={() => onSortChange(opt.key)}
              className={cn(
                "ease-chrome flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-sm",
                sortKey === opt.key
                  ? "bg-primary/10 font-semibold text-primary"
                  : "text-foreground hover:bg-muted"
              )}
            >
              {opt.label}
              {sortKey === opt.key && <Check className="size-4" />}
            </button>
          ))}
        </div>
      </div>

      <div>
        <span className="text-eyebrow mb-2 block">
          {t(lang, "watchlistFilterMovement")}
        </span>
        <div className="grid grid-cols-3 gap-1.5">
          <SegButton
            active={filters.direction === null}
            onClick={() => onFiltersChange({ ...filters, direction: null })}
            label={t(lang, "watchlistFilterMovementAll")}
          />
          <SegButton
            active={filters.direction === "up"}
            onClick={() => onFiltersChange({ ...filters, direction: "up" })}
            label={t(lang, "watchlistFilterMovementUp")}
            icon={<TrendingUp className="size-3" />}
            tone="up"
          />
          <SegButton
            active={filters.direction === "down"}
            onClick={() => onFiltersChange({ ...filters, direction: "down" })}
            label={t(lang, "watchlistFilterMovementDown")}
            icon={<TrendingDown className="size-3" />}
            tone="down"
          />
        </div>
      </div>

      <div>
        <span className="text-eyebrow mb-2 block">
          {t(lang, "watchlistFilterStatus")}
        </span>
        <div className="space-y-0.5">
          <ToggleRow
            icon={<Bell className="size-4" />}
            label={t(lang, "watchlistFilterAlerts")}
            checked={filters.hasAlert}
            onToggle={() =>
              onFiltersChange({ ...filters, hasAlert: !filters.hasAlert })
            }
          />
          <ToggleRow
            icon={<Pin className="size-4" />}
            label={t(lang, "watchlistFilterPinned")}
            checked={filters.pinnedOnly}
            onToggle={() =>
              onFiltersChange({ ...filters, pinnedOnly: !filters.pinnedOnly })
            }
          />
        </div>
      </div>

      {setOptions.length > 0 && (
        <div>
          <span className="text-eyebrow mb-2 block">{t(lang, "set")}</span>
          <div className="max-h-56 space-y-0.5 overflow-y-auto">
            {setOptions.map((opt) => {
              const checked = filters.setCodes.includes(opt.code);
              return (
                <ToggleRow
                  key={opt.code}
                  label={opt.label}
                  checked={checked}
                  onToggle={() =>
                    onFiltersChange({
                      ...filters,
                      setCodes: checked
                        ? filters.setCodes.filter((c) => c !== opt.code)
                        : [...filters.setCodes, opt.code],
                    })
                  }
                />
              );
            })}
          </div>
        </div>
      )}
    </>
  );
}

function ToggleRow({
  icon,
  label,
  checked,
  onToggle,
}: {
  icon?: React.ReactNode;
  label: string;
  checked: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={cn(
        "ease-chrome flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-sm",
        checked ? "bg-primary/10 text-primary" : "text-foreground hover:bg-muted"
      )}
    >
      {icon && (
        <span className={checked ? "text-primary" : "text-muted-foreground"}>
          {icon}
        </span>
      )}
      <span className="flex-1 text-left">{label}</span>
      {checked && <Check className="size-4" />}
    </button>
  );
}
