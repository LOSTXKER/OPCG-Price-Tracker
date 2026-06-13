# MeeCard — Data Pipeline Architecture

> อัปเดตล่าสุด: 2026-06-14 · cross-checked vs code

สถาปัตยกรรม pipeline ดึง "ข้อมูลการ์ด + ราคา" จากหลายแหล่งเข้า DB และ cron ที่อัปเดตราคารายวัน
SSOT ของงานนี้: **PLAN.md M4** · โค้ดจริงอยู่ที่ `scripts/` + `src/lib/scraper/` · ตารางcron จริงอยู่ที่ `vercel.json`

---

## Overview — แหล่งข้อมูล 3 แหล่ง

| แหล่งข้อมูล                  | ให้อะไร                                                                  | เทคนิค             | สกุลเงิน |
| ---------------------------- | ----------------------------------------------------------------------- | ------------------ | -------- |
| **Official Bandai** (3 เว็บ) | ข้อมูลการ์ดทั้งหมด: ชื่อ, stat, effect, รูปภาพ, rarity, **SP reprints** | Cheerio parse HTML | —        |
| **Yuyutei** (yuyu-tei.jp)    | ราคาตลาดมือหนึ่ง/ร้านญี่ปุ่น (`source = YUYUTEI`)                       | Cheerio parse HTML | JPY      |
| **SNKRDUNK** (snkrdunk.com)  | ราคาตลาด + graded (PSA 10) + last-sold (`source = SNKRDUNK`)             | SSR HTML + JSON API | USD      |

`CardPrice` เป็น **multi-source** — `source: PriceSource @default(YUYUTEI)` มีทั้ง `priceJpy`, `priceUsd`, `priceThb`, `gradeCondition`, `type` (`SELL`/`SOLD`) [prisma/schema.prisma:151].

**ทำไมไม่ใช้ Punk Records (GitHub JSON) เป็น master?**
Punk Records ไม่มี SP reprint cards (เช่น OP05-067 Zoro SP ที่เปิดได้ในซอง OP09)
Official Bandai จัดหมวดหมู่ SP reprints ถูกต้องตามเซ็ตที่เปิดซองได้จริง

---

## Pipeline หลัก (6 Steps) — `scripts/pipeline.ts`

orchestrator รัน 6 step เรียงกัน รองรับ `--wipe / --skip=N / --only=N / --sets=...`

```bash
npm run pipeline -- --wipe --sets=op09     # หรือ npx tsx scripts/pipeline.ts ...
```

| Step | Script                       | ทำอะไร                                              |
| ---- | ---------------------------- | --------------------------------------------------- |
| 1    | `scrape-official.ts`         | Official Bandai (3 เว็บ) → `data/cards/{set}.json`  |
| 2    | `seed-cards.ts`              | JSON → DB (upsert Card/CardSet)                     |
| 3    | `upload-images.ts`           | โหลดรูป → **Cloudflare R2** → อัปเดต `Card.imageUrl` |
| 4    | `pipeline-yuyutei.ts`        | Yuyutei → `YuyuteiMapping` (รอ admin approve)       |
| 5    | `fill-reprint-prices.ts`     | copy ราคา reprint จากการ์ดต้นฉบับ                  |
| 6    | `seed-drop-rates.ts`         | drop rate ต่อ rarity ต่อเซ็ต                        |

> ⚠️ คอมเมนต์/label ใน `pipeline.ts` ยังเขียนว่า "Supabase Storage" (บรรทัด log) — ของจริง Step 3 อัปขึ้น **R2** แล้ว ดู `upload-images.ts` ด้านล่าง (label เป็น cosmetic ยังไม่แก้)

### Step 1: Scrape Official Bandai → JSON

ดึงจาก 3 เว็บ Official ของ Bandai merge เป็น JSON file เดียวต่อเซ็ต (`data/cards/{setCode}.json`):

| เว็บ         | URL                           | Series ID prefix | ให้ภาษา |
| ------------ | ----------------------------- | ---------------- | ------- |
| Asia English | asia-en.onepiece-cardgame.com | `556`            | EN      |
| Japanese     | onepiece-cardgame.com         | `550`            | JP      |
| Asia Thai    | asia-th.onepiece-cardgame.com | `563`            | TH      |

**Series ID Formula** — `{3-digit prefix}{type digit}{2-digit number}`

```
ST = 0  (ST-01 → 556001)   OP = 1  (OP-09 → 556109)
EB = 2  (EB-01 → 556201)   PRB = 3 (PRB-01 → 556301)
```

ตัวอย่าง: `asia-en...?series=556109` (OP09 EN) · `onepiece-cardgame.com...?series=550109` (OP09 JP)

