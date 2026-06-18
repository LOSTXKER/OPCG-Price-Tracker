# 📍 PROGRESS — สถานะสด
> **เขียนทับทุกครั้ง ไม่สะสม log** · hook โหลดไฟล์นี้ทุก session · อ่านอันนี้ก่อน แล้วทำต่อจาก NEXT

อัปเดตล่าสุด: 2026-06-18 — **เทียบเกรด: เส้นเดียว + ตาราง** (เบส: กราฟเทียบ "ดูยาก" → workflow ฟันธง honesty) + ก่อนหน้า: CMC chart, low/high bar, hero, standardize

## ✅ เสร็จ session นี้ (2e) — grade-compare → single line + ladder (เบสเลือก "ซื่อสัตย์")
แก้ `card-detail.tsx` + i18n ×3 · tsc 0 · lint 0 err · test 45 · hydration สะอาด · screenshot ยืนยัน
- **ปัญหา:** เทียบเกรดโชว์ 5 เส้นทับกันมั่ว + legend ซ้ำ "350.1%" 5 ครั้ง — เพราะ**ไม่มีประวัติแยกรายเกรด** ทุกเกรดใช้ rawDelta30d เดียวกัน → indexed แล้วเส้นเดียวกันเป๊ะ
- **decision (workflow + เบส confirm):** **ไม่ปั้น divergence** · seriesList memo คืน `{lines, ladderKeys}` — วาดเฉพาะเส้นที่ delta ต่างจาก primary จริง (epsilon 0.1 · `MAX_CHART_LINES=3`) → วันนี้ collapse เหลือ **1 เส้น** · ที่เหลือไป **ladder** (ราคา฿จริง + % ของ primary + EstMark)
- **ผลพลอยได้:** 1 เส้น → `indexed=false` อัตโนมัติ → กราฟกลับเป็นแกน ฿ + last-price tag (ไม่ใช่ % นามธรรม) = แก้ "ดูยาก" ตรงจุด
- ladder: PSA10 ref · PSA9 50% · PSA8 32% · BGS 115% · Raw <1% (ปัด <1 → "<1%") · i18n `ofGrade`
- machinery indexed/dashed-est/cross-family เก็บไว้ครบ → พอ comps pipeline จริงมา (delta ต่างกัน) เส้นหลายเส้นกลับมาเอง (เปลี่ยน gate บรรทัดเดียว)

## ✅ เสร็จ session นี้ (2d) — CMC chart upgrade 3 ฟีเจอร์ (planning workflow → honesty decision)
แก้ `card-chart.tsx` + `card-detail.tsx` + mock.ts + i18n ×3 · tsc 0 · lint 0 err · **test 45** · log สะอาด · screenshot axis/dropdown/line
- **แกน Y → ซ้าย:** pad swap (padLeft 12→64, padRight 84→18) · gridline label `x=padLeft-10` textAnchor end · last-price tag ย้ายเข้า left gutter ที่ y ราคาปัจจุบัน
- **7D range:** RANGES=["7D",..] + SPAN_DAYS["7D"]=7 + mock RANGE_POINTS["7D"]=28 + i18n window7D · **1D เลื่อน** (gate `INTRADAY_ENABLED=false` · ไม่มี intraday → ปลอม)
- **dropdown ช่วงเวลาบนแถบ Low/High:** `barPeriod` state (7d/1m/1y/all · **ไม่มี 24h** — intraday) · `barPoints` memo สร้าง series ตาม period (decouple จากช่วงกราฟ · seed จาก `latest` ไม่ใช่ primaryPoints[0]) · native select pill
- **❌ candlestick — ถอดออกตามเบส** (volume การ์ดน้อย แท่งเทียนไม่เหมาะ · candlestick เหมาะสินทรัพย์เทรดถี่) · ลบ bucketOHLC + Candle render + Price\|Candle toggle + candleNote + test + i18n หมดแล้ว (revert สะอาด · grep 0 ref)
- **เส้นสี:** ลองทำ per-segment (ขาขึ้นเขียว/ขาลงแดง) แต่เบสถามว่าแปลกไหม → เช็คแล้ว **เว็บเทรดจริง (Robinhood/CMC/Google/TradingView) ใช้เส้น "สีเดียวตามเทรนด์ของช่วง"** ทั้งนั้น · เขียว/แดงรายช่วง = ใช้กับ candlestick ไม่ใช่เส้น → **revert กลับสีเดียว (มาตรฐาน)** = `primary.color` (เขียวถ้า up / แดงถ้า down ตามเทรนด์รวม) · ของเดิมถูกอยู่แล้ว
- ⚠️ **honesty defer:** 1D line + 24h low/high → ไม่มี intraday data · รอ source จริง
- orphan: i18n estSpread (เลิกใช้)

