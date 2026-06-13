import Image from "next/image";
import Link from "next/link";
import { Lock, Plus, X } from "lucide-react";

import { getCardName, t, type Language } from "@/lib/i18n";
import type { CompareCard } from "@/hooks/use-compare-data";
import { COMPARE_COLS_VAR } from "./compare-section";

/** Card codes in the database carry a parallel / reprint suffix like
 * `OP13-118_p3` or `OP01-001_r1`. Those suffixes are internal plumbing —
 * users recognise the base code, and the variant is already surfaced in
 * the "Variant" row. Strip everything from the first underscore onwards
 * so the rail shows a clean, familiar identifier. */
function displayCardCode(code: string): string {
  const idx = code.indexOf("_");
  return idx === -1 ? code : code.slice(0, idx);
}

/* ────────────────────────────────────────────────────────── */
/*  Card rail — slim sticky product selector (Apple style)    */
/* ────────────────────────────────────────────────────────── */

export function CardRail({
  cards,
  colors,
  lang,
  onRemove,
  totalLanes,
  canUpsell,
  onAddClick,
  onUpgradeClick,
}: {
  cards: CompareCard[];
  colors: string[];
  lang: Language;
  onRemove: (code: string) => void;
  totalLanes: number;
  canUpsell: boolean;
  onAddClick: () => void;
  onUpgradeClick: () => void;
}) {
  const addLabel = t(lang, "addCardToCompare");
  const upgradeLabel = t(lang, "upgradeToUnlock");

  // Each lane gets a role: a filled card, an empty tier slot (user can add),
  // or the upgrade teaser (sits just past the tier cap).
  const lanes = Array.from({ length: totalLanes }, (_, i) => {
    if (i < cards.length) {
      return { kind: "card" as const, card: cards[i], index: i };
    }
    if (canUpsell && i === totalLanes - 1) {
      return { kind: "upgrade" as const, index: i };
    }
    return { kind: "add" as const, index: i };
  });

  return (
    <div>
      <div
        className="mx-auto grid w-full max-w-fit items-stretch gap-3 sm:gap-6"
        style={{ gridTemplateColumns: `var(${COMPARE_COLS_VAR})` }}
      >
          {lanes.map((lane) => {
            if (lane.kind === "card") {
              const { card, index } = lane;
              return (
                <div
                  key={card.cardCode}
                  className="group/slot flex flex-col items-center gap-3 sm:gap-4"
                >
                  <div className="relative aspect-[5/7] w-full max-w-[180px]">
                    <Link
                      href={`/cards/${card.cardCode}`}
                      className="block h-full w-full"
                    >
                      <div className="relative h-full w-full overflow-hidden rounded-xl border bg-muted shadow-sm transition-shadow hover:shadow-md">
                        {card.imageUrl ? (
                          <Image
                            src={card.imageUrl}
                            alt={getCardName(lang, card)}
                            fill
                            className="object-cover"
                            sizes="(min-width: 640px) 180px, 40vw"
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center text-meta">
                            {displayCardCode(card.cardCode)}
                          </div>
                        )}
                        <span
                          aria-hidden
                          className="absolute inset-x-0 top-0 h-[3px]"
                          style={{ backgroundColor: colors[index % colors.length] }}
                        />
                      </div>
                    </Link>
                    <button
                      type="button"
                      onClick={() => onRemove(card.cardCode)}
                      className="absolute right-2 top-2 inline-flex size-9 items-center justify-center rounded-full bg-background text-muted-foreground shadow-md ring-1 ring-border transition-colors hover:bg-destructive hover:text-destructive-foreground hover:ring-destructive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      aria-label={t(lang, "removeFromCompare")}
                    >
                      <X className="size-4" />
                    </button>
                  </div>
                  <div className="flex w-full flex-col items-center gap-1">
                    <p className="line-clamp-2 max-w-full text-center text-sm font-semibold leading-snug sm:text-base">
                      {getCardName(lang, card)}
                    </p>
                    <p className="font-mono text-xs text-muted-foreground">
                      {displayCardCode(card.cardCode)}
                    </p>
                  </div>
                </div>
              );
            }

            const isUpgrade = lane.kind === "upgrade";
            const label = isUpgrade ? upgradeLabel : addLabel;
            const onClick = isUpgrade ? onUpgradeClick : onAddClick;
            return (
              <button
                key={`slot-${lane.index}`}
                type="button"
                onClick={onClick}
                className="group/add flex flex-col items-center gap-3 text-center sm:gap-4"
                aria-label={label}
              >
                <div className="relative aspect-[5/7] w-full max-w-[180px]">
                  <div className="flex h-full w-full flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-muted-foreground/30 bg-muted/10 text-muted-foreground transition-colors group-hover/add:border-primary/50 group-hover/add:bg-primary/5 group-hover/add:text-primary">
                    <span className="flex size-10 items-center justify-center rounded-full border border-current/30 bg-background/60 transition-transform group-hover/add:scale-110">
                      {isUpgrade ? (
                        <Lock className="size-5" />
                      ) : (
                        <Plus className="size-5" />
                      )}
                    </span>
                  </div>
                </div>
                <div className="flex w-full flex-col items-center gap-1">
                  <p className="line-clamp-2 max-w-full text-center text-sm font-semibold leading-snug text-muted-foreground transition-colors group-hover/add:text-primary sm:text-base">
                    {label}
                  </p>
                </div>
              </button>
            );
          })}
      </div>
    </div>
  );
}
