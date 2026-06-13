# Meecard — PLAN (งานโค้ดค้างจริง — ขุดจาก doc/ + เทียบโค้ดแล้ว 2026-06-13)
> งานใหญ่แตกเป็น task ติ๊กได้ · ทำทีละอัน · ติ๊กเมื่อ **verify แล้ว** (ไม่ใช่แค่เขียนเสร็จ)
> ลำดับ milestone = ข้อเสนอ — เบสสลับได้ · แผนธุรกิจ/north star อยู่ `doc/detailed-plan.md` ไม่ใช่ไฟล์นี้

## 🔴 M0 — บั๊ก/ของหลุดที่เจอจากการ audit (เร็ว ควรเก็บก่อน)
- [ ] **cron `leaderboard-rewards` ไม่ถูก schedule ใน `vercel.json`** — route มีจริง (`/api/cron/leaderboard-rewards`) แต่ไม่เคยรันอัตโนมัติ → Top-10 monthly payout อาจไม่เคยจ่าย · เพิ่ม schedule (เสนอ: วันที่ 1 ของเดือน หลัง draw-raffle) + ตรวจย้อนหลังว่าต้อง backfill รางวัลไหม
- [ ] งานใน working tree ค้าง commit (15 ไฟล์ raffle/header/i18n) — เก็บงานให้จบแล้ว commit

## 🎨 R — Refactor ทั้งระบบก่อน redesign (เบสสั่ง 2026-06-13 · "Refactor ก่อน เดี๋ยวค่อยปรับ Design")
> ผล audit 2026-06-13: conventions ส่วนใหญ่ดีแล้ว (apiHandler ครบ ยกเว้น webhook/cron ที่มี guard ของตัวเอง · Zod 57/64 mutation routes · ไม่มี desktop-first override · typography token ใช้แล้ว 823 จุด) — น้ำหนัก refactor จริงอยู่ที่โครง client code + convention ตกค้าง + i18n · ส่วนการเปลี่ยน IA/หน้าตา รอเฟส redesign

### R0 — Convention fixes (refactor-safe ไม่เปลี่ยน design)
- [x] เพิ่ม `/forgot-password` `/reset-password` เข้า `CHROMELESS_ROUTES` ใน `main-chrome.tsx` (ตอนนี้ได้ chrome เต็ม ขัดกับ login/register)
- [x] ตาราง drop-rate dialog `sets/[setCode]/set-page-client.tsx` — เพิ่ม list fallback ใต้ sm + hoist rows ใช้ร่วม table/list
- [x] ไล่เช็ค `overflow-x-auto` ~30 จุด non-admin แล้ว: ที่เหลือเป็น tab-scroll/carousel/prose ที่ตั้งใจ + ตารางมี `hidden sm:block` fallback อยู่แล้ว (trending-tabs, home-market-overview) — ไม่ต้องแก้เพิ่ม

### R1 — UI consistency (mechanical — กวาดทีเดียวจบ)
- [x] typography residuals → token แล้ว: badge/pill `text-[10px]` → `.text-micro` (9 จุด) · overlay 9px → `.text-overlay` · auth hero `<h2>` → `.text-h1` (2) · ตัด weight ซ้ำ token (1) — ที่เหลือเป็นตัวเลข KPI ที่กติกาอนุญาต plain size (display token = 36-42px ใหญ่กว่าที่ design ใช้ ปล่อยไว้รอเฟส redesign เคาะ) · `portfolio-share-card` จงใจ style เองเพราะ export เป็นรูป — ไม่แตะ
- [x] **lint errors ทั้ง repo: 29 → 0** (พังมาก่อน refactor — rule react-hooks v6) · วิธีที่ใช้: mounted-flag → `useHydrated()` ใหม่ (`src/hooks/use-hydrated.ts`, useSyncExternalStore) · countdown/URL-sync/localStorage read → setState ใน timeout-0/rAF callback · latest-value ref → อัปเดตใน effect · `PrivacyFeedback` hoist เป็น module component · conditional hooks ใน `set-detail-content` hoist เหนือ early return · `Date.now()` ใน render → `daysSince`/`daysUntil` ใน `lib/utils/time.ts` · `window.location.href=` → `.assign()` · prefer-const ×2
- [ ] lint **warnings** เหลือ 81 (exhaustive-deps / unused-vars ส่วนใหญ่ในไฟล์เก่า) — ไล่เก็บเป็น batch แยก ก่อนตั้ง CI gate `--max-warnings 0`
- [ ] รวม empty-state: `shared/empty-state` + `kuma/kuma-empty-state` → ระบบเดียวมี variant (admin แยกไว้ได้)

