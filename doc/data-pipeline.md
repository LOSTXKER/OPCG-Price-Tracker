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

## Pipeline Flow (5 Steps)

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
- `cardCode` เป็น unique identifier เช่น `OP09-001`, `OP09-001_p1`, `OP05-067_p4`
- `baseCode` คือ code ไม่มี suffix เช่น `OP09-001`, `OP05-067`

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

**3-Step Matching Logic:**

```
สำหรับแต่ละ listing จาก Yuyutei:

1. Non-parallel (การ์ดปกติ):
   → exact match โดย cardCode (e.g. "OP09-001")

2. Parallel (พาราเรล / SP):
   2a. ถ้า card ใน DB มี yuyuteiId ตรงกับ listing → match ทันที (re-run fast path)
   2b. หา card ที่ baseCode + rarity + isParallel ตรง + ยังไม่มี yuyuteiId
       → "เลือกใบที่ยังว่างก่อน" ป้องกัน overwrite เมื่อมีหลาย parallel rarity เดียวกัน
   2c. ถ้ายังไม่เจอ → หา parallel ใดๆ ที่ยังไม่มี yuyuteiId

3. YuyuteiMapping table:
   → fallback สำหรับใบที่เคย manual match ไว้ในหน้า Admin

4. ถ้าไม่เจอเลย:
   → สร้าง YuyuteiMapping (status: "pending") รอ manual review
```

**ทำไมต้อง "เลือกใบว่างก่อน"?**
OP09-119 มี P-SEC 2 ใบ (¥1,480 และ ¥198,000) ถ้าไม่กรอง `yuyuteiId: null`
ทั้ง 2 listings จะ match ไปที่ใบเดิมซ้ำ ทำให้อีกใบไม่ได้ราคา

**Output:** อัปเดต `Card.yuyuteiId`, `Card.latestPriceJpy`, สร้าง `CardPrice` history rows

---

### Step 5: Seed Drop Rates

**Script:** `scripts/seed-drop-rates.ts`

Seed ข้อมูล drop rate ของแต่ละ rarity ต่อเซ็ต

---

## Daily Price Update (Cron)

**Script:** `scripts/scrape-daily.ts` → ใช้ `src/lib/scraper/price-matcher.ts`

ลง cron run ทุกวัน เพื่ออัปเดตราคาล่าสุด:
- ใช้ matching logic เดียวกับ Step 4 แต่ compact กว่า
- สร้าง CardPrice history rows ใหม่
- คำนวณ priceChange24h, priceChange7d

---

## Key Technical Details

### Card Data Model

```
Card {
  cardCode    "OP09-001"           ← unique, ใช้เป็น primary lookup
  baseCode    "OP09-001"           ← code ไม่มี _p suffix
  setId       → CardSet (op09)
  isParallel  false
  parallelIndex  null              ← 1, 2, 3... สำหรับ parallels
  rarity      "L"                  ← L, C, UC, R, SR, SEC, SP, P-L, P-R, P-SR, P-SEC
  yuyuteiId   "10146"              ← ผูกกับ Yuyutei listing
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
npx tsx scripts/seed-drop-rates.ts                # Step 5

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
├── seed-drop-rates.ts       # Step 5: Drop rates
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
