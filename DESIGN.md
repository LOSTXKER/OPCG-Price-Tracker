# DESIGN.md — Meecard

> Design system for **Meecard**, a real-time price-tracking web app for the One Piece Card Game (OPTCG) aimed at Thai collectors. Feed this file to AI design/coding tools (Google Stitch, MCP coding agents) so generated UI matches the brand. Source of truth = `src/app/globals.css` + `AGENTS.md`. Values below are the production tokens.

## 1. Brand & feel

- **Product**: a premium, trustworthy price reference for collectible cards. Read it like a calm crypto/stock **trading dashboard** (CoinGecko · TradingView · CoinMarketCap · Collectr) — but for trading cards. Original, not a clone.
- **Mood**: warm espresso + honey-gold, dark-first, minimal, **uncluttered**, data-rich without noise.
- **Core promise**: one screen answers "this card · this edition · this grade = this price" backed by **credible reference sources**.
- **Default theme is DARK.** Light theme exists but the redesign targets dark.
- **Language**: Thai UI, font **Kanit** (sans). Numbers use a **monospace, tabular** font.

## 2. Color tokens

### Dark (default)
| Role | Hex |
| --- | --- |
| `background` | `#100C09` (warm near-black / espresso) |
| `foreground` | `#F6EFE6` (warm off-white) |
| `card` | `#17110D` |
| `popover` | `#1F1812` |
| `primary` (honey-gold accent) | `#E9B970` |
| `primary-foreground` | `#1A1207` |
| `secondary` | `#221A14` |
| `muted` | `#1D1611` |
| `muted-foreground` | `#A6907C` |
| `accent` | `#281E16` |
| `accent-foreground` | `#F4D9A8` |
| `border` / hairline | `rgba(246,239,230,0.12)` |
| **price-up (gain)** | `#46D68B` (green) |
| **price-down (loss)** | `#FF7A6B` (red) |
| warning / mid | `#FF9F0A` |
| info | `#0A84FF` |

### Light
`background #FFFFFF` · `foreground #1D1D1F` · `primary #73533E` (espresso) · `primary-foreground #FFFFFF` · `muted-foreground #8B7565` · `border #E5D9CE` · price-up `#34C759` · price-down `#FF3B30`.

### Surfaces & elevation (warm overlays — elevation reads by LIGHT, not dark shadow)
- `--p-s1` = `rgba(246,239,230,0.035)` — quiet fill
- `--p-s2` = `rgba(246,239,230,0.06)` — chips / controls
- `--p-s3` = `rgba(246,239,230,0.09)` — raised
- `--p-hair` = `rgba(246,239,230,0.09)` — 1px hairline divider/ring
- `--p-honey-soft` = honey-gold @ ~16% — soft accent wash
- Cards/panels: thin inset hairline ring + subtle ambient shadow. **No heavy borders.**

## 3. Accent rules (important)

- **Honey-gold (`--primary`) is used ONLY on the primary transact CTA** — the "ซื้อบน Meecard" (Buy) button. Keep gold under ~5% of the screen. Never color chart lines, links, or icons gold.
- **Gains green, losses red**, always paired with a **▲ / ▼ arrow** (color is reinforcement, not the only signal — a11y). A rounded-to-0.0% delta is neutral (no arrow, muted).
- **All prices/numbers are tabular (monospaced) numerals.**
- **Honesty marker**: any modeled/estimated value carries a tiny muted **"est"** tag (with title/aria). Real scraped reference prices have NO tag. A modeled chart line is **dashed**; a real one is **solid**.

## 4. Typography (semantic tokens — base scale bumped for Thai/Kanit)

Use one semantic token per element; don't stack `text-* font-* tracking-*`.

| Token | px (mobile → ≥640) | weight | notes |
| --- | --- | --- | --- |
| `.text-display` | 36 → 42 | 700 | hero KPI / the ONE price number; tabular; tight tracking |
| `.text-h1` | 28 → 32 | 700 | page title |
| `.text-h2` | 22 → 24 | 700 | section heading |
| `.text-h3` | 19 | 600 | subsection / card name |
| `.text-h4` | 17 | 600 | card title, panel heading |
| `.text-h5` | 15 | 600 | small heading, table caption |
| `.text-body` | 17 | 400 | reading copy |
| `.text-body-sm` | 15 | 400 | dense panels |
| `.text-label` | 13 | 500 | form/inline labels |
| `.text-meta` | 13 | 400 | captions/helper, **muted color** |
| `.text-eyebrow` | 12 | 600 | UPPERCASE, tracking 0.06em, muted — section eyebrows / column headers |
| `.text-micro` | 11 | 600 | pill/badge text |
| `.text-overlay` | 10 | 600 | image-overlay micro labels (last resort) |
| `.text-code` | 14 | — | monospace, tabular — inline numeric |

