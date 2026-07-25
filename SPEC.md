# Meecard (OPCG Price Tracker) — SPEC
> อะไรคือ "เสร็จ" ของระบบนี้ — AI ต้อง verify ข้อที่เกี่ยวกับงานที่แตะ ก่อนเคลม done · เปลี่ยน spec = แก้ที่นี่ก่อนเขียนโค้ด
> อัปเดต: 2026-06-13 (เขียนจากการสำรวจโค้ดจริงทั้ง repo)

## ระบบนี้คืออะไร
**Meecard** — เว็บติดตามราคาการ์ด One Piece Card Game สำหรับผู้เล่น/นักสะสมไทย
ราคา scrape จาก **Yuyu-tei + SNKRDUNK** รายวัน แปลง JPY/THB/USD · รายได้จาก subscription (Free / Pro 129฿ / Pro+ 249฿ ผ่าน Stripe) + ค่าธรรมเนียม marketplace (รอเปิด) + แผนโฆษณา 2 แบบ (Google Ads mockup เท่านั้น / Direct Sponsor ที่ติดต่อ MeeCard)
Stack: Next.js 16 · React 19 · Prisma 7 + Postgres (Supabase) · Stripe · LINE · Resend · Gemini · Cloudflare R2 (รูป) · Vercel (10 cron)

## สถานะใหญ่ (สำคัญ — อ่านก่อนแตะ)
- **ทุก feature หลัก implement เสร็จและ live แล้ว** — งานปัจจุบันคือ polish + เก็บงานค้าง (ดู PLAN.md)
- **Marketplace ทั้งก้อน (รวม /seller, /orders, /messages) โค้ดเสร็จแต่ปิดด้วย flag** `marketplaceEnabled=false` (`src/lib/admin/config.ts`) — ทุก route คืน 404 จนกว่า admin เปิดจาก `/admin/config` · ห้ามถอด guard `guardMarketplaceApi()` ออก

## เกณฑ์ "เสร็จ" ราย feature (ต้องเป็นจริงเสมอ — ใช้ verify เมื่อแตะส่วนนั้น)

### 1. Price tracking (core)
- [ ] หน้า `/` แสดง top gainers/losers + ตารางการ์ดจากราคาล่าสุดใน DB
- [ ] `/cards/[code]` มีกราฟประวัติราคา + % เปลี่ยน 24h/7d/30d ถูกต้องตาม `CardPrice`
- [ ] `/search` ค้นได้ทั้ง text และรูปถ่าย (Gemini ผ่าน `/api/cards/identify`) · `/trending`, `/market-overview`, `/compare`, `/sets` ทำงาน
- [ ] cron scrape (`scrape-prices` 17:00 UTC, `scrape-snkrdunk` 18:00, `scrape-exchange` 00:00) เขียน `CardPrice` + อัปเดต `latestPriceJpy/Thb` บน `Card`

### 2. เครื่องมือ collector (Pro tier gating ผ่าน `src/lib/tier-features.ts`)
- [ ] `/portfolio` — เพิ่ม/ลบการ์ด เห็นมูลค่า+PnL · cron `snapshot-portfolios` เก็บประวัติรายวัน
- [ ] รายการซื้อใหม่ในพอร์ตทุกทางต้องมีวันที่ได้มาและต้นทุนต่อใบ (`0` = ได้มาฟรี); เมื่อเพิ่มหลายการ์ด วันที่และโน้ตต้องผูกกับการ์ดแต่ละใบ ไม่ใช้ค่ากลางร่วมกัน; ข้อมูลเก่าที่ไม่ทราบต้องคง `null` จนผู้ใช้แก้เอง
- [x] รูปแชร์พอร์ตเป็น snapshot 1080×1350 ที่เลือก preset `ครบ / % เท่านั้น / คอลเลกชัน` หรือเปิด–ปิดมูลค่า, ผลตอบแทน, ต้นทุน, สัดส่วน, การ์ดเด่น, ราคาการ์ด, จำนวน และวันที่เองได้; ปิดมูลค่าต้องไม่หลุดตัวเลขเงินหรือ mask placeholder และทุก combination ต้อง reflow โดยไม่สร้างข้อมูลผลตอบแทนปลอม
- [ ] `/watchlist` + price alerts — cron `check-alerts` ยิงแจ้งเตือนตามเป้า ผ่าน in-app/email/LINE
- [ ] `/deck-calculator`, `/drop-calculator` — ใช้ได้ไม่ต้อง login

### 3. Honey (gamification — สเปคเศรษฐกิจเต็ม: `doc/honey-economy-rebalance.md`)
- [ ] `/honey` 7 แท็บ (missions/achievements/shop/raffle/rankings/referral/activity) ทำงานครบ
- [ ] แต้มผ่าน `HoneyTransaction` ledger เสมอ มี `idempotencyKey` กันจ่ายซ้ำ · daily cap 200/วัน
- [ ] ห้ามเขียน `HoneyActionType` ที่ deprecate แล้ว (guard ใน `src/lib/honey/deprecated.ts`)
- [ ] cron: `expire-honey` รายวัน, `draw-raffle` วันที่ 1 ของเดือน, `resolve-predictions` จันทร์

