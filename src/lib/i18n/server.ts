import { cookies } from "next/headers";

import { LANG_COOKIE, isLanguage, type Language } from "@/lib/i18n";

/**
 * Resolve the active language for SERVER components / route handlers from the
 * `kuma-lang` cookie (mirrors the client Zustand store). Defaults to TH — the
 * Thai-market default — for first-time visitors who have no cookie yet.
 *
 * Reading cookies() opts the calling route into dynamic rendering; that's the
 * accepted trade-off for per-request language on server-rendered pages.
 */
export async function getServerLanguage(): Promise<Language> {
  const store = await cookies();
  const value = store.get(LANG_COOKIE)?.value;
  return isLanguage(value) ? value : "TH";
}
