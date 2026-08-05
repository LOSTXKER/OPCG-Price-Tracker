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
}: {
  definition: AdInventoryDefinition
  lang: Language
  className?: string
  /** คงไว้เพื่อความเข้ากันได้กับ caller เดิม — ช่องว่างไม่มีรูปให้โหลด */
  eager?: boolean
}) {
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
        className="flex h-full w-full items-center justify-center overflow-hidden border border-dashed border-primary/20 bg-card shadow-none"
      >
        <span className="text-micro text-muted-foreground">
          {t(lang, "adGoogleMockLabel")}
        </span>
        <span className="sr-only">
          {definition.mobileSize} · {definition.desktopSize} ·{" "}
          {t(lang, "adGoogleMockOffline")}
        </span>
      </Surface>
    </aside>
  )
}
