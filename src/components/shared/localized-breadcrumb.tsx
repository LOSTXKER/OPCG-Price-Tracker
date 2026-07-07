"use client";

import { t, type TranslationKey } from "@/lib/i18n";
import { useUIStore } from "@/stores/ui-store";

import { Breadcrumb } from "./breadcrumb";

/**
 * Either an i18n `labelKey` (resolved against the current language) or a raw
 * `label` already in the right language (e.g. a blog post title from the DB).
 */
export type LocalizedBreadcrumbItem =
  | { labelKey: TranslationKey; href?: string }
  | { label: string; href?: string };

/**
 * Breadcrumb whose labels follow the user's chosen language — for SERVER pages
 * (deck/drop calculators, search, trending, pricing, watchlist, marketplace…)
 * that can't call `getServerLanguage` without opting into dynamic rendering.
 *
 * Reads the language from the client store, so it's a small client island on an
 * otherwise-static page and updates the instant the user switches language.
 * Hydration-safe: the store uses `skipHydration`, so SSR and the first client
 * render both read the "TH" default (no mismatch), then correct on rehydrate.
 * Client pages that already hold `lang` (portfolio, honey, settings) keep using
 * `<Breadcrumb items={… t(lang) …}>` directly.
 */
export function LocalizedBreadcrumb({
  items,
  className,
  hideMobileBack,
}: {
  items: LocalizedBreadcrumbItem[];
  className?: string;
  hideMobileBack?: boolean;
}) {
  const lang = useUIStore((s) => s.language);
  return (
    <Breadcrumb
      items={items.map((i) => ({
        label: "labelKey" in i ? t(lang, i.labelKey) : i.label,
        href: i.href,
      }))}
      className={className}
      hideMobileBack={hideMobileBack}
    />
  );
}