## ✅ เสร็จ session นี้ (2c) — CMC low/high bar + thinner chart line (เบสอ้างอิง CoinMarketCap)
แก้ `card-detail.tsx` + `card-chart.tsx` · tsc 0 · lint 0 err · test 45 · log สะอาด
- **แถบประเมิน → Low/High position bar แบบ CMC:** ดึง `priceLow/priceHigh = min/max(primaryPoints)` (เส้นกราฟจริงในช่วงที่เลือก) · จุด `pricePos = (activeValue−low)/(high−low)` (เลื่อนกราฟจุดขยับตาม) · fill ซ้าย→จุด · **honest by construction:** "ต่ำสุด" = ราคาเปิดช่วง สอดคล้องกับ %move (เลิก ±7% ปลอม → ปัญหาเลขขัดกันหายถาวร) · client-only (gate `hydrated`) ไม่ mismatch · `band` เก็บไว้ feed asks-rail rangeHigh เท่านั้น (ไม่โชว์แล้ว)
- **กราฟเส้นบาง:** primary 3.5→**2.25** · compare 2.5→**1.75** (แบบ CMC) · grid 1.25 ยัง subordinate
- ⚠️ จุดอยู่ขวาสุดในภาพเพราะ OP13-118 เป็น riser (ปัจจุบัน=สูงสุด) · การ์ดที่ลง/นิ่งจุดจะอยู่ซ้าย/กลาง = ทำงานถูก
- orphan: i18n `estSpread` (เลิกใช้ · เหลือไว้ zero-risk)

## ✅ เสร็จ session นี้ (2b) — hero layout cleanup (เบสเลือก "สะอาดขึ้น เก็บครบ" จาก AskUserQuestion 3 preview)
แก้ `card-detail.tsx` + `grade-value.tsx` (Delta) + i18n ×3 · tsc 0 · lint 0 err · test 45 · log สะอาด · screenshot raw+PSA10+mobile
- **"1M" → "ใน 1 เดือน"** — เบสงงว่า 1M คืออะไร (อ่านเป็น "1 ล้าน" ติด ฿ ได้) · เพิ่ม i18n `window1M/3M/1Y/All` + `windowLabel` (scrub→date, rest→window) · เลิก pill เป็น text ธรรมดา
- **Delta เพิ่ม prop `absFirst`** — โชว์จำนวนก่อน % (▲ +185฿ · 146.7%) แบบ Robinhood · opt-in ไม่กระทบ usage อื่น (legend ยัง %-only)
- **provenance ยุบ 2 บรรทัด → 1** — pill · source · grade · freshness(ท้าย) · freshness stale = **amber TEXT เบาๆ** (`var(--warning)`) ไม่ใช่ filled chip (เบสว่าเด่นไป)
- **est spread ยุบ 3 แถว → 1** — caption · แถบเล็ก w-14 (จุดกึ่งกลาง) · `lo – hi` · est · เอา "±7%" ออกจาก `estSpread` (เลขชัดอยู่แล้ว)

