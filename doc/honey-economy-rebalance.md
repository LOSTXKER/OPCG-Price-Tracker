# Honey Economy Rebalance

> เอกสารสรุประบบเศรษฐกิจ Honey ฉบับปัจจุบัน (Updated April 2026)
> ครอบคลุมการรับ (Earning), การใช้ (Spending), ระดับ, ความสำเร็จ, และกลไกพิเศษทั้งหมด

---

## 1. Overview

Honey คือระบบ Points ที่สร้าง daily engagement ผ่าน theme มาสคอต Kuma (หมีเก็บน้ำผึ้ง)

**เป้าหมาย:**
- ดึง User กลับมาใช้งานทุกวัน (retention)
- กระตุ้นการแชร์/ชวนเพื่อน (viral growth)
- เป็นทางเลือกสำหรับ Pro features โดยไม่ต้องจ่ายเงินจริง (soft monetization)
- สร้าง sense of progression (levels, achievements, leaderboard)

---

## 2. การรับ Honey (Earning)

### 2.1 Base Rewards (ได้รับอัตโนมัติเมื่อทำ action)

| Action | Type | Honey | Daily Limit | หมายเหตุ |
|--------|------|------:|:-----------:|----------|
| Check-in รายวัน | `CHECKIN` | 10 | 1 | x2 ที่ streak 7 วัน, x3 ที่ streak 30 วัน |
| ขายสำเร็จบน Marketplace | `MARKETPLACE_SELL` | 20 | - | |
| Review ผู้ซื้อ/ผู้ขาย | `REVIEW` | 5 | 5 ครั้ง/วัน | |
| ชวนเพื่อนสมัคร (Referrer) | `REFERRAL` | 100 | - | ได้เมื่อคนที่ชวนสมัครสำเร็จ |
| สมัครผ่าน Referral (New user) | `REFERRAL` | 50 | 1 ครั้ง | Welcome bonus |
| Trial Bonus | `TRIAL_BONUS` | 30 | - | |
| Price Prediction ถูก | `PRICE_PREDICTION` | 20 | - | |
| แชร์ Deck | `DECK_SHARE` | 15 | - | |
| ส่งราคาชุมชน | `COMMUNITY_PRICE` | 10 | 5 ครั้ง/วัน | |
| Onboarding สำเร็จ | `ONBOARDING` | 50 | 1 ครั้ง | |

### 2.2 Daily Missions (ภารกิจประจำวัน — Redesigned)

ทุกวันมี 4 ภารกิจ (3 ภารกิจหลัก + 1 ภารกิจพิเศษหมุนเวียนตามวัน)

ภารกิจทั้งหมดสะท้อนพฤติกรรมธรรมชาติของผู้ใช้ ไม่มีภารกิจฝืนใช้งาน

**ภารกิจหลัก (ทุกวัน):**

| ภารกิจ | ID | Honey | Trigger |
|--------|-----|------:|---------|
| เช็คราคาการ์ด | `check_price` | 10 | เข้าหน้า `/cards/[id]` (auto-path) |
| ดูการ์ดมาแรง | `browse_trending` | 10 | เข้าหน้า `/trending` (auto-path) |
| เยี่ยมชม Marketplace | `visit_marketplace` | 10 | เข้าหน้า `/marketplace` (auto-path) |

**ภารกิจพิเศษ (หมุนเวียนตามวัน):**

| วัน | ภารกิจ | ID | Honey | Trigger |
|-----|--------|----|------:|---------|
| อาทิตย์ | เช็คพอร์ต | `check_portfolio` | 10 | เข้าหน้า `/portfolio` (auto-path) |
| จันทร์ | สำรวจเซ็ตการ์ด | `explore_set` | 10 | เข้าหน้า `/sets/[id]` (auto-path) |
| อังคาร | แชร์การ์ด | `share_card` | 10 | Web Share API (manual + shareCompleted verify) |
| พุธ | ดูภาพรวมตลาด | `visit_overview` | 10 | เข้าหน้า `/market-overview` (auto-path) |
| พฤหัสบดี | อ่านบทความ | `read_blog` | 10 | เข้าหน้า `/blog` (auto-path) |
| ศุกร์ | แชร์เว็บ | `share_site` | 10 | Web Share API (manual + shareCompleted verify) |
| เสาร์ | เช็ครายการจับตา | `check_watchlist` | 10 | เข้าหน้า `/watchlist` (auto-path) |

