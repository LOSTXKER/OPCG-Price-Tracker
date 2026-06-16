# 📍 PROGRESS — สถานะสด
> **เขียนทับทุกครั้ง ไม่สะสม log** · hook โหลดไฟล์นี้ทุก session · อ่านอันนี้ก่อน แล้วทำต่อจาก NEXT

อัปเดตล่าสุด: 2026-06-17 — **✅ พอร์ต proto F (trading-dashboard, buy-box ขวา) ลงหน้าจริง `card-detail.tsx` เสร็จ + verified** · branch `redesign/card-detail-pricing-layout`

## ✅ เสร็จแล้ว — F อยู่บนหน้าจริง `/cards/[code]`
หน้าจริงตอนนี้ = layout F: ชื่อ+JP|EN+chips กลาง · **รางขวา flat (lg:border-l ไม่มี card border)** = `ดูประกาศขาย`(ทอง) → `[ลงขาย | เพิ่มเข้าพอร์ต]`(filled) → `[แจ้งเตือน | แชร์]`(ghost) → **ขายล่าสุด feed** (`recentSales`=mockComps seeded by grade · prototype · swap real comps ภายหลัง) · กราฟ `ScrubChart` เดิม (Raw/Graded+เทียบเกรด) + แหล่งอ้างอิง (เดิม) · รูปการ์ดเล็กลงสมส่วน (grid `[200_1fr_280]`/`xl[240_1fr_320]`)
- ลบ: center "ขายล่าสุด line", helper `statText`, CompareButton (รางไม่มี compare แล้ว — compare = เทียบเกรดในกราฟ), surface-1 panel รอบ buy box (→ flat)
- เพิ่ม: const `secondaryBtn`, `recentSales` useMemo, import `mockComps`/`ChevronRight`
- verify: **tsc 0 · lint 0 · test 36 · console 0** (clean restart) · screenshot desktop+mobile หน้าจริง OP13-118 ผ่าน

## ▶ NEXT
1. **proto ยังอยู่ `src/app/proto/rcol/` (a–f)** — เทียบเสร็จแล้ว · **รอเบสอนุญาตลบ** (CLAUDE.md: ลบไฟล์ต้องถาม)
2. **commit branch** `redesign/card-detail-pricing-layout` เมื่อเบสสั่ง (ห้าม push master ตรง)
3. ปุ่ม "เพิ่มเข้าพอร์ต" ในราง = label ยาว ถ้าแคบไปค่อยย่อ i18n `addToPort`

---
### (อ้างอิง) สเปก F ที่พอร์ตมา — proto `/proto/rcol/f` (`ProtoF` ใน `_proto.tsx`):
- **ไม่มี full-width header** — ชื่อ + JP|EN อยู่ในคอลัมน์กลาง (แบบหน้าปัจจุบัน ตามที่เบสขอ) · breadcrumb อยู่บนสุด
- **TOP BAND** `[รูป(~200/240px) | center | right rail]` · center = **identity(ชื่อ+P-SEC) + EditionToggle JP|EN** + grade chips + hero ราคากลาง + range bar · **right rail (flat, lg:border-l) = buy box**: `ดูประกาศขาย`(ทอง เต็มแถว เด่นสุด) → `[ลงขาย | เพิ่มพอร์ต]` → `[แจ้งเตือน | แชร์]` → **ขายล่าสุด feed**
- **CHART SECTION** `[กราฟ interactive | แหล่งอ้างอิง(flat,กดได้)]` · กราฟ = Raw/Graded toggle + range pills + เทียบเกรด overlay (หน้าจริงใช้ `ScrubChart` เดิมที่มีครบ) · ขวา = sources (Yuyu-tei/SNKRDUNK + ↗) tabs ประกาศขาย|ขายไปแล้ว
- **flat ไม่มีขอบ card** · gold เฉพาะ ดูประกาศขาย
- พอร์ตจริง = หน้าจริงเป็นโครง buy-box-ขวาอยู่แล้ว → งานหลัก: เพิ่ม header ชื่อบน + เพิ่ม **feed ขายล่าสุดในราง** + chips กลาง + เก็บ flat + ปุ่มจริง (CardAddToPortfolio/WatchlistStar/CompareButton/share/alert) + ScrubChart เดิม + sources เดิม · verify เต็ม · **ลบ proto `src/app/proto/rcol/` หลังเสร็จ (ขออนุญาตก่อน)**
- ⚠️ ProtoChart (proto เท่านั้น) ต้อง gate `mounted` กัน hydration — หน้าจริง ScrubChart gate อยู่แล้ว

