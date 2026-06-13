# Meecard (OPCG Price Tracker) — SPEC
> อะไรคือ "เสร็จ" ของระบบนี้ — AI ต้อง verify ข้อที่เกี่ยวกับงานที่แตะ ก่อนเคลม done · เปลี่ยน spec = แก้ที่นี่ก่อนเขียนโค้ด
> อัปเดต: 2026-06-13 (เขียนจากการสำรวจโค้ดจริงทั้ง repo)

## ระบบนี้คืออะไร
**Meecard** — เว็บติดตามราคาการ์ด One Piece Card Game สำหรับผู้เล่น/นักสะสมไทย
ราคา scrape จาก **Yuyu-tei + SNKRDUNK** รายวัน แปลง JPY/THB/USD · รายได้จาก subscription (Free / Pro 129฿ / Pro+ 249฿ ผ่าน Stripe) + ค่าธรรมเนียม marketplace (รอเปิด)
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

## เกณฑ์คุณภาพข้าม feature (บังคับทุกงานก่อนเคลมเสร็จ)
- [ ] `npm run lint` + `npm run test` + `npm run build` ผ่าน
- [ ] mobile-first ตาม breakpoint contract ใน AGENTS.md (ตาราง = list fallback ใต้ `sm:`)
- [ ] typography ใช้ semantic token · API ใช้ `apiHandler`/`adminApiHandler` + Zod + envelope `{ error }` ตาม AGENTS.md
- [ ] ห้าม migration ที่ทำลายข้อมูล โดยไม่ผ่านแผนใน doc/ + เบสอนุมัติ

## นอกขอบเขต (ยังไม่ทำ — กัน scope creep · north star อยู่ `doc/archive/detailed-plan-2026-04-28.md`)
- TCG อื่น (Pokemon/Union Arena — schema รองรับแล้วผ่าน `Game` แต่ยังไม่เปิด)
- แหล่งราคาเพิ่ม: eBay JP / Mercari / Shopee / Cardmarket / TCGPlayer
- PWA / offline · Escrow เต็มรูป (Stripe Connect) · Cart หลายใบ · Lifetime deal
