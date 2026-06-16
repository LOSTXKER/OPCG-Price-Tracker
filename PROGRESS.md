# 📍 PROGRESS — สถานะสด
> **เขียนทับทุกครั้ง ไม่สะสม log** · hook โหลดไฟล์นี้ทุก session · อ่านอันนี้ก่อน แล้วทำต่อจาก NEXT

อัปเดตล่าสุด: 2026-06-16 — **พอร์ต proto-h (CMC dashboard) เข้าหน้าจริง `/cards/[code]` เสร็จแล้ว** (in-place, wired DB จริง, ผ่าน adversarial review) · branch `redesign/card-detail-pricing-layout`

## ▶ สถานะตอนนี้ — h เข้าหน้าจริงแล้ว ✅
หน้าจริง `src/components/cards/card-detail.tsx` ถูก rewrite เป็นโครง CMC dashboard ตาม proto `card-trade-h` ที่เบสเลือก (server props interface **ไม่เปลี่ยน** — `src/app/cards/[code]/page.tsx` เหมือนเดิม):

**โครงใหม่ (บนลงล่าง):**
- utility row: breadcrumb + icons (โปรด/พอร์ต/เทียบ/แชร์/แจ้งเตือน — ของจริงทั้งหมด)
- **top 3-col** (`lg:grid-cols-[260px_1fr_300px]`): identity (รูปจริง+ชื่อ+rarity+code) · price instrument (EditionToggle + grade ladder chips + **hero เดียว** + delta + subline + range band + ปุ่มทอง "ซื้อบน Meecard") · market-stats rail (ขายล่าสุด/ต่ำสุด/ช่วง30วัน/ปริมาณ/ประชากร)
- tabs → **mid 2-col** (`[1fr_320px]`): กราฟกว้าง (`ScrubChart`) + grade-ledger rail
- แหล่งอ้างอิง (ประกาศขาย/ขายไปแล้ว) · ขายบน Meecard (`MeecardAsksRail`) · ข้อมูลการ์ด (`CardDetailSpecs`+effect+`CardTierMeta`) · related/siblings · mobile sticky buy

**reuse DB layer เดิม:** `buildGradeData` (grade ladder จาก real anchor + flag `isEst`), `ScrubChart`/`RANGES`/`dateAtIndex` (export ใหม่จาก card-chart.tsx), `MeecardAsksRail`, `CardDetailSpecs`, `CardDetailActions`, grade helpers · เลิกใช้ wrapper `CardChart` (hero แยกออกมาไว้คอลัมน์บน), `MarketEvidence`, `CardBuySell` (ยังอยู่แต่หน้านี้ไม่ใช้)

**ปรับหลัง feedback เบส รอบ 1 (รก/กราฟแปลก/CTA ลับ):**
- declutter: ตัด stats 5→3 (ตัด ปริมาณ/ประชากร modeled ล้วน) · tabs → 4
- **กราฟแปลก = `mockSeries` ปัดจำนวนเต็ม** → การ์ดถูก (~25฿) เป็นขั้นบันได · แก้: คืน **float** (เส้นเนียน) ใน `mock.ts`

**ปรับรอบ 2 (CTA ซ้าย / band คืน / กราฟ world-class) — ผ่าน `/workflow` design exploration (9 agents):**
- **top grid = flat children + `order` + explicit grid placement**: desktop = ซ้าย[รูป+identity+CTA acquire rail] · กลาง[hero+grade chips+range band คืนมา(เขียว)] · ขวา[stats] · **mobile order = รูป→ราคา→CTA→stats** (กัน buy มาก่อนราคา) · ลบ "ต่ำสุด·N รายการ"
- **กราฟ world-class** (`ScrubChart` rewrite → multi-series ใน card-chart.tsx · legacy `CardChart` ยังใช้ proto c/d/f แก้ให้เรียก series API): **filter Raw|Graded** (สลับ family → set primary + compare options + sources) · **compare overlay หลายเกรด same-family** (กัน Raw JPY ปน Graded USD per judge) · เส้น real=solid, **est=dashed** · crosshair + multi-row tooltip · latest pill/dots ต่อเส้น · global y-scale · **legend** ราคาล่าสุด+EstMark ต่อเส้น · palette `COMPARE_PALETTE` (เลี่ยงทอง/เขียว/แดง)
- **chart + แหล่งอ้างอิง = 2-col** (lg `[1fr_300px]`) · ขวา = sources (ประกาศขาย/ขายไปแล้ว) · mobile stack · ย้าย section แหล่งอ้างอิงเดิมขึ้นมาเป็น sources column
- helper: `mockGradeSeries` (per-grade series) · state `compareGrades:Set` · `switchFamily`/`toggleCompare`
- verify: tsc 0 · lint 0 · test 36 · hydration 0 · CDP click-test compare Raw A/B/C + สลับ Graded ผ่าน