(proto E เดิม `/proto/rcol/e` = ทิศ CTA-กลาง ที่ไม่ได้เลือก · เก็บไว้เทียบ)

### (อ้างอิง) โครง E ที่ไม่ได้เลือก:
- **HEADER full-width**: ชื่อ(h2) + P-SEC + JP|EN + 🔔/↗ (ย้าย name ออกจากคอลัมน์กลาง)
- **TOP BAND** `[รูป(สมส่วน ~200/240px) | center | ขายล่าสุด feed(flat)]` · center = **grade chips** + hero ราคากลาง + range bar + **CTA: ดูประกาศขาย(ทอง)/ลงขาย + เพิ่มเข้าพอร์ต**
- **CHART SECTION** `[กราฟ area | เกรด markets board(flat: ราคา+Δ+sparkline ต่อเกรด, เลือกได้)]` แทนแหล่งอ้างอิงเดิม
- **flat ไม่มีขอบ card** · gold เฉพาะปุ่มซื้อ
- ⚠️ **ProtoChart (SVG area) ต้อง gate ด้วย `mounted`** ไม่งั้น hydration mismatch (เจอแล้วแก้แล้วใน proto) — หน้าจริงใช้ `ScrubChart` ที่ gate อยู่แล้ว
- พอร์ตจริง: ต่อ data จริง (gradeData/seriesList/ScrubChart, mockComps→comps จริง, askRows/soldRows, edition, currency guard, WatchlistStar/CardAddToPortfolio/CompareButton/handleShare/CardSetAlertDialog จริง) · verify เต็ม (tsc/lint/test/screenshot/console) · **ลบ proto `src/app/proto/rcol/` หลังพอร์ตเสร็จ** (ขออนุญาตเบสก่อนลบ)

---
(ประวัติด้านล่าง = polish pass 10 ข้อ ก่อนหน้า — ยัง valid)

อัปเดตก่อนหน้า: **polish pass card-detail 10 ข้อ (จาก workflow design-review) เสร็จ+verify ครบ**

## ▶ สถานะตอนนี้ — card-detail ผ่าน world-class polish pass ✅
หลังพอร์ต proto-h เข้าหน้าจริง เบสรีวิวภาพจริง (desktop+mobile) แล้วสั่ง `/workflow` design-review (8 มุม × adversarial verify → 44 finding → แผนจัดลำดับ 10 moves). เบสเลือก **"แก้ทั้ง 10 รวดเดียว"** — ลงมือ+verify หมดแล้ว.

**10 moves ที่ลงไป (ทั้งหมด = ลบ/สลับ token/ปรับ layout · ไม่แตะ data/schema/dep):**
1. **สี green/gold ออกจาก chrome** — ลบ pill ลอยบนกราฟ (`card-chart.tsx`), range bar → `bg-foreground/25`+marker `bg-foreground` (เลิก price-up), verified BadgeCheck → muted, live dot → `var(--success)` (`asks-rail`). เส้น/area กราฟยังเขียว (= trend จริง)
2. **tier-meta** — เอาทองออกจาก "A", `text-2xl/lg font-extrabold` → `text-h4/h5` (เลิกข่ม hero)
3. **กราฟน่าเชื่อถือ** — `mock.ts` ผูก `deltaPct` จริง (`start=base/(1+pct/100)` + clamp -95) → +146% ไต่ขึ้นจริง · gridlines 3→4 (`[0,.33,.66,1]`) · y-label opacity .5→.7 · เพิ่ม **date x-ticks** 4 จุด (`dateAtIndex`)
4. **ลบข้อมูลซ้ำ** — stats rail: เอา meecardLowest override ออก (lowestListing = modeled datum.lowestAsk + est) · ลบแถว "ช่วง 30 วัน" (ซ้ำ range bar) · เพิ่มแถว **"24ชม" (`period24h`) = Delta priceChange24h** · `asks-rail` ซ่อนแถวสรุป "ต่ำสุด" เมื่อ `sorted.length<=1`
5. **อุดช่องว่างครึ่งล่าง** — specs section เลิก `lg:grid-cols-3` → CardTierMeta = แถบเต็มกว้างใต้ specs · ~~ยุบ sources ลงล่างเมื่อ 1 source~~ **เบสขอคืน sources ไว้ขวากราฟ (2-col เดิม) — ย้อนแล้ว** (เบส = north star: ปัญหาคือความโล่ง ไม่ใช่ตำแหน่ง)
6. **container เดียว** — เอากล่อง `surface-1 hairline rounded-2xl` รอบ MeecardAsksRail ออก → bare hairline section เหมือน specs/sources
7. **contrast** — grade-chip hint `text-overlay /50` → `text-micro /80`
8. **กราฟ discoverable** — เพิ่ม scrub hint (`MoveHorizontal`+`dragChartHint`) ใต้ ScrubChart · compare chips off-state มี `Plus` icon + `border-foreground/15 hover:/30`
9. **specs measure + rhythm** — `card-detail-specs` `<dl>` → `sm:grid-cols-2 gap-x-8` (label↔value ครึ่งกว้าง ไม่ลอยกลางจอ), divider ทุก cell · section gap `mt-5/mt-7` → `mt-6`
10. **delta รอง + token** — `grade-value` Delta lg `text-base`→`text-sm` · StatRow value `text-sm font-semibold` → `text-h5`

