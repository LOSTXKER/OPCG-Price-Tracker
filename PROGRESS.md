# 📍 PROGRESS — สถานะสด
> **เขียนทับทุกครั้ง ไม่สะสม log** · hook โหลดไฟล์นี้ทุก session · อ่านอันนี้ก่อน แล้วทำต่อจาก NEXT

อัปเดตล่าสุด: 2026-06-21 — **review + harden Cursor card-detail redesign** — เก็บโค้ดตาย · badge "ตัวอย่าง" (honesty) · a11y · ย่อ segment filter ~30% · tsc 0 · lint 0 · test 45 · build ✓

## ✅ เสร็จ session นี้ (3i) — review + harden การ redesign card-detail จาก Cursor (4-lens review workflow + adversarial verify → 20 verified · ยืนยันด้วย Chrome headless screenshot)
เบส: "ไปแก้ UI จาก cursor มา ช่วยตรวจสอบ หน้ารายละเอียดการ์ด" → review → เก็บกวาด → honesty → ย่อ filter · **ทั้งหมดยัง working tree → commit ขึ้น branch ใหม่**
**Cursor ทำมา (uncommitted ตอนเริ่ม):** แตก market-feed primitives ใหม่ 3 ไฟล์ (`market-feed-shared` = SEGMENT tokens/ConditionFilter/Chip/PriceCell · `market-feed-scroll` = viewport+fade+hint · `market-table-layout` = layout consts) · ฟีด `RecentSales` (ประวัติซื้อขายหลายแหล่ง) + `MeecardAsksRail` ใช้ dialect เดียวกัน · ถอด `MarketsTable` ออกจากหน้า
- **review (4 มุมขนาน → verify เชิงปฏิปักษ์ทุก finding):** correctness/hydration · honesty doctrine · UI conventions · dead code → 21 candidate · ยืนยัน 20 · ตีตก 1 (key index remount — premise จริงแต่ impact ไม่ reproduce)
- **เก็บโค้ดตาย:** ลบไฟล์ `markets-table.tsx` (Cursor ถอด render แล้วแต่ยัง refactor +149/-100 ค้าง = orphaned) · **revert** การแต่งสไตล์ `tier-meta` (เปล่าประโยชน์ · เก็บไฟล์ไว้ re-add ภายหลัง) · ลบ `SEGMENT` alias (เกิดมาก็ @deprecated) · `MARKET_FEED_VISIBLE_ROWS` · `marketSort` แช่แข็ง+branch `=== "fresh"` ที่เข้าไม่ถึง · **i18n 22 key ตาย ×3 ภาษา** (เคลียร์ orphan สะสมจาก 3b-3h หมด: stat24h/7d/30d · allSources · sortBy/sortByPrice/sortByFresh · updatedCol · soldLegend/askLegend · barPeriod7d/1m/1y/All · lowHighPeriod · medianSources · referenceSources · asksTab/soldTab · noLatestListings · notEnoughDataYet · marketEvidenceDesc) — grep ยืนยัน dead ก่อนลบทุกตัว · **i18n parity 1608 key เท่ากันทั้ง en/jp/th**
- **honesty (เบส ซีเรียส):** ฟีด Recent sales + ขายบน Meecard เป็น mock ทั้งคู่แต่**ไม่ติดป้าย** (คอมเมนต์ในโค้ดเขียนเองว่า "badged ตัวอย่าง" แต่ไม่ได้ render จริง) → สร้าง `SampleBadge` กลาง ติดหัวข้อทั้ง 2 ฟีดเมื่อ `isSample` + ซ่อน count ปลอม ("18 items") · ส่ง `isSample` จาก card-detail (RecentSales = sample เสมอจนกว่ามี data จริง)
- **median link หลอก:** ลบ provenance "ค่ากลางของแหล่งอ้างอิง" (gate ด้วย realSourceCount **จริง** แต่ลิงก์ไป `#sources` ที่ตอนนี้เป็น **sample** feed) + ลบ `realSourceCount`/`Info` ที่ตายตาม
- **a11y/UX:** tab `#sources` label `referenceSources`→`saleHistoryTitle` (ตรงหัวข้อ section + ลิงก์ buy box ด้วย) · เลิก `role=tablist/tab`+`aria-selected` (หลอก SR ว่าเป็น tab widget ทั้งที่แค่ scroll) → `<nav aria-label>` + `aria-current="page"` (i18n ใหม่ `cardSectionsNav`) · `MarketFeedScroll` ใช้ `revalidateKey={shown.length}` แทน `children` ใน deps (ResizeObserver ไม่ rebuild ทุก render + re-measure hint ตอนกรอง — เดิม children identity ใหม่ทุก render) · แถบ Low/High เพิ่ม sr-only summary (เดิม `aria-hidden` ทั้งบล็อก SR อ่านราคาไม่ได้)
- **segment control (เบส: "ขนาดไม่สมมาตร" → หลายรอบ "ยังใหญ่"):** 2 ปัญหา — (1) ปุ่ม `rounded-md` ในกรอบ `rounded-full` ขอบไม่ซ้อนศูนย์ → `rounded-full` ซ้อนพอดี (เหมือน EditionToggle ที่ถูกอยู่แล้ว) (2) **ใหญ่เกินบทบาท** (min-h-8/32px + 13px + bold ≈ EditionToggle 36px ที่เป็น control หลัก) → ย่อเด็ดขาด ~30%: **`h-6 (24px)` + `text-[12px]` + weight 500** + track เบาลง · ลำดับขนาดถูก: grade chip > edition > filter/range · **บทเรียน:** งาน UI ต้อง **screenshot ดูจริง** (ต่อ Chrome headless `/Applications/Google Chrome.app` --headless=new → PIL crop/เทียบ) — ลดทีละ 4px จากโค้ดตาไม่เห็น เสียหลายรอบ
- verify: tsc 0 · lint 0 err (84 warning เดิม unrelated) · test 45 · build ✓ · Chrome headless screenshot ยืนยันทุก control + badge "ตัวอย่าง" + ขนาด before/after
- ⏭️ **NEXT:** ฟีด Recent sales + ขายบน Meecard ยังเป็น **mock** (ติดป้าย "ตัวอย่าง" แล้ว) — พอ pipeline data จริงมา สลับ `mockRecentSales`/`mockMeecardListings` เป็นจริง + `isSample`→false (RecentSales รับ prop แล้ว) · median link + per-source reference table re-add ได้เมื่อมี table จริงกลับมา

## ✅ เสร็จ session นี้ (3h) — typography scale rebalance (เบส: "รู้สึกขนาดไม่สมส่วน")
- **ปัญหา:** segment รอบก่อนใหญ่เกิน (min-h-9+text-sm+invert pill) แย่ง hierarchy จาก h3/ราคา · ตารางใช้ text-body-sm (15px) ใกล้ text-price เกินไป · chip 11px ติด 15px
- **scale ใหม่:** filter/segment = `text-label min-h-8 rounded-md` + active `bg-foreground/10` (เดียวกับ edition/grade chip) · ตาราง primary = `text-label` · ราคา = `text-price` (15px mono) · condition chip = `text-label`
- **dropdown filter:** h-8 + text-label ให้คู่กับ condition segment
- verify: tsc 0

