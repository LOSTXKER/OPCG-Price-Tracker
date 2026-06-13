# Honey Economy Rebalance v2

> อัปเดตล่าสุด: 2026-06-14 · cross-checked vs code
>
> สเปคเศรษฐกิจ Honey (earning / spending / levels / achievements / missions / anti-abuse) — **เน้นเหตุผลออกแบบ (why)**; ตัวเลขจริงคือ source-of-truth ในโค้ด
>
> SSOT: `src/lib/honey/index.ts` (ledger + policy) · `src/lib/honey/rank-tiers.ts` (levels) · `scripts/seed-achievements.ts` · `scripts/seed-honey-shop.ts` · งานค้าง → `PLAN.md` M1
>
> เป้าหมายแกนกลาง: **"Active user ถึง 30-day Pro Pass (8,000) ใน ~6–8 เดือน"** (calibrated ใน `HONEY_REWARDS` — tune ตัวเลขพร้อมกันทั้งชุด)

---

## 1. Overview

Honey คือ Loyalty Points สร้าง daily engagement ผ่าน theme มาสคอต Kuma (หมีเก็บน้ำผึ้ง)

**เป้าหมายของระบบ:**

- ดึง user กลับมาใช้งานทุกวัน (retention)
- กระตุ้นแชร์/ชวนเพื่อน (viral growth)
- ทางเลือกแลก Pro/Pro+ โดยไม่จ่ายเงินจริง (soft monetization)
- sense of progression (levels, achievements, leaderboard)

**Persona target curve** (เป้าหมาย design — ใช้ปรับ balance):

| Persona | Honey/วัน | Honey/เดือน | ระยะถึง 30-day Pro Pass (8,000) |
|---------|----------:|------------:|--------------------------------:|
| Casual  | 5–10      | ~200        | ไม่ถึงโดยธรรมชาติ |
| Active  | 25–35     | ~800–1,000  | **~8 เดือน** *(target)* |
| Engaged | 50–70     | ~1,500–2,000| ~4–5 เดือน |
| Power   | 100–150   | ~3,000–4,500| ~2 เดือน |

---

## 2. การรับ Honey (Earning)

### 2.1 Base Rewards — `HONEY_REWARDS` (`src/lib/honey/index.ts`)

| Action | Type | Honey | Daily limit | หมายเหตุ |
|--------|------|------:|:-----------:|----------|
| Check-in รายวัน | `CHECKIN` | **5** | 1/วัน (auto) | ×2 ที่ streak 7d, ×3 ที่ streak 30d |
| ขายสำเร็จบน Marketplace | `MARKETPLACE_SELL` | **25** | **5/วัน** | |
| Review ผู้ซื้อ/ผู้ขาย | `REVIEW` | **5** | **3/วัน** | |
| ส่งราคาชุมชน | `COMMUNITY_PRICE` | **8** | **3/วัน** | |
| แชร์ Deck | `DECK_SHARE` | **20** | **2/วัน** | |
| ทายราคาถูกต้อง | `PRICE_PREDICTION` | **15** | – | จ่ายผ่าน cron `resolve-predictions` |
| ซื้อสำเร็จ Marketplace | `BUYER_PURCHASE` | **30** | – | |
| Trial Bonus | `TRIAL_BONUS` | **30** | – | |
| Onboarding | `ONBOARDING` | **100** | 1 ครั้ง | first impression |
| ชวนเพื่อน (Referrer) | `REFERRAL` | **150** | – | |
| Welcome bonus (Referee) | `REFERRAL_WELCOME` | **30** | – | จ่ายผ่าน `earnHoney` (รับ tier×seasonal) |
| Streak milestone 7d | `MILESTONE_STREAK_7` | **25** | 1/streak | one-shot ตอน check-in ที่ครอสเส้น |
| Streak milestone 30d | `MILESTONE_STREAK_30` | **100** | 1/streak | one-shot ตอน check-in ที่ครอสเส้น |

> หมายเหตุ verify: `DAILY_LIMITS` ในโค้ดมีเฉพาะ 4 ตัว (REVIEW=3, COMMUNITY_PRICE=3, MARKETPLACE_SELL=5, DECK_SHARE=2). `CHECKIN` คุมด้วย `lastCheckinAt` (1/วัน) ไม่ใช่ `DAILY_LIMITS`.

