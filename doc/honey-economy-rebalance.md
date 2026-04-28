# Honey Economy Rebalance v2

> เอกสารสรุประบบเศรษฐกิจ Honey ฉบับ **v2** (Updated April 2026)
> ครอบคลุมการรับ (Earning), การใช้ (Spending), levels, achievements, missions และกลไก anti-abuse ทั้งหมด
>
> เป้าหมายแกนกลาง: **"Active user ถึง 30-day Pro Pass ใน ~6–8 เดือน"**

---

## 1. Overview

Honey คือระบบ Loyalty Points ที่ใช้สร้าง daily engagement ผ่าน theme มาสคอต Kuma (หมีเก็บน้ำผึ้ง)

**เป้าหมายของระบบ:**

- ดึง User กลับมาใช้งานทุกวัน (retention)
- กระตุ้นการแชร์/ชวนเพื่อน (viral growth)
- เป็นทางเลือกแลก Pro/Pro+ โดยไม่ต้องจ่ายเงินจริง (soft monetization)
- สร้าง sense of progression (levels, achievements, leaderboard)

**Persona target curve (§3.1 ของ v2 plan):**

| Persona | Honey/วัน | Honey/เดือน | ระยะเวลาถึง 30-day Pro Pass (8,000) |
|---------|----------:|------------:|--------------------------------:|
| Casual | 5–10 | ~200 | ไม่ถึงโดยธรรมชาติ |
| Active | 25–35 | ~800–1,000 | **~8 เดือน** *(target)* |
| Engaged | 50–70 | ~1,500–2,000 | ~4–5 เดือน |
| Power | 100–150 | ~3,000–4,500 | ~2 เดือน |

---

## 2. การรับ Honey (Earning)

### 2.1 Base Rewards — `HONEY_REWARDS` (`src/lib/honey/index.ts`)

| Action | Type | Honey | Daily limit | หมายเหตุ |
|--------|------|------:|:-----------:|----------|
| Check-in รายวัน | `CHECKIN` | **5** | 1/วัน (auto) | ×2 ที่ streak 7d, ×3 ที่ streak 30d |
| ขายสำเร็จบน Marketplace | `MARKETPLACE_SELL` | **25** | **5/วัน** | |
| Review ผู้ซื้อ/ผู้ขาย | `REVIEW` | **5** | **3/วัน** | |
| ส่งราคาชุมชน | `COMMUNITY_PRICE` | **8** | **3/วัน** | |
| แชร์ Deck | `DECK_SHARE` | **20** | **2/วัน** | + per-deck dedup |
| ทายราคาถูกต้อง | `PRICE_PREDICTION` | **15** | – | จ่ายผ่าน cron (`earnHoney`) |
| ซื้อสำเร็จครั้งแรก/บ่อยๆ | `BUYER_PURCHASE` | **30** | – | Track ผ่าน achievement-style dedup |
| Trial Bonus | `TRIAL_BONUS` | 30 | – | |
| Onboarding | `ONBOARDING` | **100** | 1 ครั้ง | One-time first impression |
| ชวนเพื่อน (Referrer) | `REFERRAL` | **150** | – | |
| Welcome bonus (Referee) | `REFERRAL_WELCOME` | **30** | 1 ครั้ง | จ่ายผ่าน `earnHoney` (รับ tier×seasonal) |
| Streak milestone 7d | `MILESTONE_STREAK_7` | **25** | 1/streak | One-shot ขณะ check-in ที่ครอสเส้น |
| Streak milestone 30d | `MILESTONE_STREAK_30` | **100** | 1/streak | One-shot ขณะ check-in ที่ครอสเส้น |

**Global daily cap:** สูงสุด **200 Honey/วัน** จากแหล่ง "farmable" รวมกัน (CHECKIN, MARKETPLACE_SELL, REVIEW, COMMUNITY_PRICE, DECK_SHARE, PRICE_PREDICTION, BUYER_PURCHASE, daily/weekly/monthly missions)