**ไฟล์ที่แตะ:** `card-detail.tsx` · `card-detail/card-chart.tsx` · `card-detail/mock.ts` · `card-detail/tier-meta.tsx` · `card-detail/grade-value.tsx` · `card-detail-specs.tsx` · `card-detail/asks-rail.tsx` · `i18n/{th,en,jp}.ts`

**ปรับหลัง feedback เบส (รอบ CTA):** ปุ่มทอง "ซื้อบน Meecard" เต็มแถวเดี่ยว = เด่นไป + ไม่สะท้อนว่าเป็นตลาด 2 ทาง → เปลี่ยนเป็น **คู่ปุ่ม** `grid-cols-2`: "**ดูประกาศขาย**" (ทอง + ShoppingBag, ฝั่งซื้อ, → `#market`) + "**ลงขาย**" (outline + Tag, ฝั่งขาย, → `/seller/listings/new?cardCode=`) · ทองเหลือครึ่งแถว เด่นน้อยลง · sticky bar มือถือ label → "ดูประกาศขาย" ด้วย · เพิ่ม i18n key `viewAsksCta`/`sellCta` (3 ภาษา) · คำที่เบสกำหนด: "ดูประกาศขาย" + "ลงขาย"

**ปรับหลัง feedback เบส (รอบ secondary actions → ย้ายเข้าคอลัมน์ขวา):** เบส — icon-only คนเดาไม่ออก (ฟีเจอร์เฉพาะ) ต้องมี label · ลองทำ labeled เรียงตั้งใน rail ซ้าย → เบสบอก "วางไม่ดี" (ปุ่ม 5 อันเรียงตั้งในช่องแคบ = สูง/ไม่สมดุลกับกลาง-ขวา) · เบสเสนอ **ย้าย actions ไปคอลัมน์ขวา (สถิติตลาด) + จัดใหม่** → ทำตาม:
  - **ซ้าย (rail) = สะอาด:** identity (รูป+ชื่อ+★) + [ดูประกาศขาย ทอง][ลงขาย outline] เท่านั้น (เอา share icon + secondary ออกจากซ้าย)
  - **ขวา = panel เดียว "สถิติ + actions" (buy-box style):** `สถิติตลาด` 3 แถว (ขายล่าสุด/ราคาตั้งต่ำสุด/24ชม) → เส้นคั่น → **2×2 grid** actions มี label: เพิ่มเข้าพอร์ต · แจ้งเตือน (`setPriceAlertShort`) · เปรียบเทียบ · แชร์ (shared class `actionBtn`, `[&_svg]:size-4`)
  - ย่อ i18n `addToCompare` → "เปรียบเทียบ"/"Compare"/"比較" (กันตกบรรทัดในช่อง 2×2) · เลิก const `ctaIconBtn` (ไม่ใช้แล้ว)
  - ผล: 3 คอลัมน์สมดุลขึ้น (ซ้ายสั้น+สะอาด · ขวาเป็น panel เต็ม · กลาง=instrument) · mobile order: image→price→buy/sell→stats+actions

