# MeeCard — Data Pipeline Architecture

## Overview

ระบบดึงข้อมูลการ์ด One Piece TCG จาก **2 แหล่ง** แล้วรวมกัน:

| แหล่งข้อมูล | ให้อะไร | เทคนิค |
|---|---|---|
| **Official Bandai** (3 เว็บ) | ข้อมูลการ์ดทั้งหมด: ชื่อ, stat, effect, รูปภาพ, rarity, **SP reprints** | Cheerio parse HTML |
| **Yuyutei** (yuyu-tei.jp) | ราคาเท่านั้น (JPY) | Cheerio parse HTML |

**ทำไมไม่ใช้ Punk Records?**
Punk Records (GitHub JSON) ไม่มี SP reprint cards (เช่น OP05-067 Zoro SP ที่เปิดได้ในซอง OP09)
Official Bandai จัดหมวดหมู่ SP reprints ถูกต้องตามเซ็ตที่เปิดซองได้จริง

---

## Pipeline Flow (6 Steps)

```
npx tsx scripts/pipeline.ts --wipe --sets=op09
```

### Step 1: Scrape Official Bandai → JSON files

**Script:** `scripts/scrape-official.ts`

ดึงข้อมูลจาก 3 เว็บ Official ของ Bandai แล้ว merge เป็น JSON file เดียวต่อเซ็ต:

| เว็บ | URL | Series ID prefix | ให้ภาษา |
|---|---|---|---|
| Asia English | asia-en.onepiece-cardgame.com | `556` | EN |
| Japanese | onepiece-cardgame.com | `550` | JP |
| Asia Thai | asia-th.onepiece-cardgame.com | `563` | TH |

**Series ID Formula:**
```
{3-digit prefix}{type digit}{2-digit number}

Type digits:
  ST  = 0    (e.g. ST-01 → 556001)
  OP  = 1    (e.g. OP-09 → 556109)
  EB  = 2    (e.g. EB-01 → 556201)
  PRB = 3    (e.g. PRB-01 → 556301)
```

**URL ตัวอย่าง:**
```
https://asia-en.onepiece-cardgame.com/cardlist/?series=556109   ← OP09 EN
https://onepiece-cardgame.com/cardlist/?series=550109            ← OP09 JP
https://asia-th.onepiece-cardgame.com/cardlist/?series=563109    ← OP09 TH
```

**วิธี parse HTML:**
- แต่ละการ์ดอยู่ใน `<dl class="modalCol" id="OP09-001">` ภายในหน้า
- ข้อมูลอยู่ใน: `.infoCol span` (code, rarity, type), `.cardName` (ชื่อ), `.backCol` (stat, effect)
- รูปภาพ: `<img data-src="../images/cardlist/card/OP09-001.png">`
- SP reprints จะมี id เป็น code จากเซ็ตเดิม เช่น `id="OP05-067_p4"` แต่อยู่ในหน้าของ OP09

**Output:** `data/cards/{setCode}.json` — array ของ OfficialCard objects

```
npx tsx scripts/scrape-official.ts op09        # เซ็ตเดียว
npx tsx scripts/scrape-official.ts              # ทุกเซ็ต
```

---

### Step 2: Seed Cards → DB

**Script:** `scripts/seed-cards.ts`

อ่าน JSON files จาก Step 1 แล้ว upsert เข้า DB (Prisma):

```
npx tsx scripts/seed-cards.ts --wipe op09    # wipe แล้ว seed OP09
npx tsx scripts/seed-cards.ts op09           # seed OP09 (ไม่ wipe)
```

- `--wipe` จะลบข้อมูลเดิมทั้งหมด (CardPrice, Card, CardSet ฯลฯ) ก่อน seed
- สร้าง `Card` row ต่อ 1 card variant (base + parallels + SP reprints)
- `cardCode` เป็น unique identifier เช่น `OP09-001`, `OP09-001_p1`, `OP05-067_p4`, `OP01-006_r1`
- `baseCode` คือ code ไม่มี suffix ใดๆ เช่น `OP09-001`, `OP05-067`, `OP01-006`
  - strip ทั้ง `_p1` (parallel), `_r1` (reprint) ออก → ใช้แสดงผลใน UI

---

### Step 3: Upload Images → Supabase Storage

