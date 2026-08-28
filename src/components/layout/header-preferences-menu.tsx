"use client"

import { ChevronRight, Monitor, Moon, Settings, Sun } from "lucide-react"
import { useTheme } from "next-themes"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { SegmentedControl } from "@/components/ui/segmented-control"
import { useHydrated } from "@/hooks/use-hydrated"
import { t } from "@/lib/i18n"
import { useUIStore, type Currency, type Language } from "@/stores/ui-store"

import {
  CURRENCY_OPTIONS,
  LANG_OPTIONS,
  type ThemeChoice,
} from "./header-constants"

/**
 * Light · Dark · System, in the reference's order. Kept local to this switch
 * rather than reordering the shared `THEME_OPTIONS`, which `/more` renders as a
 * labelled list where "follow the system" reads better first.
 */
const THEME_SWITCH = [
  { value: "light", labelKey: "lightMode", icon: Sun },
  { value: "dark", labelKey: "darkMode", icon: Moon },
  { value: "system", labelKey: "themeSystem", icon: Monitor },
] as const satisfies ReadonlyArray<{
  value: ThemeChoice
  labelKey: "lightMode" | "darkMode" | "themeSystem"
  icon: typeof Sun
}>

/**
 * Display preferences, shaped like the account menus on CoinGecko / CoinMarketCap
 * (owner reference 2026-08-28): a labelled row whose CURRENT VALUE is visible
 * without opening anything, and a theme switch that is a real segmented control
 * rather than a third nested menu. Reading the row tells you the setting; the
 * chevron tells you it opens.
 *
 * Used twice: inside the signed-in account menu, and behind the guest gear
 * button below — the same controls, so language/currency/theme never depend on
 * having an account.
 */
export function HeaderPreferencesMenuItems() {
  const language = useUIStore((state) => state.language)
  const setLanguage = useUIStore((state) => state.setLanguage)
  const currency = useUIStore((state) => state.currency)
  const setCurrency = useUIStore((state) => state.setCurrency)
  const { theme, setTheme } = useTheme()
  const hydrated = useHydrated()
  const themeChoice: ThemeChoice =
    hydrated && (theme === "light" || theme === "dark" || theme === "system")
      ? theme
      : "system"

  const languageLabel =
    LANG_OPTIONS.find((option) => option.value === language)?.label ?? language
  const currencyLabel =
    CURRENCY_OPTIONS.find((option) => option.value === currency)?.label ?? currency

  return (
    <div className="px-1 py-1">
      <DropdownMenuSub>
        <DropdownMenuSubTrigger className="gap-2 rounded-lg px-2 py-2 [&>svg:last-child]:hidden">
          <span className="flex-1 text-body-sm">{t(language, "languageLabel")}</span>
          <span className="text-body-sm text-muted-foreground">{languageLabel}</span>
          <ChevronRight className="size-4 shrink-0 text-muted-foreground" aria-hidden />
        </DropdownMenuSubTrigger>
        <DropdownMenuSubContent className="min-w-44">
          <DropdownMenuRadioGroup
            value={language}
            onValueChange={(value) => setLanguage(value as Language)}
          >
            {LANG_OPTIONS.map((option) => (
              <DropdownMenuRadioItem key={option.value} value={option.value}>
                {option.label}
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
        </DropdownMenuSubContent>
      </DropdownMenuSub>

      <DropdownMenuSub>
        <DropdownMenuSubTrigger className="gap-2 rounded-lg px-2 py-2 [&>svg:last-child]:hidden">
          <span className="flex-1 text-body-sm">{t(language, "currencyLabel")}</span>
          <span className="text-body-sm text-muted-foreground">{currencyLabel}</span>
          <ChevronRight className="size-4 shrink-0 text-muted-foreground" aria-hidden />
        </DropdownMenuSubTrigger>
        <DropdownMenuSubContent className="min-w-44">
          <DropdownMenuRadioGroup
            value={currency}
            onValueChange={(value) => setCurrency(value as Currency)}
          >
            {CURRENCY_OPTIONS.map((option) => (
              <DropdownMenuRadioItem key={option.value} value={option.value}>
                {option.label}
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
        </DropdownMenuSubContent>
      </DropdownMenuSub>

      {/* Theme is three peer choices, so it reads better as one visible switch
          than as a submenu you have to open to see what is selected. Plain
          buttons on purpose — a DropdownMenuItem would close the menu on click
          and you could not see the theme change you just made.
          Order and icons follow the reference: the two real choices first,
          "follow the system" last. Icons carry the meaning so the labels can
          stay short enough for all three to fit one 288px row in Thai. */}
      <div className="flex items-center gap-2 px-2 py-2">
        <span className="shrink-0 text-body-sm">{t(language, "themeLabel")}</span>
        <SegmentedControl
          className="ml-auto"
          size="sm"
          compactVisual={false}
          ariaLabel={t(language, "themeLabel")}
          value={themeChoice}
          onChange={(value) => setTheme(value as ThemeChoice)}
          options={THEME_SWITCH.map((option) => ({
            value: option.value,
            icon: option.icon,
            label: <span className="sr-only">{t(language, option.labelKey)}</span>,
            ariaLabel: t(language, option.labelKey),
          }))}
        />
      </div>
    </div>
  )
}

/**
 * Guest-facing entry to the same preferences. Signed-in visitors reach them
 * through the account menu; without this, logging out would hide language,
 * currency and theme entirely.
 */
export function HeaderGuestPreferencesMenu() {
  const language = useUIStore((state) => state.language)

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={t(language, "preferences")}
        className="ease-chrome flex min-h-11 items-center justify-center rounded-full border border-hair px-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 lg:h-8 lg:min-h-0"
      >
        <Settings className="size-4" aria-hidden />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" sideOffset={8} className="w-72 p-0">
        <p className="px-3 pb-1 pt-3 text-eyebrow">{t(language, "preferences")}</p>
        <HeaderPreferencesMenuItems />
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