### 4. Marketplace (ปิด flag รอ launch)
- [ ] flow ครบ: listing → offer/counter → order → Stripe → shipped → delivered → review
- [ ] ฝั่ง `/seller` มี stats/listings/orders/reviews/settings · `/raffle/winners` public โปร่งใส
- [ ] ตอน flag ปิด: ทุกหน้า+API marketplace ต้อง 404 (invisible until launch)

### 5. Subscription / Auth / Admin
- [ ] Stripe checkout + portal + trial Pro 14 วันไม่ใส่บัตร (cron `expire-trials`) · webhook sync สถานะ
- [ ] Auth ผ่าน Supabase · settings 10 หน้า (MFA, addresses, export, privacy ฯลฯ)
- [ ] `/admin` (login แยก) จัดการ การ์ด/ชุด/blog/config/honey ทุกชิ้น/matching tools (Yuyutei/SNKRDUNK/รูป + AI suggest)

### 6. Advertising (P0 เปิดใช้ 2026-07-24)
- [x] hard reset ถอดระบบเดิมครบก่อน rebuild: ไม่มี consent state, Google script/network หรือ reserved blank slot เก่าหลงเหลือ
- [x] ทุก placement แสดง `GOOGLE_MOCK` เป็นค่าเริ่มต้น; mockup เป็น layout-only กดไม่ได้และห้ามยิง network
- [x] placement ที่ขายตรงได้ใช้ strategy `DIRECT_THEN_GOOGLE`: แคมเปญ Direct ที่ `ACTIVE` พร้อมข้อมูลผู้ซื้อจริง + ป้าย Sponsored + CTA จึงแทน Google ในช่องเดิมแบบ 1:1; ถ้าไม่มีแคมเปญให้กลับเป็น Google ทันที
- [x] หน้าเว็บต้องไม่มีสถานะ `AVAILABLE`, ข้อความเปิดขายพื้นที่ หรือ CTA ติดต่อโฆษณาใน slot; การขาย Direct อยู่ใน contact flow แยกจากประสบการณ์อ่านเว็บ
- [x] paid tier ที่มีสิทธิ์ `adFree` ซ่อนทั้งสองแบบโดยไม่เหลือ wrapper/spacing; loading/empty/error ไม่แสดง; route/section contract ใช้ `doc/advertising-placement-plan-2026-07-24.md`
- [x] P0 ไม่มีโฆษณาหลัง hero/header หรือเหนือหัวตาราง: Home/Search/Set Detail/Card Detail ใช้ bottom anchor 320×64 / 728×90 ที่ปิดได้และจำการปิดตลอด session; contextual row/boundary เดิมยังอยู่ และ Card Detail คง rectangle ข้างกราฟกับ marketplace rail โดย Direct `ACTIVE` แทน Google ได้เฉพาะช่องที่ registry อนุญาต
- [ ] P1 ขยายจาก Home/Search/Set Detail/Card Detail ไป route อื่นตาม placement matrix หลัง owner รีวิว P0

## เกณฑ์คุณภาพข้าม feature (บังคับทุกงานก่อนเคลมเสร็จ)
- [ ] `npm run lint` + `npm run test` + `npm run build` ผ่าน
- [ ] mobile-first ตาม breakpoint contract ใน AGENTS.md (ตาราง = list fallback ใต้ `sm:`)
- [ ] typography ใช้ semantic token · API ใช้ `apiHandler`/`adminApiHandler` + Zod + envelope `{ error }` ตาม AGENTS.md
- [ ] ห้าม migration ที่ทำลายข้อมูล โดยไม่ผ่านแผนใน doc/ + เบสอนุมัติ

## นอกขอบเขต (ยังไม่ทำ — กัน scope creep · north star อยู่ `doc/archive/detailed-plan-2026-04-28.md`)
- TCG อื่น (Pokémon/Union Arena — schema รองรับแล้วผ่าน `Game` แต่ยังไม่เปิด): Header `GameSwitcher` เป็น selector canonical ที่แสดงเกม registered/roadmap ได้เสมอ; game context/filter ใน Portfolio, Watchlist, Alerts และ game step ก่อนเลือกการ์ดต้องยังมองเห็นแม้มี launch-ready game เพียงเกมเดียว โดยแสดงเฉพาะเกมที่ใช้ข้อมูลจริงได้เท่านั้น; Pokémon ตอนนี้ยัง roadmap/blocked กดได้เฉพาะจาก Header ไป `/coming-soon` และห้ามเปลี่ยน active game
- แหล่งราคาเพิ่ม: eBay JP / Mercari / Shopee / Cardmarket / TCGPlayer
- PWA / offline · Escrow เต็มรูป (Stripe Connect) · Cart หลายใบ · Lifetime deal
