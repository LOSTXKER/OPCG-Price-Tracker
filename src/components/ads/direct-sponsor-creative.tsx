import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Surface } from "@/components/ui/surface"
import { t, type Language } from "@/lib/i18n"
import { cn } from "@/lib/utils"

import type { DirectCampaign } from "./direct-campaigns"
import {
  AD_FORMAT_CLASS,
  type AdInventoryDefinition,
} from "./inventory"

export function DirectSponsorCreative({
  definition,
  campaign,
  lang,
  className,
}: {
  definition: AdInventoryDefinition
  campaign: DirectCampaign
  lang: Language
  className?: string
}) {
  const isRectangle = definition.format === "RECTANGLE"
  const isAnchor = definition.format === "ANCHOR"
  const label = `${t(lang, "adSponsoredLabel")} · ${campaign.advertiser}`
  const title = campaign.headline[lang]
  const body = campaign.body[lang]
  const cta = campaign.cta[lang]

  const ctaLink = (
    <a
      href={campaign.href}
      target="_blank"
      rel="sponsored noopener noreferrer"
      aria-label={`${cta} · ${t(lang, "adOpenNewWindow")}`}
    />
  )

  return (
    <aside
      aria-label={label}
      data-ad-kind="DIRECT"
      data-ad-zone={definition.zone}
      data-ad-format={definition.format}
      data-ad-size={`${definition.mobileSize}|${definition.desktopSize}`}
      data-direct-status="ACTIVE"
      className={cn(AD_FORMAT_CLASS[definition.format], className)}
    >
      <Surface
        variant="outline"
        padding="none"
        className="h-full w-full overflow-hidden border border-primary/30 bg-primary/5 shadow-none"
      >
        <div
          className={cn(
            "flex h-full min-w-0 gap-3 p-3 sm:gap-4",
            isRectangle
              ? "flex-col items-start p-5"
              : isAnchor
                ? "items-center justify-between gap-2 p-2 sm:gap-4 sm:p-3"
                : "items-center justify-between",
          )}
        >
          <div className="min-w-0 max-w-2xl">
            {isRectangle ? (
              <Badge variant="default">{label}</Badge>
            ) : isAnchor ? (
              <p className="truncate text-micro text-primary">{label}</p>
            ) : (
              <p className="truncate text-eyebrow text-primary">{label}</p>
            )}
            <h2
              className={cn(
                isRectangle
                  ? "mt-3 text-h3"
                  : isAnchor
                    ? "mt-0.5 truncate text-h5 sm:text-h4"
                    : "mt-1 line-clamp-2 text-h4",
              )}
            >
              {title}
            </h2>
            {isRectangle && (
              <p className="mt-1.5 line-clamp-3 text-body-sm">{body}</p>
            )}
          </div>
          <Button
            render={ctaLink}
            variant="default"
            size="sm"
            className={cn(
              "shrink-0",
              isRectangle
                ? "mt-auto w-full"
                : "max-w-[42%] overflow-hidden text-ellipsis",
            )}
          >
            {cta}
          </Button>
        </div>
      </Surface>
    </aside>
  )
}