### R2 — โครง client code (ลด friction ก่อน redesign)
- [x] สร้าง client fetch helper กลาง `src/lib/api/client.ts` (`apiFetch`/`apiGet`/`apiPost`/`apiPatch`/`apiDelete` + `ApiError(status)` + `apiTry`) คู่กับ `adminJsonFetch` เดิม · เพิ่ม `src/lib/api/shared-resource.ts` แทน module-cache ที่ copy-paste 4 สำเนา
- [x] migrate hooks ครบ 9 ตัวที่มี fetch: portfolio-api, header-data, settings, public-config, marketplace-fees, rank-tiers (→ useSyncExternalStore), honey-data (19 จุด), compare-data, market-cards — คงพฤติกรรม 401→signOut / 403→limitReached / AbortError เดิม
- [ ] migrate fetch ใน components ทีละ feature (~70 จุด): honey components → portfolio dialogs → marketplace → ที่เหลือ · **เริ่มแล้ว**: `profile/section-addresses.tsx` (reference pattern: JSON CRUD → apiGet/apiPost/apiPatch/apiDelete + apiTry) · ⚠️ FormData upload (cover/avatar) คง raw fetch ไว้ · auth-critical (profile-data-context 401→signOut) migrate ระวังเป็นพิเศษ
- [ ] รวม empty-state — **ทบทวนแล้ว: ไม่ทำในเฟส refactor** · `shared/EmptyState` (functional) กับ `kuma/KumaEmptyState` (branded emoji+motion+preset) ตั้งใจแยกบทบาทตาม doc comment · การยุบ = งาน design รอเฟส redesign
- [ ] แตก client components ยักษ์ แยก data hook ออกจาก presentation: `portfolio-client` 661 · `today-card` 645 · `compare-client` 629 · `price-hub` 567 · `honey-sidebar` 500 บรรทัด
- [ ] ลบ `src/lib/notifications.ts` (71 บรรทัด, 0 importer — superseded by `notify/dispatch`) ⚠️ เบสยืนยันก่อนลบ
- [ ] ยุบ re-export shims `tier.ts`/`tier-features.ts`/`plan-features.ts` (รวม 14 บรรทัด) ให้เหลือทางเข้าเดียว

### R3 — i18n hardening (ใหญ่ — ทำเป็น batch ราย feature)
- [ ] กวาด hardcoded ไทย + ternary `language === "TH" ? ...` ใน **152 ไฟล์** → `t()` keys (key parity 3 ภาษาเป๊ะ 1406 — อย่าให้พัง) · ลำดับ: layout → messages → marketplace → ที่เหลือ
- [ ] บังคับใช้ `utils/currency` formatting ทุกที่ (JPY/THB/USD — ห้าม format มือ)

### R4 — client→server pages (performance มือถือ — ท้ายสุด)
- [ ] หน้า client ล้วนที่ควรเป็น server-first: `settings/*` 9 หน้า · `saved` · `orders` · `seller/*` (เน้นหน้า first paint ช้าบน 4G)

## 🎨 DESIGN PHASE → ดู `REDESIGN.md` (SSOT) · URL strategy = **B (`/[game]/` prefix)** · เริ่ม P0
> เบสเคาะ 2026-06-14 · roadmap เต็มใน REDESIGN.md §7 · branch `redesign/p0-*` (ห้าม push master ตรง)

