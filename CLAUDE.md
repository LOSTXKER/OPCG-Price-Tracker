# OPCG Price Tracker — Meecard

> ไฟล์นี้ = จุดเริ่มของ agent ทุกตัว. อ่านอันนี้ก่อน แล้ว `@AGENTS.md` (ด้านล่าง) จะพา convention + วงจรการทำงาน + permission มาให้ครบ.

## โปรเจคคืออะไร
**Meecard** — เว็บเช็คราคา One Piece Card Game (OPTCG) เรียลไทม์สำหรับตลาดไทย: ดูราคากลาง · portfolio · watchlist · drop/deck calculator · marketplace (ปิด flag) · Honey gamification · Stripe · LINE Bot · multilingual TH/EN/JP. Live: opcg-price-tracker.vercel.app

## Stack
Next.js 16 (App Router, React 19, TS 5) · PostgreSQL + Prisma 7 (Supabase) · Tailwind CSS 4 (semantic typography tokens) · Supabase SSR auth · Stripe · Zustand 5 · Recharts · Cheerio (scrape) · LINE Bot SDK + Resend · Vitest

## Directory map
| Path | คือ |
|------|-----|
| `src/app/` | หน้าเว็บ (cards, sets, marketplace, portfolio, honey, admin) + `api/**` |
| `src/components/` | React components แยกตาม feature |
| `src/lib/` | business logic, DB queries, scrapers, integrations, `api/` handler wrappers |
| `src/stores/` · `src/hooks/` | Zustand state · custom hooks |
| `prisma/` | schema + migrations + seed (Game → CardSet → Card → CardPrice) |
| `scripts/` | CLI: scrape / seed / pipeline / translate |
| `doc/` | reference เชิงลึก + archive (ดู `doc/README.md`) |

## รัน
```bash
npm install
npm run dev          # http://localhost:3000
npm run build        # prisma generate + production build
npm run lint         # ESLint   ·   npm run test   # Vitest
npm run db:seed      # seed DB  ·   npm run scrape:daily
```

## 📚 เอกสาร — ใครคุมอะไร (อ่านให้ถูกไฟล์ จะได้ไม่งง)
**กฎเหล็ก: 1 ไฟล์ = 1 หน้าที่ · ไม่ทวนกัน · ถ้าข้อมูลขัดกัน เชื่อไฟล์ที่เป็นเจ้าของเรื่องนั้น**

| ไฟล์ | หน้าที่เดียว | แตะเมื่อ |
|------|------------|---------|
| **[AGENTS.md](AGENTS.md)** | **เขียนโค้ดยังไง** — typography/breakpoint/API convention + วงจรการทำงาน + permission | ก่อนแตะโค้ดทุกครั้ง |
| **[SPEC.md](SPEC.md)** | **อะไรคือ "เสร็จ"** — เกณฑ์ acceptance ราย feature | ก่อนเคลม done / เปลี่ยน spec |
| **[PLAN.md](PLAN.md)** | **งานค้าง** — checklist ติ๊กได้ | เริ่มงานใหญ่ / ปิด task |
| **[PROGRESS.md](PROGRESS.md)** | **สถานะสด** — session handoff (เขียนทับทุกครั้ง) | เริ่ม session / จบงาน |
| **[VISION.md](VISION.md)** | **ทิศดีไซน์** — north-star ของ redesign (เนื้อหากำลัง revise) | ก่อนงาน UI |
| **[doc/](doc/)** | reference เชิงลึก (data-pipeline · honey · marketplace) + `archive/` ประวัติ | เจาะระบบนั้นๆ |

> README.md = สำหรับคน/มือใหม่ (GitHub). ไฟล์ในตารางนี้ = สำหรับทำงานจริง.

## หมายเหตุสถานะ
ฟีเจอร์หลัก live แล้ว · marketplace ปิดด้วย flag `marketplaceEnabled=false` (ดู SPEC.md §4) · **redesign = แก้ของเดิม in-place ไม่มีเวอร์ชัน v1/v2 แยก** · สถานะสด+งานต่อไปอยู่ PROGRESS.md เสมอ

@AGENTS.md