## ⚠️ 3 การตัดสินใจสำคัญ (เพื่อความน่าเชื่อถือ = north star เบส)
1. **default grade = Raw A** (ราคาตลาดจริง) ไม่ใช่ PSA 10 — กันการ์ดถูกโชว์ headline graded แพงเกินจริง (`gradeData.raw_a.hasData ? "raw_a" : defaultGradeKey`)
2. **raw = Yuyutei (JPY) เท่านั้น** — ตัด SNKRDUNK USD ออกจาก raw ทั้ง anchor/source/lastSale (มันคือราคา graded ปนเข้ามา ทำให้ "ขายล่าสุด" เพี้ยน 5,861฿ ทั้งที่ raw 25฿) · ตาม doc `grades.ts`: raw→Yuyutei, PSA10→SNKRDUNK
3. **source row ติด label = เกรดจริงของแหล่ง** (Raw/PSA 10) ไม่ใช่เกรดที่เลือก — ดู PSA 9 (modeled) → source โชว์ "SNKRDUNK · PSA 10 · 5,673฿" + hero "PSA 9 · 2,852฿ EST" = เล่าจริงว่า PSA 9 ประมาณจาก PSA 10
+ ทุกค่า modeled ติด `<EstMark/>` รวม **hero ตัวใหญ่** (เกรด modeled) · currency guard `hydrated?pref:"THB"` เหมือน displayLang

## ✅ verify ครบ (อย่าเคลมลอย)
tsc 0 · lint 0 · **test 36 ผ่าน** · **hydration 0** (clean restart, console 0 บน OP01-001 + OP01-120) · screenshot desktop+mobile + CDP-click PSA9 ยืนยัน hero EST จริง · **adversarial review workflow 16 agents → 6/12 confirmed แก้หมด**

## ⚠️ gotchas (ก่อนทำต่อ)
1. **dev restart = kill PID** (`kill $(lsof -nP -iTCP:3000 -sTCP:LISTEN -t)` + `pkill -f "OPCG.*node_modules/.bin/next"` → `npm run dev`) · **ห้าม rm .next** (เบส deny) · หลัง edit จะเห็น "1 Issue"/hydration error = **HMR staleness** ไม่ใช่บั๊กจริง → restart สะอาดแล้วเช็คใหม่ (เครื่องมือ screenshot/console อยู่ใน `.codex/*.mjs`)
2. **screenshot มือถือ = CDP mobile emulation** (`.codex/shot.mjs`) ไม่ใช่ `--window-size`
3. ห้าม `npm run build` ระหว่าง `next dev` (clobber .next)
4. **currency hydration นอกหน้านี้ยังไม่ guard** (card table/header/portfolio อ่าน `currency` ตรง = latent mismatch สำหรับ user ≠THB) — งานแยกทั้งแอป ถ้าจะทำ

## ▶ NEXT
> **เบส (2026-06-16): Meecard ตอนนี้ = prototype → ไม่ต้องฟื้น scrape/ดึงราคาจริง.** mock + ข้อมูลค้าง (เม.ย.) ปล่อยไว้ได้ · อย่าทักว่า data/กราฟ stale เป็นบั๊ก · โฟกัส **UI/ดีไซน์**. (วินิจฉัยเผื่ออนาคต: cron 401 เพราะ `CRON_SECRET` หายบน Vercel — ดู memory `meecard-prototype-status`)
1. รอโจทย์ UI/ดีไซน์ถัดไปจากเบส (ปรับ card-detail ต่อ / ขยายหน้าอื่นตาม VISION §7: home · portfolio hero · marketplace)
2. proto e/f/g/h เก็บเทียบใน `/proto/` · proto-h = ตัวอ้างอิง fidelity ของหน้าจริง
3. ลองให้ Google Stitch ออกแบบได้ (มี `DESIGN.md` ที่ราก repo ไว้แนบ)