แหล่งที่ **ไม่อยู่ใต้ global cap** (จ่ายเต็มเสมอ): REFERRAL, REFERRAL_WELCOME, ACHIEVEMENT, LEVEL_UP, LEADERBOARD_REWARD, RAFFLE_*, MILESTONE_STREAK_*, WEEKLY_BONUS, MONTHLY_PERFECT_BONUS, ADMIN_GRANT.

### 2.2 Multiplier policy

ตารางอย่างเป็นทางการอยู่ในตัวแปร `MULTIPLIER_POLICY` (`src/lib/honey/index.ts`) — แก้ที่นี่ที่เดียว ไม่ต้อง grep หลายไฟล์

| ระดับ | ตัวคูณที่สแต็ก | Action types |
|---|---|---|
| `tier_and_seasonal` | tier × seasonal | CHECKIN, MARKETPLACE_SELL, REVIEW, COMMUNITY_PRICE, DECK_SHARE, ONBOARDING, TRIAL_BONUS, REFERRAL, REFERRAL_WELCOME, PRICE_PREDICTION, BUYER_PURCHASE, DAILY_MISSION, WEEKLY_MISSION |
| `tier_only` | tier เท่านั้น (rare event) | WEEKLY_BONUS, MONTHLY_MISSION, MONTHLY_PERFECT_BONUS |
| `none` | ไม่ใช้ตัวคูณ | ACHIEVEMENT, LEVEL_UP, LEADERBOARD_REWARD, RAFFLE_TICKET, RAFFLE_WIN, ADMIN_GRANT, REDEEM, EXPIRED, MILESTONE_STREAK_7/30 |

Streak multiplier (`×2 @ 7d`, `×3 @ 30d`) มีผลเฉพาะ `CHECKIN` เท่านั้น

### 2.3 Daily Missions — 4 ภารกิจ/วัน × 5 Honey

ทุกวันมี 4 ภารกิจ (3 ภารกิจหลัก + 1 ภารกิจพิเศษหมุนเวียนตามวัน) ภารกิจหนึ่งให้ **5 Honey** (เดิม 10) — ทั้งหมดสะท้อนพฤติกรรมธรรมชาติของผู้ใช้

**ภารกิจหลัก (ทุกวัน):**

| ภารกิจ | ID | Honey | Trigger |
|--------|-----|------:|---------|
| เช็คราคาการ์ด | `check_price` | 5 | เข้าหน้า `/cards/[id]` (auto-path) |
| ดูการ์ดมาแรง | `browse_trending` | 5 | เข้าหน้า `/trending` (auto-path) |
| เยี่ยมชม Marketplace | `visit_marketplace` | 5 | เข้าหน้า `/marketplace` (auto-path) |

**ภารกิจพิเศษ (หมุนเวียนตามวัน):**

| วัน | ภารกิจ | ID | Honey | Trigger |
|-----|--------|----|------:|---------|
| อาทิตย์ | เช็คพอร์ต | `check_portfolio` | 5 | `/portfolio` (auto-path) |
| จันทร์ | สำรวจเซ็ตการ์ด | `explore_set` | 5 | `/sets/[id]` (auto-path) |
| อังคาร | แชร์การ์ด | `share_card` | 5 | Web Share API + `shareCompleted` + `shareTarget` (cardId) |
| พุธ | ดูภาพรวมตลาด | `visit_overview` | 5 | `/market-overview` (auto-path) |
| พฤหัสบดี | อ่านบทความ | `read_blog` | 5 | `/blog` (auto-path) |
| ศุกร์ | แชร์เว็บ | `share_site` | 5 | Web Share API + `shareCompleted` + `shareTarget` (url) |
| เสาร์ | เช็ครายการจับตา | `check_watchlist` | 5 | `/watchlist` (auto-path) |

**Anti-spam (§4.1):**

- `share_*` ต้องมี non-empty `shareTarget` ใน metadata — ไม่ใช่แค่ flag
- Auto-path tasks ต้องผ่านขั้นต่ำ `dwellMs` (8s) ที่ client tracker ส่งมา ก่อน server จะนับ
- Server-event track type ถูกลบทั้งหมด