**ปรับหลัง feedback เบส (รอบ hero image):** เบส "ดีได้กว่านี้ + รูปใหญ่กว่านี้" → ทำตาม DESIGN §1 "การ์ด = พระเอก" · restructure top-band 3-col เป็น **[รูปการ์ดใหญ่ซ้าย | identity+ราคา+ซื้อขาย กลาง | สถิติ+actions ขวา]**:
  - **COL1 = รูปการ์ดใหญ่อย่างเดียว** (`w-48 sm:w-56` mobile centered → `lg:w-full`, `lg:row-span-2`, aspect 63/88, rounded-xl) — จาก 64px → ~240-280px (~4×) เป็นพระเอกเต็มจอ
  - **COL2 = identity (ย้ายมาจาก col1, ชื่อ `text-h3 sm:text-h2` ใหญ่ขึ้น) + edition+chips+hero+range (แถว1) + buy/sell (แถว2)**
  - **COL3 = สถิติ + 2×2 actions** เหมือนเดิม (row-span-2)
  - grid: `lg:[240px_1fr_240px]` `xl:[280px_1fr_280px]` · mobile order: image→identity+price→buy/sell→stats+actions
  - หมายเหตุ: route ใช้ `cardCode` จริง (`/cards/OP13-118` = SP) — `OP13_P3` (P-SEC พาราเรล) เป็น display code ไม่ใช่ route (404)

**ปรับหลัง feedback เบส (รอบ buy box — ผ่าน `/workflow` 4 แนว + judge):** เบส "ขวายังดูแปลกๆ ออกแบบได้ดีกว่านี้" + เสนอ "ย้ายปุ่มซื้อขายไปขวา" → workflow design (StockX/Amazon/minimal-flat/collector) → judge: ต้นเหตุ weird = คอลัมน์ขวา "ไม่มี body" (eyebrow + StatRow ลอยๆ ข้างรูปกรอบ+ราคาเด่น) → merge StockX+Amazon+Robinhood เป็น **BUY BOX panel**:
  - COL3 = `surface-1 hairline rounded-2xl p-4 xl:p-5` (panel มี body, flat+hairline ตาม DESIGN §4) เรียง: **ACT** (ดูประกาศขาย ทอง full-width / ลงขาย **filled-neutral** `bg-foreground/[0.06]` ไม่ใช่ outline — ย้ายจากกลางมา) → **REFERENCE** tile 2 ช่อง (`surface-2`, ขายล่าสุด/ราคาตั้งต่ำสุด, `text-h5` ไม่ใช่ display = ไม่แย่ง hero number) → **TREND** (24ชม StatRow) → **UTILITY** ghost 2×2 (class ใหม่ `utilityBtn`: borderless `border-0` muted-foreground h-9 — เลิก `actionBtn`)
  - center เหลือ identity+instrument (ตัด buy/sell block กลางออก) · grid เลิก row-span → `lg:items-start` single-row · gold ยัง 1 จุด (ปุ่มซื้อ) · mobile: image→instrument→buy box (ซื้ออยู่บนสุด panel = ใกล้ราคา)

**ปรับหลัง feedback เบส (รอบ stats → trading feel):** เบส "ย้ายขายล่าสุดไปกลาง · เอาราคาตั้งต่ำสุด+24ชม ออก · อยากให้ดูเป็นเว็บเทรดมากขึ้นหน่อย":
  - **center:** เพิ่มบรรทัด "ขายล่าสุด {value} EST" ใต้ subline (ใต้ hero/ราคากลาง) → อ่านเป็น quote (ราคากลาง + ขายล่าสุดคู่กัน)
  - **buy box:** ตัด REFERENCE tile + TREND(24ชม) ออก → เหลือ ACT (ซื้อ/ขาย) + เส้นคั่น + UTILITY ghost → panel กระชับเป็น "act here" ล้วน
  - ลบ helper `StatRow` + import `ReactNode` (ไม่ใช้แล้ว) · keys `lowestListing/period24h/marketStats` ไม่ถูกเรียกแล้ว (ไม่ error)
  - **trading feel = เพิ่งทำ pass แรก** (quote ที่ center + buy box สะอาด) · ถ้าจะดันต่อ (เอารูปเล็กลง/ดึงกราฟขึ้นมาคู่ราคา/quote-stats strip) = งานถัดไป รอเบสยืนยันทิศ