## ✅ เสร็จ session นี้ (2a) — hero price block redesign (judge-panel 3 framing → "minimal-trust" 35/40 + graft)
แก้ `card-detail.tsx` (hero block lines ~363, 568-628) + i18n ×3 (`estSpread`) · verify: tsc 0 · lint 0 err · test 45 · fresh-server log สะอาด (0 markerPct) · CDP hero screenshot desktop+mobile
- **แก้ที่ราก contradiction:** delta คุม **เวลา** ("1M") · band คุม **ช่วง** ("ช่วงประเมิน ±7%") → คนละ frame เลขขัดกันไม่ได้ (เดิม "+146.7% (1M)" ชนกับ "ต่ำสุด 289฿")
- **range bar → centered spread tick:** ลบ left-fill (progress metaphor ผิด) + จุดกึ่งกลาง `left-1/2` + faint band กลาง · **ลบ `markerPct`** (dead หลัง redesign · grep ยืนยันใช้แค่ที่นี่) · caption "ช่วงประเมิน ±7%" + EstMark แทน "ต่ำสุด/สูงสุด" · endpoints เหลือเลขเปล่า 289/329
- **ask vs sold pre-attentive (graft):** ask = pill **เส้นขอบ** (`border-foreground/20`) · sold = **เขียวทึบ** (เดิม) → แยกชัดทันที
- **staleness honest (graft):** `daysSinceUpdate>=30` → updatedLabel เป็นชิป `.status-warn` (token `--warning` #FF9F0A) · fresh = muted ธรรมดา · gate `isStale`
- **price→delta แยกบรรทัด** + window ("1M"/scrub-date) เป็น pill เล็ก · provenance แยก 2 บรรทัด (อะไร/สดแค่ไหน)
- honesty: band ยัง modeled เลขเดิม (relabel ซื่อสัตย์ ไม่ปลอม) · EstMark คุม band caption · จุดยัง float · band ยังป้อน asks-rail rangeHigh
- ⚠️ orphan i18n `low`/`high` เหลือไว้ (zero-risk · ลบเป็น cleanup แยก)

## ✅ เสร็จ session นี้ (1) — กราฟราคาเป็นมาตรฐาน (ผ่าน design judge workflow 3 lens → spec)
แก้ `src/components/cards/card-detail/card-chart.tsx` (ScrubChart) + `card-detail.tsx` + i18n ×3 · **in-place ไม่เปลี่ยน library ไม่แตะ honesty model** · verify: tsc 0 · lint 0 err · test **45** (เดิม 40 + niceTicks 5) · hydration log สะอาด · CDP screenshot ผ่าน desktop/hover/compare/mobile

1. **nice-number Y-axis** — `export function niceTicks(lo,hi,count=5)` (pure, tested) แทน `gridVals=[0,.33,.66,1]` เดิม → แกนเป็นเลขกลม **150/200/250/300฿** (เดิม 56K/134K/209K/285K สุ่มๆ) · ทำงานทั้งโหมด ฿ และ indexed-% (+0/+50/+100%) เพราะ feed `min/max` ที่ rebase แล้ว · **ตัด unit 2.5 ออก ใช้แค่ 1/2/5** (กัน compactDisplayValue ปัด 2.5K→"3K")
2. **grid ชัด** — ย้าย gridline ไปวาด **หลัง area fill** (ไม่โดนกลบ) + `--muted-foreground` opacity 0.22 (token `--border` มี alpha 0.12 ในตัว คูณ strokeOpacity แล้วจางหาย) → ลากสายตาเทียบระดับได้
3. **hover-to-inspect** — `onPointerMove`: `event.pointerType !== "touch"` → mouse/pen ขึ้น crosshair+tooltip ตอน hover เฉยๆ (เดิมต้องกดค้าง buttons===1) · touch ยัง press-drag เหมือนเดิม (vertical swipe ยัง scroll หน้าได้)
4. **caption พลิกเป็น touch-only** — `flex sm:hidden` (เดิม `hidden sm:flex` = โชว์ desktop ที่ไม่ต้องบอกแล้ว) · reword `dragChartHint` ×3 ภาษา
5. **last-price tag** — pill สีเส้น + ราคาล่าสุด ติดแกนขวาที่จุดล่าสุด · gate `!indexed` (โหมด % เป็น +0% ไม่มีความหมาย เลยไม่โชว์)
6. **font constants** — `AXIS_FONT/TOOLTIP_FONT/TOOLTIP_LABEL_FONT` แทน magic number กระจาย

## ⚠️ decisions session นี้
- **baseline ไม่เริ่มที่ 0** (price chart มาตรฐานไม่เริ่ม 0 — `yMin=min-span*8%` เดิม ถูกแล้ว เก็บไว้)
- **out of scope (เลื่อน):** x-axis calendar-snap ticks · tooltip enrich (delta คอลัมน์) · compare discoverability redesign · loading skeleton · a11y (keyboard scrub) — แยก task

## ▶ NEXT — งาน gate (รอ pipeline data จริง · เหมือนเดิม)
- **เทียบแหล่ง (compare sources):** per-source time series ไม่มีจริง (mock) · ทำเมื่อ comps pipeline พร้อม
- **est → ข้อมูลจริง:** PSA 9/8/BGS + graded delta30d ยัง modeled (กราฟ cross 2 เส้นซ้อนกันเพราะ delta เท่ากัน = artifact ของ mock) · swap เมื่อมี Grade enum + Comp tables (PLAN:37)
- **build:** ยังไม่รัน `npm run build` (gotcha: ห้าม build ระหว่าง dev) — tsc/lint/test เขียวครบ · ถ้าจะ build ต้อง stop dev ก่อน

## ⚠️ decisions เดิม (เบส confirm — ยังใช้อยู่)
1. **Raw = เกรดเดียว** (domain ไม่มี A/B/C — Yuyutei ตั้ง ungraded ราคาเดียว) · `listingMatchesGrade` เช็ค `startsWith("raw")`
2. raw markets = Yuyutei (ไม่เอา SNKRDUNK noisy) · graded = SNKRDUNK
3. **ad = คอลัมน์ขวาตรงกราฟ** (`AdSlot placement="card-detail-chart-side"` · ยุบเองเมื่อ PRO) + page-tail `card-detail-mid` · ขัด VISION §4.6 แต่เบสเลือก credibility trade-off
4. honesty: EstMark รายค่า · ไม่ปลอม sold · cross line = anchor จริง (solid/dashed ตาม isEst) เท่านั้น · จุด chart ยัง float (ไม่ปัดเป็น tick)

## ⚠️ gotchas
1. **dev server หาตัวที่รันอยู่ก่อน** — session นี้เจอ dev ของโปรเจคนี้รันที่ **port 3000** (ไม่ใช่ Anajak ตามที่เคยจด) · Next 16 ล็อก dir เดียวห้าม dev ซ้ำ → ถ้าจะเปิด 3005 ต้อง kill ตัวเก่าก่อน (`taskkill /F /PID <pid>`)
2. Turbopack SSR cache ค้างหลัง edit เยอะๆ → 500 "Failed to generate static paths / Jest worker exceptions" = state เน่า · แก้: kill + `next dev -p 3005` ใหม่ (สด → 200)
3. **screenshot อัตโนมัติ:** `D:\tmp\shoot.mjs` (CDP ผ่าน Chrome headless + node24 global WebSocket) · output `D:\tmp\shots\*.png` · ⚠️ Write tool เขียน `/tmp/x` ลง **`D:\tmp\x`** แต่ node มอง `/tmp`→`C:\Users\...\AppData\Local\Temp` → ใช้ path เต็ม `D:/tmp/...` เสมอ · script ถ่าย desktop default/hover/compare + mobile (scroll หากราฟก่อน + คลิก pill "vsPSA10")
4. chart cold-compile ช้าหลัง restart → script warm 3× ก่อนถ่าย
5. `/cards/OP13-118` = SP (raw 311฿ · PSA 10 69,231฿) = หน้าใช้เทสกราฟ
6. Meecard = prototype — mock/ข้อมูลค้างปล่อยได้