**โบนัส:**

- **Perfect Day Bonus:** ทำครบทุกภารกิจ → **+10 Honey × tier**
- **Weekly Bonus:** Perfect day ครบ 7 วันติด → **+75 Honey × tier + 1 raffle ticket** (`WEEKLY_BONUS`, ไม่รับ seasonal)
- **Monthly Perfect Bonus (NEW):** Perfect day ครบ **28 วันติด** → **+500 Honey × tier + 3 raffle tickets** (`MONTHLY_PERFECT_BONUS`)

**Earning ceiling จาก mission flow:**

- ต่อวัน (ครบ): 4 × 5 + 10 = **30 Honey/วัน**
- ต่อสัปดาห์ (perfect): 30 × 7 + 75 = **285 Honey/สัปดาห์** (+1 ticket)
- ต่อเดือน (perfect 28d): 30 × 28 + 75 × 4 + 500 = **1,640 Honey/เดือน** (+7 tickets)

### 2.4 Weekly Missions (NEW — 3 ภารกิจ/สัปดาห์)

อยู่ใน mission engine เดียวกันกับ daily/monthly ภายใต้ `cadence: WEEKLY` (`MissionTemplate.cadence`) Reset ทุกวันจันทร์ 00:00

ตัวอย่าง:

- "Browse 5 different sets" — 40 Honey + 1 raffle ticket
- "Add 3 cards to portfolio or watchlist" — 30 Honey
- "Complete 1 marketplace listing OR review OR community price" — 50 Honey

**Per-week ceiling:** ~120 Honey + 1 ticket

### 2.5 Monthly Raffle Missions (REFRESHED)

ฝังไว้ใน mission engine ภายใต้ `cadence: MONTHLY` — เลิกแยกเป็นไฟล์ `raffle-missions.ts` มุ่งจ่ายเป็น **ตั๋ว** ไม่ใช่ Honey

| Mission | Target | Reward |
|---------|-------:|--------|
| `explore_sets` | 15 unique | 0 Honey + 1 ticket |
| `check_cards` | 50 | **30 Honey + 1 ticket** *(was 50 + 0)* |
| `share_raffle` | 3 | **20 Honey + 1 ticket** *(was 30 + 0)* |
| `visit_trending` | 10 | 0 Honey + 1 ticket |
| **Bonus complete-all** | — | **0 Honey + 2 tickets** *(was 0 + 1)* |

### 2.6 Level-Up Bonus (ครั้งเดียวต่อระดับ — `src/lib/honey/levels.ts`)

| ระดับ | Label | Lifetime ที่ต้องการ | Bonus |
|:-----:|-------|------------------:|------:|
| 1 | Bronze | 100 | 50 |
| 2 | Silver | 500 | 150 |
| 3 | Gold | 2,000 | 400 |
| 4 | Diamond | 5,000 | 1,000 |
| 5 | **Master (NEW)** | 15,000 | 2,500 |

Level-up bonus ถูก trigger อัตโนมัติภายใน `grantHoney()` เมื่อ `honeyLifetimeEarned` ข้ามเกณฑ์ — รองรับการครอสหลายระดับใน grant ครั้งเดียว (เช่น admin grant 16,000 ให้ user 0 → จ่ายเฉพาะ Master bonus 2,500)

### 2.7 Achievements (ครอบ 5 families)

จาก [scripts/seed-achievements.ts](../scripts/seed-achievements.ts) — รีเฟรชเป็น 5 families ที่มี progressive tiers รวมประมาณ **~35,000 Honey** ตลอด lifetime ของผู้เล่น (≈ 4 free 30-day Pro Passes กระจายไปทั้งหมด — เหมาะกับ sink ระยะยาว)