### P0 — Foundation (chrome / nav / tokens / primitives) · บล็อกทุก phase
**P0a — Nav IA foundation** ✅ verified, PR #7 เปิดแล้ว (branch `redesign/p0-nav-foundation`)
- [x] ui-store: เพิ่ม `currentGame` (+ partialize) — game-context พื้นฐาน (UI switcher จริงไว้ P4)
- [x] i18n: +6 keys ×3 ภาษา parity (browse/decksAndTools/deckBuilder/myDecks/metaCards/tierList · more/decks/market มีอยู่แล้ว)
- [x] bottom-nav: **freeze 5 tab** (Market·Browse·Decks·Portfolio·More) เลิก ternary marketplaceEnabled · ย้าย Search ออก (อยู่ header แล้ว) · badge → Portfolio
- [x] `/decks` hub page — tool grid (deck/drop calc, compare) + meta/tier/builder disabled "coming soon" + My Decks placeholder
- [x] header desktop: NAV_LINKS → Market/Browse/Decks · ตัด Tools dropdown (ย้ายเข้า hub) · marketplace append เมื่อ flag เปิด
- [x] mobile-menu-sheet: Tools section → ลิงก์เดียว "Decks & Tools" → /decks

**P0b — AdSlot + Consent** ✅ verified (branch `redesign/p0b-ads-consent`)
- [x] `<AdSlot placement>` — FREE-only + route-excluded (`src/components/ads/placements.ts`) + house-ad (Upgrade-to-Pro) · returns null เมื่อซ่อน (ไม่เหลือช่องว่าง) · AdSense path dormant จนตั้ง `NEXT_PUBLIC_ADSENSE_CLIENT`
- [x] `ConsentBanner` + `adConsent` ใน ui-store (persist) — dormant จน env ตั้ง (กัน nag ก่อน ads live) · ใช้ `useHydrated()`
- [x] billing/features: key `adFree` (PRO) + `featAdFree` i18n · migrate HomeAdCard → AdSlot · + mobile home AdSlot (แก้ ad lg:-only)

**P0c — polish** ✅ verified (branch `redesign/p0c-polish`)
- [x] command palette: เพิ่ม "Pages" nav shortcuts (Market/Browse/Decks/Portfolio/Watchlist/Trending/Compare/Honey/Settings) — ค้นหน้าได้ ไม่ใช่แค่การ์ด · keyboard nav รองรับ
- [x] footer มือถือเข้าถึงได้ (เลิก `hidden md:block` + pb clear bottom-nav)
- [x] design-token pass: `.text-price`/`.text-price-lg` (numeric mono) + `--game-accent` hook (default → primary, GameSwitcher set ตอน P4) — **adopt บน PriceTag ตอน P1**

→ **P0 จบครบ** (P0a nav + P0b ads + P0c polish)

### P1 — Core pages (REDESIGN.md §7) · เริ่มจากหน้าแย่สุด (card-detail)
**P1.1 — card-detail mobile** ✅ verified (branch `redesign/p1-card-detail`)
- [x] ย่อรูปการ์ดบนมือถือ (`max-w-[240px] sm:[320px] lg:none`) — ไม่กินทั้งจอแรก
- [x] reorder: image → header/actions/price/info → siblings (full-width) → related (เลิกดัน actions ใต้ siblings)
- [x] AdSlot `card-detail-mid` (หลัง price-hub, FREE only)
- [x] tap target primary CTA `h-11` บนมือถือ
**P1.2 — card-detail sticky bar** ✅ verified (branch `redesign/p1-card-detail-2`)
- [x] sticky action bar มือถือ (`CardDetailStickyBar`) — ราคา + Add-to-Portfolio ลอยเหนือ bottom-nav เสมอ · desktop ใช้ inline actions
- [~] **defer มีเหตุผล**: chart-collapse (quick-view ราคาอยู่บนสุดแล้ว + Recharts ใน collapsed เสี่ยง 0-width) · adopt `.text-price` (PriceDisplay มี size system อยู่แล้ว, force-swap = regress) → ทำตอนสร้าง price surface ใหม่
**P1.3 — ListRow primitive** ✅ verified (branch `redesign/p1-listrow`)
- [x] `src/components/ui/list-row.tsx` — interactive row primitive (`min-h-14` tap target, focus-visible ring, leading/title/subtitle/trailing/chevron slots, Link/button/div)
- [x] adopt ใน `CardListRow` (CardTable mobile fallback) → ได้ทั่ว cards/sets/trending ทันที
- note: `MobileAssetCard` (PnL+notes+edit) / `OrderCard` (status header + actions footer) เป็น multi-section card จริง — คงเป็น bespoke (ไม่ force เข้า row primitive)
- [ ] home / cards / sets — AdSlot `browse-in-feed` · ยืน table→list `<sm` · ใช้ ListRow กับ list อื่นๆ ที่ยัง hand-roll