**Global daily cap = 200** (`GLOBAL_DAILY_CAP`) — เพดานรวมของแหล่ง "farmable" ที่ spam ได้
`GLOBAL_CAP_TYPES` = CHECKIN, MARKETPLACE_SELL, REVIEW, COMMUNITY_PRICE, DECK_SHARE, PRICE_PREDICTION, BUYER_PURCHASE, **DAILY_MISSION, WEEKLY_MISSION, MONTHLY_MISSION**

**ไม่อยู่ใต้ cap** (จ่ายเต็มเสมอ): REFERRAL, REFERRAL_WELCOME, ACHIEVEMENT, LEVEL_UP, LEADERBOARD_REWARD, RAFFLE_*, MILESTONE_STREAK_*, WEEKLY_BONUS, MONTHLY_PERFECT_BONUS, ADMIN_GRANT

> **Why cap-by-type ไม่ใช่ cap-รวมทั้งหมด:** one-off / rare events (referral, achievement, milestone) คุมตัวเองด้วย dedup อยู่แล้ว → ปล่อยจ่ายเต็มเพื่อไม่ให้ผู้เล่นขยันโดน "เพดานวันนั้นเต็ม" บดบังรางวัลที่ตั้งใจให้

### 2.2 Multiplier policy — `MULTIPLIER_POLICY` (`src/lib/honey/index.ts`)

แก้ที่เดียว ไม่ต้อง grep หลายไฟล์ — บอกว่าแต่ละ action สแต็กตัวคูณตัวไหน

| ระดับ | ตัวคูณ | Action types |
|---|---|---|
| `tier_and_seasonal` | tier × seasonal | CHECKIN, MARKETPLACE_SELL, REVIEW, COMMUNITY_PRICE, DECK_SHARE, ONBOARDING, TRIAL_BONUS, REFERRAL, REFERRAL_WELCOME, PRICE_PREDICTION, BUYER_PURCHASE, **DAILY_MISSION**, WEEKLY_MISSION |
| `tier_only` | tier เท่านั้น (rare event) | WEEKLY_BONUS, **MONTHLY_MISSION**, MONTHLY_PERFECT_BONUS |
| `none` | ไม่ใช้ตัวคูณ | ACHIEVEMENT, LEVEL_UP, LEADERBOARD_REWARD, RAFFLE_TICKET, RAFFLE_WIN, ADMIN_GRANT, REDEEM, EXPIRED, MILESTONE_STREAK_7/30 + legacy codes |

Streak multiplier (`getStreakMultiplier`: <7→1×, ≥7→2×, ≥30→3×) มีผลเฉพาะ `CHECKIN`

> **Why tier_only สำหรับ rare events:** ไม่อยากให้ seasonal ×2 ไป double รางวัลก้อนใหญ่ที่ตั้งใจจ่ายครั้งเดียว (weekly/monthly bonus) → คุม budget ไม่ให้พุ่งช่วง event

### 2.3 Daily Missions — 4 ภารกิจ/วัน × 5 Honey (`src/lib/honey/missions.ts`)

ทุกวันมี 4 ภารกิจ (3 หลัก + 1 พิเศษหมุนเวียนตามวัน) ภารกิจละ **5 Honey** — สะท้อนพฤติกรรมธรรมชาติ
DB-driven (`UserMissionPeriod` cadence=DAILY) มี fallback hardcoded ใน `FALLBACK_CORE_MISSIONS` / `FALLBACK_ROTATING_MISSIONS`

**ภารกิจหลัก (ทุกวัน):** `check_price` (`/cards/[id]`) · `browse_trending` (`/trending`) · `visit_marketplace` (`/marketplace`) — auto-path
*(`visit_marketplace` ถูกตัดจาก roster อัตโนมัติเมื่อ admin ปิด marketplace — `MARKETPLACE_DEPENDENT_MISSION_IDS`)*

**ภารกิจพิเศษ (หมุนตาม `getDay()`):**

| วัน | ภารกิจ | ID | Trigger |
|-----|--------|----|---------|
| อาทิตย์(0) | เช็คพอร์ต | `check_portfolio` | `/portfolio` auto-path |
| จันทร์(1) | สำรวจเซ็ต | `explore_set` | `/sets/[id]` auto-path |
| อังคาร(2) | แชร์การ์ด | `share_card` | manual + `shareTarget` (cardId) |
| พุธ(3) | ภาพรวมตลาด | `visit_overview` | `/market-overview` auto-path |
| พฤหัส(4) | อ่านบทความ | `read_blog` | `/blog` auto-path |
| ศุกร์(5) | แชร์เว็บ | `share_site` | manual + `shareTarget` (url) |
| เสาร์(6) | รายการจับตา | `check_watchlist` | `/watchlist` auto-path |

