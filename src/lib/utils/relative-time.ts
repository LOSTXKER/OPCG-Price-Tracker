import { t, type Language } from "@/lib/i18n";

/**
 * Returns a human-readable, language-aware relative time string for a date in
 * the past — like "3h ago" / "เมื่อวาน" / "2ヶ月". Mirrors the GitHub/Reddit
 * style used throughout the public profile so visitors don't see Buddhist year
 * formatting or other locale surprises.
 */
export function formatRelativeAgo(input: Date | string, lang: Language): string {
  const d = input instanceof Date ? input : new Date(input);
  const now = Date.now();
  const diffSec = Math.max(0, Math.floor((now - d.getTime()) / 1000));

  if (diffSec < 60) return t(lang, "agoJustNow");

  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return t(lang, "agoMinutes").replace("{n}", String(diffMin));

  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return t(lang, "agoHours").replace("{n}", String(diffHour));

  const diffDay = Math.floor(diffHour / 24);
  if (diffDay === 1) return t(lang, "agoYesterday");
  if (diffDay < 30) return t(lang, "agoDays").replace("{n}", String(diffDay));

  const diffMonth = Math.floor(diffDay / 30);
  if (diffMonth < 12) return t(lang, "agoMonths").replace("{n}", String(diffMonth));

  const diffYear = Math.floor(diffMonth / 12);
  return t(lang, "agoYears").replace("{n}", String(diffYear));
}

/** "Joined 8 months ago" style line, with the relative chunk localised. */
export function formatJoinedRelative(input: Date | string, lang: Language): string {
  return t(lang, "joinedRelative").replace("{ago}", formatRelativeAgo(input, lang));
}

/**
 * Compact "x ago" for transactional lists (orders, etc). Unlike
 * `formatRelativeAgo` this uses generic "just now / Xm ago" wording (not the
 * profile-specific "just joined"), and falls back to a localized date past 30d.
 */
export function formatRelativeAgoShort(input: Date | string, lang: Language): string {
  const d = input instanceof Date ? input : new Date(input);
  const mins = Math.floor((Date.now() - d.getTime()) / 60000);
  if (mins < 1) return t(lang, "relJustNow");
  if (mins < 60) return t(lang, "relMinsAgo").replace("{n}", String(mins));
  const hours = Math.floor(mins / 60);
  if (hours < 24) return t(lang, "relHoursAgo").replace("{n}", String(hours));
  const days = Math.floor(hours / 24);
  if (days < 30) return t(lang, "relDaysAgo").replace("{n}", String(days));
  const months = Math.floor(days / 30);
  if (months < 12) return t(lang, "relMonthsAgo").replace("{n}", String(months));
  return t(lang, "relYearsAgo").replace("{n}", String(Math.floor(months / 12)));
}