## ✅ เสร็จ session นี้ (3e) — finance key-stats + sticky tabs fix (tsc 0 · lint 0 · test 45 · screenshot desktop/mobile/scrolled×3)
เบส: "มีอะไรควรปรับอีก เนื้อหา/UI" → AskUserQuestion เลือกทำหมด #1-5
แก้ `card-detail.tsx` + i18n ×3 (`stat24h/7d/30d`)
- **#1+#4 key-stats row:** เพิ่มแถว `24ชม / 7วัน / 30วัน` ใต้ราคา (CMC/Coinbase) จาก `card.priceChange24h/7d/30d` (DB จริง) ใช้ `Delta` (guard null→"—") · ลำดับ price block: ราคา+%ช่วงกราฟ → stats row → provenance → low/high · honesty: เป็น asset/raw change (ไม่มี per-grade history)
- **#2 ซ่อน tier sample:** เอา `<CardTierMeta>` + import ออก (ข้อมูลปั้นชิ้นสุดท้าย) เก็บไฟล์ไว้ re-add เมื่อมี deck/meta จริง · right rail เหลือ specs+effect
- **#3 viewCount:** เติม `<Eye/> {viewCount}` ใน identity meta (reuse i18n `views`)
- **#5 + bug fix sticky:** session ก่อนตั้งแท็บ `md:top-14`(56) ลืมนับ ticker `h-11`(44) → desktop chrome จริง = **100px** แท็บ overlap header · แก้เป็น `sticky top-14 md:top-[6.25rem]` (mobile ใต้ mobile header 56 · desktop ใต้ ticker+header 100) frost+เส้นล่างทั้งสอง · **scrollspy เขียนใหม่:** scroll listener + rAF + วัด `navRef.getBoundingClientRect().bottom` (แม่นทุก breakpoint แทนเลขคงที่) · scroll-mt `[6.5rem] md:[9rem]` · sticky rails `lg:top-[9rem]`
- **⚠️ subtle fix:** #specs anchor เดิมอยู่บน aside ที่ sticky → rect.top ถูก pin ที่เส้น offset → scrollspy เพี้ยน (specs active ตลอด) · แก้: ย้าย sticky ไป inner div, aside `lg:self-stretch` (ให้ inner มีที่ stick) + id อยู่ aside (natural position) → scrollspy อ่านตำแหน่งจริง · verify scrolled: 820=แหล่งอ้างอิง, 1150=ขายบน Meecard active ถูกต้อง
- verify: tsc 0 · lint 0 err · test 45 · screenshot ยืนยัน stats row + viewcount + ไม่มี tier + แท็บ sticky ไม่ overlap + scrollspy ตามคอลัมน์หลัก
- **➕ follow-up (เบส: "ซ้ำซ้อนมั้ย ทำไม 7วันไม่ตรง"):** อินไลน์ % ข้างราคา (delta ตามช่วงกราฟ = modeled) ชนกับแถว stats 7วัน (DB จริง) — เช่น กราฟ 7D "▲22.4%" vs stats "7วัน ▼0.1%"
- **➕ follow-up #2 (เบส: "เอา % 3 อันออก เอาไปต่อท้ายราคาเหมือนเดิม"):** ลบแถว stats 24ชม/7วัน/30วัน ทั้งหมด · คืนอินไลน์ % ข้างราคา (โชว์ตอนนิ่งตามเดิม `shownDelta != null`) = % ชุดเดียวตามช่วงกราฟ · viewCount (#3) ยังอยู่ · tsc 0 · lint 0 · screenshot ยืนยัน "311฿ ▲94.3% ใน 1เดือน" + ไม่มีแถว stats · ⚠️ orphan i18n เพิ่ม: `stat24h/7d/30d` (zero-risk)
- **➕ follow-up #3 (เบส: "ส่วนล่างก็ดูยากอยู่" → AskUserQuestion = hierarchy + density):** แก้ markets-table + section heads
  - **hierarchy:** ราคา ask เดิม `text-muted-foreground` (จาง) → `text-foreground font-semibold` — การ์ด Raw มีราคาเดียว เลขหลักเลยจางอ่านยาก · sold ยังมีจุด settled + font-semibold (แยกด้วยจุด+หัวคอลัมน์ ไม่พึ่งสี) · section title `text-h4`→`text-h3` (SectionHead + markets + asks-rail) ให้หัวข้อเด่นกว่าเนื้อหา (mb-3→mb-4)
  - **density:** ตัด native ¥/$ บรรทัดสอง (secondary) ในทุก cell (desktop+mobile) → ราคาบรรทัดเดียว · ลบ legend block (หัวคอลัมน์+จุดสื่อแล้ว)
  - ⚠️ orphan i18n เพิ่ม: `soldLegend`/`askLegend` (zero-risk) · tsc 0 · lint 0 · screenshot ส่วนล่างยืนยัน

