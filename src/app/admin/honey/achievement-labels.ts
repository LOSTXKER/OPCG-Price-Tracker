/**
 * Thai-first display helpers for the admin achievements page.
 *
 * `Achievement.description` is a single-language column (English copy is
 * baked into `scripts/seed-achievements.ts`), so we derive Thai text from
 * the structured `criteria` JSON instead of pattern-matching the English
 * description. Every criteria type listed in `AchievementCriteriaSchema`
 * (`src/lib/honey/schemas.ts`) must have an entry here — if a new type is
 * added there, add a matching template below or the row falls back to the
 * raw English description.
 */

type Criteria = { type?: unknown; target?: unknown };

interface CriteriaTemplate {
  /** "เช็คอิน N วันต่อเนื่อง" — `{n}` is replaced with `target`. */
  desc: string;
  /** Short label shown after "เงื่อนไข:" — e.g. "เช็คอินต่อเนื่อง". */
  label: string;
}

const TEMPLATES: Record<string, CriteriaTemplate> = {
  portfolio_count:       { desc: "เพิ่มการ์ดในพอร์ตให้ครบ {n} ใบ",            label: "การ์ดในพอร์ต" },
  checkin_streak:        { desc: "เช็คอินต่อเนื่อง {n} วัน",                    label: "เช็คอินต่อเนื่อง" },
  first_sell:            { desc: "ขายในตลาดให้สำเร็จเป็นครั้งแรก",                label: "ขายครั้งแรก" },
  trades_count:          { desc: "ขายในตลาดให้สำเร็จ {n} ครั้ง",                  label: "จำนวนการขาย" },
  order_buy_count:       { desc: "ซื้อในตลาดให้สำเร็จ {n} ครั้ง",                  label: "จำนวนการซื้อ" },
  first_review:          { desc: "เขียนรีวิวเป็นครั้งแรก",                          label: "รีวิวครั้งแรก" },
  review_count:          { desc: "เขียนรีวิวให้ครบ {n} ครั้ง",                    label: "จำนวนรีวิว" },
  prediction_count:      { desc: "ทายราคาให้ครบ {n} ครั้ง",                      label: "ทายราคา" },
  correct_predictions:   { desc: "ทายราคาถูกต้อง {n} ครั้ง",                      label: "ทายถูก" },
  referral_count:        { desc: "ชวนเพื่อนสมัครสำเร็จ {n} คน",                  label: "ชวนเพื่อน" },
  watchlist_count:       { desc: "เพิ่มการ์ดในวอชลิสต์ให้ครบ {n} ใบ",            label: "การ์ดในวอชลิสต์" },
  deck_count:            { desc: "สร้างเด็คให้ครบ {n} ชุด",                        label: "จำนวนเด็ค" },
  deck_share_count:      { desc: "เปิดเด็คเป็นสาธารณะ {n} ชุด",                    label: "เด็คสาธารณะ" },
  community_price_count: { desc: "ส่งราคาให้ชุมชน {n} ครั้ง",                      label: "ราคาชุมชน" },
  perfect_day_count:     { desc: "ทำภารกิจรายวันครบทุกข้อรวม {n} วัน",          label: "ครบทุกภารกิจ" },
  raffle_win_count:      { desc: "ถูกรางวัลจับฉลากรายเดือนรวม {n} ครั้ง",         label: "ถูกรางวัล" },
  honey_lifetime:        { desc: "สะสม Honey สะสมตลอดกาลให้ครบ {n} แต้ม",        label: "Honey สะสม" },
};

function getCriteriaParts(criteria: unknown): { template?: CriteriaTemplate; target: number } {
  if (!criteria || typeof criteria !== "object") return { target: 0 };
  const c = criteria as Criteria;
  const type = typeof c.type === "string" ? c.type : "";
  const target = typeof c.target === "number" ? c.target : 0;
  return { template: TEMPLATES[type], target };
}

/**
 * Localized description for an achievement row in the admin list. Falls back
 * to the raw `description` column when the criteria type is unknown so the
 * admin always sees *something* — even for criteria types not yet templated.
 */
export function localizedAchievementDesc(
  criteria: unknown,
  fallback: string | null,
): string {
  const { template, target } = getCriteriaParts(criteria);
  if (!template) return fallback ?? "";
  return template.desc.replace("{n}", target.toLocaleString("th-TH"));
}

/**
 * Compact Thai summary of the criteria — replaces the raw JSON shown next
 * to the achievement code (e.g. `เป้าหมาย: เช็คอินต่อเนื่อง 30`).
 */
export function formatAchievementCriteria(criteria: unknown): string {
  const { template, target } = getCriteriaParts(criteria);
  if (!template) {
    try {
      return JSON.stringify(criteria);
    } catch {
      return "";
    }
  }
  return `${template.label} ${target.toLocaleString("th-TH")}`;
}
