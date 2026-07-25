import Image from "next/image"

import { Surface } from "@/components/ui/surface"
import { t, type Language } from "@/lib/i18n"
import { cn } from "@/lib/utils"

import {
  AD_FORMAT_CLASS,
  type AdInventoryDefinition,
} from "./inventory"

export function GoogleAdMockup({
  definition,
  lang,
  className,
  eager = false,
}: {
  definition: AdInventoryDefinition
  lang: Language
  className?: string
  eager?: boolean
}) {
  const isRectangle = definition.format === "RECTANGLE"
  const isAnchor = definition.format === "ANCHOR"

  return (
    <aside
      aria-label={t(lang, "adGoogleMockLabel")}
      data-ad-kind="GOOGLE_MOCK"
      data-ad-zone={definition.zone}
      data-ad-format={definition.format}
      data-ad-size={`${definition.mobileSize}|${definition.desktopSize}`}
      className={cn(AD_FORMAT_CLASS[definition.format], className)}
    >
      <Surface
        variant="outline"
        padding="none"
        className="h-full w-full overflow-hidden border border-primary/20 bg-card shadow-none"
      >
        <div
          className={cn(
            "h-full min-w-0 overflow-hidden",
            isRectangle
              ? "flex flex-col"
              : isAnchor
                ? "grid grid-cols-[minmax(0,1fr)_96px] sm:grid-cols-[minmax(0,1fr)_auto_180px]"
                : "grid grid-cols-[minmax(0,1fr)_104px] sm:grid-cols-[minmax(0,1fr)_auto_220px]",
          )}
        >
          <div
            className={cn(
              "relative overflow-hidden",
              isRectangle
                ? "h-[112px] w-full shrink-0 sm:h-[128px]"
                : "order-2 h-full sm:order-3",
            )}
          >
            <Image
              src="/ads/google-mock-card-accessories-v1.jpg"
              alt=""
              fill
              sizes={
                isRectangle
                  ? "(max-width: 639px) 300px, 336px"
                  : isAnchor
                    ? "(max-width: 639px) 96px, 180px"
                    : "(max-width: 639px) 104px, 220px"
              }
              loading={eager ? "eager" : "lazy"}
              className="object-cover"
              style={{ objectPosition: "66% 58%" }}
            />
            <span
              aria-hidden
              className="absolute inset-0 bg-linear-to-r from-background/10 to-transparent"
            />
          </div>

          <div
            className={cn(
              "min-w-0",
              isRectangle
                ? "flex flex-1 flex-col px-4 py-3.5"
                : isAnchor
                  ? "flex flex-col justify-center px-3 py-1.5 sm:px-5 sm:py-2"
                  : "flex flex-col justify-center px-3 py-2 sm:px-5",
            )}
          >
            <p className="truncate text-micro text-muted-foreground">
              {t(lang, "adGoogleMockLabel")} · {t(lang, "adMockBrand")}
            </p>
            <p
              className={cn(
                "mt-0.5 line-clamp-2 text-foreground",
                isRectangle
                  ? "text-h4"
                  : isAnchor
                    ? "truncate text-h5 sm:text-h4"
                    : "text-h5 sm:text-h4",
              )}
            >
              {t(lang, "adMockHeadline")}
            </p>
            {isRectangle && (
              <p className="mt-1 line-clamp-2 text-body-sm text-muted-foreground">
                {t(lang, "adMockBody")}
              </p>
            )}
            {isRectangle && (
              <span className="mt-auto inline-flex h-8 w-fit items-center rounded-md bg-primary px-3 text-label text-primary-foreground">
                {t(lang, "adMockCta")}
              </span>
            )}
            <span className="sr-only">
              {definition.mobileSize} · {definition.desktopSize} ·{" "}
              {t(lang, "adGoogleMockOffline")}
            </span>
          </div>

          {!isRectangle && (
            <span className="order-2 mr-4 hidden h-8 items-center self-center rounded-md bg-primary px-3 text-label text-primary-foreground sm:inline-flex">
              {t(lang, "adMockCta")}
            </span>
          )}
        </div>
      </Surface>
    </aside>
  )
}
