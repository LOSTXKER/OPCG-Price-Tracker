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