**Anti-spam (§4.1):** share_* ต้องมี `shareTarget` ไม่ว่าง · auto-path ต้องผ่าน `MIN_AUTO_DWELL_MS` (8s)

**โบนัส (fallback values — DB override ได้ผ่าน `MissionBonusRule`):**

- **Perfect Day:** ทำครบ → **+10 × tier** (`FALLBACK_PERFECT_DAY_BONUS`)
- **Weekly Bonus:** perfect 7 วันติด → **+75 × tier + 1 ticket** (`WEEKLY_BONUS`, tier-only)
- **Monthly Perfect Bonus:** perfect **28 วันติด** → **+500 × tier + 3 tickets** (`MONTHLY_PERFECT_BONUS`; rolling 28-day, idempotent ต่อ ISO month)

**Earning ceiling จาก mission flow:** ต่อวัน 4×5+10 = **30** · ต่อสัปดาห์ perfect 30×7+75 = **285** (+1 ticket) · ต่อเดือน perfect 28d ≈ **1,640** (+7 tickets รวม weekly+monthly)

### 2.4 Weekly Missions — ⚠️ ยังไม่ build (scaffolding only)

มีแค่โครง: `MissionCadence.WEEKLY` enum + `HoneyActionType.WEEKLY_MISSION` (อยู่ใน `MULTIPLIER_POLICY` + `GLOBAL_CAP_TYPES`) **แต่ยังไม่มี mission ใดถูก seed/จ่ายจริง**:

- ❌ ไม่มี route `/api/honey/weekly-missions`
- ❌ ไม่มี `WeeklyMission` model (ใช้ `UserMissionPeriod` unified — ดู §7.3)
- ❌ `seed-missions.ts` seed เฉพาะ DAILY + bonus rules · `WEEKLY_MISSION` ไม่เคยถูก grant ที่ใด

→ ถ้าจะทำต่อ: เพิ่ม weekly templates (cadence=WEEKLY) + helper ใน `missions.ts` + route + UI

### 2.5 Monthly Raffle Missions — `RAFFLE_MISSIONS` (`src/lib/honey/missions.ts`)

ฝังใน mission engine (`UserMissionPeriod` cadence=MONTHLY) มุ่งจ่ายเป็น **ตั๋ว** เป็นหลัก

| Mission | Target | Reward |
|---------|-------:|--------|
| `explore_sets` | 15 unique | 0 Honey + 1 ticket |
| `check_cards` | 50 | 30 Honey + 1 ticket |
| `share_raffle` | 3 (manual) | 20 Honey + 1 ticket |
| `visit_trending` | 10 | 0 Honey + 1 ticket |
| **Bonus complete-all** (`RAFFLE_BONUS_REWARD`) | — | 0 Honey + **2 tickets** |

> **Why ออกแบบให้จ่ายตั๋วมากกว่า Honey:** raffle arc ดึงคนให้เข้าลุ้นของรางวัลจริง — Honey อีกแค่ "nudge" เล็กๆ ตอน complete ไม่ใช่แหล่ง farm หลัก

### 2.6 Level-Up Bonus — `rank-tiers.ts` (admin-editable)

> **เปลี่ยนสำคัญ:** ladder ย้ายจาก hardcoded ใน `levels.ts` → admin แก้ได้ที่ `/admin/honey/ranks` (เก็บใน `SystemConfig`). `levels.ts` ตอนนี้เป็น async wrapper (`getHoneyLevel` / `checkLevelUp`) อ่าน `getRankTiers()`. ค่า default คือ `DEFAULT_RANK_TIERS`:

| Level | Label (EN) | Threshold (lifetime) | Bonus |
|:-----:|------------|---------------------:|------:|
| 0 | Newbie | 0 | – |
| 1 | Bronze | 100 | 50 |
| 2 | Silver | 500 | 150 |
| 3 | Gold | 2,000 | 400 |
| 4 | Diamond | 5,000 | 1,000 |
| 5 | Master | 15,000 | 2,500 |