**Script:** `scripts/upload-images.ts`

โหลดรูปจาก CDN ของ Bandai แล้ว upload ขึ้น Supabase Storage:

```
npx tsx scripts/upload-images.ts --sets=op09
npx tsx scripts/upload-images.ts --force       # re-upload แม้มีอยู่แล้ว
```

- สร้าง bucket `card-images` (public)
- จัดเก็บ: `{setCode}/{cardCode}.png` เช่น `op09/OP09-001.png`
- อัปเดต `Card.imageUrl` ใน DB เป็น Supabase public URL
- ข้ามใบที่ imageUrl ชี้ไป Supabase อยู่แล้ว (เว้นแต่ใช้ `--force`)

**ต้องมี ENV:**
```
NEXT_PUBLIC_SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...
```

---

### Step 4: Yuyutei → Match Prices

**Script:** `scripts/pipeline-yuyutei.ts`

Scrape ราคาจาก Yuyutei แล้ว match กับการ์ดที่มีอยู่ใน DB:

```
npx tsx scripts/pipeline-yuyutei.ts --sets=op09 --verbose
```

**⚠️ CRITICAL: Yuyutei ใช้ ID แบบ set-local**

Yuyutei ID (เช่น `10001`, `10002`) **ซ้ำกันข้ามเซ็ต** — ทุกเซ็ตเริ่มนับจาก ~10001 ใหม่
ดังนั้น **ทุก query ที่ค้นหาการ์ดต้องกรองด้วย `set: { code: setCode }` เสมอ**
ถ้าไม่กรอง จะเกิด cross-set contamination: listing ของ OP09 ไป match กับการ์ดเซ็ตอื่น

**3-Step Matching Logic (ทุก step ต้อง scope ด้วย set):**

```
สำหรับแต่ละ listing จาก Yuyutei:
(ทุก query ต้อง WHERE set.code = current set เสมอ!)

1. Non-parallel (การ์ดปกติ):
   → match โดย cardCode (e.g. "OP09-001") ภายในเซ็ตปัจจุบัน

2. Parallel (พาราเรล / SP):
   2a. ถ้า card ใน DB (ในเซ็ตเดียวกัน) มี yuyuteiId ตรงกับ listing → match ทันที (re-run fast path)
   2b. หา card (ในเซ็ตเดียวกัน) ที่ baseCode + rarity + isParallel ตรง + ยังไม่มี yuyuteiId
       → "เลือกใบที่ยังว่างก่อน" ป้องกัน overwrite เมื่อมีหลาย parallel rarity เดียวกัน
   2c. ถ้ายังไม่เจอ → หา parallel ใดๆ (ในเซ็ตเดียวกัน) ที่ยังไม่มี yuyuteiId

3. YuyuteiMapping table:
   → fallback สำหรับใบที่เคย manual match ไว้ในหน้า Admin

4. ถ้าไม่เจอเลย:
   → สร้าง YuyuteiMapping (status: "pending") รอ manual review
```

**ทำไมต้อง "เลือกใบว่างก่อน"?**
OP09-119 มี P-SEC 2 ใบ (¥1,480 และ ¥198,000) ถ้าไม่กรอง `yuyuteiId: null`
ทั้ง 2 listings จะ match ไปที่ใบเดิมซ้ำ ทำให้อีกใบไม่ได้ราคา

**ทำไมต้อง scope ด้วย set?**
Yuyutei ใช้ ID ที่ซ้ำข้ามเซ็ต เช่น OP01 มี yuyu=10006, OP09 ก็มี yuyu=10006
ถ้า query ไม่กรอง set จะเจอ:
- OP09 P-SR listing (yuyu=10007) match ไปที่ EB01 card ที่ได้ yuyu=10007 จากก่อนหน้า
- OP09 Leader ที่ถูก match ถูกต้องแล้ว ถูก overwrite ด้วยเซ็ตทีหลัง (PRB01)
- ราคาผิดหลายร้อยใบ, parallel ไม่มีราคาเลย

**Output:** อัปเดต `Card.yuyuteiId`, `Card.latestPriceJpy`, สร้าง `CardPrice` history rows

---

### Step 5: Fill Reprint Prices

**Script:** `scripts/fill-reprint-prices.ts`