**Removed missions:**
- ~~`check_collection`~~ (Portfolio/Watchlist generic) — แยกเป็น `check_watchlist` + `check_portfolio`
- ~~`affiliate_click`~~ (server-event) — ลบออก เนื่องจากผู้ใช้ไม่สามารถควบคุมได้
- ~~`bonus_overview`~~ — ย้ายเป็น `visit_overview` (rotating)
- ~~`bonus_marketplace`~~ — ย้ายเป็น core mission แทน
- ~~`pull_calculator`~~ — ไม่ใช่สิ่งที่ทำทุกวัน
- ~~`use_compare`~~ — ไม่ใช่สิ่งที่ทำทุกวัน
- ~~`read_guide`~~ — ไม่ใช่สิ่งที่ทำทุกวัน (แทนด้วย `read_blog`)

**โบนัส:**
- **Perfect Day Bonus:** ทำครบทุกภารกิจ = +20 Honey
- **Weekly Bonus:** ทำ Perfect Day ครบ 7 วันติด = +100 Honey (type: `WEEKLY_BONUS`)

**Earning potential ต่อวัน (ภารกิจ):** 4 x 10 + 20 = **60 Honey/วัน**
**Earning potential ต่อสัปดาห์ (ภารกิจ):** 60 x 7 + 100 = **520 Honey/สัปดาห์**

### 2.3 Level-Up Bonus (ครั้งเดียวต่อระดับ)

| ระดับ | Label | Lifetime Honey ที่ต้องการ | Bonus |
|:-----:|-------|-------------------------:|------:|
| 1 | Bronze | 100 | 50 |
| 2 | Silver | 500 | 100 |
| 3 | Gold | 2,000 | 200 |
| 4 | Diamond | 5,000 | 500 |

Level-up bonus ถูก trigger อัตโนมัติภายใน `grantHoney()` เมื่อ `honeyLifetimeEarned` ข้ามเกณฑ์

### 2.4 Achievements (ความสำเร็จ)

| Code | ชื่อ | เงื่อนไข | Honey Reward |
|------|------|----------|------------:|
| `portfolio_100` | Collector 100 | Portfolio 100 ใบ | 100 |
| `collector_500` | Collector 500 | Portfolio 500 ใบ | 300 |
| `portfolio_1000` | Collector 1000 | Portfolio 1,000 ใบ | 500 |
| `streak_7` | 7-Day Streak | เช็คอิน 7 วันติด | 50 |
| `streak_30` | 30-Day Streak | เช็คอิน 30 วันติด | 200 |
| `streak_90` | 90-Day Streak | เช็คอิน 90 วันติด | 500 |
| `streak_365` | 365-Day Streak | เช็คอิน 365 วันติด | 2,000 |
| `first_sell` | First Sale | ขายสำเร็จครั้งแรก | 30 |
| `first_review` | First Review | รีวิวครั้งแรก | 20 |
| `prediction_5` | 5 Correct Predictions | ทายราคาถูก 5 ครั้ง | 100 |
| `referral_5` | Refer 5 Users | ชวนเพื่อน 5 คน | 300 |
| `referral_20` | Refer 20 Users | ชวนเพื่อน 20 คน | 1,000 |
| `trades_10` | 10 Marketplace Sales | ขาย 10 ครั้ง | 200 |
| `honey_lifetime_10000` | 10,000 Lifetime Honey | สะสม Honey 10,000 | 500 |

### 2.5 Monthly Leaderboard Reward

ทุกต้นเดือนระบบ cron (`/api/cron/leaderboard-rewards`) จะจ่ายรางวัลให้ Top 3 ผู้หา Honey มากที่สุดในเดือนก่อน:

| อันดับ | Honey | Type |
|:------:|------:|------|
| 1 | 500 | `LEADERBOARD_REWARD` |
| 2 | 300 | `LEADERBOARD_REWARD` |
| 3 | 100 | `LEADERBOARD_REWARD` |

### 2.6 Multipliers (ตัวคูณ)

| ตัวคูณ | ค่า | เงื่อนไข |
|--------|-----|----------|
| Tier multiplier | ตาม `getLimits()` | สมาชิก Pro/Pro+ ได้ Honey มากกว่า |
| Check-in streak | x2 | 7 วันติด |
| Check-in streak | x3 | 30 วันติด |
| Seasonal event | variable | ตั้งค่าในตาราง `SeasonalEvent` |

---

## 3. การใช้ Honey (Spending)

### 3.1 Honey Shop

**รายการ Cosmetic / Utility:**

| ของ | ราคา (Honey) | ประเภท |
|-----|------------:|--------|
| Gold Profile Frame | 100 | `PROFILE_FRAME` |
| Kuma Profile Badge | 200 | `BADGE` |
| Diamond Profile Frame | 200 | `PROFILE_FRAME` |
| Flame Profile Frame | 300 | `PROFILE_FRAME` |
| Free Listing Boost x1 | 150 | `CUSTOM` |
| Price Alert +1 Slot | 150 | `PRICE_ALERT_SLOT` |
| CSV Export Pass | 200 | `CSV_EXPORT_PASS` |

**Honey Exclusive Packages (แพคเกจพิเศษ):**

| Package | ราคา (Honey) | สิ่งที่ได้ |
|---------|------------:|-----------|
| Honey Pass (7 วัน) | 2,000 | Pro 7 วัน + Honey Pass badge |
| Honey Pass+ (30 วัน) | 5,000 | Pro 30 วัน + Honey Elite badge + 1 raffle ticket |
| Honey Pro+ Pass (30 วัน) | 10,000 | Pro+ 30 วัน + Honey Pro+ badge + 2 raffle tickets |

**Pricing Page Integration:**
- หน้า `/pricing` มีแบนเนอร์ **"Don't want to pay? Earn it with Honey!"**
- แสดง Honey Pass ทุกระดับ + ลิงก์ไป Honey Shop
- ทำให้ผู้ใช้รู้ว่าสามารถได้ Pro โดยไม่ต้องจ่ายเงิน

### 3.2 Monthly Raffle (ลุ้นรางวัลประจำเดือน — Redesigned)

> **Lucky Draw ถูกลบออกแล้ว** — แทนที่ด้วยระบบ Monthly Raffle ที่มีรางวัลเป็นของจริง

**รางวัลเริ่มต้น:**

| อันดับ | รางวัล | หมายเหตุ |
|:------:|--------|----------|
| 1st | OPCG Booster Box | กล่องสุ่มการ์ดวันพีช |
| 2nd | OPCG Booster Packs x5 | ซอง 5 ซอง |
| 3rd | OPCG Starter Deck | เด็คเริ่มเล่น |

**กลไก:**
- **ราคาตั๋ว:** 50 Honey / ใบ
- **จำกัด:** 5 ใบ / คน / เดือน
- **ตั๋วฟรี:** เช็คอิน 7 วันติด = ตั๋วฟรี 1 ใบ
- **ตั๋วโบนัส:** แลก Honey Pass = ตั๋วเพิ่ม (1-2 ใบตามแพคเกจ)
- **จับรางวัล:** ทุกสิ้นเดือน (cron + manual draw จาก admin)

**Admin Management:**
- สร้าง/จัดการ raffle ที่ `/admin/honey/raffle`
- ตั้งค่ารางวัล 3 ระดับ (1st, 2nd, 3rd) พร้อม optional Honey bonus
- Default prizes: OPCG physical items (Box, Packs, Starter Deck)

**Enhanced UI:**
- Hero section พร้อม countdown นับถอยหลังสิ้นเดือน
- แสดงรางวัลแบบ card 3 อันดับ (gold/silver/bronze)
- "วิธีรับตั๋ว" section (ซื้อ / streak / Honey Pass)
- แสดงผู้ชนะเดือนก่อน