Level-up trigger อัตโนมัติใน `grantHoney()` เมื่อ `honeyLifetimeEarned` ครอสเกณฑ์ — รองรับครอสหลายระดับใน grant เดียว (admin grant 16,000 ให้ user 0 → จ่าย Master bonus 2,500) + ส่ง in-app/email/LINE ping

### 2.7 Achievements — `scripts/seed-achievements.ts`

13 families, progressive tiers รวม ~35,000 Honey ตลอด lifetime (เป็น long-term sink) — re-run seed = idempotent upsert by `code`

| Family | Codes | Reward (Honey) |
|--------|-------|----------------|
| Collector | `portfolio_10/50/100`, **`collector_500`**, `portfolio_1000` | 30 / 80 / 200 / 500 / 1,500 |
| Streaker | `streak_7/30/90/365` | 50 / 250 / 750 / 3,000 |
| Trader | `first_sell`, `trades_10/50/200` | 30 / 250 / 800 / 2,500 |
| Buyer | `first_buy`, `buyer_10/50/200` | 30 / 250 / 800 / 2,500 |
| Reviewer | `first_review`, `review_5/20/100` | 20 / 80 / 300 / 1,000 |
| Predictor (attempts) | `predict_5/25/100_attempts` | 30 / 150 / 500 |
| Predictor (correct) | `prediction_5/25/100` | 100 / 500 / 2,000 |
| Connector | `referral_1/5/10/20/50` | 100 / 300 / 600 / 1,000 / 3,000 |
| Watchlister | `watchlist_10/50/200` | 50 / 150 / 500 |
| Deck Master | `deck_3`, `deck_share_1/10/50` | 80 / 50 / 400 / 1,200 |
| Helper | `community_helper_10/50/200` | 150 / 500 / 1,500 |
| Honey Royalty | `honey_lifetime_5000/15000/50000` | 500 / 1,500 / 5,000 |
| Special | `perfect_week`, `perfect_month`, `raffle_first_win`, `raffle_3_wins` | 200 / 1,500 / 200 / 1,000 |

> Collector 500 ใช้ code `collector_500` (ไม่ใช่ `portfolio_500`) — ที่เหลือใน family pattern ตรง
> **Deprecated** (`DEPRECATED_CODES` → `isActive=false`, เก็บ row เดิม): `honey_lifetime_10000`, `honey_lifetime_25000`

### 2.8 Monthly Leaderboard Reward — Top 10 (`/api/cron/leaderboard-rewards`)

`REWARDS = [1500, 800, 400, 100×7]` — pool รวม **3,400 Honey/เดือน** · จัดอันดับจาก honey ที่ "earn" (ไม่นับ ADMIN_GRANT, LEADERBOARD_REWARD, LEVEL_UP)

| อันดับ | Honey |
|:------:|------:|
| 1 | 1,500 |
| 2 | 800 |
| 3 | 400 |
| 4–10 | 100 (consolation) |

> ⚠️ **cron นี้ยังไม่ถูก schedule ใน `vercel.json`** → Top-10 payout อาจไม่เคยรันอัตโนมัติ (ดู PLAN.md M1)

---

## 3. การใช้ Honey (Spending)

### 3.1 Honey Shop — Tiered catalog (`scripts/seed-honey-shop.ts`)

3 tier + Mega Pass พร้อม **`requiredLevel` gating** กัน abuse จาก admin grant วันแรก
> **Why gate ด้วย level:** admin grant ก้อนใหญ่ทำให้ balance พุ่งได้ทันที — gate ด้วย `requiredLevel` (อิง lifetime tier) บังคับให้ "เล่นจริง" ถึงระดับก่อนแลกของแพง

**Tier S — lvl 0 (50–300):**

| ของ | ราคา | type |
|-----|----:|------|
| Bronze Profile Frame | 50 | `PROFILE_FRAME` |
| Gold Profile Frame | 100 | `PROFILE_FRAME` |
| Listing Boost 24h | 120 | `CUSTOM` |
| CSV Export Pass | 150 | `CSV_EXPORT_PASS` |
| Price Alert +1 Slot | 180 | `PRICE_ALERT_SLOT` |
| Diamond Profile Frame | 200 | `PROFILE_FRAME` |
| Kuma Profile Badge | 200 | `BADGE` |
| Watchlist +5 Slots | 250 | `CUSTOM` |
| Flame Profile Frame | 300 | `PROFILE_FRAME` |

