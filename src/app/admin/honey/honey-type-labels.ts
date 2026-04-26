export interface HoneyTypeInfo {
  label: string;
  bg: string;
  text: string;
  chartColor: string;
}

export const HONEY_TYPE_MAP: Record<string, HoneyTypeInfo> = {
  CHECKIN:            { label: "เช็คอิน",         bg: "bg-green-500/10",  text: "text-green-600 dark:text-green-400",  chartColor: "hsl(142, 60%, 45%)" },
  DAILY_MISSION:      { label: "เดลี่มิชชั่น",     bg: "bg-blue-500/10",   text: "text-blue-600 dark:text-blue-400",    chartColor: "hsl(217, 80%, 58%)" },
  MONTHLY_MISSION:    { label: "มิชชั่นรายเดือน",   bg: "bg-sky-500/10",    text: "text-sky-600 dark:text-sky-400",      chartColor: "hsl(199, 80%, 50%)" },
  WEEKLY_BONUS:       { label: "โบนัสรายสัปดาห์",   bg: "bg-lime-500/10",   text: "text-lime-600 dark:text-lime-400",    chartColor: "hsl(84, 60%, 45%)" },
  REDEEM:             { label: "แลกสินค้า",        bg: "bg-red-500/10",    text: "text-red-600 dark:text-red-400",      chartColor: "hsl(0, 72%, 51%)" },
  RAFFLE_TICKET:      { label: "ตั๋วจับรางวัล",     bg: "bg-violet-500/10", text: "text-violet-600 dark:text-violet-400", chartColor: "hsl(262, 75%, 58%)" },
  RAFFLE_WIN:         { label: "ชนะจับรางวัล",     bg: "bg-amber-500/10",  text: "text-amber-600 dark:text-amber-400",  chartColor: "hsl(38, 92%, 50%)" },
  LEVEL_UP:           { label: "เลเวลอัป",        bg: "bg-rose-500/10",   text: "text-rose-600 dark:text-rose-400",    chartColor: "hsl(350, 75%, 55%)" },
  ACHIEVEMENT:        { label: "ความสำเร็จ",       bg: "bg-yellow-500/10", text: "text-yellow-600 dark:text-yellow-400", chartColor: "hsl(45, 93%, 47%)" },
  MARKETPLACE_SELL:   { label: "ขายในตลาด",       bg: "bg-purple-500/10", text: "text-purple-600 dark:text-purple-400", chartColor: "hsl(280, 65%, 58%)" },
  REVIEW:             { label: "รีวิว",            bg: "bg-cyan-500/10",   text: "text-cyan-600 dark:text-cyan-400",    chartColor: "hsl(187, 80%, 43%)" },
  REFERRAL:           { label: "แนะนำเพื่อน",      bg: "bg-pink-500/10",   text: "text-pink-600 dark:text-pink-400",    chartColor: "hsl(330, 75%, 55%)" },
  ADMIN_GRANT:        { label: "แอดมินให้",        bg: "bg-amber-500/10",  text: "text-amber-700 dark:text-amber-300",  chartColor: "hsl(38, 70%, 50%)" },
  TRIAL_BONUS:        { label: "โบนัสทดลอง",      bg: "bg-orange-500/10", text: "text-orange-600 dark:text-orange-400", chartColor: "hsl(24, 90%, 53%)" },
  PRICE_PREDICTION:   { label: "ทายราคา",         bg: "bg-indigo-500/10", text: "text-indigo-600 dark:text-indigo-400", chartColor: "hsl(240, 65%, 58%)" },
  DECK_SHARE:         { label: "แชร์เด็ค",         bg: "bg-teal-500/10",   text: "text-teal-600 dark:text-teal-400",    chartColor: "hsl(168, 60%, 40%)" },
  COMMUNITY_PRICE:    { label: "ราคาชุมชน",       bg: "bg-emerald-500/10", text: "text-emerald-600 dark:text-emerald-400", chartColor: "hsl(155, 60%, 40%)" },
  ONBOARDING:         { label: "สมัครใหม่",        bg: "bg-sky-500/10",    text: "text-sky-600 dark:text-sky-400",      chartColor: "hsl(199, 80%, 50%)" },
  LEADERBOARD_REWARD: { label: "รางวัลลีดเดอร์บอร์ด", bg: "bg-fuchsia-500/10", text: "text-fuchsia-600 dark:text-fuchsia-400", chartColor: "hsl(292, 70%, 55%)" },
  EXPIRED:            { label: "หมดอายุ",          bg: "bg-gray-400/10",   text: "text-gray-500 dark:text-gray-400",    chartColor: "hsl(0, 0%, 55%)" },
};

const FALLBACK: HoneyTypeInfo = {
  label: "อื่นๆ",
  bg: "bg-muted",
  text: "text-muted-foreground",
  chartColor: "hsl(0, 0%, 50%)",
};

export function getTypeInfo(type: string): HoneyTypeInfo {
  return HONEY_TYPE_MAP[type] ?? FALLBACK;
}

export const ALL_TYPES = Object.keys(HONEY_TYPE_MAP);