## ✅ เสร็จ session นี้ (3f) — "แหล่งอ้างอิง" → ฟีดประวัติการซื้อขายหลายแหล่ง (เบส: เปลี่ยนเป็นแบบคู่แข่ง SNKRDUNK แต่ดีกว่า = หลายแหล่ง · mock ไปก่อน)
แก้ `mock.ts` · `recent-sales.tsx` (rewrite) · `card-detail.tsx` · i18n ×3 · tsc 0 · lint 0 · test 45 · screenshot desktop+mobile
- **decision (AskUserQuestion):** เบสเลือก "หลายแหล่ง + mock data ไปก่อน" (prototype) — ไม่ทำ pipeline จริงตอนนี้ (เก็บ SNKRDUNK used-listings ลง DB = งานแยก ต้อง permission schema/scrape)
- **data จริงที่มี:** `SnkrdunkMapping` เก็บแค่ค่ารวม (`lastSoldPsa10Usd`/`minPriceUsd`) · scraper (`snkrdunk.ts`) ดึง `used-listings` (price/condition/isSold) ได้แต่ทิ้งลิสต์ → real feed ทำได้ภายหลัง (เหลือ persist + วันที่ขายถ้า API มี)
- **mock:** `mockRecentSales(baseJpy, nowIso, count)` ใน mock.ts — seeded ด้วย `hash()` (ไม่ใช้ Math.random/clock) · 4 แหล่ง (SNKRDUNK/Yuyutei/Mercari JP/eBay JP) · เกรดหลากหลาย (PSA10/9·BGS9.5·ARS10+·raw A/B/C/D) ราคา ×mult ตามเกรด · วันที่ derive จาก `latestUpdatedAt − whenDays` (SSR-pure)
- **component:** rewrite `recent-sales.tsx` (เดิม unused) → header h3 "ประวัติการซื้อขายล่าสุด" + badge "ตัวอย่าง" + subtitle · source filter chips (ทั้งหมด/แต่ละแหล่ง · client state) · ตาราง ≥sm (แหล่ง·วันที่·สภาพ·ราคา) + list <sm · ราคา = ¥ native ตัวหนา + "≈ ฿" (omit ถ้า currency=JPY) · วันที่ format UTC (กัน hydration drift) · Sold/Listed tag (honesty) · condition chip (graded=boxed, raw=muted)
- **wire:** แทน `<MarketsTable>` ใน `#sources` ด้วย `<RecentSales sales={saleHistory}>` · `saleHistory` memo = mockRecentSales · คง id=sources + tab/anchor · ลบ import MarketsTable (เก็บไฟล์ไว้) · `marketSort` drop setter (sort UI หายไปกับ MarketsTable · marketRows ยังใช้ buy-box latestSale + provenance)
- **i18n ×3:** `saleHistoryTitle`/`saleHistoryDesc`/`saleDate`/`priceCol`/`allSources` · reuse `sampleLabel`/`priceTypeSold`/`priceTypeListed`/`sourceCol`/`condition`
- ⚠️ honesty: ทั้งฟีด mock → badge "ตัวอย่าง" ชัด · ราคา sample เล็ก (seed จาก raw ~¥1,400 → PSA10 ~¥4,650) ไม่ใช่สเกลจริง (SP จริง PSA10 ¥300K+) — เป็น sample โครงสร้าง · comment swap real ไว้แล้ว
- ⚠️ orphan: markets-table.tsx (dead, เก็บไว้) · i18n `marketEvidenceDesc`/`soldLegend`/`askLegend`/`sortBy`/`sortByPrice`/`sortByFresh`/`asksTab`/`soldTab`/`notEnoughDataYet`/`noLatestListings`/`updatedCol` (เลิกใช้กับ MarketsTable)
- **➕ follow-up (เบส: "ราคาที่แสดงเอาตามสกุลที่ user ตั้งไว้"):** PriceCell สลับ — ตัวหลัก = `formatDisplayValue(jpyToDisplayValue(jpy, currency), currency)` (สกุล user) · ¥ native = บรรทัดรอง (ซ่อนเมื่อ currency=JPY) · tsc 0 · lint 0 · screenshot THB primary ยืนยัน (977฿/¥4,650)
- **➕ follow-up #2 (เบส: "เพิ่มสภาพ raw grade เป็น filter"):** เพิ่ม filter ชุดที่ 2 "สภาพ" (ทั้งหมด/Raw/PSA/BGS/ARS — derive จาก family ในฟีด) ควบ filter "แหล่ง" (AND) · empty state เมื่อกรองแล้วว่าง (`noLatestSales`) · chip label "สภาพ"/"แหล่ง" reuse `condition`/`sourceCol`
- **➕ follow-up #3 (เบส: "ไม่เอาราคาตั้งขาย + ส่วนที่เลื่อนตามจอ ไม่ต้องเลื่อน"):** (a) ตัด LISTED ออกจาก `mockRecentSales` (เหลือ SOLD ล้วน) + ลบ field `type` + ลบ `TypeTag` (แท็กซ้ำซ้อนเมื่อขายแล้วหมด) (b) เอา `lg:sticky` ออกจาก card-info rail (+ `lg:self-stretch`) และ side-ad → เลื่อนตามหน้าปกติ · **แท็บ section ยังคง sticky** (ไม่แตะ ตามที่เบสเคยขอ CMC feel) · tsc 0 · lint 0 · test 45 · screenshot ยืนยัน
- ⚠️ orphan i18n สะสม (zero-risk): `barPeriod*`/`lowHighPeriod`, `details`, `viewSaleHistory` · tier-meta.tsx = dead component (เก็บไว้)

## ✅ เสร็จ session นี้ (3d) — flat minimal finance redesign (tsc 0 · lint 0 · test 45 · screenshot desktop/mobile/scrolled 200)
เบส: "คลีน minimal แบบ Coinbase/TradingView/CMC · hero+กราฟคงโครง · ปรับทั้งหน้าได้" → AskUserQuestion: **flat** (ถอดกล่อง) + **keep gold** (accent เฉพาะ CTA)
แก้ `card-detail.tsx` · `markets-table.tsx` · `asks-rail.tsx` · `card-detail-related.tsx`
- **A. sticky section tabs:** `<nav>` แท็บ → `md:sticky md:top-14 z-30 md:frost md:shadow-[inset_0_-1px_0_0_p-hair]` (ใต้ global header sticky h-14) · mobile non-sticky (border-t) · scrollspy offset 80→**104** + rootMargin `-104px 0px -68%` (เคลียร์ header+tabs) · section `scroll-mt-20 md:scroll-mt-28` · sticky rail `lg:top-20→top-28` · rhythm mt-10→**mt-12**
- **B. ฝั่งซ้าย flat:** markets-table ถอด `surface-1 hairline rounded-2xl p-4` → `<div>` เปล่า, thead เอา `surface-2` ออก (โปร่ง+เส้นล่าง) · asks-rail ถอด panel + ลบ prop `embedded` (ไม่ใช้แล้ว) + ลบ `px-4` inset (flush), row hover `-mx-2 px-2 rounded-lg bg-foreground/[0.03]` · 2 ส่วนคั่นด้วย `hairline-t pt-10`
- **C. ฝั่งขวา flat rail:** card-info ถอดกล่อง → `lg:border-l lg:pl-8` (เส้นแบ่ง rail เหมือน buy box) + sticky top-28 · specs single-col + effect accent bar + tier คั่น hairline
- **D. accent sweep:** related ปุ่ม "ดูทั้งหมดในชุด" จากกล่อง surface → flat link `hairline-t` + icon ทอง→neutral · ทองเหลือเฉพาะ CTA (ดูประกาศขาย/ลงขาย/list) · ring การ์ดปัจจุบัน + effect accent bar คง subtle (ไม่เพิ่มทองใหม่)
- **E. hero+chart:** คงโครง (flat อยู่แล้ว — image card, buy box border-l, low/high bar) ไม่แตะ
- verify: tsc 0 · lint 0 err · test 45 · dev 200 · screenshot desktop(flat ครบ)+mobile(stack)+scrolled(sticky tabs ทำงาน) · "Page error {}" ใน log = artifact CDP headless emulation (fresh load สะอาด)
- ⚠️ orphan i18n สะสม (zero-risk): `barPeriod*`/`lowHighPeriod` (3c) · `details`/`viewSaleHistory` (3b)

