import { formatRelativeAgo } from "./relative-time";
import type { Language } from "@/lib/i18n";

/**
 * Legacy wrapper around formatRelativeAgo.
 * @deprecated Prefer `formatRelativeAgo` from `@/lib/utils/relative-time` directly.
 */
export function relativeTime(dateStr: string | null, lang: string = "TH"): string {
  if (!dateStr) return "—";
  return formatRelativeAgo(dateStr, (lang as Language) ?? "TH");
}

/** Whole days elapsed since `date` (clock read lives here, outside component render). */
export function daysSince(date: string | Date): number {
  return Math.floor((Date.now() - new Date(date).getTime()) / 86_400_000);
}

/** Whole days (rounded up) until `date`. */
export function daysUntil(date: string | Date): number {
  return Math.ceil((new Date(date).getTime() - Date.now()) / 86_400_000);
}

/** Local calendar date for a native date input (`YYYY-MM-DD`). */
export function localDateInputValue(date: Date = new Date()): string {
  const localTime = date.getTime() - date.getTimezoneOffset() * 60_000;
  return new Date(localTime).toISOString().slice(0, 10);
}

export function formatChatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" });
}

export function formatRelativeShort(iso: string) {
  const d = new Date(iso);
  const diffMs = Date.now() - d.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "เมื่อสักครู่";
  if (diffMin < 60) return `${diffMin} นาที`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr} ชม.`;
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay < 7) return `${diffDay} วัน`;
  return d.toLocaleDateString("th-TH", { day: "numeric", month: "short" });
}