| Family | Tiers | Reward (Honey) |
|--------|-------|----------------|
| **Collector** | `portfolio_10/50/100/500/1000` | 30 / 80 / 200 / 500 / **1,500** |
| **Streaker** | `streak_7/30/90/365` | 50 / 250 / 750 / **3,000** |
| **Trader** | `first_sell`, `trades_10/50/200` | 30 / 250 / 800 / **2,500** |
| **Buyer** | `first_buy`, `buyer_10/50/200` | 30 / 250 / 800 / **2,500** |
| **Reviewer** | `first_review`, `review_5/20/100` | 20 / 80 / 300 / **1,000** |
| **Predictor (attempts)** | `predict_5/25/100_attempts` | 30 / 150 / 500 |
| **Predictor (correct)** | `prediction_5/25/100` | 100 / 500 / 2,000 |
| **Connector** | `referral_1/5/10/20/50` | 100 / 300 / 600 / 1,000 / **3,000** |
| **Watchlister** | `watchlist_10/50/200` | 50 / 150 / **500** |
| **Deck Master** | `deck_3`, `deck_share_1/10/50` | 80 / 50 / 400 / **1,200** |
| **Helper** | `community_helper_10/50/200` | 150 / 500 / **1,500** |
| **Honey Royalty (lifetime)** | `honey_lifetime_5000/15000/50000` | 500 / 1,500 / 5,000 |
| **Special** | `perfect_week`, `perfect_month`, `raffle_first_win`, `raffle_3_wins` | 200 / 1,500 / 200 / 1,000 |

**Deprecated codes** (ปิดด้วย `isActive=false` แต่เก็บ row เพื่อรักษา UserAchievement records เดิม): `honey_lifetime_10000`, `honey_lifetime_25000`

### 2.8 Monthly Leaderboard Reward — Top 10

จาก [src/app/api/cron/leaderboard-rewards/route.ts](../src/app/api/cron/leaderboard-rewards/route.ts) — จ่ายต้นเดือนทุกเดือน

| อันดับ | Honey |
|:------:|------:|
| 1 | **1,500** |
| 2 | **800** |
| 3 | **400** |
| 4–10 | 100 (consolation) |

(เดิมจ่ายแค่ Top 3 = 500/300/100; v2 ขยายเป็น Top 10 + ปรับให้สอดคล้องกับ earning curve ใหม่)

---

## 3. การใช้ Honey (Spending)

### 3.1 Honey Shop — Tiered catalog (NEW)

จาก [scripts/seed-honey-shop.ts](../scripts/seed-honey-shop.ts) แบ่งเป็น 3 ชั้น + Mega Pass พร้อม **`requiredLevel` gating** เพื่อกัน abuse จาก admin grant ใน day-1

#### Tier S — Newbie+ (50–500 Honey, daily affordable)

| ของ | ราคา | ประเภท |
|-----|----:|--------|
| Bronze Profile Frame | 50 | `PROFILE_FRAME` |
| Gold Profile Frame | 100 | `PROFILE_FRAME` |
| Listing Boost 24h | **120** *(was 150)* | `CUSTOM` |
| CSV Export Pass | **150** *(was 200)* | `CSV_EXPORT_PASS` |
| Price Alert +1 Slot | **180** *(was 150)* | `PRICE_ALERT_SLOT` |
| Diamond Profile Frame | 200 | `PROFILE_FRAME` |
| Kuma Profile Badge | 200 | `BADGE` |
| Watchlist +5 Slots | **250** *(NEW)* | `CUSTOM` |
| Flame Profile Frame | 300 | `PROFILE_FRAME` |

#### Tier M — Bronze+ / lvl 1 (500–2,000 Honey, weekly utility bundles)

| ของ | ราคา | ประเภท | gating |
|-----|----:|--------|:------:|
| Listing Boost 7-Day *(NEW)* | 500 | `CUSTOM` | lvl 1 |
| Bulk Lookup +50 *(NEW)* | 600 | `CUSTOM` | lvl 1 |
| Auto-Pricing 7-Day Pass *(NEW)* | 800 | `CUSTOM` | lvl 1 |
| LINE Alerts 7-Day Pass *(NEW)* | 800 | `CUSTOM` | lvl 1 |
| Mini Kuma Pet Skin *(NEW)* | 1,200 | `BADGE` | lvl 1 |