---

## 4. Anti-Abuse Measures (มาตรการป้องกันการ Farm)

### 4.1 Mission Track Security (CRITICAL)

- `trackMission()` ปฏิเสธ task ที่มี `trackType !== "manual"`
- auto-path tasks ต้อง track ผ่าน `trackMissionByPath()` เท่านั้น (ใช้ pathname จริงจาก client)
- Share missions (`share_card`, `share_site`) ต้องส่ง `shareCompleted: true` มากับ request
- Server event (`server-event`) track type ถูกลบออกทั้งหมด

### 4.2 Portfolio Add Honey — Removed

- **เหตุผล:** การเพิ่มการ์ดเข้าพอร์ตไม่ควรจูงใจด้วย Honey เพราะผู้ใช้จะ "ฝืน" เพิ่มการ์ดที่ไม่ได้ซื้อจริง
- Honey reward สำหรับ `PORTFOLIO_ADD` ถูกลบออกทั้งหมด

### 4.3 Referral Click Dedup (MEDIUM)

- `recordReferralClick()` เช็ค duplicate: same IP + same linkId + same day = skip
- ป้องกันการกดลิงก์ตัวเองซ้ำเพื่อ farm clicks

---

## 5. Economy Balance Analysis

### 5.1 ประมาณ Earning ต่อเดือน (Active user)

| แหล่ง | Honey/เดือน | หมายเหตุ |
|--------|------------:|----------|
| Daily Missions (ครบทุกวัน) | ~1,800 | 60/วัน x 30 วัน |
| Weekly Bonus | ~400 | 100 x 4 สัปดาห์ |
| Check-in (streak 30d) | ~300 | 10 x 3 x 10 วัน (ไม่นับซ้ำกับ mission) |
| Referrals | 0-500 | ขึ้นกับกิจกรรม |
| Achievements | 0-2,000 | ครั้งเดียว |
| **รวม (active)** | **~2,200-2,700** | |

### 5.2 ระยะเวลาถึง Goal

| เป้าหมาย | Honey ที่ต้องใช้ | ระยะเวลาโดยประมาณ |
|----------|----------------:|-------------------|
| Gold Frame | 100 | ~1-2 วัน |
| Price Alert Slot | 150 | ~2-3 วัน |
| Kuma Badge | 200 | ~3-4 วัน |
| Flame Frame | 300 | ~5-6 วัน |
| Raffle Ticket x5 | 250 | ~4-5 วัน |
| Honey Pass (7d Pro) | 2,000 | ~3-4 สัปดาห์ |
| Honey Pass+ (30d Pro) | 5,000 | ~2 เดือน |
| Honey Pro+ Pass | 10,000 | ~3-4 เดือน |

### 5.3 Honey Sinks

| Sink | ดูดซับ/เดือน | หมายเหตุ |
|------|------------:|----------|
| Raffle Tickets | 50-250 | 1-5 ใบ/เดือน |
| Shop items | Variable | ซื้อ cosmetics |
| Honey Pass packages | 2,000-10,000 | Goal หลักของ Power users |

---

## 6. Referral System

### 6.1 Flow

```
User A สร้าง Referral Link
  → /ref/[code] redirect + set cookie (30 วัน)
  → User B สมัครสมาชิก
  → processReferralConversion():
      User A ได้ 100 Honey (REFERRAL)
      User B ได้ 50 Honey (Welcome bonus)
```

### 6.2 Implementation

- **Referral code:** สร้างอัตโนมัติ (8-char hex) เก็บใน `User.referralCode`
- **Tracking:** `ReferralLink` + `ReferralClick` models
- **Cookie:** `ref_code` httpOnly, 30 วัน, set ที่ `/ref/[code]`
- **Conversion:** ถูก trigger ใน `syncAppUser()` และ `callback/route.ts` เมื่อตรวจพบ user ใหม่
- **UI:** อยู่ใน Honey page เป็น tab "Referral"
- **Click dedup:** IP + linkId per day (ป้องกัน farm)

---

