"use client"

import {
  ChevronDown,
  CircleDollarSign,
  Globe,
  MonitorCog,
  Settings2,
} from "lucide-react"
import { useTheme } from "next-themes"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useHydrated } from "@/hooks/use-hydrated"
import { t } from "@/lib/i18n"
import { useUIStore, type Currency, type Language } from "@/stores/ui-store"

import {
  CURRENCY_OPTIONS,
  LANG_OPTIONS,
  THEME_OPTIONS,
  type ThemeChoice,
} from "./header-constants"

/**
 * Display preferences shared by the signed-in account menu and the guest
 * fallback. Submenus keep the top-level menu scannable while preserving radio
 * semantics, keyboard navigation, and the existing persisted stores.
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
  const themeLabel = t(
    language,
    THEME_OPTIONS.find((option) => option.value === themeChoice)?.labelKey ??
      "themeSystem",
  )

  return (
    <DropdownMenuGroup>
      <DropdownMenuLabel className="text-eyebrow">
        {t(language, "preferences")}
      </DropdownMenuLabel>

      <DropdownMenuSub>
        <DropdownMenuSubTrigger>
          <Globe className="size-4 text-muted-foreground" aria-hidden />
          <span className="flex-1">{t(language, "languageLabel")}</span>
          <span className="text-meta text-foreground">{languageLabel}</span>
        </DropdownMenuSubTrigger>
        <DropdownMenuSubContent className="min-w-40">
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
        <DropdownMenuSubTrigger>
          <CircleDollarSign
            className="size-4 text-muted-foreground"
            aria-hidden
          />
          <span className="flex-1">{t(language, "currencyLabel")}</span>
          <span className="text-meta text-foreground">{currencyLabel}</span>
        </DropdownMenuSubTrigger>
        <DropdownMenuSubContent className="min-w-40">
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

      <DropdownMenuSub>
        <DropdownMenuSubTrigger>
          <MonitorCog className="size-4 text-muted-foreground" aria-hidden />
          <span className="flex-1">{t(language, "themeLabel")}</span>
          <span className="text-meta text-foreground">{themeLabel}</span>
        </DropdownMenuSubTrigger>
        <DropdownMenuSubContent className="min-w-40">
          <DropdownMenuRadioGroup
            value={themeChoice}
            onValueChange={(value) => setTheme(value)}
          >
            {THEME_OPTIONS.map((option) => (
              <DropdownMenuRadioItem key={option.value} value={option.value}>
                {t(language, option.labelKey)}
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
        </DropdownMenuSubContent>
      </DropdownMenuSub>
    </DropdownMenuGroup>
  )
}

/** Guests have no profile menu, so preferences collapse into one quiet control. */
export function HeaderGuestPreferencesMenu() {
  const language = useUIStore((state) => state.language)

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={t(language, "preferences")}
        className="surface-2 hairline ease-chrome flex min-h-11 items-center gap-1.5 rounded-full px-2.5 text-label text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 lg:min-h-0 lg:py-1.5"
      >
        <Settings2 className="size-3.5" aria-hidden />
        <span className="hidden xl:inline">{t(language, "preferences")}</span>
        <ChevronDown className="hidden size-3 text-muted-foreground xl:block" aria-hidden />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" sideOffset={8} className="w-64">
        <HeaderPreferencesMenuItems />
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
