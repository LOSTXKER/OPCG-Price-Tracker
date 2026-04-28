import {
  Swords,
  Palette,
  Coins,
  Zap,
  Shield,
  Heart,
  Crosshair,
  Fingerprint,
} from "lucide-react"

import { t } from "@/lib/i18n"
import type { Language } from "@/stores/ui-store"
import { cn } from "@/lib/utils"

interface CardDetailSpecsProps {
  card: {
    cardType: string
    color: string
    colorEn?: string | null
    cost?: number | null
    power?: number | null
    counter?: number | null
    life?: number | null
    attribute?: string | null
    trait?: string | null
  }
  lang: Language
}

// Map color tokens (EN + JP) to a tailwind background class for the swatch.
// Multi-color cards may use "/" or "・" as separator — we pick the first chunk.
const COLOR_SWATCH: Record<string, string> = {
  RED: "bg-red-500",
  BLUE: "bg-blue-500",
  GREEN: "bg-emerald-500",
  PURPLE: "bg-purple-500",
  BLACK: "bg-zinc-800",
  YELLOW: "bg-yellow-400",
  WHITE: "bg-zinc-200",
  // Japanese tokens
  赤: "bg-red-500",
  青: "bg-blue-500",
  緑: "bg-emerald-500",
  紫: "bg-purple-500",
  黒: "bg-zinc-800",
  黄: "bg-yellow-400",
  白: "bg-zinc-200",
}

function getColorSwatchClass(raw: string | null | undefined): string | null {
  if (!raw) return null
  const first = raw.split(/[\s/・,&]+/).filter(Boolean)[0]
  if (!first) return null
  const upper = first.toUpperCase()
  return COLOR_SWATCH[upper] ?? COLOR_SWATCH[first] ?? null
}

interface SpecTileProps {
  label: string
  value: string | number | null | undefined
  icon: React.ComponentType<{ className?: string }>
  swatchClass?: string | null
  emphasis?: boolean
}

function SpecTile({
  label,
  value,
  icon: Icon,
  swatchClass,
  emphasis,
}: SpecTileProps) {
  const isEmpty = value == null || value === ""
  return (
    <div className="rounded-lg bg-muted/30 px-3 py-2.5">
      <p className="flex items-center gap-1 text-meta">
        <Icon className="size-3" />
        {label}
      </p>
      <p
        className={cn(
          "mt-0.5 flex items-center gap-1.5 font-price tabular-nums",
          emphasis ? "text-base font-semibold" : "text-sm font-semibold",
          // Soften empty placeholders so populated stats stand out and the
          // tile doesn't visually shout "no data".
          isEmpty && "font-normal text-muted-foreground/30",
        )}
      >
        {swatchClass && !isEmpty && (
          <span
            aria-hidden
            className={cn(
              "inline-block size-3 rounded-full ring-1 ring-border/60",
              swatchClass,
            )}
          />
        )}
        {isEmpty ? "—" : value}
      </p>
    </div>
  )
}

// Decide which spec fields are meaningful for this card. CHARACTER cards use
// every field; LEADER omits counter (leaders can't counter); EVENT and STAGE
// don't have power / counter / life so we hide those tiles instead of
// rendering empty `—` placeholders that look like missing data.
function getRelevantTiles(cardType: string) {
  const upper = cardType.toUpperCase()
  if (upper === "LEADER") {
    return { power: true, counter: false, life: true }
  }
  if (upper === "EVENT" || upper === "STAGE") {
    return { power: false, counter: false, life: false }
  }
  // CHARACTER and any unknown type — show full set.
  return { power: true, counter: true, life: true }
}

export function CardDetailSpecs({ card, lang }: CardDetailSpecsProps) {
  const colorValue = card.colorEn ?? card.color
  const swatchClass =
    getColorSwatchClass(card.color) ?? getColorSwatchClass(card.colorEn)
  const tiles = getRelevantTiles(card.cardType)

  // Collect visible tiles so the grid auto-sizes (no orphan empty cells).
  const visible: Array<SpecTileProps> = [
    { label: t(lang, "type"), value: card.cardType, icon: Swords },
    {
      label: t(lang, "color"),
      value: colorValue,
      icon: Palette,
      swatchClass,
    },
    { label: t(lang, "cost"), value: card.cost, icon: Coins },
  ]
  if (tiles.power) {
    visible.push({
      label: t(lang, "power"),
      value: card.power,
      icon: Zap,
      emphasis: card.power != null,
    })
  }
  if (tiles.counter) {
    visible.push({
      label: t(lang, "counter"),
      value: card.counter,
      icon: Shield,
    })
  }
  if (tiles.life) {
    visible.push({ label: t(lang, "life"), value: card.life, icon: Heart })
  }

  return (
    <div className="panel p-5">
      <p className="mb-3 text-meta">{t(lang, "details")}</p>
      <div
        className={cn(
          "grid gap-2",
          // 3 cols on mobile, scale up to match number of tiles on desktop
          // so we don't end up with a half-empty row.
          visible.length <= 3 ? "grid-cols-3" : "grid-cols-3 sm:grid-cols-6",
        )}
      >
        {visible.map((tile) => (
          <SpecTile key={tile.label} {...tile} />
        ))}
      </div>
      {(card.attribute || card.trait) && (
        <div className="mt-2 grid grid-cols-2 gap-2">
          {card.attribute && (
            <div className="rounded-lg bg-muted/30 px-3 py-2.5">
              <p className="flex items-center gap-1 text-meta">
                <Crosshair className="size-3" />
                {t(lang, "attribute")}
              </p>
              <p className="mt-0.5 text-sm">{card.attribute}</p>
            </div>
          )}
          {card.trait && (
            <div className="rounded-lg bg-muted/30 px-3 py-2.5">
              <p className="flex items-center gap-1 text-meta">
                <Fingerprint className="size-3" />
                {t(lang, "trait")}
              </p>
              <p className="mt-0.5 text-sm">{card.trait}</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