## 7. Technical Architecture

### 7.1 Core Files

| ไฟล์ | หน้าที่ |
|------|---------|
| `src/lib/honey.ts` | Core ledger: `grantHoney`, `earnHoney`, `earnHoneyDirect`, `spendHoney` |
| `src/lib/honey-levels.ts` | Level definitions + `checkLevelUp()` |
| `src/lib/honey-missions.ts` | Daily mission defs, tracking, claiming, weekly bonus |
| `src/lib/honey-achievements.ts` | Achievement checking + auto-grant |
| `src/lib/honey-fulfillment.ts` | Shop item fulfillment (tier upgrade, badges, raffle tickets) |
| `src/lib/honey-referral.ts` | Referral code management + conversion + click dedup |
| `src/lib/honey-raffle.ts` | Monthly raffle system |

### 7.2 API Routes

| Route | Method | หน้าที่ |
|-------|--------|---------|
| `/api/honey/missions` | GET/POST | ดึง/track/claim missions |
| `/api/honey/referral` | GET | ดึงข้อมูล referral link |
| `/api/honey/raffle` | GET/POST | ดึง raffle + ซื้อ/claim ตั๋ว |
| `/api/cron/leaderboard-rewards` | GET (cron) | จ่ายรางวัล Top 3 รายเดือน |
| `/api/cron/draw-raffle` | GET (cron) | จับรางวัลอัตโนมัติสิ้นเดือน |

### 7.3 Removed

| Item | เหตุผล |
|------|--------|
| ~~Lucky Draw~~ (`honey-lucky-draw.ts`, `/api/honey/lucky-draw`) | แทนที่ด้วย Monthly Raffle ที่มีรางวัลจับต้องได้ |
| ~~`server-event` track type~~ | ลบออก — ไม่มีภารกิจที่ต้องใช้ |
| ~~`affiliate_click` mission~~ | ลบออก — ผู้ใช้ไม่สามารถควบคุมได้ |
| ~~`check_collection` mission~~ | แยกเป็น `check_watchlist` เฉพาะวัน |
| ~~`bonus_overview`, `bonus_marketplace`~~ | ซ้ำกับ core missions |
| ~~`pull_calculator`, `use_compare`, `read_guide` missions~~ | ไม่ใช่สิ่งที่ผู้ใช้ทำทุกวัน |
| ~~`PORTFOLIO_ADD` honey reward~~ | ผู้ใช้จะฝืนเพิ่มการ์ดเพื่อ farm |

### 7.4 HoneyActionType Enum (Prisma)

```
CHECKIN, PORTFOLIO_ADD, MARKETPLACE_SELL, REVIEW, REFERRAL,
TRIAL_BONUS, DAILY_MISSION, PRICE_PREDICTION, DECK_SHARE,
COMMUNITY_PRICE, FIRST_PURCHASE, ONBOARDING, SHARE, AFFILIATE,
ADMIN_GRANT, REDEEM, ACHIEVEMENT, RAFFLE_TICKET,
RAFFLE_WIN, LEVEL_UP, WEEKLY_BONUS, LEADERBOARD_REWARD
```

### 7.5 Migrations

- `20260401000000_daily_mission_redesign` — Per-task rewards, referral models
- `20260401100000_honey_economy_rebalance` — Added LEVEL_UP, WEEKLY_BONUS, LEADERBOARD_REWARD

---

## 8. Pending / Future Work

| Item | สถานะ | หมายเหตุ |
|------|--------|----------|
| FIRST_PURCHASE reward | Pending | ต้องเพิ่ม buyer tracking ใน Listing model ก่อน |
| Seasonal events UI | Pending | SeasonalEvent model พร้อมแล้ว, ยังไม่มี admin UI |
| Achievement notification toast | Pending | ควรแสดง popup เมื่อ unlock achievement ใหม่ |
| Physical prize fulfillment flow | Pending | ต้องมีระบบ shipping address สำหรับ raffle winner |
| Raffle auto-draw cron | Pending | `/api/cron/draw-raffle` ยังไม่ถูก deploy เป็น scheduled job |