**Tier M — lvl 1 (500–1,200):**

| ของ | ราคา | type |
|-----|----:|------|
| Listing Boost 7-Day | 500 | `CUSTOM` |
| Bulk Lookup +50 | 600 | `CUSTOM` |
| Auto-Pricing 7-Day Pass | 800 | `CUSTOM` |
| LINE Alerts 7-Day Pass | 800 | `CUSTOM` |
| Mini Kuma Pet Skin | 1,200 | `PROFILE_FRAME` *(frameId: mini_kuma)* |

**Tier L — lvl 2 (2,500–15,000):**

| ของ | ราคา | type |
|-----|----:|------|
| Honey Pass — Pro 7d + badge | 2,500 | `TRIAL_PRO` |
| Honey Pass+ — Pro 30d + badge + 1 ticket | 8,000 | `TRIAL_PRO` |
| Honey Pro+ Pass — Pro+ 30d + badge + 2 tickets | 15,000 | `TRIAL_PRO_PLUS` |

**Mega — lvl 3 (capstone):**

| ของ | ราคา | type |
|-----|----:|------|
| Mega Honey Pass — Pro 90d + 3 tickets + Flame frame | 20,000 | `TRIAL_PRO` |

> ShopItemType จริง: Pro/Pro+ passes = `TRIAL_PRO` / `TRIAL_PRO_PLUS` (ไม่ใช่ `TIER_UPGRADE`); Mini Kuma = `PROFILE_FRAME`; utility passes (boost/auto-pricing/LINE/bulk/watchlist) = `CUSTOM` + `value.reward` flag → fulfillment ใน `src/lib/honey/fulfillment.ts`
> Legacy rows ถูกปิดด้วย `DEACTIVATE_NAMES` + แปลงชื่อด้วย `RENAME_MAP` ใน seed

### 3.2 Rotating featured slot (schema-ready)

ฟิลด์ `featuredUntil` / `availableUntil` / `originalCost` บน `HoneyShopItem` (มี `@@index([featuredUntil])`) สำหรับของ "Hot This Week" ราคา −20%
> ⚠️ **admin curation UI ยังไม่มี** ใน `/admin/honey/shop` (ดู PLAN.md M1) — ตอนนี้ตั้งค่าได้แค่ผ่าน DB/API ตรง

### 3.3 Monthly Raffle (`src/lib/honey/raffle.ts`)

> Lucky Draw เดิมถูกลบ — แทนด้วย Monthly Raffle ที่มีรางวัลจริง

**กลไก:** `TICKET_COST_DEFAULT = 50` Honey/ใบ · `MAX_TICKETS_DEFAULT = 5` ใบ/คน/เดือน

**ตั๋วฟรี:** Weekly Bonus 1 · Monthly Perfect Bonus 3 · raffle missions รวม 4 + complete-all 2 = 6 · แลก Honey Pass+/Pro+/Mega = 1/2/3 ตามลำดับ

**จับรางวัล:** `/api/cron/draw-raffle` (schedule `0 12 1 * *` — ทุกวันที่ 1) + admin manual draw

> **Why ตั๋ว 50 + cap 5/คน:** กันคนรวย-Honey กวาดตั๋วทั้งหมด → ให้โอกาสกระจาย, รักษา raffle เป็น "ลุ้น" ไม่ใช่ "ซื้อชนะ"

---

## 4. Anti-Abuse Measures

### 4.1 Mission Track Security

- `trackMission()` รับเฉพาะ task `trackType=manual` — auto-path ต้องผ่าน `trackMissionByPath()` (server เช็ค pathname จริง)
- auto-path ต้องผ่าน `MIN_AUTO_DWELL_MS` (8s) ที่ client ส่งมา → กัน drive-by route change
- share_* ต้องมี `shareCompleted: true` **และ** `shareTarget` ไม่ว่าง (cardId/url) → บันทึก `metadata.shareTargets` กัน dup
- ทุก claim path ใช้ `idempotencyKey` บน `HoneyTransaction` + Serializable tx → กัน double-pay จาก concurrent request

### 4.2 Daily caps & global cap

ดู §2.1 — anti-farm ระดับ action (`DAILY_LIMITS`) + global ceiling 200/วัน (`remainingGlobalCap`)