## ✅ เสร็จ session นี้ (3c) — รื้อใต้กราฟเป็น 2-col redesign (tsc 0 · lint 0 · test 45 · screenshot desktop+mobile 200)
แก้ `card-detail.tsx` · `markets-table.tsx` · `asks-rail.tsx` · `card-detail-specs.tsx` · เพิ่มใช้ `section-head.tsx` (SectionHead ที่มีอยู่แต่ยังไม่ถูกใช้)
- **#1 รวมตัวกรองวันที่:** ลบ pill `barPeriod` แยก (state+`BAR_PERIODS`/`BarPeriod`/`BAR_PERIOD_RANGE`/`barPeriodLabel`) · `barPoints` memo ใช้ `range` ของกราฟตรงๆ → แถบ low/high กับกราฟใช้ตัวกรองเดียวกัน · i18n `barPeriod*`/`lowHighPeriod` orphan
- **#2 แถบ low/high ขนาดเดิม:** เอา pill ออกแล้วยุบ wrapper ซ้อน → กลับเต็ม `max-w-sm`
- **#3 รื้อใต้กราฟ → grid 2 คอลัมน์** (`lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start xl:_360px`):
  - **LEFT (ราคาตลาด):** `แหล่งอ้างอิง` (#sources) + `ขายบน Meecard` (#market) — แต่ละอันเป็น **panel เดียว** (`surface-1 hairline rounded-2xl`) หัวข้อ `text-h4` ชุดเดียว · MarketsTable: ถอด `<section>`+id ออก ทำเป็น panel เอง, table flush (ลบ hairline ซ้อน, thead→surface-2), empty state plain · asks-rail: เพิ่ม header (h2 sellingNow + grade meta + live/badge) รวมจาก 2 branch เหลือ header เดียว, root เป็น panel (เลิกส่ง `embedded`)
  - **RIGHT (ข้อมูลการ์ด #specs):** รวม specs+effect+tier เป็น **panel เดียว** `lg:sticky lg:top-20` (เรียงใต้ side-ad → right rail ต่อเนื่องทั้งหน้า) · SectionHead "ข้อมูลการ์ด" · specs เปลี่ยนเป็น **single-col** (ลบ `sm:grid-cols-2` ที่จะอัด 2 คอลัมน์ใน rail 320px) · effect = divider+accent bar, tier = divider (เลิก wrapper hairline ซ้อน)
  - **full width:** เวอร์ชันอื่น (SectionHead) + การ์ดอื่นในชุด (header เดิม text-h4) อยู่ใต้ grid เต็มแถว
- **scrollspy resolver fix:** เดิมเลือก "ตัวสุดท้ายใน array ที่ top≤80" → desktop #sources(ซ้าย)/#specs(ขวา) top เท่ากันเลยเลือก specs ผิด · เปลี่ยนเป็น **top มากสุดที่ ≤ offset · เสมอ→index แรก** (main column ชนะ sidebar) · tabs/anchor เดิม 4 อันคงไว้ (ลิงก์ภายใน #market/#sources ไม่พัง)
- verify: tsc 0 · lint 0 err · test 45 · dev 200 · screenshot desktop(1280) 2-col + mobile(390) stacked ยืนยัน (HMR error ระหว่างแก้เป็น state ชั่วคราว — final สะอาด)

## ✅ เสร็จ session นี้ (3b) — card detail UX polish (plan #1-5 · tsc 0 · lint 0 · test 45 · screenshot desktop+mobile 200)
แก้ `card-detail.tsx` · `card-detail-related.tsx` · `card-detail-sibling-grid.tsx` · `card-detail-specs.tsx` · `tier-meta.tsx`
- **#1 แท็บ scrollspy (bug):** เดิม active hard-code `i===0` → ขีดเส้นใต้ตัวแรกเสมอแม้เลื่อนลง · เพิ่ม `activeTab` state + `IntersectionObserver` (4 section: overview/sources/market/specs · rootMargin `-80px 0px -70%` · เลือก section ล่างสุดที่ top ผ่านใต้ header) → ขีดตามหัวข้อในจอ · click set ทันที + `aria-current`
- **#2 ส่วนล่างเข้าชุด:** related + sibling-grid tile `panel`/`bg-muted` → `surface-1 hairline rounded-lg` + `ease-chrome` + `group-hover:ring-2 ring-primary/40` (เหมือน hero) · เลิก `hover:shadow-md active:scale-[0.99]` ยุคเก่า · ปุ่ม "ดูทั้งหมดในชุด" → surface-1 hairline เรียบ · set-code chip → surface-2
- **#3 double-header:** ลบ sub-label "รายละเอียด" ใน specs (h2 "ข้อมูลการ์ด" ข้างนอกคุมแล้ว) + ลบ wrapper `hairline-t pt-4` (row borders เป็น divider แทน) · i18n `details` orphan
- **#4 ลดน้ำหนัก section รอง:** ข้อมูลการ์ด/เวอร์ชันอื่น/การ์ดอื่นในชุด `text-h3`→`text-h4` (price story เด่นกว่า) · related เลิก wrapper `mt-6 border-t border-border/40 pt-8` → ให้ outer `mt-10` คุมระยะชุดเดียว
- **#5 polish:** (a) low/high period native `<select>` → segmented pill (สไตล์เดียวกับ chart RANGES · `role=group`) (b) buy-box "ขายล่าสุด" เดิม list ทุกแหล่ง = ซ้ำกับคอลัมน์ "ขายไปแล้ว" ในตาราง → เหลือ **headline แถวเดียว (สดสุด)** ทั้งแถวเป็นลิงก์ `#sources` · `latestSale` = reduce updatedAt max (render-pure) · i18n `viewSaleHistory` orphan (c) tier "sample" badge `/40` จางอ่านไม่ออก → pill `surface-2 ring` อ่านออกแต่ยัง subordinate
- verify: tsc 0 · lint 0 err (warnings เดิม unrelated) · test 45 · dev 200 · screenshot desktop(1280) + mobile(390) ยืนยันเข้าชุด/ไม่พัง

## ✅ เสร็จ session นี้ (3a) — "แหล่งอ้างอิง" (MarketsTable) world-class redesign (design workflow → markets-pro + review workflow → 12 verified fix)
เขียนใหม่ `card-detail/markets-table.tsx` + i18n ×3 (`sortBy`) · tsc 0 · lint 0 · test 45 · screenshot ครบทุก tier × dark/light × desktop/mobile (CDP script `/tmp/shoot.mjs`)
- **ปัญหาเดิม:** prod จริง raw เหลือ Yuyutei แหล่งเดียว → ตาราง 4 คอลัมน์ 1 แถว "340฿" ลอยกลางช่องว่าง = ดูเหมือน spreadsheet เปล่า ไม่โปร · เคส 1 แหล่งคือเคสหลักที่ต้องสวยสุด
- **design workflow (9 agents):** research markets/TCG/table-UX จริง (CoinGecko/CMC/TCGplayer/PriceCharting) → audit token → judge panel 3 ทิศ (clarity/markets-pro/adaptive) → ผู้ชนะ **markets-pro 89** + graft (zero-new-key + Tier-C fallback + self-contained row) → blueprint
- **โครง: 1 tier branch ตาม rows.length** → 0 empty · 1 **Tier A quote card** (surface-2 · desktop=quote row [identity left + ask/sold grouped right] · mobile=masthead+divider+spread) · 2–3 **Tier B rich rows** · ≥4 **Tier C table+sort** · mobile(<sm)=stacked cards · helper `SourceIdentity`/`Freshness`/`StatPair(spread|grouped)` กัน drift ข้าม tier
- **honesty:** ask≠sold = 5 cue (ขนาด+น้ำหนัก+ตำแหน่ง+ป้าย+settled-dot — ไม่พึ่งสี) · sold=headline foreground, ask=muted · stale >7วัน (`STALE_AFTER_DAYS` + `daysSince` lint-safe, หลัง `hydrated` guard) = amber `.status-warn` pill + Clock · 0 fabrication · `referenceBadge` chip humble · **`visibleRows` filter** กัน phantom source (ask+sold null ทั้งคู่ = ขัด marketEvidenceDesc)
- **review workflow (18 agents → 12 verified → ติด 9 ปฏิเสธ 3):** #1 `<h2>`+aria-labelledby (a11y heading) · #2 visibleRows · #4 settled-dot ในตาราง · #5 `scope=col` · #6 sort `role=group`+`sortBy` key · #7 no-sale→`—` (กัน wrap/ragged) · #8 ลบ `font-medium` ซ้อน eyebrow · #10/11 ยกคอนทราสต์ secondary `/60`→muted
  - **ปฏิเสธ:** #9 (เปลี่ยน stale pill→text จะ**ย้อน decision 2f** ที่เบส fix contrast light mode มาแล้ว) · #12 (empty surface-1 เบากว่า Tier A = subordinate by design) · #3 residual Tier B align (rich-rows ตั้งใจ · #7 ช่วยแล้ว)
- **0 i18n key ใหม่** ยกเว้น `sortBy` (a11y group label · th/en/jp index ตรงกัน)
- gate รอ data จริง: Tier B/C (2+ แหล่ง) ทดสอบผ่าน scratch page ชั่วคราว (ลบแล้ว) · prod ปกติ = แหล่งเดียว

### ➕ follow-up (เบส รอบใหญ่): "card ดูยาก เอาตารางแบบเดิม + รื้อส่วนล่างตั้งแต่กราฟลงไปให้เข้าชุด ไม่รก มีโฟกัส"
- **pivot: ทิ้ง tier-card → ตารางเดียว** (`markets-table.tsx` เขียนใหม่อีกรอบ) — desktop ตาราง 4 คอลัมน์ (แหล่ง·ประกาศขาย·ขายไปแล้ว·อัปเดต) · mobile list 2-col · ทุกจำนวนแหล่ง · เก็บ honesty (sold=foreground+settled-dot, ask=muted), stale amber, `scope=col`, `visibleRows` filter, `<h2>` heading · ลบ helper `SourceIdentity`/`StatPair`, chip "อ้างอิง"
- **header เป็นชุดเดียว:** แหล่งอ้างอิง/ขายอยู่บน Meecard/ข้อมูลการ์ด = `<h2 text-h3>` เหมือนกันหมด · แหล่งอ้างอิง = title + เมตาบรรทัดเดียว ("{grade} · แสดงเฉพาะ...")
- **ตัด sub-header ซ้ำ:** `asks-rail.tsx` เดิม render "ขายอยู่บน MEECARD · Raw" ซ้ำกับ `<h2>` ด้านนอก → เหลือแค่ grade ("RAW")
- verify: tsc 0 · lint 0 · test 45 · screenshot ส่วนล่าง (sources+market+specs) ส่งเบสแล้ว
- ⏭️ **NEXT (รอเบส):** ยืนยันทิศ + ลึกขึ้นเรื่อง "จุดโฟกัส" ส่วนล่าง (เช่น ลด weight section รอง specs/versions, ข้อมูลการ์ด+"รายละเอียด" ยัง double-header เล็กน้อย)

## ก่อนหน้า — hero + chart sessions (เก็บประวัติไว้ด้านล่าง)

## ✅ เสร็จ session นี้ (2f) — hero delta+provenance polish (3-lens critique workflow → 7 fix ติดทั้งหมด)
แก้ `card-detail.tsx` (บรรทัด ~625-672) + `i18n/th.ts` · tsc 0 · lint 0 err · test 45 · screenshot desktop+mobile + computed-style ยืนยัน
- **scope:** เบสชี้ภาพ hero ถาม "ปรับให้ดูง่าย · อย่ายุ่งราคาตัวใหญ่ + แถบ low/high" → เหลือ 2 บรรทัด: delta (`▲ +185฿ · 146.7% ใน 1 เดือน`) + provenance (`ราคาตั้งขาย · Yuyu-tei · JP·Raw · 2 เดือนที่แล้ว`)
- **#1 stale → ป้ายสีส้ม (.status-warn pill):** เดิม `2 เดือนที่แล้ว` เป็นแค่ตัวหนังสือ `var(--warning)` → **light mode contrast ~1.9:1 เกือบหาย** · เปลี่ยนเป็น pill (text+`--warning-soft` bg) เด่นทั้ง 2 โหมด · computed: `rgb(255,159,10)` บน bg 16% ✓ — **โบนัส:** ทำให้ "ข้อมูลเก่า 2 เดือน" เด่น = แก้ความงง "delta 1 เดือน แต่ข้อมูล 2 เดือน" ไปในตัว
  - **⚠️ ย้อน decision 2b:** 2b เคยลด chip→text เพราะ "filled chip เด่นไป" · 2f เอา pill กลับด้วย**เหตุผลใหม่ (contrast light mode)** + tint อ่อน 12/16% (ไม่ solid) → dark mode ดูไม่ loud (screenshot ยืนยัน) · เบส approve รอบนี้ ("ทั้งหมด #1-7") แต่**ถ้ายังรู้สึกเด่นไป revert เป็น text ได้ บรรทัดเดียว**
- **#2 จุดคั่น `·`:** เดิมจุดคั่นกลุ่มใหญ่ /40 จางกว่าจุดเล็กใน "JP·Raw" (กลับหัว) → bump /40→/55 (×3) + parent `gap-x-1.5→2.5` → แยก 4 ก้อนชัด
- **#3 window word un-mute:** `ใน 1 เดือน` เดิม `.text-meta /70` (mute ซ้อน 2 ชั้น) → เหลือ `.text-meta` เปล่า
- **#4 JP·Raw weight:** เดิม mute แบนกว่าชื่อร้าน → `font-medium text-foreground/70` (ทั้ง est + non-est branch)
- **#5 i18n:** `median ของแหล่งอ้างอิง` → `ค่ากลางของแหล่งอ้างอิง` (เลิกคำอังกฤษโดดในประโยคไทย · โผล่เมื่อ ≥2 source)
- **#6 mobile nowrap:** source span + (dot+freshness) group เป็น `whitespace-nowrap` → ไม่แตกกลางกลุ่มบน 390px
- **#7 rhythm:** price→delta `mt-1→mt-1.5` (6/6 สม่ำเสมอ)
- **review:** workflow 3 critic lens (hierarchy/clarity/visual) + synth ตรวจซ้ำ — ตัด finding ผิด ("isStale ไม่ firing" = FALSE, traced page.tsx:92→178, มันทำงาน · ปัญหาคือ contrast ไม่ใช่ logic)
- **➕ follow-up (เบส สั่งต่อ):** provenance อ่านเป็น "data เปล่า" → ขอเป็น**คำ** · (1) **เอา `JP · Raw` ออก** (ซ้ำกับ grade chips + chart header) → ลบ `editionLabel` ด้วย (ไม่ถูกใช้แล้ว) (2) source เติม `อ้างอิง` (reuse i18n `referenceBadge` = อ้างอิง/reference/参照) (3) freshness เติม `อัปเดต` (reuse `updatedAgo` template = "อัปเดต {ago}"/"Updated {ago}"/"{ago}更新" · `.replace("{ago}",…)` ตาม pattern เดิม) → ป้ายสีส้ม = "อัปเดต 2 เดือนที่แล้ว"
  - **refactor:** provenance เปลี่ยนเป็น `provenanceParts: ReactNode[]` + `.map` interleave จุดคั่น → **จุดไม่ orphan** เวลา part หาย · #4 เดิม (JP·Raw weight) = moot แล้ว
- **➕ follow-up #2 (เบส สั่งต่อ — รอบ 2):**
  - **delta ย้ายไปต่อราคาใหญ่ + เอาแต่ %:** price line เดียว `311฿ ▲ 146.7% ใน 1 เดือน` (flex items-end · delta+window ที่ baseline) · ตัด abs `+185฿` ออก (ลบ prop `abs/absFirst` ที่ call + ลบ memo `shownAbs`) · เก็บ window word ไว้ (ไม่งั้น % ไร้กรอบเวลา) — Delta component ไม่แตะ
  - **เอา freshness "อัปเดต X" ออกทั้งหมด (เบส: ไม่บอก user):** ลบ fresh push ออกจาก provenanceParts · **dead-code cleanup:** ลบ `updatedLabel`/`isStale`/func `relativeDaysLabel` + เลิก destructure `daysSinceUpdate` (prop ยังอยู่ใน interface + page ยังส่ง → re-add push บล็อกเดียวพอ) · `<p>` provenance gate `length>0` (est ไม่มี source = ซ่อนทั้งบรรทัด)
  - ⚠️ **honesty trade-off:** ตอนนี้ user มองไม่เห็นว่าราคาเก่าแค่ไหน · เหตุผลเบส = mock ค้าง 2 เดือนดูแย่ · **พอ scrape รายวันจริง ควรเปิด "อัปเดตวันนี้" กลับ** (เป็น trust signal) — comment ในโค้ดบอกวิธี re-add ไว้แล้ว
  - verify รอบนี้: tsc 0 · lint 0 (card-detail) · test 45 · screenshot desktop+mobile ✓
- **➕ follow-up #3 (เบส: badge ราคาตั้งขาย/ขายล่าสุด ไม่เท่ากัน):**
  - **bug:** ask pill มี `border` แต่ sold pill ไม่มี (เป็น bg fill เฉยๆ) → วัดได้ ask h=**24.2px** vs sold h=**17.2px** (ต่าง 7px! border 2px + box คำนวณไม่นิ่งเพราะ span ไม่ได้ inline-flex)
  - **fix รอบ 1 (height เท่า แต่ยังคนละสไตล์):** ทั้ง 2 มี border 1px เท่ากัน · ask outline / sold fill → ask=19.0 sold=19.2 · **เบส: "ก็ยังไม่เท่า"** (สไตล์ outline vs fill ต่างกัน ดูคนละแบบ)
  - **fix รอบ 2 (เบส: "ใช้แบบเดียวกัน แค่เปลี่ยนสี"):** เอา outline ออก ทำพื้นอ่อนทั้งคู่ — **แต่ยังเผลอใช้คนละสูตร** (ask `bg-foreground/[0.08]`=8% + ตัว muted · sold เขียว 14% + เขียว) → ความเข้มต่างกัน · **เบส: "ก็ยังไม่เหมือน เขียนใหม่"** (ส่ง crop ซูมมา)
  - **fix รอบ 3 (เขียนใหม่ · สูตรเดียว):** `const kindColor = heroIsSold ? "var(--price-up)" : "var(--muted-foreground)"` → span เดียว class เป๊ะเดียวกัน (`inline-flex items-center rounded-full px-2 py-0.5 text-micro font-semibold leading-none`) + `style={{ background: color-mix(${kindColor} 16%), color: kindColor }}` · **ต่างแค่ค่า hue ตัวเดียว** ทุกอย่างอื่น identical · วัด ask=sold=**17.2px · pad 2px 8px · radius full · bg 16%** เป๊ะ · crop ซูมยืนยันเป็น component เดียวกัน ต่างแค่สี (เทา/เขียว)
  - verify: tsc 0 · lint 0 · test 45 · badge-probe วัด+crop 2 สถานะ

## ✅ เสร็จ session นี้ (2k) — รื้อกราฟสู่ world-class: right-axis + fluid + finish (เบส: "รื้อให้เหมือนเว็บโลก" + 3 ภาพ Google/CoinGecko/CMC → research workflow 60+ แหล่ง → "Core+refactor")
แก้ `card-chart.tsx` · tsc 0 · lint 0 · test 45 · screenshot rest/hover/graded/mobile ยืนยัน
- **verdict:** กราฟเป็น world-class ~80% แล้ว · ช่องว่างจริง = **แกน Y อยู่ซ้าย** (ทั้ง 3 เว็บอยู่ขวา) → targeted rebuild ไม่ใช่เขียนใหม่
- **#1 แกน Y + pill ราคา → ขวา** (⚠️ ย้อน 2d ที่ย้ายไปซ้าย) — `padRight` = wide gutter (sized maxYChars+pill) · `padLeft`=14 slim · y-label `x=width-padRight+8 textAnchor=start` · pill `translate(width-padRight+4)` · เหตุผล: จุดล่าสุดอยู่ขวา ตาอ่าน "now" ทันที (Google/CoinGecko/CMC)
- **#2 fluid width (refactor · ⚠️ ย้อน fixed viewBox 1000×320):** `useRef`+`useState`+`ResizeObserver` วัด px จริง → viewBox=`0 0 ${size.w} ${size.h}` 1:1 · ฟอนต์ลดเป็น px จริง (TAG13/Y12/X12) เลิก hack 15-19u · x-tick group เดียว `maxXTicks=clamp(plotW/92,3..8)` แทน 2 CSS-toggled group · default 720×280 กัน SSR · hooks อยู่เหนือ early-return
- **#3 dotted gridlines 2 แกน:** horizontal `dasharray "1 5"` α0.14 · vertical ที่ x-ticks α0.08 (graph-paper)
- **#4 crosshair เส้นประ** (`dasharray "4 6"` α0.45 · คง fade) + **date-pill ติดแกนล่าง** (`dpX` clamp · แยก WHEN=แกน/WHAT=เส้น แบบ Google/CoinGecko)
- **ตัดทิ้ง (honesty · research ฟันธง):** volume (ไม่มี data=ปั้นสภาพคล่อง) · candlestick/TradingView (ไม่มี OHLC) · 1H/1D (ไม่มี intraday) · faded-future (ไม่พยากรณ์) · per-segment สี (choppy บน data บาง) · **brush navigator** (data ~2y+mock จะว่างเปล่า · ~200 บรรทัดคุ้มน้อย)
- **gate รอ data จริง/ทีหลัง:** Log scale (1Y/All) · event marker prop (วันออกชุดการ์ด) · glow ตอน scrub · stipple area
- research workflow: 4 lens web search จริง (Robinhood/Google/CoinGecko/CMC/Highcharts/d3 docs · 60+ URL) → blueprint
- **🐛 fix (เบส จับได้): % ไม่ตามช่วงที่เลือก** — เดิม hero % ตอนนิ่ง = `datum.delta30d` **ตายตัวทุก range** แต่ป้ายเปลี่ยนตาม range → เลือก 7D/1Y แต่ % ยัง 30d = ขัดกัน
  - **fix:** (1) `shownDelta` derive จาก **เส้นที่แสดงเสมอ** `(activeValue−open)/open` (open=primaryPoints[0]=ต้นช่วง) → ตามช่วง + ตรงกับเส้น (2) `rangeDeltaPct = delta30d × √(windowDays/30)` ป้อน mock + `chartUp` → เส้นไต่ตามช่วง · สี/ลูกศร/% agree กัน (3) เลิก fallback delta30d
  - ผล: 7D ▲14.5% · 1M ▲94.3% · 1Y ▲483.4% (monotonic damped · ตรงป้าย "ใน X") · ⚠️ 1M=real 30d · 7D/3M/1Y/All MODELED (รอ per-range history จริง)
- **🐛 fix (เบส · 3 ข้อ จากภาพ Google):**
  - (1) **% บอกช่วงวันที่:** ตอน scrub hero `shownDate` = `${dateAt(0)} – ${dateAt(active)}` (ต้นช่วง→จุดที่ชี้) แทนวันเดียว → "▲ 6.7% 29 มี.ค.–1 เม.ย." ชัดว่า % ครอบช่วงไหน · at rest = windowLabel เหมือนเดิม
  - (2) **🐛 7D จุดลากไม่ตรงแกน x:** `scrubAt` ใช้ `rect.width` เต็ม (ไม่หัก gutter) → index เพี้ยน (หนักขึ้นเพราะแกนขวากว้าง) · fix: map cursor→plot `((clientX-left)/rect.width*width - padLeft)/plotW` → จุด/crosshair/date-pill ตรงแกน x ทุก range
  - (3) แสดงจุดที่ชี้: crosshair + date-pill (มีอยู่) ตอนนี้ตรงตำแหน่งแล้ว (จาก fix #2)
- **💅 fix (เบส: pill ราคา "ไม่สวย"):** เดิม pill `▲ 269K ฿` รก (ลูกศร+อ้วน+จุดติด) → **เอาลูกศรออก** (hero มี ▲% อยู่แล้ว · a11y ผ่าน aria-label/hero) · กระชับ (tagW ไม่เผื่อ glyph · h20→18 · rx6) · เว้นช่องจากจุด (+7 · padRight floor tagW+10) · จุดปลายเส้นเล็กลง (r5→4 · stroke3→2) · ลบตัวแปร `up` (ไม่ใช้แล้ว) → เหลือ "311 ฿" สะอาดแบบ CoinGecko/CMC
- **➕ scrub focus (เบส: "กราฟควรจางข้างขวาตอนชี้" · Google Finance):** split เส้น+area ที่ cursor — `pathRange(a,b)`/`areaRange(a,b)` (slice ตาม original index) · ซ้าย(0→splitIdx)=สว่าง · ขวา(splitIdx→last)=`opacity 0.3` (เส้น) / `0.25` (area) · `hasDim` gate (rest=ไม่จาง) · honest: จาง real points ที่มีอยู่ ไม่ใช่ปั้นอนาคต
- **🐛 fix (เบส): tooltip ตอน hover มองไม่ชัด + ไม่อยากได้ %** — tooltip+date-pill ใช้ `--p-s2` (โปร่ง 6%) เลยกลืนพื้นมืด · เปลี่ยนเป็น **`--popover` ทึบ (#1F1812) + drop-shadow filter (hover-only ไม่กระทบ scroll perf)** → เด่นชัด · **ลบแถว "% จากต้นช่วง" ออกจาก tooltip** (เหลือ วันที่ + ราคา) · hero % ด้านบนยังโชว์ตามเดิม · orphan i18n `fromWindowOpen`

## ✅ เสร็จ session นี้ (2j) — ยกกราฟสู่ world-class: table-stakes + polish (เบส: "กราฟไม่ถึงมาตรฐานโลก" → audit workflow 4 lens → เลือก "มาตรฐาน+polish")
แก้ `card-chart.tsx` + `card-detail.tsx` + `mock.ts` + `globals.css` + i18n ×3 · tsc 0 · lint 0 · test 45 · screenshot rest/hover/mobile ยืนยัน
- **audit verdict:** กราฟดีอยู่แล้ว (snap จุดจริง/hit area/gutter/x-tick ปฏิทิน = world-class) · 2 ช่องว่างใหญ่ = **honesty (mock ละเอียดเกินจริง) + a11y (pointer-only)**
- **#1 a11y:** svg `tabIndex=0` + focus ring + `onKeyDown` (←→/Home/End/Esc · reuse activeIndex เดิม) + `onFocus`→scrub latest + aria-label เป็นประโยค (open→last·low·high) + sr-only `aria-live` ใน card-detail (โชว์ค่า scrub)
- **#2 mock→รายวัน:** `RANGE_POINTS` 7D 28→**8** · 1M 60→**31** (เลิก imply sub-daily · INTRADAY_ENABLED=false) · 3M/1Y/All ≤ รายวันอยู่แล้ว
- **#3 baseline ต้นช่วง:** เส้นประจางที่ `y(open)` → ทำให้สีเขียว/แดง "ขึ้น/ลงจากตรงไหน" มีความหมาย
- **#4 ▲/▼ บน pill:** ขึ้น/ลงไม่พึ่งสีอย่างเดียว (a11y/greyscale) · `up = last>=open` · tagW เผื่อ +2 char
- **#5 single/flat states:** รับ series 1 จุด → single-dot state (i18n `singlePricePoint`) แยกจาก "ไม่มีข้อมูล" · gridline label dedup (กัน flat โชว์ "200฿/200฿") · ⚠️ ยัง trigger ไม่ได้บน mock (จุดเยอะเสมอ)
- **#6 สีแดง dark:** `--price-down` #FF7A6B(salmon ซีด)→**#FF6155**(coral เข้ม) · ⚠️ **token กลาง — กระทบ down-indicator ทั้งแอปใน dark mode** (delta ทุกที่) ไม่ใช่แค่กราฟ
- **polish:** crosshair เส้น**ทึบ**+fade (`ease-chrome`) + tooltip flip บน/ล่าง · ซ่อนจุด resting ตอน scrub · **% ใน tooltip** (จากต้นช่วง · i18n `fromWindowOpen`) · range-switch fade (`key + .rise` · reduced-motion safe) · loading **Skeleton** แทน blank
- **⏭️ ข้าม:** error state (ไม่มี client fetch/error path · render จาก server · synth ว่า defensible) · delight (glow/depth/haptic/pill-notch — เบสเลือกแค่ "มาตรฐาน+polish")
- **gate รอ data จริง:** plot vertex จุดจริง · hi/lo markers บนเส้น (mock = มาร์คจุดปลอม)

## ✅ เสร็จ session นี้ (2i) — x-axis ถี่ขึ้น + ปี + polish กราฟ (เบส: "แกน x ไม่ถี่" → chart-review workflow → ทั้งหมด 7 ข้อ)
แก้ `card-detail/card-chart.tsx` · tsc 0 · lint 0 · test 45 · screenshot 1M/1Y/All + mobile ยืนยัน
- **บั๊กเดิม:** x-tick hard-code `[0,⅓,⅔,1]` = 4 จุดตายตัวทุกช่วง · ลงวันสุ่ม · ไม่มีปี (1Y/All กำกวม)
- **#1+2 x-tick calendar-snap + mobile guard:** helper `xAxisTicks(refMs,range,lang)` (pure/SSR-safe · เดินปฏิทินจาก refMs) — 7D รายวัน · 1M รายสัปดาห์ · 3M ต้นเดือน · 1Y รายสองเดือน · All รายไตรมาส · force-include latest · de-dupe · `thinTicks(,8)` desktop / `(,4)` mobile · render 2 `<g>` (`hidden sm:block` ถี่ / `sm:hidden` capped) → ไม่มี JS width ก็กันชนได้ · ผล 1M=5, 1Y=7, All=8 ป้าย
- **#3 ปีบนช่วงยาว:** `isLongRange` → axis `{month,year:2-digit}` (drop day), tooltip/`dateAtIndex` `{day,month,year}` · เห็นรอยต่อปี 68→69
- **#4 ซ่อนเลขแกน Y ที่ชน tag:** hoist `lastVal`/`tagY` · `hideLabel = !indexed && |gy−tagY|<20` (data-space · กันชนทั้ง 2 โหมด) → แก้ "269K ทับ 250K"
- **#5 font แยกบทบาท:** `AXIS_FONT 18` เดียว → `TAG_FONT 18 bold` / `Y_AXIS_FONT 17` / `X_AXIS_FONT 15` / `X_AXIS_FONT_MOBILE 19` · padLeft คิดจาก y-label + tag pill แยก
- **#6 ป้าย x หายใจ:** `padBottom 28→34` · เลิก double-mute (เอา opacity 0.7/0.8 ออก ใช้ muted token ล้วน)
- **#7 stub:** ขีดสั้น 5u ใต้ plot ที่ทุก tick (desktop) ผูกวันกับกราฟ
- review: chart-review workflow (3 lens + synth) · ตัด finding ที่ปั้น data (per-day markers — mock ไม่มี daily จริง) · ยืนยัน y-ticks/line/area/scrub ดีอยู่แล้วไม่แตะ

## ✅ เสร็จ session นี้ (2h) — fix Y-axis labels คลิปขอบซ้าย (เบส: "กราฟแกน y โดนทับ")
แก้ `card-detail/card-chart.tsx` (ScrubChart) · tsc 0 · lint 0 · test 45 · screenshot raw+graded ยืนยัน
- **บั๊กเดิม (ไม่ใช่ของ session นี้):** `padLeft=64` คงที่ + last-price `tagW=56` คงที่ → การ์ดราคาหลักแสน (graded "489K ฿"/"300K ฿" font 18 กว้าง ~67px) **ล้นเลย x=0 → คลิปเลขหลักแรก** · pill tag ก็แคบกว่าตัวเลข
- **fix:** คำนวณ `padLeft` + `tagW` **ตามความกว้างป้ายจริง** — hoist `gridVals`/labels ขึ้นก่อน · `maxLabelChars = max(yLabels, lastLabel)` · `padLeft = max(64, ceil(chars × AXIS_FONT × 0.62) + 24)` (gutter เก็บทั้ง label ขวา-ชิด + pill tag) · `tagW = ceil(lastLabel × 0.62) + 16`
- **ผล:** การ์ดถูก (RAW 311฿ → "150 ฿") gutter แคบเท่าเดิม · การ์ดแพง (PSA10 → "30K-69K ฿") gutter กว้างพอ ไม่คลิป · scale อัตโนมัติถึงหลักล้าน
- verify: tsc 0 · lint 0 · test 45 (niceTicks ยังผ่าน) · screenshot 2 เคส (raw+graded) ยืนยันเลขเต็ม

## ✅ เสร็จ session นี้ (2g) — ลบ "เทียบเกรด" ออกทั้งหมด (เบส: "จะได้คลีน" · ข้อมูลเทียบเป็น EST ล้วน)
แก้ `card-detail.tsx` · tsc 0 · lint 0 · test 45 · screenshot chart ยืนยัน
- **เหตุผล:** ข้อมูลเทียบเกรดทั้งหมดเป็น modeled/EST (ไม่มี per-grade history จริง) → เทียบปลอม รก · เบสเลือก "ออกหมดทั้งแถบ" (AskUserQuestion) · ราคาแต่ละเกรดยังเห็นที่ **grade selector chips ด้านบน**
- **ลบ JSX:** compare row (chips PSA9/8/BGS + vs Raw + เทียบแหล่ง coming-soon + clear) · indexed-% explainer · legend · ladder table
- **ลบ state/logic:** `compareGrades` `vsOther` `toggleCompare` `seriesColor` · cross-family vars (`crossKey/crossAvailable/crossLabel/crossIsGraded/crossNum`) · `familyKeys/familyGrades/sameFamilyCompareKeys` · constants `COMPARE_PALETTE/MAX_CHART_LINES/COMPARE_HUE_ORDER/compareHue`
- **ย่อ `seriesList`:** จาก `{lines, ladderKeys}` multi-line memo → **เส้นเดียว** (selectedGrade) เสมอ · `indexed={false}` ตายตัว · ลบ import `Plus`
- **เก็บไว้:** grade selector chips · Raw\|Graded toggle (`switchFamily` ยังใช้ RAW_KEYS/GRADED_KEYS) · range buttons · `mockGradeSeries` (เส้นเดียว + barPoints) · ScrubChart รองรับ multi/indexed อยู่ (เผื่ออนาคต)
- ⚠️ orphan i18n (zero-risk · ยังไม่ลบ): `compareGrades/compareSources/comingSoon/compareVs/indexedPctNote/clearAll/ofGrade`
- ⚠️ ถ้าจะเอา comps จริงกลับมาเทียบ → ต้องเขียน compare UI ใหม่ (ลบทิ้งแล้ว ไม่ได้ comment ค้าง)
- **➕ follow-up (เบส: "ไม่ต้องมีเลือก raw grade บนกราฟ"):** ลบปุ่ม **Raw\|Graded toggle** บนหัวกราฟ (ซ้ำกับ grade selector chips ด้านบนที่กด Raw/PSA เปลี่ยนเกรดได้อยู่แล้ว) → ลบ `switchFamily` + constants `RAW_KEYS/GRADED_KEYS` (เหลือ dead หลังเอา toggle ออก) · หัวกราฟเหลือ eyebrow "ประวัติราคา · {grade}" + ปุ่มช่วงเวลา · การเปลี่ยน raw↔graded ทำผ่าน chips บนสุดแทน · orphan i18n เพิ่ม: `gradeModeRaw/gradeModeGraded`

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
- **⚠️ delta window vs วันข้อมูล (logic · จาก 2f):** delta "ใน 1 เดือน" คิดจาก **ช่วงกราฟ (range)** ส่วน freshness "X เดือนที่แล้ว" คิดจาก **daysSinceUpdate (วัน scrape ล่าสุด)** — คนละแหล่ง เลยขัดกันได้ **แม้มี data จริง** (ไม่ใช่แค่ mock) · 2f แก้ด้วยการทำ stale เด่น (อ่านแล้วหักลบเอง) แต่ราก = ควร gate/relabel ช่วง delta ให้อิงวันข้อมูลจริง (เช่น stale มากๆ ซ่อน %move หรือเตือน) · แตะ logic นอก 2 บรรทัด hero → งานแยก
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
