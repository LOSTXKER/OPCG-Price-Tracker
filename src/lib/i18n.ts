import type { Language } from "@/stores/ui-store";
import { th } from "./i18n/th";
import { en } from "./i18n/en";
import { jp } from "./i18n/jp";

const LOCALE_MAP: Record<Language, string> = {
  TH: "th-TH",
  EN: "en-US",
  JP: "ja-JP",
};

export function getLocale(lang: Language): string {
  return LOCALE_MAP[lang];
}

const translations = { TH: th, EN: en, JP: jp } as const;

export type TranslationKey = keyof typeof th;

export function t(lang: Language, key: TranslationKey): string {
  return translations[lang]?.[key] ?? translations.EN[key] ?? key;
}

export function getCardName(
  lang: Language,
  card: { nameEn?: string | null; nameJp?: string | null; nameTh?: string | null }
): string {
  if (lang === "TH" && card.nameTh) return card.nameTh;
  if (lang === "JP" && card.nameJp) return card.nameJp;
  return card.nameEn ?? card.nameJp ?? "Unknown";
}

export function getCardEffect(
  lang: Language,
  card: {
    effectEn?: string | null;
    effectJp?: string | null;
    effectTh?: string | null;
  }
): string | null {
  if (lang === "TH" && card.effectTh) return card.effectTh;
  if (lang === "JP" && card.effectJp) return card.effectJp;
  return card.effectEn ?? card.effectJp ?? null;
}

export function getSetName(
  lang: Language,
  set: {
    name?: string | null;
    nameEn?: string | null;
    nameTh?: string | null;
  }
): string {
  if (lang === "TH" && set.nameTh) return set.nameTh;
  if (lang === "JP" && set.name) return set.name;
  return set.nameEn ?? set.name ?? "Unknown";
}
