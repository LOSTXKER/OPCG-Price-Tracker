"use client";

import {
  Fragment,
  useState,
  useMemo,
  useEffect,
  useRef,
  type ReactNode,
} from "react";
import Link from "next/link";
import { TrendingUpDown } from "lucide-react";

import { SegmentedControl } from "@/components/ui/segmented-control";
import { GradeControl } from "@/components/market/price-mode-control";
import { FilterModal } from "@/components/shared/filter-modal";
import { FilterButton } from "@/components/ui/toolbar";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import { RarityBadge } from "@/components/shared/rarity-badge";
import { RARITY_BAR_COLOR } from "@/lib/constants/rarities";
import { type ChangePeriod } from "@/components/cards/card-item";
import { SetCardTile } from "./set-card-tile";
import { AdInventorySlot } from "@/components/ads/ad-inventory-slot";
import { EmptyState } from "@/components/shared/empty-state";
import {
  CHANGE_PERIODS,
} from "@/components/home/market-types";
import {
  getGradePriceUsd,
  hasGradePrice,
  isRawGrade,
  type GradeKey,
} from "@/lib/pricing/grade-tiers";
import { cn } from "@/lib/utils";
import { t } from "@/lib/i18n";
import { setRarityGuideLinkLabel } from "@/lib/seo/copy/sets";
import { useUIStore } from "@/stores/ui-store";
import {
  CARD_COLORS,
  CARD_TYPE_ORDER,
  getCardTypeLabel,
} from "@/lib/constants/card-config";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export type CardData = {
  id: number;
  cardCode: string;
  nameJp: string;
  nameEn: string | null;
  /** Thai card name (populated for ~all cards) — `getCardName` prefers it on TH. */
  nameTh: string | null;
  rarity: string;
  isParallel: boolean;
  imageUrl: string | null;
  latestPriceJpy: number | null;
  latestPriceThb: number | null;
  priceChange24h: number | null;
  priceChange7d: number | null;
  priceChange30d: number | null;
  setCode: string;
  psa10PriceUsd: number | null;
  cardType: string;
  color: string;
};

export type PullRateData = {
  rarity: string;
  avgPerBox: number;
  ratePerPack: number;
};

export type RarityGroup = {
  rarity: string;
  name: string;
  cards: CardData[];
  pullRate?: PullRateData;
  pullChancePerBox?: number;
};

export function getSetAdHeadingGroupIndex(
  groupCardCounts: readonly number[],
): number | null {
  let precedingCardCount = 0;

  for (let groupIndex = 0; groupIndex < groupCardCounts.length; groupIndex += 1) {
    if (groupIndex > 0 && precedingCardCount >= 12) return groupIndex;
    precedingCardCount += groupCardCounts[groupIndex] ?? 0;
  }

  return null;
}

export function getVisibleSetGroups(
  groups: RarityGroup[],
  {
    activeType,
    activeColor,
    grade,
  }: {
    activeType: string;
    activeColor: string;
    grade: GradeKey;
  },
): RarityGroup[] {
  if (
    activeType === "all" &&
    activeColor === "all" &&
    isRawGrade(grade)
  ) {
    return groups;
  }

  return groups
    .map((group) => {
      const cards = group.cards.filter(
        (card) =>
          (activeType === "all" || card.cardType === activeType) &&
          (activeColor === "all" || card.color.includes(activeColor)) &&
          (isRawGrade(grade) ||
            hasGradePrice(
              {
                rawPriceJpy: card.latestPriceJpy,
                psa10PriceUsd: card.psa10PriceUsd,
              },
              grade,
            )),
      );

      if (!isRawGrade(grade)) {
        cards.sort(
          (a, b) =>
            (getGradePriceUsd(b.psa10PriceUsd, grade) ?? 0) -
            (getGradePriceUsd(a.psa10PriceUsd, grade) ?? 0),
        );
      }

      return { ...group, cards };
    })
    .filter((group) => group.cards.length > 0);
}

interface SetDetailContentProps {
  groups: RarityGroup[];
  totalCards: number;
  grade: GradeKey;
  onGradeChange: (grade: GradeKey) => void;
}