#### Tier L — Silver+ / lvl 2 (2,500–15,000 Honey, premium access)

| ของ | ราคา | ประเภท | gating |
|-----|----:|--------|:------:|
| Honey Pass — Pro 7d + badge | **2,500** *(was 2,000)* | `TIER_UPGRADE` | lvl 2 |
| Honey Pass+ — Pro 30d + badge + 1 ticket | **8,000** *(was 5,000)* | `TIER_UPGRADE` | lvl 2 |
| Honey Pro+ Pass — Pro+ 30d + badge + 2 tickets | **15,000** *(was 10,000)* | `TIER_UPGRADE` | lvl 2 |

#### Mega — Gold+ / lvl 3 (capstone)

| ของ | ราคา | ประเภท | gating |
|-----|----:|--------|:------:|
| Mega Honey Pass — Pro 90d + 3 tickets + Flame frame *(NEW)* | 20,000 | `TIER_UPGRADE` | lvl 3 |

**Pricing page integration:** หน้า `/pricing` มีแบนเนอร์ "Don't want to pay? Earn it with Honey!" + ลิงก์ไป Honey Shop

### 3.2 Rotating featured slot (NEW)

3 ของ "Hot This Week" หมุนเวียนรายสัปดาห์ ราคา **−20%** เปิด-ปิดผ่านฟิลด์ `featuredUntil` / `availableUntil` บน `HoneyShopItem` มี admin curation endpoint

### 3.3 Monthly Raffle (REFRESHED)

> Lucky Draw ถูกลบไปแล้ว — แทนด้วย Monthly Raffle ที่มีรางวัลจริง

**รางวัลเริ่มต้น:**

| อันดับ | รางวัล |
|:------:|--------|
| 1st | OPCG Booster Box |
| 2nd | OPCG Booster Packs ×5 |
| 3rd | OPCG Starter Deck |

**กลไก:**

- **ราคาตั๋ว:** 50 Honey/ใบ
- **จำกัด:** 5 ใบ/คน/เดือน
- **ตั๋วฟรี:**
  - Weekly Bonus = 1 ใบ
  - Monthly Perfect Bonus = 3 ใบ
  - Weekly Mission "Browse 5 sets" = 1 ใบ
  - Monthly raffle missions รวม = **5 ใบ + 2 ใบ complete-all = 7 ใบ**
  - แลก Honey Pass+ / Pro+ Pass / Mega Pass = 1 / 2 / 3 ใบ ตามลำดับ
- **จับรางวัล:** ทุกสิ้นเดือน (cron + admin manual draw)

---

## 4. Anti-Abuse Measures

### 4.1 Mission Track Security (CRITICAL)

- `trackMission()` ปฏิเสธ task ที่ `trackType !== "manual"`
- auto-path tasks ต้องใช้ `trackMissionByPath()` (server เช็ค pathname จริง)
- auto-path tasks ต้องผ่านขั้นต่ำ `dwellMs` (8s) ที่ client ส่งมา ก่อน server จะนับเสร็จ
- `share_*` tasks ต้องมีทั้ง `shareCompleted: true` **และ** `shareTarget` ที่ไม่ว่าง (cardId/url)
- Server-event track type ถูกลบทั้งหมด

### 4.2 Daily caps & global cap (§2.1)

ดูตารางใน §2.1 — anti-farm ที่ระดับ action + global ceiling 200/วัน

### 4.3 Referral Click Dedup

- `recordReferralClick()` skip ถ้า same IP + same linkId + same day
- ป้องกันการกดลิงก์ตัวเองซ้ำเพื่อ farm clicks

### 4.4 Removed earning sources

- `PORTFOLIO_ADD` Honey reward — ลบทั้งหมด (ผู้ใช้จะฝืนเพิ่มการ์ดเพื่อ farm)
- `affiliate_click` mission — ลบ (ผู้ใช้ไม่สามารถควบคุมได้)
- `bonus_overview`, `bonus_marketplace` missions — รวมเข้ากับ core missions
- `pull_calculator`, `use_compare`, `read_guide` — ไม่ใช่กิจวัตร, ลบ

