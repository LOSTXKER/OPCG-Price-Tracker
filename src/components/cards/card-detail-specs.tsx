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

// Which gameplay-stat fields are meaningful for this card type. LEADER omits
// counter; EVENT/STAGE have no power/counter/life. Within an allowed type we
// still drop any field that's actually null (below) so the sheet never shows
// empty "—" rows.
function getRelevantTiles(cardType: string) {
  const upper = cardType.toUpperCase()
  if (upper === "LEADER") return { power: true, counter: false, life: true }
  if (upper === "EVENT" || upper === "STAGE") return { power: false, counter: false, life: false }
  return { power: true, counter: true, life: true }
}

interface SpecRow {
  label: string
  icon: React.ComponentType<{ className?: string }>
  value: React.ReactNode
  numeric?: boolean
  emphasis?: boolean
}

/**
 * Card spec sheet (left column, beside the image). A clean label–value list:
 * categorical fields read as text, gameplay numbers use the tabular price font,
 * null fields are dropped entirely, and the long trait gets its own full-width
 * row so it never gets crushed into a half cell.
 */
export function CardDetailSpecs({ card, lang }: CardDetailSpecsProps) {
  const colorValue = card.colorEn ?? card.color
  const swatchClass = getColorSwatchClass(card.color) ?? getColorSwatchClass(card.colorEn)
  const allow = getRelevantTiles(card.cardType)

  const rows: SpecRow[] = [
    { label: t(lang, "type"), icon: Swords, value: card.cardType },
    {
      label: t(lang, "color"),
      icon: Palette,
      value: (
        <span className="inline-flex items-center gap-1.5">
          {swatchClass && (
            <span aria-hidden className={cn("inline-block size-2.5 rounded-full ring-1 ring-border/60", swatchClass)} />
          )}
          {colorValue}
        </span>
      ),
    },
  ]
  if (card.cost != null) rows.push({ label: t(lang, "cost"), icon: Coins, value: card.cost, numeric: true })
  if (allow.power && card.power != null) rows.push({ label: t(lang, "power"), icon: Zap, value: card.power, numeric: true, emphasis: true })
  if (allow.counter && card.counter != null) rows.push({ label: t(lang, "counter"), icon: Shield, value: card.counter, numeric: true })
  if (allow.life && card.life != null) rows.push({ label: t(lang, "life"), icon: Heart, value: card.life, numeric: true })
  if (card.attribute) rows.push({ label: t(lang, "attribute"), icon: Crosshair, value: card.attribute })

  return (
    <div className="hairline-t pt-4">
      <p className="mb-1 text-meta">{t(lang, "details")}</p>
      <dl>
        {rows.map((r, i) => {
          const Icon = r.icon
          return (
            <div key={r.label} className={cn("flex items-center justify-between gap-3 py-2.5", i > 0 && "hairline-t")}>
              <dt className="text-meta flex shrink-0 items-center gap-1.5">
                <Icon className="size-3.5" />
                {r.label}
              </dt>
              <dd
                className={cn(
                  "min-w-0 truncate text-right text-foreground",
                  r.numeric && "font-price tabular-nums",
                  r.emphasis ? "text-base font-bold" : "text-sm font-semibold",
                )}
              >
                {r.value}
              </dd>
            </div>
          )
        })}
      </dl>
      {card.trait && (
        <div className="hairline-t mt-1 pt-3">
          <p className="text-meta mb-1 flex items-center gap-1.5">
            <Fingerprint className="size-3.5" />
            {t(lang, "trait")}
          </p>
          <p className="text-sm leading-relaxed text-foreground">{card.trait}</p>
        </div>
      )}
    </div>
  )
}