/**
 * How much is docked at the top right now: the global chrome (`--chrome-h`:
 * 56px phone / 100px from `md`) plus the sticky two-row control group on the
 * breakpoints where it renders (`offsetParent === null` while `lg:hidden`
 * hides it).
 * Jump-scroll and scrollspy both read this so no magic number can drift.
 */
function getStickyChromeHeight(): number {
  if (typeof document === "undefined") return 0;
  const root = document.documentElement;
  const styles = getComputedStyle(root);
  const rootFontSize = parseFloat(styles.fontSize) || 16;
  const chromeRem = parseFloat(styles.getPropertyValue("--chrome-h")) || 3.5;
  const bar = document.querySelector<HTMLElement>(
    '[data-slot="set-rarity-nav-sticky"]',
  );
  const barHeight =
    bar && bar.offsetParent !== null ? bar.getBoundingClientRect().height : 0;
  return chromeRem * rootFontSize + barHeight;
}

/** Keep nearby jumps calm, but never animate a long page traversal. */
export function getRarityScrollBehavior(
  distance: number,
  viewportHeight: number,
  prefersReducedMotion: boolean,
): ScrollBehavior {
  if (prefersReducedMotion) return "auto";
  return Math.abs(distance) > Math.max(viewportHeight, 1) * 2
    ? "auto"
    : "smooth";
}

/* ------------------------------------------------------------------ */
/*  Facet dropdown                                                     */
/* ------------------------------------------------------------------ */

type FilterOption = { value: string; label: ReactNode };

/** Compact facet dropdown for the toolbar — reads "<label> <selected>" and opens
 *  a small menu. Replaces the old full-width chip rows (เบส — chips felt cluttered). */