### 4.5 Shop level gating

`requiredLevel` (`HoneyShopItem`) บล็อกการแลกของ Tier M/L/Mega ใน user ที่ lifetime ยังต่ำ → กัน admin-grant abuse ในวันแรก

---

## 5. Economy Balance Analysis

### 5.1 Earning ต่อเดือน per persona

| Persona | Daily missions | Weekly bonus | Monthly perfect | Check-in (×streak) | Other (referral / sell / community / achievement) | **รวม/เดือน** |
|---------|--------------:|-------------:|----------------:|-------------------:|-------------------------------------------------:|--------------:|
| Casual | – | – | – | ~150 | – | ~200 |
| **Active** | ~600 *(20/วัน)* | – | – | ~300 | ~100 | **~1,000** |
| **Engaged** | ~840 *(30/วัน perfect)* | ~300 *(75 × 4)* | – | ~450 | ~400 | **~2,000** |
| Power | ~840 | ~300 | ~500 | ~900 | ~1,500 | ~4,000+ |

### 5.2 ระยะเวลาถึง goal

| เป้าหมาย | Honey | Active (~1k/mo) | Engaged (~2k/mo) | Power (~4k/mo) |
|----------|-----:|---------------:|----------------:|--------------:|
| Bronze Frame | 50 | 1–2 วัน | 1 วัน | <1 วัน |
| Listing Boost 24h | 120 | ~4 วัน | ~2 วัน | ~1 วัน |
| Bronze level (lifetime) | 100 | ~3 วัน | ~2 วัน | ~1 วัน |
| Watchlist +5 Slots | 250 | ~1 สัปดาห์ | ~4 วัน | ~2 วัน |
| Auto-Pricing 7-Day | 800 | ~3–4 สัปดาห์ | ~2 สัปดาห์ | ~1 สัปดาห์ |
| Honey Pass (Pro 7d) | 2,500 | ~2.5 เดือน | ~1.3 เดือน | ~3 สัปดาห์ |
| **Honey Pass+ (Pro 30d)** | **8,000** | **~8 เดือน** *(target)* | **~4 เดือน** | **~2 เดือน** |
| Honey Pro+ Pass (Pro+ 30d) | 15,000 | ~15 เดือน | ~7.5 เดือน | ~4 เดือน |
| Mega Honey Pass (Pro 90d) | 20,000 | ~20 เดือน | ~10 เดือน | ~5 เดือน |

### 5.3 Honey Sinks

| Sink | ดูดซับ/เดือน (ทั่วไป) | หมายเหตุ |
|------|-----:|----------|
| Raffle Tickets | 50–250 | 1–5 ใบ/เดือน |
| Tier S cosmetics | 50–300 | first-time purchases |
| Tier M utility | 500–1,200 | Engaged users; 7-day passes |
| Tier L premium | 2,500–15,000 | Goal หลักของ Active+ |
| Mega Pass | 20,000 | Engaged power-users (yearly) |

### 5.4 Lifetime achievement pool

≈ **35,000 Honey** ตลอด lifetime — ครอบคลุม "free 4 × 30-day Pro Pass" กระจายไปตลอดหลายปี

---

## 6. Referral System

### 6.1 Flow

```
User A สร้าง Referral Link
  → /ref/[code] redirect + set cookie (30 วัน)
  → User B สมัครสมาชิก
  → processReferralConversion():
      User A ได้ 150 Honey (REFERRAL,    tier × seasonal)
      User B ได้  30 Honey (REFERRAL_WELCOME, tier × seasonal)
```

### 6.2 Implementation

- **Referral code:** สร้างอัตโนมัติ (8-char hex) เก็บใน `User.referralCode`
- **Tracking:** `ReferralLink` + `ReferralClick` models
- **Cookie:** `ref_code` httpOnly, 30 วัน, set ที่ `/ref/[code]`
- **Conversion:** trigger ใน `syncAppUser()` และ `auth/callback` เมื่อตรวจพบ user ใหม่
- **Click dedup:** IP + linkId per day