**วิธี parse HTML** (selectors ดู [HTML Parsing Selectors](#html-parsing-selectors-official-bandai)):
- แต่ละการ์ดอยู่ใน `<dl class="modalCol" id="OP09-001">`
- รูปภาพ: `<img data-src="../images/cardlist/card/OP09-001.png">`
- SP reprints มี id เป็น code จากเซ็ตเดิม เช่น `id="OP05-067_p4"` แต่อยู่ในหน้า OP09

### Step 2: Seed Cards → DB — `seed-cards.ts`

อ่าน JSON จาก Step 1 → upsert เข้า DB (Prisma):
- `--wipe` ลบข้อมูลเดิม (CardPrice, Card, CardSet ฯลฯ) ก่อน seed
- 1 row ต่อ 1 variant (base + parallels + SP reprints)
- `cardCode` = unique เช่น `OP09-001`, `OP09-001_p1`, `OP05-067_p4`, `OP01-006_r1`
- `baseCode` = code ไม่มี suffix เช่น `OP09-001`, `OP05-067` — strip ทั้ง `_p1` (parallel) และ `_r1` (reprint) ผ่าน `extractBaseCode()` → ใช้แสดงผล UI

### Step 3: Upload Images → **Cloudflare R2** — `upload-images.ts`

โหลดรูปจาก CDN ของ Bandai แล้ว upload ขึ้น **Cloudflare R2** ผ่าน `@aws-sdk/client-s3` (S3-compatible) [upload-images.ts:17,35]:

```bash
npx tsx scripts/upload-images.ts --sets=op09
npx tsx scripts/upload-images.ts --force       # re-upload แม้มีอยู่แล้ว
```

- จัดเก็บเป็น key `{setCode}/{cardCode}.png` เช่น `op09/OP09-001.png` (`storagePath()`)
- อัปเดต `Card.imageUrl` เป็น public URL ของ R2 (`${NEXT_PUBLIC_R2_PUBLIC_URL}/${key}`)
- ข้ามใบที่ `imageUrl` ชี้ R2 อยู่แล้ว (`NOT: { imageUrl: { contains: R2_PUBLIC_URL } }`) เว้นแต่ `--force`

**ENV ที่ต้องมี** [upload-images.ts:24-28]:

```
R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_ENDPOINT, R2_BUCKET, NEXT_PUBLIC_R2_PUBLIC_URL
```

> รูปการ์ดทั้งหมดย้ายจาก Bandai CDN → R2 ครั้งแรกด้วย `scripts/migrate-to-r2.ts` (อ่าน original URL จาก `data/cards/*.json`, รองรับ `--dry-run`)

### Step 4: Yuyutei → `YuyuteiMapping` (staging) — `pipeline-yuyutei.ts`

> ⚠️ Step นี้ **ไม่เขียนราคาเข้าการ์ดโดยตรง** — มัน scrape ทุก listing เข้า `YuyuteiMapping` ให้ admin approve ในหน้า `/admin/yuyutei-matching` ก่อน [pipeline-yuyutei.ts:2,109]

```bash
npx tsx scripts/pipeline-yuyutei.ts --sets=op09 --verbose
```

**⚠️ CRITICAL: Yuyutei ใช้ ID แบบ set-local**
Yuyutei ID (เช่น `10001`, `10002`) **ซ้ำกันข้ามเซ็ต** — ทุกเซ็ตเริ่มนับ ~10001 ใหม่
จึงต้อง scope ทุก query ด้วย set เสมอ — `YuyuteiMapping` ใช้ compound unique `setCode_yuyuteiId` กันชนข้ามเซ็ตที่ระดับ schema [schema.prisma:1156]

**Matching logic ใน script (ทุก lookup มี `set: { code: setCode }`)** [pipeline-yuyutei.ts:55-90]:
1. Parallel listing → `baseCode + isParallel=true + rarity` ตรง
2. Parallel ไม่เจอ rarity → parallel ใดๆ ที่ `baseCode` ตรง
3. Non-parallel → `baseCode + isParallel=false` (รองรับ PRB/ST reprints ที่ Yuyutei ลิสต์ด้วย original code)
4. ที่เหลือ → mapping `status: "pending"` รอ manual review ในหน้า Admin

**ทำไมต้อง scope ด้วย set?** OP01 มี yuyu=10006, OP09 ก็มี yuyu=10006 — ถ้า query ไม่กรอง set ราคาจะ contaminate ข้ามเซ็ตเป็นร้อยใบ

### Step 5: Fill Reprint Prices — `fill-reprint-prices.ts`

การ์ด reprint (`_r1`, `_r2`) ในเซ็ต PRB01/PRB02/ST15–ST28 เป็นการ์ดเดียวกับต้นฉบับ แต่ Yuyutei ขายภายใต้เซ็ตเดิม
Step นี้ copy ราคาจากการ์ดต้นฉบับมาใส่ (match `cardCode`/`baseCode` กับ clean base ที่มีราคาอยู่แล้ว):

```
OP01-006_r1 (PRB01) ← copy ราคาจาก OP01-006 (OP01)
OP09-013_r1 (ST23)  ← copy ราคาจาก OP09-013 (OP09)
```

### Step 6: Seed Drop Rates — `seed-drop-rates.ts`

Seed ข้อมูล drop rate ของแต่ละ rarity ต่อเซ็ต (ใช้ในหน้า drop calculator)

---

## SNKRDUNK Pipeline (ราคา USD + graded)

แหล่งราคาที่ 2 — ดึง market price (USD), PSA 10 graded และ last-sold จาก snkrdunk.com
โค้ดอยู่ที่ `src/lib/scraper/snkrdunk.ts` (scraper) + `snkrdunk-matcher.ts` (เขียน DB)

**วิธีดึงข้อมูล** [snkrdunk.ts]:
- SSR HTML ของ `/en/trading-cards/{id}` → parse prop `:trading-card` / `:summary` (Vue SSR, HTML-entity encoded) ได้ `minPrice`, `usedMinPrice`
- API `/en/v1/trading-cards/{id}/used-listings` → listings พร้อม flag `isSold` + `condition` → คำนวณ PSA10 min / PSA10 last-sold / last-sold ใดๆ

**Mapping เหมือน Yuyutei** — listing เข้า `SnkrdunkMapping` ก่อน [schema.prisma:1189], admin approve ในหน้า `/admin/snkrdunk-matching`
- `autoMatchByProductNumber()` auto-approve เมื่อ `productNumber` ตรง `cardCode` แบบ unique 1 ใบ (`matchMethod: "auto-code"`); หลายใบ → mark `auto-code-multi` รอ admin
- `updateSnkrdunkPrices(db)` วน mapping ที่ `status: "matched"` แล้วเขียน `CardPrice` หลาย row ต่อใบ [snkrdunk-matcher.ts:62]:

| ข้อมูล                  | `type` | `gradeCondition` |
| ----------------------- | ------ | ---------------- |
| ราคา raw/new ต่ำสุด     | SELL   | —                |
| PSA 10 listing ต่ำสุด   | SELL   | `PSA 10`         |
| PSA 10 ขายล่าสุด        | SOLD   | `PSA 10`         |
| ขายล่าสุด (ทุก condition)| SOLD   | —                |

**Scripts (one-off / discovery):**
```bash
npx tsx scripts/bulk-discover-snkrdunk.ts    # discover การ์ด OPCG จาก SNKRDUNK → สร้าง mapping → auto-match → fetch ราคา
npx tsx scripts/run-snkrdunk-scraper.ts      # รัน updateSnkrdunkPrices() กับ mapping ที่ approve แล้ว
```

---

## Cron Jobs (ของจริงใน `vercel.json`)

มี cron 10 ตัว — เฉพาะ 2 ตัวแรกเกี่ยวกับ price pipeline โดยตรง:

| Path                              | Schedule (UTC) | หน้าที่                                             |
| --------------------------------- | -------------- | -------------------------------------------------- |
| `/api/cron/scrape-prices`         | `0 17 * * *`   | **Yuyutei daily** → ดูด้านล่าง                     |
| `/api/cron/scrape-snkrdunk`       | `0 18 * * *`   | `updateSnkrdunkPrices(prisma)` อัปราคา USD/PSA10   |
| `/api/cron/scrape-exchange`       | `0 0 * * *`    | อัปเดต exchange rate (JPY/USD → THB)               |
| `/api/cron/snapshot-portfolios`   | `0 20 * * *`   | snapshot มูลค่า portfolio รายวัน                   |
| `/api/cron/check-alerts`          | `0 21 * * *`   | เช็ค price alert / watchlist                       |
| `/api/cron/expire-trials`         | `0 6 * * *`    | หมดอายุ trial                                      |
| `/api/cron/expire-honey`          | `0 7 * * *`    | หมดอายุ honey                                      |
| `/api/cron/weekly-digest`         | `0 9 * * 1`    | weekly digest (จันทร์)                             |
| `/api/cron/resolve-predictions`   | `0 10 * * 1`   | resolve prediction (จันทร์)                        |
| `/api/cron/draw-raffle`           | `0 12 1 * *`   | จับ raffle (วันที่ 1 ของเดือน)                     |

> ⚠️ route `src/app/api/cron/leaderboard-rewards/` **มีอยู่แต่ไม่ได้ลง schedule** ใน `vercel.json` — ไม่ถูกเรียกอัตโนมัติ (เรียก manual เท่านั้น)

### `/api/cron/scrape-prices` (Yuyutei daily) — `src/lib/scraper/daily-prices.ts`

flow รายวัน (ต่างจาก Step 4 pipeline — อันนี้ใช้ mapping ที่ approve แล้ว ไม่สร้าง card ใหม่):
1. `fetchExchangeRate()` + `saveExchangeRate()` — อัปเดต rate JPY→THB ก่อน
2. วน `SET_CODES` ทุกเซ็ต → scrape Yuyutei (`yuyu-tei.ts`) → `matchAndUpdatePrices()`
3. `matchAndUpdatePrices()` หา `YuyuteiMapping` ด้วย unique `setCode_yuyuteiId`:
   - ถ้า `status: "matched"` → อัปเดต `Card.latestPriceJpy/latestPriceThb` + สร้าง `CardPrice` (`source: YUYUTEI`, `type: SELL`)
   - ถ้า mapping มีแต่ยังไม่ approve → อัปแค่ราคาใน mapping (ไม่แตะ card)
   - listing ใหม่ → สร้าง mapping `status: "pending"` รอ admin
4. `computePriceChanges()` — คำนวณ priceChange 24h/7d/30d (SQL LATERAL join batch)

> set-scoping ในขั้น daily ถูกบังคับที่ระดับ DB ผ่าน compound key `setCode_yuyuteiId` — ไม่มี matchCard ladder แบบ Step 4 อีกแล้ว [price-matcher.ts:40-42]

---

## Key Technical Details

### Card Data Model

```
Card {
  cardCode    "OP09-001"     ← unique, primary lookup
  baseCode    "OP09-001"     ← ไม่มี _p/_r suffix (ใช้แสดงผล UI)
  setId       → CardSet (op09)
  isParallel  false
  parallelIndex  null         ← 1,2,3... สำหรับ parallels
  rarity      "L"             ← L,C,UC,R,SR,SEC,SP,P-L,P-R,P-SR,P-SEC
  yuyuteiId   "10146"         ← ⚠️ set-local! ซ้ำข้ามเซ็ตได้
  latestPriceJpy  500
  latestPriceThb  ...
}
```

ราคา history เก็บแยกใน `CardPrice` (multi-source) — query ด้วย index `[cardId, source, scrapedAt desc]`

### SP Reprint Cards

การ์ด SP reprint เช่น `OP05-067_p4` (Zoro-Juurou SP ในซอง OP09):
- `cardCode`: `OP05-067_p4` · `baseCode`: `OP05-067` · `setId`: **OP09** (เซ็ตที่เปิดได้จริง) · `rarity`: `SP` · `isParallel`: `true`

Official Bandai จัดการ์ดเหล่านี้ไว้ในหน้าของเซ็ตที่เปิดได้ → scraper ดึงมาถูกเซ็ตอัตโนมัติ

### Rarity Map

| Official HTML       | Internal DB |
| ------------------- | ----------- |
| L / C / UC / R / SR / SEC | (ตรงตัว)   |
| SP CARD / SPカード      | SP          |
| Parallel ของ L/R/SR/SEC | P-L/P-R/P-SR/P-SEC |

### HTML Parsing Selectors (Official Bandai)

```
Series list:  select#series > option        [value = series ID]
Card modals:  .modalCol                      [id = card ID e.g. "OP09-001"]
Card code:    .infoCol span:nth(0)           Rarity: .infoCol span:nth(1)
Card type:    .infoCol span:nth(2)           Name:   .cardName
Image:        .frontCol img[data-src]
Cost/Life:    .backCol .cost                 Power:  .backCol .power
Counter:      .backCol .counter              Color:  .backCol .color
Attribute:    .backCol .attribute i          Trait:  .backCol .feature
Effect:       .backCol .text (first)         Trigger: .backCol .text (second, if heading="Trigger")
Card sets:    .backCol .getInfo
```

---

## Commands Quick Reference

```bash
# Full pipeline
npm run pipeline -- --wipe                       # ทุกเซ็ต
npm run pipeline -- --wipe --sets=op09,op13      # เฉพาะบางเซ็ต

# Individual steps
npx tsx scripts/scrape-official.ts op09          # Step 1
npx tsx scripts/seed-cards.ts --wipe op09        # Step 2
npx tsx scripts/upload-images.ts --sets=op09     # Step 3 (→ R2)
npx tsx scripts/pipeline-yuyutei.ts --sets=op09 --verbose   # Step 4 (→ YuyuteiMapping)
npx tsx scripts/fill-reprint-prices.ts           # Step 5
npx tsx scripts/seed-drop-rates.ts               # Step 6

# SNKRDUNK
npx tsx scripts/bulk-discover-snkrdunk.ts        # discover + auto-match + fetch
npx tsx scripts/run-snkrdunk-scraper.ts          # อัปราคา mapping ที่ approve แล้ว

# Daily (รันด้วย cron — รันมือได้)
npm run scrape:daily                             # = tsx scripts/scrape-daily.ts (Yuyutei)
```

> `npm run seed:prices` map ไป `scripts/seed-price-history.ts` (ไม่ใช่ไฟล์ `seed-prices.ts`) — ดู `package.json`

---

## File Structure

```
scripts/
├── pipeline.ts              # Orchestrator (6 steps)
├── scrape-official.ts       # Step 1: Official Bandai → JSON
├── seed-cards.ts            # Step 2: JSON → DB
├── upload-images.ts         # Step 3: CDN → Cloudflare R2
├── migrate-to-r2.ts         # one-off: ย้ายรูปทั้งหมด Bandai CDN → R2
├── pipeline-yuyutei.ts      # Step 4: Yuyutei → YuyuteiMapping
├── fill-reprint-prices.ts   # Step 5: copy ราคา reprint
├── seed-drop-rates.ts       # Step 6: drop rates
├── scrape-daily.ts          # Daily Yuyutei (เรียกโดย cron route)
├── bulk-discover-snkrdunk.ts / run-snkrdunk-scraper.ts   # SNKRDUNK
├── sets.ts · _db.ts · scrape-prices.ts
└── seed-*.ts                # users/games/honey-shop/achievements/missions/price-history

src/lib/scraper/
├── yuyu-tei.ts              # Yuyutei HTML parser
├── price-matcher.ts         # Daily Yuyutei matching (ใช้ YuyuteiMapping)
├── daily-prices.ts          # Daily orchestration (cron entry)
├── snkrdunk.ts              # SNKRDUNK scraper (SSR + API)
├── snkrdunk-matcher.ts      # SNKRDUNK → CardPrice
├── gemini-matcher.ts        # AI-assisted matching (admin)
├── exchange-rate.ts · http-utils.ts · parallel-utils.ts

src/app/api/cron/            # cron route handlers (scrape-prices, scrape-snkrdunk, ...)
```

---

## ⚠️ Known Gotchas

### 1. Yuyutei ID ซ้ำข้ามเซ็ต (CRITICAL)

Yuyutei ใช้ ID แบบ set-local (ทุกเซ็ตเริ่ม ~10001) → ทุก lookup ต้อง scope ด้วย set
- ขั้น daily: บังคับด้วย compound key `setCode_yuyuteiId` ใน `YuyuteiMapping` [price-matcher.ts]
- ขั้น scrape pipeline: ทุก query มี `set: { code: setCode }` [pipeline-yuyutei.ts:55]
ลืม scope → cross-set contamination (parallel OP09 ไป match Common EB01, ราคาผิดเป็นร้อยใบ)

### 2. Reprint cards ใน PRB/ST — baseCode fallback

Yuyutei ลิสต์ reprint ด้วย original code (เช่น "OP01-120" ในหน้า PRB01) แต่ DB เก็บเป็น "OP01-120_r1"/"_p5"
- Step 4 matcher ใช้ baseCode fallback จับให้ตรงเซ็ต
- Step 5 (`fill-reprint-prices`) เสริมสำหรับ reprint ที่ Yuyutei ไม่มี listing เฉพาะ (copy จากต้นฉบับ)

### 3. baseCode ต้องไม่มี suffix

`baseCode` ใช้แสดงผล UI → strip ทั้ง `_p1`, `_r1`, `_R1`; `seed-cards.ts` ใช้ `extractBaseCode()`
ถ้าผิด → UI โชว์ `OP02-013_R1` แทน `OP02-013`

### 4. ราคามาจาก mapping ที่ admin approve เท่านั้น

ทั้ง Yuyutei และ SNKRDUNK ราคาเข้า card ก็ต่อเมื่อ mapping `status: "matched"` แล้ว
listing ใหม่/กำกวมจะค้างเป็น `pending` ในหน้า admin (`/admin/yuyutei-matching`, `/admin/snkrdunk-matching`) — ไม่ใช่บั๊กถ้าราคาใบใหม่ยังไม่ขึ้น
