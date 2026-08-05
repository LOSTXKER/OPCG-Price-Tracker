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
import {
  rarityHeadingLabel,
  setRarityGuideLinkLabel,
} from "@/lib/seo/copy/sets";
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
 * 56px phone / 100px from `md`) plus the sticky rarity bar on the breakpoints
 * where it renders (`offsetParent === null` while `lg:hidden` hides it).
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
  const [changePeriod, setChangePeriod] = useState<ChangePeriod>("7d");
  // activeRarity = the section currently in view (scrollspy), NOT a filter —
  // the rarity rail is a jump-nav (เบส): click scrolls to that section.
  const [activeRarity, setActiveRarity] = useState<string>("");
  const sectionsRef = useRef<HTMLDivElement>(null);
  const chipsRef = useRef<HTMLElement>(null);
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

  // A set can carry a dozen rarities, so the docked chip strip keeps the section
  // you are actually reading in view. Only the strip's own horizontal scroll
  // moves (never `scrollIntoView`, which would yank the page vertically).
  useEffect(() => {
    const nav = chipsRef.current;
    if (!nav || !activeRarity) return;
    const chip = nav.querySelector<HTMLElement>(
      `[data-rarity-chip="${activeRarity}"]`,
    );
    if (!chip) return;
    const navRect = nav.getBoundingClientRect();
    const chipRect = chip.getBoundingClientRect();
    const fullyVisible =
      chipRect.left >= navRect.left + 4 && chipRect.right <= navRect.right - 4;
    if (fullyVisible) return;
    nav.scrollTo({
      left:
        nav.scrollLeft +
        (chipRect.left - navRect.left) -
        (navRect.width - chipRect.width) / 2,
      behavior: "smooth",
    });
  }, [activeRarity]);

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
  // is docked at the top (measured, not a magic 132: the top chrome is 56px on a
  // phone and 100px from `md`, and the sticky rarity bar adds its own height on
  // the breakpoints where it renders).
  const scrollToRarity = (rarity: string) => {
    const el = document.getElementById(`rar-${rarity}`);
    if (!el) return;
    window.scrollTo({
      top:
        el.getBoundingClientRect().top +
        window.scrollY -
        (getStickyChromeHeight() + 16),
      behavior: "smooth",
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

  const rarityNav = visibleGroups.map((g) => ({
    value: g.rarity,
    count: g.cards.length,
  }));

  const rarityButton = (rt: { value: string; count: number }, variant: "rail" | "chip") => {
    const active = activeRarity === rt.value;
    return (
      <button
        key={rt.value}
        type="button"
        onClick={() => scrollToRarity(rt.value)}
        aria-current={active ? "true" : undefined}
        data-rarity-chip={variant === "chip" ? rt.value : undefined}
        className={cn(
          "ease-chrome flex items-center gap-1.5 transition-colors",
          variant === "rail"
            ? cn(
                "w-full justify-between gap-2 rounded-lg px-2 py-1.5",
                active ? "bg-[var(--p-honey-soft)]" : "hover:bg-muted",
              )
            : cn(
                "shrink-0 rounded-full px-2.5 py-1.5",
                active ? "bg-[var(--p-honey-soft)]" : "bg-muted/60",
              ),
        )}
      >
        {variant === "rail" ? (
          // Minimal rail row: a small rarity-colour dot + plain code (no pill).
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
        ) : (
          <RarityBadge rarity={rt.value} size="sm" />
        )}
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
              {rarityNav.map((rt) => rarityButton(rt, "rail"))}
            </div>
          </nav>
        </div>
      </aside>

      {/* ── RIGHT (desktop) / full width (mobile) ── */}
      <div ref={sectionsRef} className="min-w-0 flex-1">
        {/* MOBILE/TABLET controls (desktop uses the sidebar): filters + period
            on one wrapping row, then the rarity jump-chips. */}
        <div className="mb-3 lg:hidden">
          <div className="flex flex-wrap items-center gap-2">
            <GradeControl value={grade} onChange={onGradeChange} />
            {availableTypes.length > 1 && (
              <FilterSelect
                label={t(lang, "type")}
                value={activeType}
                onChange={setActiveType}
                options={typeOptions}
              />
            )}
            {availableColors.length > 1 && (
              <FilterSelect
                label={t(lang, "color")}
                value={activeColor}
                onChange={setActiveColor}
                options={colorOptions}
              />
            )}
            {isRawGrade(grade) && (
              <SegmentedControl
                size="sm"
                variant="pill"
                leadingIcon={TrendingUpDown}
                options={CHANGE_PERIODS.map((p) => ({ value: p, label: p }))}
                value={changePeriod}
                onChange={setChangePeriod}
                ariaLabel={t(lang, "pricePeriod")}
              />
            )}
          </div>
        </div>

        {/* Rarity jump-nav — STICKY under the top chrome so it follows the card
            wall on the way down (เบส), the same job the desktop sidebar rail
            already does. It has to be a direct child of the tall sections
            container: inside the short filters block a sticky element would
            unstick the moment that block scrolled past. Same docking treatment
            as the watchlist selection bar. */}
        <div
          data-slot="set-rarity-nav-sticky"
          className="sticky top-[var(--chrome-h)] z-sticky -mx-5 border-b border-hair bg-background/95 px-5 py-2 backdrop-blur-sm md:-mx-6 md:px-6 lg:hidden"
        >
          <nav
            ref={chipsRef}
            aria-label={t(lang, "rarity")}
            className="no-sb flex items-center gap-1.5 overflow-x-auto"
          >
            {rarityNav.map((rt) => rarityButton(rt, "chip"))}
          </nav>
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
                    flanked by hairlines on both sides. The Thai gloss next to
                    the English rarity name is the SEO hook ("ซีเคร็ทแรร์"), and
                    the first section links out to the rarity guide once. */}
                <div className="mb-5 flex items-center gap-3 sm:gap-4">
                  <span aria-hidden className="h-px flex-1 bg-hair" />
                  {/* min-w-0 (not shrink-0): the heading now carries the Thai
                      gloss too, which is long enough to overflow a phone if the
                      block refuses to shrink — let it wrap instead. */}
                  <div className="flex min-w-0 items-center gap-2">
                    <h2 className="text-h4 min-w-0 text-center">
                      {rarityHeadingLabel(lang, g.rarity, g.name)}
                    </h2>
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
            <div className="py-16 text-center text-sm text-muted-foreground">
              {t(lang, "noData")}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