### 4.3 Referral Click Dedup

`recordReferralClick()` skip ถ้า same IP + same linkId + same day → กันกดลิงก์ตัวเองซ้ำ

### 4.4 Removed earning sources

- `PORTFOLIO_ADD` reward — ลบ (ฝืนเพิ่มการ์ดเพื่อ farm)
- `affiliate_click` mission — ลบ (ผู้ใช้ควบคุมไม่ได้)
- `pull_calculator` / `use_compare` / `read_guide` — ไม่ใช่กิจวัตร, ลบ

### 4.5 Shop level gating

`requiredLevel` บล็อกแลกของ Tier M/L/Mega จาก user lifetime ต่ำ → กัน admin-grant abuse วันแรก (§3.1)

### 4.6 Deprecated action-type guard

`assertNotDeprecatedHoneyActionType()` (`deprecated.ts`) — wired ใน `grantHoney`; ขว้าง error ถ้าพยายามเขียน type ใน `DEPRECATED_HONEY_ACTION_TYPES` (PORTFOLIO_ADD, GIFT_SEND, GIFT_RECEIVE, LUCKY_DRAW, FIRST_PURCHASE, SHARE, AFFILIATE) → กัน legacy value หลุดลง ledger จริง

---

## 5. Economy Balance Analysis

> ตัวเลขประมาณการเชิงออกแบบ — ใช้ตั้งเป้า ไม่ใช่ผลวัดจริง

### 5.1 Earning/เดือน per persona

| Persona | Daily missions | Weekly bonus | Monthly perfect | Check-in | Other | **รวม/เดือน** |
|---------|--------------:|-------------:|----------------:|---------:|------:|--------------:|
| Casual | – | – | – | ~150 | – | ~200 |
| Active | ~600 | – | – | ~300 | ~100 | **~1,000** |
| Engaged | ~840 | ~300 | – | ~450 | ~400 | **~2,000** |
| Power | ~840 | ~300 | ~500 | ~900 | ~1,500 | ~4,000+ |

### 5.2 ระยะถึง goal

| เป้าหมาย | Honey | Active | Engaged | Power |
|----------|-----:|-------:|--------:|------:|
| Listing Boost 24h | 120 | ~4 วัน | ~2 วัน | ~1 วัน |
| Bronze level (lifetime) | 100 | ~3 วัน | ~2 วัน | ~1 วัน |
| Watchlist +5 | 250 | ~1 สัปดาห์ | ~4 วัน | ~2 วัน |
| Auto-Pricing 7-Day | 800 | ~3–4 สัปดาห์ | ~2 สัปดาห์ | ~1 สัปดาห์ |
| Honey Pass (Pro 7d) | 2,500 | ~2.5 เดือน | ~1.3 เดือน | ~3 สัปดาห์ |
| **Honey Pass+ (Pro 30d)** | **8,000** | **~8 เดือน** *(target)* | **~4 เดือน** | **~2 เดือน** |
| Honey Pro+ Pass (Pro+ 30d) | 15,000 | ~15 เดือน | ~7.5 เดือน | ~4 เดือน |
| Mega Honey Pass (Pro 90d) | 20,000 | ~20 เดือน | ~10 เดือน | ~5 เดือน |

### 5.3 Honey Sinks

| Sink | ดูดซับ/เดือน | หมายเหตุ |
|------|-----:|----------|
| Raffle Tickets | 50–250 | 1–5 ใบ |
| Tier S cosmetics | 50–300 | first-time |
| Tier M utility | 500–1,200 | 7-day passes |
| Tier L premium | 2,500–15,000 | goal หลัก Active+ |
| Mega Pass | 20,000 | power-user (รายปี) |

---

## 6. Referral System (`src/lib/honey/referral.ts`)

### 6.1 Flow

```
User A สร้าง Referral Link → /ref/[code] redirect + set cookie ref_code (30 วัน)
  → User B สมัคร → processReferralConversion():
      User A ได้ 150 Honey (REFERRAL,         tier × seasonal)
      User B ได้  30 Honey (REFERRAL_WELCOME, tier × seasonal)
```

ทั้งสองฝั่งจ่ายผ่าน `earnHoney()` → รับ multiplier ตาม policy

### 6.2 Implementation

