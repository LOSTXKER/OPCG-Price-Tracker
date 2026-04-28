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

import { t, getCardEffect } from "@/lib/i18n"
import type { Language } from "@/stores/ui-store"
import { cn } from "@/lib/utils"
import { CardEffectText } from "./card-effect-text"

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
    effectJp?: string | null
    effectEn?: string | null
    effectTh?: string | null
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
          "mt-0.5 flex items-center gap-1.5 font-price font-semibold",
          emphasis ? "text-base" : "text-sm",
          isEmpty && "text-muted-foreground/40",
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

export function CardDetailSpecs({ card, lang }: CardDetailSpecsProps) {
  const effectText = getCardEffect(lang, card)
  const colorValue = card.colorEn ?? card.color
  const swatchClass =
    getColorSwatchClass(card.color) ?? getColorSwatchClass(card.colorEn)

  return (
    <>
      <div className="panel p-5">
        <p className="mb-3 text-meta">{t(lang, "details")}</p>
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
          <SpecTile label={t(lang, "type")} value={card.cardType} icon={Swords} />
          <SpecTile
            label={t(lang, "color")}
            value={colorValue}
            icon={Palette}
            swatchClass={swatchClass}
          />
          <SpecTile label={t(lang, "cost")} value={card.cost} icon={Coins} />
          <SpecTile
            label={t(lang, "power")}
            value={card.power}
            icon={Zap}
            emphasis={card.power != null}
          />
          <SpecTile label={t(lang, "counter")} value={card.counter} icon={Shield} />
          <SpecTile label={t(lang, "life")} value={card.life} icon={Heart} />
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

      {effectText && (
        <div className="panel p-5">
          <p className="mb-2 text-meta">{t(lang, "effect")}</p>
          <CardEffectText text={effectText} />
        </div>
      )}
    </>
  )
}