---

## 7. Technical Architecture

### 7.1 Core files

| ไฟล์ | หน้าที่ |
|------|---------|
| `src/lib/honey/index.ts` | Core ledger: `grantHoney`, `earnHoney`, `earnHoneyDirect`, `spendHoney` + `HONEY_REWARDS` / `DAILY_LIMITS` / `GLOBAL_DAILY_CAP` / `MULTIPLIER_POLICY` |
| `src/lib/honey/levels.ts` | `LEVELS`, `LEVEL_UP_BONUS`, `LEVEL_THRESHOLD`, `getHoneyLevel()`, `checkLevelUp()` |
| `src/lib/honey/missions.ts` | Mission engine (DAILY/WEEKLY/MONTHLY cadence), perfect-day, weekly bonus, monthly perfect bonus |
| `src/lib/honey/achievements.ts` | Achievement checking + auto-grant |
| `src/lib/honey/fulfillment.ts` | Shop item fulfillment incl. auto-pricing/LINE/watchlist passes |
| `src/lib/honey/referral.ts` | Referral code + welcome bonus via `earnHoney` |
| `src/lib/honey/raffle.ts` | Monthly raffle (tickets, draw) |
| `scripts/seed-achievements.ts` | Achievement seed (5 families, deprecated codes) |
| `scripts/seed-honey-shop.ts` | Shop catalog seed (Tier S/M/L + Mega Pass) |
| `scripts/honey-dry-run-30d.ts` | Dry-run simulator for the v2 ledger |

### 7.2 API routes

| Route | Method | หน้าที่ |
|-------|--------|---------|
| `/api/honey` | POST | check-in, redeem (with `requiredLevel` + `availableUntil` checks) |
| `/api/honey/missions` | GET/POST | daily missions: track / claim / bonus |
| `/api/honey/weekly-missions` | GET/POST | weekly missions (NEW) |
| `/api/honey/raffle-missions` | GET/POST | monthly raffle missions (folded into mission engine) |
| `/api/honey/referral` | GET | referral link |
| `/api/honey/raffle` | GET/POST | raffle tickets |
| `/api/admin/honey/grant` | POST | admin grant — routes via `grantHoney` |
| `/api/cron/leaderboard-rewards` | GET | Top-10 monthly payout |
| `/api/cron/resolve-predictions` | GET | calls `earnHoney("PRICE_PREDICTION", ...)` |
| `/api/cron/draw-raffle` | GET | end-of-month raffle draw |

### 7.3 Prisma schema additions (v2)

| Field / value | หน้าที่ |
|---|---|
| `HoneyShopItem.requiredLevel` | level gating |
| `HoneyShopItem.featuredUntil`, `availableUntil`, `originalCost` | rotating featured slot |
| `MissionTemplate.cadence` enum (`DAILY`/`WEEKLY`/`MONTHLY`/`SPECIAL`) | unified mission engine |
| `MissionBonusRule.MONTHLY_PERFECT` | 28-day perfect bonus rule |
| `WeeklyMission` model | per-user weekly mission state |
| `User.extraWatchlistSlots` | shop fulfillment counter |
| `User.bulkLookupCredits` | shop fulfillment counter |
| `User.autoPricingUntil` | shop fulfillment time-window |
| `User.lineAlertsUntil` | shop fulfillment time-window |
| `User.weeklyListingBoostUntil` | shop fulfillment time-window |
| `HoneyActionType.REFERRAL_WELCOME` | new earning type |
| `HoneyActionType.MILESTONE_STREAK_7/30` | one-shot milestones |
| `HoneyActionType.BUYER_PURCHASE` | first-purchase bonus |
| `HoneyActionType.MONTHLY_PERFECT_BONUS` | 28-day perfect bonus |
| `HoneyActionType.WEEKLY_MISSION` | weekly mission claim |

### 7.4 Migrations