การ์ด reprint (`_r1`, `_r2`) ในเซ็ต PRB01, PRB02, ST15-ST28 เป็นการ์ดเดียวกับต้นฉบับ
แต่ Yuyutei ขายภายใต้เซ็ตเดิม (เช่น OP01-006 อยู่หน้า OP01 ไม่ใช่ PRB01)
Step นี้ copy ราคาจากการ์ดต้นฉบับมาใส่:

```
OP01-006_r1 (PRB01) ← copy ราคาจาก OP01-006 (OP01) = ¥120
OP09-013_r1 (ST23)  ← copy ราคาจาก OP09-013 (OP09) = ¥30
```

**Logic:** หา card ที่ `cardCode` หรือ `baseCode` ตรงกับ clean base (strip `_r1` etc.) ที่มีราคาอยู่แล้ว

**ผลลัพธ์:** ~520 ใบได้ราคา, เหลือ ~36 ใบ (Promo P-xxx ที่ Yuyutei ไม่ขาย) = **99.1% coverage**

---

### Step 6: Seed Drop Rates

**Script:** `scripts/seed-drop-rates.ts`

Seed ข้อมูล drop rate ของแต่ละ rarity ต่อเซ็ต

---

## Daily Price Update (Cron)

**Script:** `scripts/scrape-daily.ts` → ใช้ `src/lib/scraper/price-matcher.ts`

ลง cron run ทุกวัน เพื่ออัปเดตราคาล่าสุด:
- ใช้ matching logic เดียวกับ Step 4 (ทุก query ต้อง scope ด้วย set เสมอ)
- สร้าง CardPrice history rows ใหม่
- คำนวณ priceChange24h, priceChange7d

---

## Key Technical Details

### Card Data Model

```
Card {
  cardCode    "OP09-001"           ← unique, ใช้เป็น primary lookup
  baseCode    "OP09-001"           ← code ไม่มี _p/_r suffix (ใช้แสดงผล UI)
  setId       → CardSet (op09)
  isParallel  false
  parallelIndex  null              ← 1, 2, 3... สำหรับ parallels
  rarity      "L"                  ← L, C, UC, R, SR, SEC, SP, P-L, P-R, P-SR, P-SEC
  yuyuteiId   "10146"              ← ผูกกับ Yuyutei listing (⚠️ set-local! ซ้ำข้ามเซ็ตได้)
  latestPriceJpy  500
}
```

### SP Reprint Cards

การ์ด SP reprint เช่น `OP05-067_p4` (Zoro-Juurou SP ในซอง OP09):
- `cardCode`: `OP05-067_p4` (code จากเซ็ตเดิม + parallel index)
- `baseCode`: `OP05-067`
- `setId`: **OP09** (เซ็ตที่เปิดซองได้จริง)
- `rarity`: `SP`
- `isParallel`: `true`

Official Bandai จัดการ์ดเหล่านี้ไว้ในหน้าของเซ็ตที่เปิดได้ ไม่ใช่เซ็ตเดิม
ดังนั้น scraper ของเราจะดึงมาถูกเซ็ตโดยอัตโนมัติ

### Rarity Map

| Official HTML | Internal DB |
|---|---|
| L | L |
| C | C |
| UC | UC |
| R | R |
| SR | SR |
| SEC | SEC |
| SP CARD / SPカード | SP |
| Parallel ของ R | P-R |
| Parallel ของ SR | P-SR |
| Parallel ของ SEC | P-SEC |
| Parallel ของ L | P-L |

### HTML Parsing Selectors (Official Bandai)

```
Series list:    select#series > option          [value = series ID]
Card modals:    .modalCol                       [id = card ID e.g. "OP09-001"]
Card code:      .infoCol span:nth(0)
Rarity:         .infoCol span:nth(1)
Card type:      .infoCol span:nth(2)
Name:           .cardName
Image:          .frontCol img[data-src]
Cost/Life:      .backCol .cost
Power:          .backCol .power
Counter:        .backCol .counter
Color:          .backCol .color
Attribute:      .backCol .attribute i
Trait/Type:     .backCol .feature
Effect:         .backCol .text (first)
Trigger:        .backCol .text (second, if heading = "Trigger")
Card sets:      .backCol .getInfo
```

---

## Commands Quick Reference