function FilterSelect({
  label,
  value,
  onChange,
  options,
  fullWidth,
  hideLabel,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: FilterOption[];
  fullWidth?: boolean;
  // When the label is shown as a header above the control, the trigger only
  // needs the selected value.
  hideLabel?: boolean;
}) {
  // Render the selected option's label ourselves — base-ui SelectValue shows the
  // raw value ("all") rather than the option label, so map it here.
  const current = options.find((o) => o.value === value)?.label ?? label;
  return (
    <Select value={value} onValueChange={(v) => onChange(v ?? "all")}>
      <SelectTrigger
        size="sm"
        className={cn(
          "gap-1.5 text-xs font-medium",
          fullWidth ? "w-full" : "shrink-0",
        )}
      >
        {!hideLabel && <span className="text-muted-foreground">{label}</span>}
        <span className="text-foreground">{current}</span>
      </SelectTrigger>
      <SelectContent
        align="start"
        alignItemWithTrigger={false}
        sideOffset={6}
        className="w-auto min-w-(--anchor-width) p-1"
      >
        {options.map((o) => (
          <SelectItem
            key={o.value}
            value={o.value}
            className="py-1.5 pr-7 pl-2.5 text-sm"
          >
            {o.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

/* ------------------------------------------------------------------ */
/*  Main component                                                     */
/* ------------------------------------------------------------------ */

export function SetDetailContent({
  groups,
  totalCards,
  grade,
  onGradeChange,
}: SetDetailContentProps) {
  const [activeType, setActiveType] = useState<string>("all");
  const [activeColor, setActiveColor] = useState<string>("all");
  // Mobile-only canonical FilterModal for the two facets above (เบส
  // 2026-08-27 — the two inline dropdowns cost a full toolbar row on phones;
  // this page's old keep-the-selects exception is retired). Desktop keeps the
  // sidebar selects, which don't compete for vertical space.
  const [filterOpen, setFilterOpen] = useState(false);
  const [changePeriod, setChangePeriod] = useState<ChangePeriod>("7d");
  // activeRarity = the section currently in view (scrollspy), NOT a filter —
  // the rarity rail is a jump-nav (เบส): click scrolls to that section.
  const [activeRarity, setActiveRarity] = useState<string>("");
  const sectionsRef = useRef<HTMLDivElement>(null);
  const lang = useUIStore((s) => s.language);

  const allCards = useMemo(() => groups.flatMap((g) => g.cards), [groups]);

  const availableTypes = useMemo(() => {
    const counts = new Map<string, number>();
    for (const c of allCards) {
      counts.set(c.cardType, (counts.get(c.cardType) ?? 0) + 1);
    }
    return CARD_TYPE_ORDER.filter((ty) => counts.has(ty)).map((ty) => ({
      value: ty,
      count: counts.get(ty)!,
    }));
  }, [allCards]);

  const availableColors = useMemo(() => {
    const present = new Set(allCards.map((c) => c.color));
    return CARD_COLORS.filter((cc) => present.has(cc.value));
  }, [allCards]);

  // type/color narrow which cards (and therefore which rarities) are available.
  const visibleGroups = useMemo(
    () =>
      getVisibleSetGroups(groups, { activeType, activeColor, grade }),
    [groups, activeType, activeColor, grade],
  );

  // Scrollspy — the rail highlights whichever rarity section is currently below
  // the docked chrome (the last one whose top has passed that line).
  useEffect(() => {
    const root = sectionsRef.current;
    if (!root) return;
    const onScroll = () => {
      const line = getStickyChromeHeight() + 24;
      const sections = root.querySelectorAll<HTMLElement>("[data-rarity]");
      let current = "";
      for (const s of sections) {
        if (s.getBoundingClientRect().top <= line) current = s.dataset.rarity ?? "";
        else break;
      }
      if (!current && sections.length) current = sections[0].dataset.rarity ?? "";
      setActiveRarity(current);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [visibleGroups]);

  if (totalCards === 0) {
    return <EmptyState mascot="kuma" title={t(lang, "noCardsInSet")} />;
  }

  // Every rarity section is always rendered (rarity is jump-nav, not a filter).
  // type/color narrow the cards within each section.
  const displayGroups = visibleGroups;
  const totalVisible = visibleGroups.reduce((s, g) => s + g.cards.length, 0);
  const adHeadingGroupIndex = getSetAdHeadingGroupIndex(
    displayGroups.map((group) => group.cards.length),
  );

  // Click a rarity → smooth-scroll its section to sit comfortably below whatever
  // is docked at the top (measured, not a magic number: the top chrome is 56px
  // on a phone and 100px from `md`; the rarity bar adds its own rendered height).
  const scrollToRarity = (rarity: string) => {
    const el = document.getElementById(`rar-${rarity}`);
    if (!el) return;
    const top = Math.max(
      0,
      el.getBoundingClientRect().top +
        window.scrollY -
        (getStickyChromeHeight() + 16),
    );
    const prefersReducedMotion =
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
    window.scrollTo({
      top,
      behavior: getRarityScrollBehavior(
        top - window.scrollY,
        window.innerHeight,
        prefersReducedMotion,
      ),
    });
  };

  // Filters are compact dropdowns (เบส — chips read as clutter): one option list
  // per facet, "all" first as the reset.
  const typeOptions: FilterOption[] = [
    { value: "all", label: t(lang, "allTab") },
    ...availableTypes.map((ct) => ({
      value: ct.value,
      label: getCardTypeLabel(ct.value, lang),
    })),
  ];
  const colorOptions: FilterOption[] = [
    { value: "all", label: t(lang, "allTab") },
    ...availableColors.map((cc) => ({
      value: cc.value,
      label: (
        <span className="flex items-center gap-1.5">
          <span className={cn("size-2 rounded-full", cc.dotClass)} />
          {cc.label[lang]}
        </span>
      ),
    })),
  ];

  const hasFacets = availableTypes.length > 1 || availableColors.length > 1;
  const activeFilterCount =
    (activeType !== "all" ? 1 : 0) + (activeColor !== "all" ? 1 : 0);
  const hasActiveCardFilters =
    activeFilterCount > 0 || !isRawGrade(grade);

  // Single-select facet chip inside the FilterModal — same visual grammar as
  // the home market modal's chips ("ทั้งหมด" first as the reset, one value per
  // facet, values apply live so Apply just closes).
  const facetChip = (
    o: FilterOption,
    current: string,
    onSelect: (v: string) => void,
  ) => {
    const active = current === o.value;
    return (
      <button
        key={o.value}
        type="button"
        aria-pressed={active}
        onClick={() => onSelect(o.value)}
        className={cn(
          "ease-chrome flex min-h-11 items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-medium lg:min-h-0",
          active
            ? "border-primary/40 bg-primary/5 text-primary"
            : "border-hair bg-background text-muted-foreground hover:text-foreground",
        )}
      >
        {o.label}
      </button>
    );
  };

  const rarityNav = visibleGroups.map((g) => ({
    value: g.rarity,
    count: g.cards.length,
  }));
  const selectedRarity =
    rarityNav.find((item) => item.value === activeRarity) ?? rarityNav[0] ?? null;

  const rarityButton = (rt: { value: string; count: number }) => {
    const active = activeRarity === rt.value;
    return (
      <button
        key={rt.value}
        type="button"
        onClick={() => scrollToRarity(rt.value)}
        aria-current={active ? "true" : undefined}
        className={cn(
          "ease-chrome flex w-full items-center justify-between gap-2 rounded-lg px-2 py-1.5 transition-colors",
          active ? "bg-[var(--p-honey-soft)]" : "hover:bg-muted",
        )}
      >
        {/* Minimal rail row: a small rarity-colour dot + plain code (no pill). */}
        <span className="flex min-w-0 items-center gap-2">
          <span
            aria-hidden
            className={cn(
              "size-2 shrink-0 rounded-full",
              RARITY_BAR_COLOR[rt.value] ?? "bg-muted-foreground/40",
            )}
          />
          <span
            className={cn(
              "truncate text-xs font-medium",
              active ? "text-primary" : "text-foreground/80",
            )}
          >
            {rt.value}
          </span>
        </span>
        <span
          className={cn(
            "shrink-0 text-xs tabular-nums",
            active ? "text-primary/70" : "text-muted-foreground/40",
          )}
        >
          {rt.count}
        </span>
      </button>
    );
  };

  return (
    <div className="lg:flex lg:gap-8">
      {/* ── LEFT sidebar (desktop) — ALL controls live here (เบส): facet filters
          + period + the rarity jump-nav. Sticky so it follows the card wall;
          the right column is then pure cards. ── */}
      <aside className="hidden w-52 shrink-0 lg:block">
        <div className="no-sb sticky top-32 max-h-[calc(100vh-9rem)] space-y-4 overflow-y-auto pr-0.5">
          {/* Each control carries its own label header above it. */}
          {availableTypes.length > 1 && (
            <div className="space-y-1.5">
              <p className="text-eyebrow px-0.5">{t(lang, "type")}</p>
              <FilterSelect
                fullWidth
                hideLabel
                label={t(lang, "type")}
                value={activeType}
                onChange={setActiveType}
                options={typeOptions}
              />
            </div>
          )}
          {availableColors.length > 1 && (
            <div className="space-y-1.5">
              <p className="text-eyebrow px-0.5">{t(lang, "color")}</p>
              <FilterSelect
                fullWidth
                hideLabel
                label={t(lang, "color")}
                value={activeColor}
                onChange={setActiveColor}
                options={colorOptions}
              />
            </div>
          )}

          <div className="space-y-1.5">
            <p className="text-eyebrow px-0.5">{t(lang, "chooseGrade")}</p>
            <GradeControl value={grade} onChange={onGradeChange} />
          </div>

          {/* Period (%-change window) */}
          {isRawGrade(grade) && (
            <div className="space-y-1.5">
              <p className="text-eyebrow px-0.5">{t(lang, "pricePeriod")}</p>
              <SegmentedControl
                size="sm"
                variant="pill"
                fullWidth
                leadingIcon={TrendingUpDown}
                options={CHANGE_PERIODS.map((p) => ({ value: p, label: p }))}
                value={changePeriod}
                onChange={setChangePeriod}
                ariaLabel={t(lang, "pricePeriod")}
              />
            </div>
          )}

          {/* Rarity jump-nav group (scrollspy highlights the section in view) */}
          <nav aria-label={t(lang, "rarity")} className="space-y-1.5 pt-1">
            <p className="text-eyebrow flex items-center justify-between px-0.5">
              <span>{t(lang, "rarity")}</span>
              <span className="tabular-nums text-muted-foreground/40">{totalVisible}</span>
            </p>
            <div className="space-y-0.5">
              {rarityNav.map((rt) => rarityButton(rt))}
            </div>
          </nav>
        </div>
      </aside>

      {/* ── RIGHT (desktop) / full width (mobile) ── */}
      <div ref={sectionsRef} className="min-w-0 flex-1">
        {/* Canonical facet modal (opened from the mobile row only — the desktop
            sidebar keeps its inline selects). Chip taps apply immediately, so
            Apply just closes; Reset returns both facets to "all". */}
        <FilterModal
          open={filterOpen}
          onOpenChange={setFilterOpen}
          onReset={() => {
            setActiveType("all");
            setActiveColor("all");
          }}
          resetDisabled={activeFilterCount === 0}
        >
          {availableTypes.length > 1 && (
            <div>
              <span className="mb-1.5 block text-eyebrow">{t(lang, "type")}</span>
              <div className="flex flex-wrap gap-1.5">
                {typeOptions.map((o) => facetChip(o, activeType, setActiveType))}
              </div>
            </div>
          )}
          {availableColors.length > 1 && (
            <div>
              <span className="mb-1.5 block text-eyebrow">{t(lang, "color")}</span>
              <div className="flex flex-wrap gap-1.5">
                {colorOptions.map((o) => facetChip(o, activeColor, setActiveColor))}
              </div>
            </div>
          )}
        </FilterModal>

        {/* MOBILE/TABLET: both control rows dock together under the global chrome
            so the selected grade stays available while browsing the card wall.
            One sticky wrapper also gives scrollspy a single measured offset. */}
        <div
          data-slot="set-rarity-nav-sticky"
          className="sticky top-[var(--chrome-h)] z-sticky -mx-5 border-b border-hair bg-background/95 px-5 py-2 backdrop-blur-sm md:-mx-6 md:px-6 lg:hidden"
        >
          {/* The canonical grade lens owns the full first line so all five grades
              remain visible at both 390px and the 768px boundary. */}
          <div data-slot="set-mobile-grade-row" className="mb-2">
            <GradeControl
              value={grade}
              onChange={onGradeChange}
              className="sm:w-full"
            />
          </div>

          {/* Rarity uses a Select instead of the clipped horizontal chip rail;
              period and facets keep the same behavior as the desktop controls. */}
          <div
            data-slot="set-mobile-control-row"
            className="flex min-w-0 items-center gap-2"
          >
            {isRawGrade(grade) && (
              <Select
                value={changePeriod}
                onValueChange={(value) => {
                  if (value) setChangePeriod(value);
                }}
              >
                <SelectTrigger
                  size="sm"
                  aria-label={t(lang, "pricePeriod")}
                  className="min-h-11 w-[5.25rem] shrink-0 px-2.5 sm:min-h-11!"
                >
                  <TrendingUpDown aria-hidden className="size-3.5 text-muted-foreground" />
                  <span className="text-label text-foreground">{changePeriod}</span>
                </SelectTrigger>
                <SelectContent
                  align="start"
                  alignItemWithTrigger={false}
                  sideOffset={6}
                  className="p-1"
                >
                  {CHANGE_PERIODS.map((period) => (
                    <SelectItem
                      key={period}
                      value={period}
                      className="min-h-11 py-2 pr-7 pl-2.5 sm:min-h-11!"
                    >
                      {period}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            {selectedRarity && (
              <Select
                value={selectedRarity.value}
                onValueChange={(value) => {
                  if (value) scrollToRarity(value);
                }}
              >
                <SelectTrigger
                  size="sm"
                  aria-label={t(lang, "rarity")}
                  className="min-h-11 min-w-0 flex-1 px-2.5 sm:min-h-11!"
                >
                  <span className="flex min-w-0 items-center gap-1.5">
                    <RarityBadge rarity={selectedRarity.value} size="sm" />
                    <span className="text-meta shrink-0 tabular-nums">
                      {selectedRarity.count}
                    </span>
                  </span>
                </SelectTrigger>
                <SelectContent
                  align="start"
                  alignItemWithTrigger={false}
                  sideOffset={6}
                  className="min-w-40 p-1"
                >
                  {rarityNav.map((item) => (
                    <SelectItem
                      key={item.value}
                      value={item.value}
                      className="min-h-11 py-2 pr-7 pl-2.5 sm:min-h-11!"
                    >
                      <RarityBadge rarity={item.value} size="sm" />
                      <span className="text-meta tabular-nums">{item.count}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            {hasFacets && (
              <FilterButton
                aria-label={t(lang, "filter")}
                aria-expanded={filterOpen}
                onClick={() => setFilterOpen(true)}
                active={filterOpen || activeFilterCount > 0}
                count={activeFilterCount}
                className="shrink-0 md:h-11! md:min-w-11!"
              >
                {t(lang, "filter")}
              </FilterButton>
            )}
          </div>
        </div>

        <div className="space-y-8 pt-4 lg:pt-0">
          {displayGroups.map((g, groupIndex) => (
            <Fragment key={g.rarity}>
              {groupIndex === adHeadingGroupIndex && (
                <AdInventorySlot zone="set-detail-before-rarity" />
              )}
              <section
                id={`rar-${g.rarity}`}
                data-rarity={g.rarity}
                className="scroll-mt-32"
              >
                {/* centered section heading (เบส) — name + RarityBadge + count,
                    flanked by hairlines on both sides. English name only: the
                    Thai gloss ("พาราเรลซีเคร็ทแรร์") made the heading wrap on
                    phones, so เบส removed it here (2026-08-27) — the Thai
                    rarity names still render in this page's drop-rate table,
                    so the keyword stays on the page. The first section links
                    out to the rarity guide once. */}
                <div className="mb-5 flex items-center gap-3 sm:gap-4">
                  <span aria-hidden className="h-px flex-1 bg-hair" />
                  {/* min-w-0 (not shrink-0): long names ("Parallel Secret
                      Rare") can still overflow a phone if the block refuses
                      to shrink — let the heading wrap instead. */}
                  <div className="flex min-w-0 items-center gap-2">
                    <h2 className="text-h4 min-w-0 text-center">{g.name}</h2>
                    <RarityBadge rarity={g.rarity} size="sm" />
                    <span className="text-meta tabular-nums">{g.cards.length}</span>
                  </div>
                  <span aria-hidden className="h-px flex-1 bg-hair" />
                </div>
                {groupIndex === 0 && (
                  <p className="text-meta -mt-3 mb-5 text-center">
                    <Link
                      href="/guide/rarities"
                      className="underline-offset-2 hover:text-foreground hover:underline"
                    >
                      {setRarityGuideLinkLabel(lang)}
                    </Link>
                  </p>
                )}
                <div className="grid grid-cols-3 gap-x-2.5 gap-y-4 sm:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
                  {g.cards.map((c) => (
                    <SetCardTile
                      key={c.id}
                      card={c}
                      changePeriod={changePeriod}
                      grade={grade}
                    />
                  ))}
                </div>
              </section>
            </Fragment>
          ))}

          {displayGroups.length === 0 && (
            <EmptyState
              variant="plain"
              size="sm"
              title={t(lang, "noData")}
              action={
                hasActiveCardFilters ? (
                  <Button
                    type="button"
                    variant="outline"
                    className="sm:min-h-11!"
                    onClick={() => {
                      setActiveType("all");
                      setActiveColor("all");
                      onGradeChange("raw");
                    }}
                  >
                    {t(lang, "clearAllFilters")}
                  </Button>
                ) : undefined
              }
            />
          )}
        </div>
      </div>
    </div>
  );
}