## ⚠️ การตัดสินใจสำคัญ (คงเดิมจากรอบก่อน — north star = น่าเชื่อถือ)
1. **default grade = Raw A** (ราคาตลาดจริง) ไม่ใช่ PSA 10
2. **raw = Yuyutei (JPY) เท่านั้น** · PSA10 = SNKRDUNK · ทุก modeled ติด `<EstMark/>`
3. source row label = เกรดจริงของแหล่ง ไม่ใช่เกรดที่เลือก
4. **(ใหม่) สี = reinforcement เท่านั้น**: green/red สงวนให้ delta · chrome (pill/range-bar/badge) = neutral · live dot = `--success` (status ไม่ใช่ price)

## ✅ verify ครบ (อย่าเคลมลอย)
tsc 0 · lint 0 · **test 36 ผ่าน** · **console 0 errors/warnings** (ไม่มี hydration) บน OP13-118 · หลังย้อน sources (จุด 5) re-run **tsc 0 · lint 0 + screenshot ยืนยัน sources กลับไปขวากราฟ (2-col)** แล้ว · screenshot ยืนยัน: desktop fold (กราฟไต่จริง+date axis+ไม่มี pill+range bar เทา+24ชม+scrub hint+compare chips มี +) · specs zone (sources แถบเต็มกว้าง · ไม่มีกล่อง listings · specs 2-col) · tier strip ("Tier A" ขาวไม่ทอง · 12.4% เล็กลง) · mobile fold (order image→price→CTA→stats ครบ)

## ⚠️ gotchas (ก่อนทำต่อ)
1. **dev restart = kill PID** (`kill $(lsof -nP -iTCP:3000 -sTCP:LISTEN -t)` + `pkill -f "OPCG.*node_modules/.bin/next"` → `npm run dev`) · **ห้าม rm .next** · HMR staleness หลัง edit = restart สะอาดแล้วเช็คใหม่
2. **screenshot tools ใน `.codex/`**: `shot.mjs <url> <base> [mw]` (desktop1440+mobile402 full) · `shot-fold.mjs <url> <out> [w h]` (top viewport) · `shot-at.mjs <url> <out> <scrollY> [w h]` (เลื่อนแล้วแคป — ใหม่) · `console.mjs <url>` (เช็ค error) · **#hash ไม่ scroll ใน headless → ใช้ shot-at**
3. ห้าม `npm run build` ระหว่าง `next dev`
4. **prisma client = ESM (Prisma 7)** — `require('@prisma/client')` ใน node -e พัง (`.prisma/client/default` not found); ใช้ผ่าน app/route แทน
5. การ์ดที่เบสเปิด (P-SEC พาราเรล 268,800฿) = code `OP13_P3` คนละใบกับ `/cards/OP13-118` (SP ฐาน 311฿) — ราคาต่างกันเพราะคนละ variant ไม่ใช่บั๊ก
6. **currency hydration นอกหน้านี้ยังไม่ guard** (card table/header/portfolio) — งานแยกทั้งแอป
7. **mock.ts ผูก deltaPct เป็น 30d** ใช้กับทุก range (1M เป๊ะ · 3M/1Y/All เป็น mock shape) — เปลี่ยนเมื่อมี pipeline จริง (VISION §6)

## ▶ NEXT
> **เบส (2026-06-16): Meecard = prototype → โฟกัส UI/ดีไซน์** · mock+ข้อมูลค้าง (เม.ย.) ปล่อยได้ · อย่าทักว่า data/กราฟ stale เป็นบั๊ก
1. รอ feedback เบสรอบใหม่บน card-detail หลัง polish pass (move #10 เพิ่มแถว 24h · move #6 เอากล่องออก — ถ้าอยากได้ความรู้สึกอื่นบอกได้)
2. ขยายมุมเดียวกันไปหน้าอื่นตาม VISION §7: **home · portfolio hero · marketplace** (ใช้ workflow design-review pattern เดิมได้)
3. ยังไม่ verify visual move #4 (ซ่อนแถวสรุป single-listing) บนการ์ดจริง — OP13-118 SP เป็น empty state; logic+test ผ่าน แต่ถ้าอยากเห็นจริงให้เปิดการ์ดที่มี Meecard listing 1 ใบ (เช่น `OP13_P3`)