- **referral code:** 8-char hex เก็บใน `User.referralCode`
- **tracking:** `ReferralLink` + `ReferralClick`
- **cookie:** `ref_code` httpOnly 30 วัน (set ที่ `/ref/[code]`)
- **conversion:** trigger เมื่อตรวจพบ user ใหม่ (sync app user / auth callback)
- **click dedup:** IP + linkId per day (§4.3)

---

## 7. Technical Architecture

### 7.1 Core files (`src/lib/honey/`)

| ไฟล์ | หน้าที่ |
|------|---------|
| `index.ts` | Ledger: `grantHoney` / `earnHoney` / `earnHoneyDirect` / `spendHoney` + `HONEY_REWARDS` / `DAILY_LIMITS` / `GLOBAL_DAILY_CAP` / `GLOBAL_CAP_TYPES` / `MULTIPLIER_POLICY` |
| `rank-tiers.ts` | `DEFAULT_RANK_TIERS` + pure helpers (`getHoneyLevelFromTiers`, `checkLevelUpFromTiers`) — client-safe |
| `rank-tiers-server.ts` | DB loader `getRankTiers()` (SystemConfig, TTL cache) |
| `levels.ts` | async wrappers `getHoneyLevel` / `checkLevelUp` + `LEVEL_THRESHOLD` / `LEVEL_UP_BONUS` (back-compat) |
| `missions.ts` | Mission engine (DAILY + MONTHLY raffle), perfect-day, weekly/monthly perfect bonus |
| `achievements.ts` | Achievement checking + auto-grant |
| `fulfillment.ts` | Shop item fulfillment (auto-pricing/LINE/watchlist/bulk/boost passes) |
| `referral.ts` | Referral conversion + welcome bonus |
| `raffle.ts` | Monthly raffle (tickets, draw) — `TICKET_COST_DEFAULT` / `MAX_TICKETS_DEFAULT` |
| `deprecated.ts` | Frozen action-type guard |
| `scripts/seed-achievements.ts` | Achievement seed (13 families) |
| `scripts/seed-honey-shop.ts` | Shop catalog seed |
| `scripts/honey-dry-run-30d.ts` | Dry-run simulator |

### 7.2 API routes (`src/app/api/honey/` ที่มีจริง)

| Route | หน้าที่ |
|-------|---------|
| `/api/honey` (POST) | check-in, redeem (เช็ค `requiredLevel` + `availableUntil`) |
| `/api/honey/missions` | daily missions: track / claim / bonus |
| `/api/honey/raffle-missions` | monthly raffle missions |
| `/api/honey/raffle` | raffle tickets |
| `/api/honey/shop` | shop catalog |
| `/api/honey/achievements` | achievement list/state |
| `/api/honey/onboarding` | onboarding bonus |
| `/api/honey/predictions` | price prediction CRUD |
| `/api/honey/referral` | referral link |
| `/api/honey/ranks` | rank tiers |
| `/api/honey/leaderboard` | leaderboard view |
| `/api/admin/honey/grant` | admin grant → `grantHoney` |
| `/api/cron/leaderboard-rewards` | Top-10 payout *(⚠️ ยังไม่ schedule)* |
| `/api/cron/resolve-predictions` | `earnHoney("PRICE_PREDICTION")` (schedule `0 10 * * 1`) |
| `/api/cron/draw-raffle` | end-of-month raffle draw (schedule `0 12 1 * *`) |

> ❌ ไม่มี `/api/honey/weekly-missions` (weekly missions ยังไม่ build — §2.4)

### 7.3 Prisma schema (v2)

| Field / model | หน้าที่ |
|---|---|
| `HoneyShopItem.requiredLevel` | level gating |
| `HoneyShopItem.featuredUntil` / `availableUntil` / `originalCost` | rotating featured slot |
| `MissionCadence` enum (`DAILY`/`WEEKLY`/`MONTHLY`) | unified cadence |
| `UserMissionPeriod` (cadence + periodKey + tasks JSON) | **รวม** daily/weekly/monthly เป็น model เดียว (มาแทน DailyMission/WeeklyMission/MonthlyMission triplet) |
| `MissionBonusRequirement.MONTHLY_PERFECT` | 28-day perfect bonus rule |
| `User.extraWatchlistSlots` / `bulkLookupCredits` | shop fulfillment counters |
| `User.autoPricingUntil` / `lineAlertsUntil` / `weeklyListingBoostUntil` | shop fulfillment time-windows |
| `HoneyActionType.REFERRAL_WELCOME` / `MILESTONE_STREAK_7/30` / `BUYER_PURCHASE` / `MONTHLY_PERFECT_BONUS` / `WEEKLY_MISSION` | new earning types |

