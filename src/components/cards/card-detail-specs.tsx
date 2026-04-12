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

export function CardDetailSpecs({ card, lang }: CardDetailSpecsProps) {
  const effectText = getCardEffect(lang, card)

  return (
    <>
      <div className="panel p-5">
        <p className="mb-3 text-xs text-muted-foreground">{t(lang, "details")}</p>
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
          {[
            { label: t(lang, "type"), value: card.cardType, icon: Swords },
            { label: t(lang, "color"), value: card.colorEn ?? card.color, icon: Palette },
            { label: t(lang, "cost"), value: card.cost, icon: Coins },
            { label: t(lang, "power"), value: card.power, icon: Zap },
            { label: t(lang, "counter"), value: card.counter, icon: Shield },
            { label: t(lang, "life"), value: card.life, icon: Heart },
          ].map((s) => (
            <div key={s.label} className="rounded-lg bg-muted/30 px-3 py-2.5">
              <p className="flex items-center gap-1 text-xs text-muted-foreground">
                <s.icon className="size-3" />
                {s.label}
              </p>
              <p className="mt-0.5 font-price text-sm font-semibold">{s.value ?? "—"}</p>
            </div>
          ))}
        </div>
        {(card.attribute || card.trait) && (
          <div className="mt-2 grid grid-cols-2 gap-2">
            {card.attribute && (
              <div className="rounded-lg bg-muted/30 px-3 py-2.5">
                <p className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Crosshair className="size-3" />
                  {t(lang, "attribute")}
                </p>
                <p className="mt-0.5 text-sm">{card.attribute}</p>
              </div>
            )}
            {card.trait && (
              <div className="rounded-lg bg-muted/30 px-3 py-2.5">
                <p className="flex items-center gap-1 text-xs text-muted-foreground">
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
          <p className="mb-2 text-xs text-muted-foreground">{t(lang, "effect")}</p>
          <div className="break-words text-sm leading-relaxed whitespace-pre-wrap">
            {effectText}
          </div>
        </div>
      )}
    </>
  )
}
