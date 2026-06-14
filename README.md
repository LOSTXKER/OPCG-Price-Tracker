# Meecard — OPCG Price Tracker

เว็บเช็คราคา **One Piece Card Game (OPCG / OPTCG)** แบบเรียลไทม์สำหรับตลาดไทย — ดูราคากลาง, จัดการ portfolio, คำนวณ drop rate, deck builder, marketplace พร้อม Stripe payments และ LINE Bot

🔗 Live: [opcg-price-tracker.vercel.app](https://opcg-price-tracker.vercel.app)

## Features

- **Price tracking** — ราคากลางรายวันจาก Yuyutei (JPY) + SNKRDUNK (USD / PSA 10 graded), แปลงเป็น THB
- **Portfolio & Watchlist** — ติดตามมูลค่าคอลเลกชัน, กำไร/ขาดทุน, แจ้งเตือนราคา
- **Tools** — drop-rate calculator, deck cost calculator, card compare
- **Marketplace** — ซื้อขายการ์ด + seller center (ปิดด้วย feature flag จนกว่าจะ launch)
- **Gamification** — Honey rewards, missions, ranks, raffle
- **Multilingual** — TH / EN / JP

## Stack

| | |
|---|---|
| Framework | Next.js 16 (App Router, React 19, TypeScript 5) |
| Database | PostgreSQL + Prisma 7 (via Supabase) |
| Styling | Tailwind CSS 4 + semantic typography tokens |
| Auth | Supabase SSR · Payments: Stripe |
| State | Zustand 5 · Charts: Recharts |
| Scraping | Cheerio · Notifications: LINE Bot SDK, Resend |
| Testing | Vitest |

## Getting Started

```bash
# 1. install
npm install

# 2. env — คัดลอกแล้วเติมค่า (Supabase, Stripe, R2, LINE ฯลฯ)
cp .env.example .env.local

# 3. generate Prisma client + seed ฐานข้อมูล
npx prisma generate
npm run db:seed

# 4. dev server → http://localhost:3000
npm run dev
```

## Commands

| คำสั่ง | ทำอะไร |
|--------|--------|
| `npm run dev` | dev server |
| `npm run build` | `prisma generate` + production build |
| `npm run start` | รัน production build |
| `npm run lint` | ESLint |
| `npm run test` | Vitest (`test:watch` สำหรับ watch mode) |
| `npm run pipeline` | data pipeline เต็ม (scrape → seed → images → prices) — ดู [doc/data-pipeline.md](doc/data-pipeline.md) |
| `npm run scrape:daily` | อัปเดตราคารายวัน |
| `npm run db:seed` | seed ฐานข้อมูล |
| `npm run translate:thai` | แปลชื่อการ์ดเป็นไทย |

> มี `seed:*` script ย่อยอีกหลายตัว (cards / games / honey-shop / missions / achievements …) — ดู `package.json`

## Project Structure

```
src/app/          หน้าเว็บ (cards, sets, marketplace, portfolio, honey, admin)
src/components/    React components แยกตาม feature
src/lib/           business logic, DB queries, scrapers, integrations
src/stores/        Zustand state · src/hooks/ custom hooks
prisma/            schema + migrations + seed (Game → CardSet → Card → CardPrice)
scripts/           CLI: scrape / seed / pipeline / translate
doc/               เอกสารอ้างอิงเชิงลึก (ดู doc/README.md)
```

## Docs

ก่อนแตะโค้ด อ่าน **[AGENTS.md](AGENTS.md)** — typography tokens, breakpoints, API conventions (บังคับ)

| ไฟล์ | บทบาท |
|------|-------|
| [AGENTS.md](AGENTS.md) | conventions (typography / breakpoints / API) + วงจรการทำงาน + permission |
| [SPEC.md](SPEC.md) | what-is-done checklist |
| [PLAN.md](PLAN.md) | งานค้าง (checklist) |
| [PROGRESS.md](PROGRESS.md) | สถานะสด / session handoff |
| [VISION.md](VISION.md) | ทิศดีไซน์ (redesign north-star) |
| [doc/](doc/) | reference เชิงลึก + `archive/` (REDESIGN เก่า, business plan) |

## Deploy

Deploy บน Vercel (auto จาก `master`). `npm run build` รัน `prisma generate` ก่อน build เสมอ