> ⚠️ ไม่มี `WeeklyMission` model แยก — ทั้งหมดรวมใน `UserMissionPeriod` (Phase 3.2 unification, migration `20260503000000_unify_mission_periods`). `WEEKLY_MISSION` action type + `MissionCadence.WEEKLY` มีไว้รองรับอนาคต แต่ยังไม่มี payload จริง

### 7.4 Migrations (เกี่ยวกับ honey)

`20260330000000_honey_features_bootstrap` · `20260401000000_daily_mission_redesign` · `20260401100000_honey_economy_rebalance` · `20260401200000_honey_refactor_cleanup` · `20260426050615_add_mission_system` · `20260501000000_honey_rebalance_v2` · `20260503000000_unify_mission_periods`

### 7.5 Deprecated / removed

| Item | เหตุผล |
|------|--------|
| ~~Lucky Draw~~ | แทนด้วย Monthly Raffle |
| ~~`affiliate_click` mission~~ | ผู้ใช้ควบคุมไม่ได้ |
| ~~`PORTFOLIO_ADD` reward~~ | farm risk (frozen ใน `deprecated.ts`) |
| ~~legacy shop names~~ | ปิดด้วย `DEACTIVATE_NAMES` ใน seed |
| ~~`honey_lifetime_10000/25000`~~ | `isActive=false` (เก็บ row user เดิม) |
| ~~DailyMission/MonthlyMission models~~ | รวมเป็น `UserMissionPeriod` |

---

## 8. Validation

### 8.1 Tests (`src/lib/honey/__tests__/`)

- `levels.test.ts` — `getHoneyLevel`, `checkLevelUp`, ครอส Master @ 15,000, single-grant multi-level
- `policy.test.ts` — `HONEY_REWARDS` / `DAILY_LIMITS` / `GLOBAL_DAILY_CAP` / `GLOBAL_CAP_TYPES` / `MULTIPLIER_POLICY` exhaustiveness
- `earn.test.ts` — `earnHoney` daily limits / global cap / tier × seasonal / ADMIN_GRANT lifetime accounting / level-up cascade

รัน `npm test`

### 8.2 Dry-run simulation

`npx tsx scripts/honey-dry-run-30d.ts` — รีเพลย์ทรานแซคชัน 30 วันภายใต้กฎ v2: cohort total old vs new, per-user delta percentiles, top/bottom winners, sanity gate (top earner ไม่ควร gain >~2×, bottom 50% ไม่ติดลบ)

---

## 9. Pending / Future Work

> reconcile กับ `PLAN.md` M1 — เก็บเฉพาะที่ยังค้างจริง

| Item | สถานะ | หมายเหตุ |
|------|--------|----------|
| Seasonal events admin UI | ✅ **DONE** | `/admin/honey/events` มี manager + form + new/[id] |
| Raffle auto-draw cron deploy | ✅ **DONE** | `draw-raffle` schedule `0 12 1 * *` ใน vercel.json |
| Achievement unlock toast | 🔲 Pending | ยังไม่มี component แจ้งตอนปลดล็อก |
| Physical prize fulfillment flow | 🔲 Pending | flow เก็บที่อยู่จัดส่งผู้ชนะ raffle (ผูก `ShippingAddress` ที่มีอยู่ได้) |
| Featured-slot curation UI ใน `/admin/honey/shop` | 🔲 Pending | schema/field พร้อม (`featuredUntil`) แต่ไม่มีหน้า admin (§3.2) |
| **Leaderboard-rewards cron schedule** | 🔲 Pending | route มีจริงแต่ไม่อยู่ใน `vercel.json` → Top-10 payout อาจไม่เคยรัน (เสนอ: วันที่ 1 หลัง draw-raffle) + ตรวจ backfill |
| Weekly Missions (build จริง) | 🔲 Pending | มีแค่ scaffolding enum/action-type — ต้องเพิ่ม templates + helper + route + UI (§2.4) |
| Anti-abuse score model | 💭 Future | per-user abuse signal เตือน admin |