- `20260401000000_daily_mission_redesign` — Per-task rewards, referral models
- `20260401100000_honey_economy_rebalance` — `LEVEL_UP`, `WEEKLY_BONUS`, `LEADERBOARD_REWARD`
- **`20260501000000_honey_rebalance_v2`** — v2 schema additions above

### 7.5 Deprecated / removed

| Item | เหตุผล |
|------|--------|
| ~~Lucky Draw~~ | แทนด้วย Monthly Raffle |
| ~~`server-event` track type~~ | ไม่มี mission ที่ต้องใช้ + abuse risk |
| ~~`affiliate_click` mission~~ | ผู้ใช้ควบคุมไม่ได้ |
| ~~`PORTFOLIO_ADD` honey reward~~ | farm risk |
| ~~Old listing boost shop names~~ | ปิดด้วย `DEACTIVATE_NAMES` ใน seed |
| ~~`honey_lifetime_10000`/`honey_lifetime_25000`~~ | `isActive=false` (เก็บ row ไว้สำหรับ user เดิม) |

---

## 8. Validation & Rollout

### 8.1 Tests (`src/lib/honey/__tests__/`)

- `levels.test.ts` — `getHoneyLevel`, `checkLevelUp`, ครอส Master at 15,000, single-grant multi-level vault
- `policy.test.ts` — `HONEY_REWARDS`, `DAILY_LIMITS`, `GLOBAL_DAILY_CAP`, `GLOBAL_CAP_TYPES`, `MULTIPLIER_POLICY` exhaustiveness
- `earn.test.ts` — `earnHoney` daily limits, global cap, tier × seasonal, ADMIN_GRANT lifetime accounting via `grantHoney`, level-up cascade

รัน `npm test`

### 8.2 Dry-run simulation

`npx tsx scripts/honey-dry-run-30d.ts` รีเพลย์ทรานแซคชัน 30 วันล่าสุดภายใต้กฎ v2 แล้ว print:

- Cohort total Honey old vs. new
- Per-user delta percentiles (p10/25/50/75/90/99)
- Top-10 winners / Bottom-10 losers
- Sanity gate: top earners ไม่ควร gain เกิน ~2× และ bottom 50% ไม่ควรติดลบ

### 8.3 Manual QA matrix

FREE / PRO / PRO+ × seasonal-on/off × streak <7 / 7–29 / 30+ ครอบคลุม:

- CHECKIN, mission claim, perfect-day, weekly bonus, monthly perfect bonus
- Prediction cron payout, referral both sides, BUYER_PURCHASE first-time, MILESTONE_STREAK_7/30 one-shots
- Shop redeem with `requiredLevel` block, `availableUntil` window, fulfillment writes (User.* counters/windows)

### 8.4 Rollout phases

| Phase | สิ่งที่ deploy | ผู้ใช้สังเกตเห็น |
|---|---|---|
| A | schema migration + ledger fixes (ADMIN_GRANT, prediction cron, referee) | ไม่มีตัวเลขเปลี่ยน |
| B | new `HONEY_REWARDS`, `DAILY_LIMITS`, mission rewards | เปลี่ยนตัวเลขที่ได้ → in-app announcement |
| C | achievement seed re-run (idempotent) | เห็น tier ใหม่ใน list |
| D | shop catalog re-seed + level gating + rotating featured | catalog ใหม่ |
| E | weekly missions + monthly perfect bonus + leaderboard top-10 | UI ใหม่บน `/honey` |

---

## 9. Pending / Future Work

| Item | สถานะ | หมายเหตุ |
|------|--------|----------|
| Seasonal events admin UI | Pending | model พร้อมแล้ว |
| Achievement notification toast | Pending | popup เมื่อ unlock |
| Physical prize fulfillment flow | Pending | shipping address สำหรับ raffle winner |
| Raffle auto-draw cron deploy | Pending | `/api/cron/draw-raffle` ยังไม่ schedule |
| Featured-slot admin curation UI | Pending | API พร้อม แต่ UI ใน `/admin/honey` ยังไม่มี |
| Anti-abuse score model | Future | per-user abuse signal สำหรับเตือน admin |