### ค้างจาก audit (ทำตอน redesign แต่ละหน้า — REDESIGN.md P1+)
- Honey nav มือถือ: 7 แท็บไอคอนล้วนไม่มี label (`honey-tab-nav.tsx:159`) + scroll แนวนอน (→ P5)
- card-detail หนาแน่น/ปุ่มใต้ fold (→ P1) · portfolio scroll ลึก (→ P2)

## M1 — Honey: เก็บงานค้างจาก rebalance v2 (`doc/honey-economy-rebalance.md` §9)
- [ ] Achievement unlock toast — ยังไม่มี component แจ้งตอนปลดล็อก
- [ ] Physical prize fulfillment — flow เก็บที่อยู่จัดส่งผู้ชนะ raffle (ผูก `ShippingAddress` ที่มีอยู่แล้วได้)
- [ ] Featured-slot curation UI ใน `/admin/honey` — API พร้อมแล้ว (`featuredUntil`) แต่ไม่มีหน้า admin
- [ ] (future) Anti-abuse score model

## M2 — HoneyActionType migration (`doc/honey-action-type-migration.md` — ค้าง phase 4 ทั้งก้อน ทำเป็นชุดเดียว)
> ตอนนี้ freeze ด้วย runtime guard เท่านั้น enum เก่ายังอยู่ใน schema
- [ ] Step 1: เพิ่มคอลัมน์ `legacyType String?` บน `HoneyTransaction`
- [ ] Step 2: backfill SQL ย้ายค่าเก่า → `legacyType`
- [ ] Step 3: drop enum members เก่า (raw SQL ALTER TYPE)
- [ ] Step 4: ปรับ read site ใน `/admin/honey` ให้ fallback ไป `legacyType`
- [ ] ⚠️ ทั้งชุดแตะ DB จริง — เบสอนุมัติก่อนรัน migration

## M3 — Marketplace launch prep (โค้ดเสร็จแล้ว ปิด flag อยู่ · ค้างจาก `doc/MARKETPLACE_OVERHAUL.md`)
- [ ] ตัดสินใจ: เปิด `marketplaceEnabled` เมื่อไหร่ + เกณฑ์พร้อม (งานธุรกิจ — เบสเคาะ)
- [ ] auto-complete order: DELIVERED → COMPLETED หลัง X วัน (ตรวจว่ามี cron หรือยัง — น่าจะยังไม่มี)
- [ ] `OrderEvent` model — audit log การเปลี่ยน status ของ order
- [ ] DISPUTED status + mediation flow
- [ ] Escrow release จริง (เงินเข้าผู้ขายเมื่อ COMPLETED — ต้อง Stripe Connect)
- [ ] (optional) `/checkout/[orderId]` แยกหน้า + Cart ซื้อหลายใบร้านเดียว

## M4 — สุขภาพ docs (กัน AI/คนอ่านแล้วหลงทาง)
- [ ] อัปเดต `doc/data-pipeline.md`: รูปขึ้น **Cloudflare R2** แล้ว (ไม่ใช่ Supabase Storage) + เพิ่มส่วน SNKRDUNK pipeline + ชี้ cron จริงใน vercel.json
- [ ] ตัดสินใจชะตา `data/cards-official/` (5.1MB ไม่มีโค้ดอ้าง — snapshot เก่า?) — เบสเคาะ: ลบ หรือเก็บเป็น archive

## ถัดไป (north star — ยังไม่เริ่ม อย่าหยิบเองโดยเบสไม่สั่ง)
- [ ] แหล่งราคาเพิ่ม (Mercari/eBay JP) · Multi-TCG (seed-games.ts พร้อมแล้ว) · PWA · Lifetime deal