Base text steps (Thai readability): xs 13 · sm 15 · base 17 · lg 19px.

## 5. Shape · spacing · motion

- **Radius**: base `0.75rem` (12px). Scale: sm 0.6× · md 0.8× · lg 1× · xl 1.4× · 2xl 1.8× · 3xl 2.2×. Cards ≈ 16–24px radius; chips/buttons ≈ pill or 10–12px.
- **Spacing**: generous; 4px grid. Sections separated by clear vertical rhythm + hairlines, not boxes-in-boxes.
- **Motion**: durations `fast 120ms · base 200ms · slow 300ms`; primary easing `cubic-bezier(0.32, 0.72, 0, 1)` ("ease-chrome"); spring `cubic-bezier(0.34, 1.56, 0.64, 1)`.

## 6. Component patterns

- **Primary button (Buy)**: solid honey-gold fill, `primary-foreground` text, pill/rounded-xl, bold, shopping-bag icon. The only gold element.
- **Secondary actions**: outline/ghost buttons (transparent + hairline border), muted text, hover lifts to foreground. e.g. add-to-portfolio, share, price alert, compare.
- **Segmented toggle** (edition JP|EN, Raw|Graded): pill track `--p-s2` + hairline ring; active segment = solid `foreground` bg with `background` text.
- **Grade chips**: small pill/cell per grade showing grade label + its price; selected = `foreground/10` fill. Grade families: **Raw** (single, ungraded), **PSA 10 · 9 · 8**, **BGS 9.5** (raw family in JPY, graded in USD).
- **Stat row**: label left (muted), value right (tabular, bold), hairline divider between rows.
- **Source row**: source logo + name + verified check + condition·freshness, price right, external-link icon.
- **Price chart**: SVG line + soft area gradient under the primary line; right-side price axis; dashed gridlines; latest-value pill; pointer crosshair + tooltip on scrub. **Compare mode** overlays multiple same-family grade lines (distinct non-gold colors; real=solid, estimate=dashed) with a legend. Time ranges 1M·3M·1Y·All.
- **Range bar**: thin horizontal track with a marker dot showing where the current price sits within its 30-day low–high.
- **Empty states**: never a dead box — a short message + 1–2 recovery actions (e.g. "notify me", "list this card").

## 7. Layout & breakpoints

- Breakpoints: **sm 640px** = data-layout boundary (tables→list, grid scale-up); **md 768px** = chrome boundary (desktop vs mobile nav); **lg 1024px** = optional extra columns. Mobile-first.
- Three distinct **trust zones** must stay visually separate: (1) external reference sources, (2) the grade price ladder, (3) Meecard's own marketplace listings.

## 8. Screen to design — Card detail (`/cards/[code]`)

Desktop, three columns at top:
- **Left rail (acquire)**: portrait card image (aspect **63:88**) + ★ favorite; card name, rarity badge, set code; then the gold **"ซื้อบน Meecard"** button + a 2×2 grid of outline actions (**เพิ่มเข้าพอร์ต · แชร์ · แจ้งเตือนราคา · เปรียบเทียบ**).
- **Center (price instrument)**: edition toggle **JP | EN**; horizontal grade chips with prices; the **ONE hero price** (`.text-display`) + green/red ▲% + caption "ราคากลาง · JP · Raw · อัปเดต …"; a 30-day **range bar** (ต่ำสุด – สูงสุด, est).
- **Right (market stats)**: flat list — ขายล่าสุด · ราคาตั้งต่ำสุด · ช่วง 30 วัน (est tags on modeled).

Then: a tab row (ภาพรวม · แหล่งอ้างอิง · ขายบน Meecard · สเปก); a wide **price chart** with Raw|Graded filter + range pills + เทียบเกรด compare overlay, beside a narrow **"แหล่งอ้างอิง"** sources panel (tabs ประกาศขาย|ขายไปแล้ว: SNKRDUNK / Yuyu-tei rows); then **"ขายอยู่บน Meecard"** marketplace listings; **"ข้อมูลการ์ด"** spec sheet (Cost/Power/Counter/Life/Color/Type/Attribute/Trait + effect text); **"การ์ดอื่นในเซ็ต"** related grid.

Mobile: single column in this order — image+name → grade chips → hero price + range bar → gold Buy → action grid → stats → chart → sources → listings → specs → related; plus a **sticky bottom bar** (price + gold Buy).

Sample data (use real-looking values, not lorem): card **"Roronoa Zoro"**, code **OP01-001**, rarity **L (Leader)**, set **OP01 Romance Dawn**; Raw ฿25 (▲50%), PSA 10 ฿5,673; sources SNKRDUNK (graded, USD) + Yuyu-tei (raw, JPY); currency shown in **฿ (THB)**.
