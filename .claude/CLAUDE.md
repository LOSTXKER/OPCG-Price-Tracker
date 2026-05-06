# OPCG Price Tracker — Meecard

## Project
Real-time price tracking สำหรับ One Piece Trading Card Game (OPTCG) — ดูราคา, portfolio, marketplace, deck builder พร้อม Stripe payments และ LINE Bot

## Business
**Meecard** — เว็บเช็คราคาการ์ด OPCG สู่ TCG platform

## Stack
- Framework: Next.js 16.2 (App Router, React 19, TypeScript 5)
- Database: PostgreSQL (Prisma 7) via Supabase
- Styling: Tailwind CSS 4 + semantic typography tokens (ดู AGENTS.md)
- Auth: Supabase SSR
- Payments: Stripe
- State: Zustand 5
- Scraping: Cheerio
- Notifications: LINE Bot SDK, Resend
- Charts: Recharts
- Testing: Vitest

## Directory Map
| Path | Purpose |
|------|---------|
| `src/app/` | Pages (cards, sets, marketplace, portfolio, admin) |
| `src/components/` | React components แยกตาม feature |
| `src/lib/` | Business logic, DB queries, integrations |
| `src/hooks/` | Custom hooks |
| `src/stores/` | Zustand state |
| `prisma/` | Schema, migrations, seed |
| `scripts/` | CLI scripts (scrape, seed, translate) |

## How to Run
```bash
npm install
npm run dev          # http://localhost:3000
npm run db:seed      # seed database
npm run scrape:prices
```

## Key Files
- `src/middleware.ts` — Route protection
- `prisma/schema.prisma` — Game → CardSet → Card → CardPrice
- `src/lib/api/` — API handler wrappers
- `AGENTS.md` — Typography tokens, breakpoints, API conventions (อ่านก่อนแตะ UI)

## Conventions
- Typography: ใช้ `.text-h1` / `.text-body` ตาม AGENTS.md — ห้าม `text-[Xpx]` arbitrary
- Breakpoints: `sm:` data, `md:` chrome, `lg:` polish, `xl:` marketing
- API routes: wrap ใน `apiHandler()` / `adminApiHandler()` + Zod validation
- Auth: `requireAuthUser()` / `requireAdmin()` early — ไม่ double-check
- Mobile-first: เขียน mobile ก่อน layer `sm:` ขึ้นไป

## Current Status (as of May 2026)
- ✅ Card lookup, portfolio, watchlist, drop calc, deck calc — live ที่ opcg-price-tracker.vercel.app
- ✅ Mobile-first UI, missions/gamification, multilingual (TH/EN/JP)
- 🚧 Marketplace — UI only, backend pending
- 🎯 เป้า: launch จริง Q3 2026
