const SUFFIXES: Record<string, { justNow: string; min: string; hr: string; day: string }> = {
  TH: { justNow: "เมื่อกี้", min: " นาที", hr: " ชม.", day: " วัน" },
  JP: { justNow: "たった今", min: "分前", hr: "時間前", day: "日前" },
  EN: { justNow: "just now", min: "m", hr: "h", day: "d" },
};

export function relativeTime(dateStr: string | null, lang: string = "TH"): string {
  if (!dateStr) return "—";
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60_000);
  const s = SUFFIXES[lang] ?? SUFFIXES.TH;
  if (mins < 1) return s.justNow;
  if (mins < 60) return `${mins}${s.min}`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}${s.hr}`;
  const days = Math.floor(hrs / 24);
  return `${days}${s.day}`;
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