```bash
# Full pipeline (wipe + all sets)
npx tsx scripts/pipeline.ts --wipe

# Full pipeline (specific sets only)
npx tsx scripts/pipeline.ts --wipe --sets=op09,op13

# Individual steps
npx tsx scripts/scrape-official.ts op09           # Step 1
npx tsx scripts/seed-cards.ts --wipe op09         # Step 2
npx tsx scripts/upload-images.ts --sets=op09      # Step 3
npx tsx scripts/pipeline-yuyutei.ts --sets=op09 --verbose   # Step 4
npx tsx scripts/fill-reprint-prices.ts              # Step 5
npx tsx scripts/seed-drop-rates.ts                # Step 6

# Daily cron
npx tsx scripts/scrape-daily.ts
```

---

## File Structure

```
scripts/
├── pipeline.ts              # Orchestrator (runs all steps)
├── scrape-official.ts       # Step 1: Official Bandai → JSON
├── seed-cards.ts            # Step 2: JSON → DB
├── upload-images.ts         # Step 3: CDN → Supabase Storage
├── pipeline-yuyutei.ts      # Step 4: Yuyutei → price matching
├── fill-reprint-prices.ts   # Step 5: Copy prices for reprints
├── seed-drop-rates.ts       # Step 6: Drop rates
├── scrape-daily.ts          # Daily cron for price updates
├── sets.ts                  # Set definitions (codes, names)
├── _db.ts                   # Prisma client init
└── scrape-prices.ts         # Price scraper utilities

data/cards/
├── op01.json                # Card data per set (generated by Step 1)
├── op09.json
├── ...
└── st29.json

src/lib/scraper/
├── yuyu-tei.ts              # Yuyutei HTML parser
├── price-matcher.ts         # Price matching logic (used by daily cron)
├── daily-prices.ts          # Daily scrape orchestration
└── parallel-utils.ts        # Parallel processing helpers
```

---

## ⚠️ Known Gotchas

### 1. Yuyutei ID ซ้ำข้ามเซ็ต (CRITICAL)

Yuyutei ใช้ ID แบบ set-local (ทุกเซ็ตเริ่มจาก ~10001)
**ทุก query ที่ค้นหาการ์ดด้วย yuyuteiId ต้อง WHERE set.code = ... เสมอ**

ถ้าลืม scope → cross-set contamination:
- Parallel OP09 ไป match กับ Common EB01
- Leader cards ถูก overwrite ราคาผิดทั้งหมด
- ราคาผิดเป็นร้อยใบ แต่ matched count ดูเหมือนถูก

ไฟล์ที่ต้องระวัง:
- `scripts/pipeline-yuyutei.ts` — matchCard() ทุก step ต้องมี `set: { code: setCode }`
- `src/lib/scraper/price-matcher.ts` — matchAndUpdatePrices() ทุก step ต้องมี `set: { code: setCode }`

### 2. Reprint cards ใน PRB/ST ไม่มีราคาจาก Yuyutei โดยตรง

การ์ด reprint (`_r1`, `_r2`) ใน PRB01, PRB02, ST15-ST28 ไม่มี Yuyutei listing โดยตรง
เพราะ Yuyutei ขายภายใต้เซ็ตเดิม (เช่น OP01-006 อยู่ในหน้า OP01 ไม่ใช่ PRB01)

**แก้ไขด้วย Step 5:** `fill-reprint-prices.ts` copy ราคาจากการ์ดต้นฉบับ
เหลือ ~36 ใบที่ไม่มีราคาจริงๆ (Promo P-xxx ที่ Yuyutei ไม่ขาย)

### 3. baseCode ต้องไม่มี suffix

`baseCode` ใช้แสดงผลใน UI → ต้อง strip ทั้ง `_p1`, `_r1`, `_R1` ออก
`seed-cards.ts` ใช้ `extractBaseCode()` ทำตรงนี้
ถ้า baseCode ผิด → UI จะแสดง `OP02-013_R1` แทน `OP02-013`

### 4. OP09-077 มี 2 versions บน Yuyutei

Yuyutei list OP09-077 สองใบ (ก่อน/หลังแก้ text) ทั้งคู่ match ไปที่ OP09-077 ใบเดียวใน DB
ราคาจะเป็นของ listing ที่ process ทีหลัง (text แก้แล้ว)
